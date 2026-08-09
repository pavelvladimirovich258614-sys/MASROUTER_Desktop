// routerEngine — детерминированная реализация каскада Fθ = Fθm ∘ Fθr ∘ Fθt
// из статьи arXiv:2502.11133. Правила взяты напрямую из промпта X60, секция 5.
//
// Сам каскад:
//
//   Q ──Fθt──> T (topology)
//   (Q,T) ──Fθr──> {R_i}  (chain of roles)
//   (Q,T,{R_i}) ──Fθm──> {M_i}  (chain of models)
//
//   δ(H) — обучаемая функция сложности в [0,1]; здесь — детерминированная эвристика.
//   γ=6 (максимум агентов) — из раздела 5.1.
//   λ ∈ {5,15,25} — trade-off quality vs cost, из раздела 5.1.

import { ROLE_MAP, DEFAULT_ESTIMATED_TOKENS } from '../../shared/masrouterData';
import { MASROUTER_CONSTANTS } from '../../shared/constants';
import { gamma as gammaFn } from './gamma';
import { buildFinalPrompt, buildStopConditions, buildSafetyChecklist } from './promptBuilder';
import { estimateCost } from './costEstimator';
import type {
  ChainStep,
  CostMode,
  ModelConfig,
  ModelTier,
  RiskLevel,
  RoleConfig,
  RouteDecision,
  RouterInput,
  Topology
} from '../../shared/types';

// =============================================================================
// ВНУТРЕННИЕ ЭВРИСТИКИ
// =============================================================================

/**
 * Эвристика сложности δ(H) ∈ [0,1] — аналог обучаемой δ(H) из статьи.
 * Чем сложнее задача и выше риск, тем ближе к 1.
 */
function computeDelta(input: RouterInput): number {
  const riskContribution = computeRiskScore(input) / 3; // 0..1
  const complexityMap: Record<string, number> = { Low: 0.2, Medium: 0.5, High: 0.85 };
  const c = complexityMap[input.complexity];
  // Финальная δ = max(risk, complexity) с лёгкой добавкой.
  return Math.min(1, Math.max(riskContribution, c));
}

/**
 * Risk Score 1/2/3 по правилам статьи.
 * - money/payment/discount/security/database/deploy → 3
 * - иначе complexity=High → 3
 * - иначе complexity=Medium → 2
 * - иначе 1
 */
export function computeRiskScore(input: RouterInput): RiskLevel {
  const f = input.riskFlags;
  if (f.money || f.payment || f.discount || f.security || f.database || f.deploy) {
    return 3;
  }
  if (input.complexity === 'High') return 3;
  if (input.complexity === 'Medium') return 2;
  return 1;
}

/**
 * Cost Mode — ECO / BALANCED / QUALITY.
 * Если budgetMode ≠ AUTO, используем его. Иначе:
 * - Risk=3 → QUALITY
 * - иначе complexity=Low → ECO
 * - иначе BALANCED
 */
function computeCostMode(input: RouterInput, risk: RiskLevel): CostMode {
  if (input.budgetMode !== 'AUTO') return input.budgetMode;
  if (risk === 3) return 'QUALITY';
  if (input.complexity === 'Low') return 'ECO';
  return 'BALANCED';
}

function lambdaFor(mode: CostMode): 5 | 15 | 25 {
  return MASROUTER_CONSTANTS.LAMBDAS[mode];
}

/**
 * Количество агентов k по правилам из спеки (детерминированный rule-based):
 * - Risk=3 → 4
 * - complexity=Low → 1
 * - иначе → 3
 * - максимум 6 (γ=6)
 *
 * Параллельно считаем "обучаемую" δ(H) для UI — она показывает, что вернула бы
 * policy-gradient-формула k = ⌈δ(H)·γ⌉.
 */
function computeAgentCount(
  risk: RiskLevel,
  complexity: RouterInput['complexity'],
  delta: number
): { agentCount: number; paperAgentCount: number } {
  const paperAgentCount = Math.max(1, Math.min(MASROUTER_CONSTANTS.GAMMA, Math.ceil(delta * MASROUTER_CONSTANTS.GAMMA)));
  let agentCount: number;
  if (risk === 3) agentCount = 4;
  else if (complexity === 'Low') agentCount = 1;
  else agentCount = 3;
  agentCount = Math.min(MASROUTER_CONSTANTS.GAMMA, Math.max(1, agentCount));
  return { agentCount, paperAgentCount };
}

// =============================================================================
// Fθt — collaboration determiner: Q → T
// =============================================================================

function determineTopology(input: RouterInput, risk: RiskLevel, mode: CostMode): Topology {
  if (input.userOverrides?.forcedTopology) {
    return input.userOverrides.forcedTopology;
  }

  const f = input.riskFlags;
  const t = input.taskType;
  const riskCritical = f.money || f.payment || f.discount || f.security || f.database || f.deploy;
  const isDebate = /дебат|спор|обсуд|дискус/i.test(input.taskDescription);

  // 1. Простая задача + низкий риск → Single.
  if (risk === 1 && input.complexity === 'Low' && !riskCritical) {
    return 'Single';
  }
  // 2. Серверная правка / code editing / API / validation / sorting / filter → Chain.
  if (
    t === 'server-edit' ||
    t === 'code-edit' ||
    t === 'refactor' ||
    t === 'test' ||
    t === 'feature'
  ) {
    return 'Chain';
  }
  // 3. Деплой → Chain (явная последовательность планирования).
  if (t === 'deploy') return 'Chain';
  // 4. Несколько независимых компонентов → Tree.
  if (t === 'analysis' && /несколько|компонент|модул/i.test(input.taskDescription)) {
    return 'Tree';
  }
  // 5. Явный флаг "дебаты" + QUALITY → Debate.
  if (isDebate && mode === 'QUALITY') return 'Debate';
  // 6. Пост-обработка / улучшение → Reflection.
  if (/улучш|отража|рефлек|доработ/i.test(input.taskDescription)) {
    return 'Reflection';
  }
  // 7. Сложная задача → CoT как минимум.
  if (input.complexity === 'High') return 'CoT';
  // 8. Дефолт.
  return 'Chain';
}

// =============================================================================
// Fθr — role allocator: (Q,T) → {R_i} chain
// =============================================================================

/**
 * Возвращает упорядоченный список id ролей. Дубли исключены.
 * Логика по правилам из промпта X60, секция 5.6.
 */
function allocateRoles(input: RouterInput, risk: RiskLevel, mode: CostMode, topology: Topology): string[] {
  const f = input.riskFlags;
  const t = input.taskType;

  // 1. ECO simple → только Implementer.
  if (mode === 'ECO' && risk === 1) return ['Implementer'];

  // 2. Серверный debug → LogReader → Analyst → Implementer → Tester.
  if (t === 'server-edit' && /debug|баг|ошиб|не работ/i.test(input.taskDescription)) {
    return ['LogReader', 'Analyst', 'Implementer', 'Tester'];
  }

  // 3. Deploy → LogReader → Architect → Deployer → Reviewer.
  if (f.deploy) {
    return ['LogReader', 'Architect', 'Deployer', 'Reviewer'];
  }

  // 4. Database / Payment / Discount → Analyst → Implementer → SecurityReviewer → Reviewer.
  if (f.database || f.payment || f.discount) {
    return ['Analyst', 'Implementer', 'SecurityReviewer', 'Reviewer'];
  }

  // 5. Security → Analyst → SecurityReviewer → Reviewer.
  if (f.security) {
    return ['Analyst', 'SecurityReviewer', 'Reviewer'];
  }

  // 6. QUALITY дефолт → Analyst → Implementer → Reviewer → SecurityReviewer.
  if (mode === 'QUALITY') {
    return ['Analyst', 'Implementer', 'Reviewer', 'SecurityReviewer'];
  }

  // 7. BALANCED → Analyst → Implementer → Tester.
  if (mode === 'BALANCED') {
    return ['Analyst', 'Implementer', 'Tester'];
  }

  // 8. Дефолт по топологии.
  switch (topology) {
    case 'Debate':
      return ['WikiSearcher', 'Critic', 'Reflector'];
    case 'Reflection':
      return ['Implementer', 'Reflector'];
    case 'CoT':
      return ['Analyst', 'MathTeacher'];
    case 'Tree':
      return ['Architect', 'Implementer', 'Tester', 'Reviewer'];
    case 'FullConnected':
      return ['Analyst', 'AlgorithmDesigner', 'Implementer', 'Tester', 'Reviewer', 'Reflector'];
    case 'Chain':
      return ['Analyst', 'Implementer', 'Tester'];
    case 'Single':
    default:
      return ['Implementer'];
  }
}

// =============================================================================
// Fθm — LLM router: (Q,T,{R_i}) → {M_i}
// =============================================================================

/**
 * Выбирает модель подходящего тира.
 * - QUALITY → strong, fallback balanced.
 * - BALANCED → balanced, fallback cheap.
 * - ECO → cheap, fallback local-light → balanced.
 * - local-light — для local-ollama.
 */
function pickModelForTier(models: ModelConfig[], tier: ModelTier): ModelConfig | null {
  const enabled = models.filter((m) => m.enabled);
  if (enabled.length === 0) return null;
  return (
    enabled.find((m) => m.tier === tier) ??
    enabled.find((m) => (tier === 'strong' ? m.tier === 'balanced' : m.tier === 'cheap')) ??
    enabled.find((m) => m.tier === 'local-light') ??
    enabled[0]
  );
}

function allocateModels(
  chain: RoleConfig[],
  input: RouterInput,
  mode: CostMode
): { steps: ChainStep[]; warnings: string[] } {
  const tier: ModelTier = mode === 'QUALITY' ? 'strong' : mode === 'BALANCED' ? 'balanced' : 'cheap';
  const warnings: string[] = [];
  const steps: ChainStep[] = [];

  // Проверка на наличие strong-модели для QUALITY.
  if (mode === 'QUALITY' && !input.availableModels.some((m) => m.enabled && m.tier === 'strong')) {
    warnings.push('Нет подключённой strong-tier модели. Fallback на balanced.');
  }
  if (input.availableModels.filter((m) => m.enabled).length === 0) {
    warnings.push('Ни одна модель не подключена. Маршрут сгенерирован, но LLM-вызовы невозможны.');
  }

  // Каждой роли — свою модель. Reviewer/SecurityReviewer → strong, остальные — по тиру.
  for (let i = 0; i < chain.length; i++) {
    const role = chain[i];
    let stepTier = tier;
    if (role.riskLevel === 3) {
      // Reviewer/SecurityReviewer — всегда strong.
      const strong = pickModelForTier(input.availableModels, 'strong');
      if (strong) {
        steps.push({
          order: i + 1,
          role,
          model: strong,
          outputFormat: role.outputFormat,
          promptTemplateId: role.id
        });
        continue;
      }
      stepTier = 'balanced';
    }
    const model = pickModelForTier(input.availableModels, stepTier);
    if (!model) {
      warnings.push(`Не удалось подобрать модель для роли ${role.name} (тир ${stepTier}).`);
      continue;
    }
    steps.push({
      order: i + 1,
      role,
      model,
      outputFormat: role.outputFormat,
      promptTemplateId: role.id
    });
  }

  return { steps, warnings };
}

// =============================================================================
// STOP CONDITIONS & SAFETY
// =============================================================================

function addExtraStopConditions(input: RouterInput, base: string[]): string[] {
  const f = input.riskFlags;
  const out = [...base];
  if (f.database) out.push('нужна миграция БД или изменение схемы данных');
  if (f.deploy) out.push('требуется перезапуск прода');
  if (f.payment || f.discount) out.push('изменение логики оплаты/скидок');
  return out;
}

// =============================================================================
// ГЛАВНАЯ ФУНКЦИЯ
// =============================================================================

/**
 * Главный вход каскада. Принимает RouterInput, возвращает RouteDecision.
 * Полностью детерминированный — никакого LLM внутри роутера, только правила.
 */
export function calculateRoute(input: RouterInput): RouteDecision {
  const warnings: string[] = [];

  // 1. Risk Score.
  const riskScore = computeRiskScore(input);
  const cascade: RouteDecision['cascade'] = [
    {
      stage: 'Fθt',
      selected: '—',
      rationale: 'вычисление Risk Score для входа в каскад'
    }
  ];

  // 2. Cost Mode.
  const costMode = computeCostMode(input, riskScore);
  const lambda = lambdaFor(costMode);

  // 3. δ(H) и k.
  const delta = computeDelta(input);
  const { agentCount: ruleAgentCount, paperAgentCount } = computeAgentCount(
    riskScore,
    input.complexity,
    delta
  );
  let agentCount = input.userOverrides?.forcedAgentCount ?? ruleAgentCount;
  if (agentCount > MASROUTER_CONSTANTS.GAMMA) {
    warnings.push(`agentCount=${agentCount} превышает γ=6. Игнорируем, ставим 6.`);
    agentCount = MASROUTER_CONSTANTS.GAMMA;
  }
  if (paperAgentCount > MASROUTER_CONSTANTS.GAMMA) {
    warnings.push(
      `Paper-формула ⌈δ·γ⌉ дала ${paperAgentCount}, что > γ=6 (по статье γ>6 даёт ×1.5 cost без прироста).`
    );
  }

  // 4. Fθt — topology.
  const topology = determineTopology(input, riskScore, costMode);
  cascade[0] = {
    stage: 'Fθt',
    selected: topology,
    rationale: `Risk=${riskScore}, complexity=${input.complexity}, taskType=${input.taskType}`
  };

  // 5. Fθr — role chain.
  const roleIds = allocateRoles(input, riskScore, costMode, topology);
  const roleChain: RoleConfig[] = roleIds
    .map((id) => ROLE_MAP[id])
    .filter(Boolean) as RoleConfig[];

  // Подгоняем число ролей под agentCount.
  const trimmedRoles =
    roleChain.length >= agentCount
      ? roleChain.slice(0, agentCount)
      : [...roleChain, ...Array(agentCount - roleChain.length).fill(null).map((_, i) => ROLE_MAP['Reflector']!)].slice(0, agentCount);

  cascade.push({
    stage: 'Fθr',
    selected: trimmedRoles.map((r) => r.name).join(' → '),
    rationale: `${trimmedRoles.length} ролей для топологии ${topology} и режима ${costMode}`
  });

  // 6. Fθm — model allocation.
  const { steps, warnings: modelWarnings } = allocateModels(trimmedRoles, input, costMode);
  warnings.push(...modelWarnings);
  cascade.push({
    stage: 'Fθm',
    selected: steps.map((s) => s.model.name).join(' → '),
    rationale: `${costMode} тир=${costMode === 'QUALITY' ? 'strong' : costMode === 'BALANCED' ? 'balanced' : 'cheap'}, securityReviewer=strong`
  });

  // 7. Stop conditions / Safety.
  let stopConditions = buildStopConditions(input);
  stopConditions = addExtraStopConditions(input, stopConditions);
  const safetyChecklist = buildSafetyChecklist(input);

  // 8. Final Prompt.
  const finalPrompt = buildFinalPrompt({
    input,
    steps,
    costMode,
    topology,
    riskScore,
    stopConditions,
    safetyChecklist
  });

  // 9. Estimated cost.
  const est = estimateCost(steps, DEFAULT_ESTIMATED_TOKENS.input, DEFAULT_ESTIMATED_TOKENS.output);

  // 10. Topological multiplier Γ(k+1).
  const topologicalMultiplier = gammaFn(steps.length + 1);

  // 11. Reason.
  const reason = composeReason(input, riskScore, costMode, topology, agentCount, steps);

  return {
    riskScore,
    costMode,
    lambda,
    topology,
    agentCount: steps.length,
    reason,
    cascade,
    chain: steps,
    stopConditions,
    safetyChecklist,
    finalPrompt,
    estimatedCost: est,
    warnings,
    delta,
    gamma: MASROUTER_CONSTANTS.GAMMA,
    topologicalMultiplier
  };
}

function composeReason(
  input: RouterInput,
  risk: RiskLevel,
  mode: CostMode,
  topology: Topology,
  count: number,
  steps: ChainStep[]
): string {
  const f = input.riskFlags;
  const critical: string[] = [];
  if (f.money) critical.push('money');
  if (f.payment) critical.push('payment');
  if (f.discount) critical.push('discount');
  if (f.security) critical.push('security');
  if (f.database) critical.push('database');
  if (f.deploy) critical.push('deploy');
  const criticalPart = critical.length ? `Критические флаги: ${critical.join(', ')}. ` : '';
  return `${criticalPart}Risk Score = ${risk} → режим ${mode} (λ=${MASROUTER_CONSTANTS.LAMBDAS[mode]}). ` +
    `Топология ${topology}, агентов: ${count}. ` +
    `Цепочка: ${steps.map((s) => s.role.name).join(' → ')}.`;
}
