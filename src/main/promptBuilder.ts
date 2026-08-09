// promptBuilder — генерация Final Prompt по структуре из промпта X60, секция 7.
// Содержит: ROLE / POLICY / MODEL / CONTEXT / TASK / ALLOWED / FORBIDDEN /
// OUTPUT FORMAT / DONE CRITERIA / STOP CONDITIONS.

import { DEFAULT_SAFETY_CHECKLIST, DEFAULT_STOP_CONDITIONS } from '../../shared/constants';
import type { ChainStep, CostMode, RiskLevel, RouterInput, Topology } from '../../shared/types';

export interface BuildFinalPromptInput {
  input: RouterInput;
  steps: ChainStep[];
  costMode: CostMode;
  topology: Topology;
  riskScore: RiskLevel;
  stopConditions: string[];
  safetyChecklist: string[];
}

/**
 * Базовая структура Final Prompt. Один шаг = один блок.
 * Несколько шагов = несколько блоков, разделённых ---STEP---
 */
export function buildFinalPrompt(b: BuildFinalPromptInput): string {
  const { input, steps, costMode, topology, riskScore, stopConditions, safetyChecklist } = b;
  const f = input.riskFlags;

  const headerLines = [
    `# MASROUTER Final Prompt`,
    ``,
    `**Режим:** ${costMode} (λ=${lambdaFor(costMode)})`,
    `**Risk Score:** ${riskScore} / 3`,
    `**Топология:** ${topology}`,
    `**Агентов:** ${steps.length}`,
    `**Тип задачи:** ${input.taskType}`,
    `**Сложность:** ${input.complexity}`,
    ``,
    `## CONTEXT`,
    `- Проект: ${input.userOverrides?.forcedModel ? 'n/a' : '—'}`,
    `- Сервер: ${f.serverEdit ? 'требуется доступ' : 'не требуется'}`,
    `- Ветка: ${input.userOverrides ? 'main' : 'main'}`,
    ``,
    `## TASK`,
    input.taskDescription,
    ``,
    `## ALLOWED`,
    `- внести одну атомарную правку в указанном файле`,
    `- прочитать логи/файлы при необходимости`,
    `- предложить commit message в конце`,
    ``,
    `## FORBIDDEN`,
    `- не менять соседние файлы`,
    `- не рефакторить без явного запроса`,
    `- не менять архитектуру`,
    `- не трогать оплату, базу, .env, деплой без команды`,
    `- не создавать лишних агентов`,
    `- не выходить за пределы одной задачи`,
    ``,
    `## DONE CRITERIA`,
    `- задача выполнена согласно описанию`,
    `- показана команда проверки`,
    `- показан diff / изменённые файлы`,
    `- предложен commit message`,
    ``
  ];

  const stopBlock = [
    `## STOP CONDITIONS`,
    ...stopConditions.map((s) => `- ${s}`),
    ``
  ].join('\n');

  const safetyBlock = f.serverEdit
    ? [
        `## SERVER SAFETY CHECKLIST`,
        ...safetyChecklist.map((s) => `- [ ] ${s}`),
        ``
      ].join('\n')
    : '';

  const stepsBlock = steps
    .map(
      (s, i) => `---STEP ${i + 1} of ${steps.length}---` +
        '\n' +
        buildStepBlock(s, costMode)
    )
    .join('\n\n');

  return headerLines.join('\n') + '\n' + stopBlock + '\n' + safetyBlock + '\n' + stepsBlock;
}

function buildStepBlock(step: ChainStep, mode: CostMode): string {
  return [
    `ROLE: ${step.role.name}`,
    `POLICY: ${mode}`,
    `MODEL: ${step.model.name} (${step.model.id})`,
    ``,
    `TASK (в рамках общей задачи):`,
    `Выполни свою часть работы, описанную в роли "${step.role.name}".`,
    `Соблюдай указанные выше CONTEXT / ALLOWED / FORBIDDEN / DONE CRITERIA.`,
    ``,
    `OUTPUT FORMAT:`,
    step.role.outputFormat,
    ``,
    `ALLOWED (для этого шага):`,
    ...step.role.allowedActions.map((a) => `- ${a}`),
    ``,
    `FORBIDDEN (для этого шага):`,
    ...step.role.forbiddenActions.map((a) => `- ${a}`),
    ``,
    `DONE CRITERIA:`,
    `- выход соответствует OUTPUT FORMAT`,
    `- нет нарушений FORBIDDEN`,
    `- следующему шагу передаётся структурированный результат`
  ].join('\n');
}

function lambdaFor(mode: CostMode): 5 | 15 | 25 {
  return mode === 'QUALITY' ? 5 : mode === 'BALANCED' ? 15 : 25;
}

export function buildStopConditions(input: RouterInput): string[] {
  const f = input.riskFlags;
  const base = [...DEFAULT_STOP_CONDITIONS];
  if (f.serverEdit) {
    base.push('требуется перезапуск сервиса на сервере');
    base.push('нужно править прод-конфиги');
  }
  if (f.security) base.push('найдена потенциальная уязвимость');
  return base;
}

export function buildSafetyChecklist(input: RouterInput): string[] {
  if (!input.riskFlags.serverEdit) return [];
  return [...DEFAULT_SAFETY_CHECKLIST];
}
