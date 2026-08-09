import { describe, it, expect } from 'vitest';
import { estimateCost, stepCost, costLabel, isPriceConfigured } from '../src/main/costEstimator';
import { BUILTIN_MODELS } from '../shared/masrouterData';

describe('stepCost', () => {
  it('local-light → 0', () => {
    const local = BUILTIN_MODELS.find((m) => m.tier === 'local-light')!;
    expect(stepCost(local, 1500, 800)).toBe(0);
  });

  it('gpt-4o-mini: 1500 in / 800 out → ожидаемая стоимость', () => {
    const gpt = BUILTIN_MODELS.find((m) => m.id === 'gpt-4o-mini')!;
    // 1500/1e6 * 0.15 + 800/1e6 * 0.6 = 0.000225 + 0.00048 = 0.000705
    const c = stepCost(gpt, 1500, 800);
    expect(c).toBeCloseTo(0.000705, 6);
  });

  it('throws на отрицательные tokens', () => {
    const gpt = BUILTIN_MODELS.find((m) => m.id === 'gpt-4o-mini')!;
    expect(() => stepCost(gpt, -1, 0)).toThrow();
  });
});

describe('estimateCost (цепочка)', () => {
  it('суммирует по шагам', () => {
    const gpt = BUILTIN_MODELS.find((m) => m.id === 'gpt-4o-mini')!;
    const local = BUILTIN_MODELS.find((m) => m.tier === 'local-light')!;
    const steps = [
      {
        order: 1,
        role: BUILTIN_MODELS[0] as any, // нам не важна роль тут
        model: gpt,
        outputFormat: '',
        promptTemplateId: 'x'
      },
      {
        order: 2,
        role: BUILTIN_MODELS[0] as any,
        model: local,
        outputFormat: '',
        promptTemplateId: 'y'
      }
    ];
    const c = estimateCost(steps as any, 1500, 800);
    expect(c.perStep.length).toBe(2);
    expect(c.perStep[0].cost).toBeCloseTo(0.000705, 6);
    expect(c.perStep[1].cost).toBe(0);
    expect(c.total).toBeCloseTo(0.000705, 6);
    expect(c.currency).toBe('USD');
  });
});

describe('costLabel', () => {
  it('0 → Бесплатно (local)', () => {
    expect(costLabel(0)).toBe('Бесплатно (local)');
  });
  it('маленькая → < $0.01', () => {
    expect(costLabel(0.001)).toBe('< $0.01 USD');
  });
  it('нормальная → $X.XXX', () => {
    expect(costLabel(0.123)).toBe('$0.123 USD');
  });
});

describe('isPriceConfigured', () => {
  it('local → true', () => {
    const local = BUILTIN_MODELS.find((m) => m.tier === 'local-light')!;
    expect(isPriceConfigured(local)).toBe(true);
  });
  it('cloud → true', () => {
    const gpt = BUILTIN_MODELS.find((m) => m.id === 'gpt-4o-mini')!;
    expect(isPriceConfigured(gpt)).toBe(true);
  });
  it('цена 0/0 → false', () => {
    const m = { ...BUILTIN_MODELS[0], inputPricePerMTok: 0, outputPricePerMTok: 0, tier: 'balanced' as const };
    expect(isPriceConfigured(m)).toBe(false);
  });
});
