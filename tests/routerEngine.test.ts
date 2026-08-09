import { describe, it, expect } from 'vitest';
import { calculateRoute, computeRiskScore } from '../src/main/routerEngine';
import { BUILTIN_MODELS } from '../shared/masrouterData';
import type { RouterInput, RiskFlags } from '../shared/types';

const NO_RISK: RiskFlags = {
  money: false,
  payment: false,
  discount: false,
  security: false,
  database: false,
  deploy: false,
  serverEdit: false
};

function mkInput(overrides: Partial<RouterInput>): RouterInput {
  return {
    taskDescription: 'Test',
    taskType: 'code-edit',
    complexity: 'Low',
    riskFlags: NO_RISK,
    budgetMode: 'AUTO',
    availableModels: BUILTIN_MODELS.map((m) => ({ ...m, enabled: true })),
    ...overrides
  };
}

describe('computeRiskScore', () => {
  it('flags → 3', () => {
    expect(computeRiskScore(mkInput({ riskFlags: { ...NO_RISK, money: true } }))).toBe(3);
    expect(computeRiskScore(mkInput({ riskFlags: { ...NO_RISK, payment: true } }))).toBe(3);
    expect(computeRiskScore(mkInput({ riskFlags: { ...NO_RISK, discount: true } }))).toBe(3);
    expect(computeRiskScore(mkInput({ riskFlags: { ...NO_RISK, security: true } }))).toBe(3);
    expect(computeRiskScore(mkInput({ riskFlags: { ...NO_RISK, database: true } }))).toBe(3);
    expect(computeRiskScore(mkInput({ riskFlags: { ...NO_RISK, deploy: true } }))).toBe(3);
  });
  it('complexity=High → 3', () => {
    expect(computeRiskScore(mkInput({ complexity: 'High' }))).toBe(3);
  });
  it('complexity=Medium → 2', () => {
    expect(computeRiskScore(mkInput({ complexity: 'Medium' }))).toBe(2);
  });
  it('Low + no risk → 1', () => {
    expect(computeRiskScore(mkInput({ complexity: 'Low' }))).toBe(1);
  });
});

describe('calculateRoute — простая задача', () => {
  it('Low + no risk → ECO / Single / λ=25 / 1 агент', () => {
    const r = calculateRoute(
      mkInput({
        taskDescription: 'Поменять текст кнопки',
        complexity: 'Low',
        riskFlags: NO_RISK
      })
    );
    expect(r.riskScore).toBe(1);
    expect(r.costMode).toBe('ECO');
    expect(r.lambda).toBe(25);
    expect(r.topology).toBe('Single');
    expect(r.agentCount).toBe(1);
    expect(r.chain.length).toBe(1);
  });
});

describe('calculateRoute — средняя задача', () => {
  it('Medium + no risk → BALANCED / Chain / λ=15 / 3 агента', () => {
    const r = calculateRoute(
      mkInput({
        taskDescription: 'Добавить сортировку туров по дате',
        taskType: 'feature',
        complexity: 'Medium',
        riskFlags: NO_RISK
      })
    );
    expect(r.riskScore).toBe(2);
    expect(r.costMode).toBe('BALANCED');
    expect(r.lambda).toBe(15);
    expect(r.topology).toBe('Chain');
    expect(r.agentCount).toBe(3);
    expect(r.chain.length).toBe(3);
  });
});

describe('calculateRoute — задача со скидкой', () => {
  it('discount=true → QUALITY / strong / SecurityReviewer обязателен / λ=5', () => {
    const r = calculateRoute(
      mkInput({
        taskDescription: 'Исправить баг в скидке',
        taskType: 'bug-fix',
        complexity: 'High',
        riskFlags: { ...NO_RISK, discount: true }
      })
    );
    expect(r.riskScore).toBe(3);
    expect(r.costMode).toBe('QUALITY');
    expect(r.lambda).toBe(5);
    expect(r.chain.some((s) => s.role.id === 'SecurityReviewer')).toBe(true);
    expect(r.chain.some((s) => s.model.tier === 'strong')).toBe(true);
  });
});

describe('calculateRoute — deploy=true', () => {
  it('deploy → QUALITY + stop conditions про деплой', () => {
    const r = calculateRoute(
      mkInput({
        taskDescription: 'План деплоя',
        taskType: 'deploy',
        complexity: 'High',
        riskFlags: { ...NO_RISK, deploy: true }
      })
    );
    expect(r.riskScore).toBe(3);
    expect(r.costMode).toBe('QUALITY');
    expect(r.stopConditions.some((s) => /прод|депл/i.test(s))).toBe(true);
  });
});

describe('calculateRoute — database=true', () => {
  it('database → QUALITY', () => {
    const r = calculateRoute(
      mkInput({
        taskDescription: 'Добавить поле в БД',
        taskType: 'database',
        complexity: 'High',
        riskFlags: { ...NO_RISK, database: true }
      })
    );
    expect(r.costMode).toBe('QUALITY');
    expect(r.chain.some((s) => s.role.id === 'SecurityReviewer')).toBe(true);
  });
});

describe('calculateRoute — нет strong-модели', () => {
  it('warning + fallback не падает', () => {
    const noStrong = BUILTIN_MODELS
      .filter((m) => m.tier !== 'strong')
      .map((m) => ({ ...m, enabled: true }));
    const r = calculateRoute(
      mkInput({
        taskDescription: 'Скидка',
        taskType: 'bug-fix',
        complexity: 'High',
        riskFlags: { ...NO_RISK, discount: true },
        availableModels: noStrong
      })
    );
    expect(r.warnings.some((w) => /strong/i.test(w))).toBe(true);
    expect(r.chain.length).toBeGreaterThan(0);
  });

  it('нет моделей вообще → warning, маршрут существует', () => {
    const r = calculateRoute(
      mkInput({
        taskDescription: 'Скидка',
        riskFlags: { ...NO_RISK, discount: true },
        availableModels: []
      })
    );
    expect(r.warnings.some((w) => /не подключ/i.test(w))).toBe(true);
  });
});

describe('calculateRoute — agentCount ≤ 6', () => {
  it('никогда не превышает γ=6', () => {
    const r = calculateRoute(
      mkInput({
        complexity: 'High',
        riskFlags: { ...NO_RISK, deploy: true, payment: true, discount: true }
      })
    );
    expect(r.agentCount).toBeLessThanOrEqual(6);
  });
});

describe('calculateRoute — каскад видим', () => {
  it('cascade содержит Fθt / Fθr / Fθm', () => {
    const r = calculateRoute(mkInput({ complexity: 'Medium' }));
    const stages = r.cascade.map((c) => c.stage);
    expect(stages).toEqual(['Fθt', 'Fθr', 'Fθm']);
  });
});

describe('calculateRoute — Topological Multiplier', () => {
  it('вычисляется через Γ(k+1)', () => {
    const r = calculateRoute(mkInput({ complexity: 'Low' }));
    // для 1 агента: Γ(2) = 1
    expect(r.topologicalMultiplier).toBeCloseTo(1, 6);
  });
});
