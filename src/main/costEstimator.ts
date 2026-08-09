// costEstimator — расчёт стоимости по ценам моделей.
// estimatedCost = inputTokens/1e6 * inputPrice + outputTokens/1e6 * outputPrice
// Local модель → 0. Без цены → null (UI покажет "Не настроено").

import type { ChainStep, ModelConfig } from '../../shared/types';

export interface CostBreakdown {
  input: number;
  output: number;
  total: number;
  currency: 'USD';
  perStep: { order: number; modelId: string; cost: number; reason: string }[];
}

/**
 * Оценка стоимости всей цепочки шагов.
 * @param steps - шаги из routerEngine
 * @param inputTokensPerStep - среднее input tokens на один шаг
 * @param outputTokensPerStep - среднее output tokens на один шаг
 */
export function estimateCost(
  steps: ChainStep[],
  inputTokensPerStep: number,
  outputTokensPerStep: number
): CostBreakdown {
  const perStep: CostBreakdown['perStep'] = [];
  let total = 0;
  for (const s of steps) {
    const c = stepCost(s.model, inputTokensPerStep, outputTokensPerStep);
    perStep.push({
      order: s.order,
      modelId: s.model.id,
      cost: c,
      reason: c === 0 && s.model.tier === 'local-light' ? 'local — бесплатно' : `${s.model.tier} tier`
    });
    total += c;
  }
  return {
    input: 0, // агрегировано в perStep
    output: 0,
    total,
    currency: 'USD',
    perStep
  };
}

/**
 * Стоимость одного вызова. Возвращает 0 для local.
 * @throws RangeError при отрицательных tokens.
 */
export function stepCost(
  model: ModelConfig,
  inputTokens: number,
  outputTokens: number
): number {
  if (inputTokens < 0 || outputTokens < 0) {
    throw new RangeError('Tokens must be non-negative');
  }
  if (model.tier === 'local-light') return 0;
  const inputCost = (inputTokens / 1_000_000) * model.inputPricePerMTok;
  const outputCost = (outputTokens / 1_000_000) * model.outputPricePerMTok;
  return inputCost + outputCost;
}

/**
 * Текстовая метка для UI.
 */
export function costLabel(cost: number, currency: 'USD' = 'USD'): string {
  if (cost === 0) return 'Бесплатно (local)';
  if (cost < 0.01) return `< $0.01 ${currency}`;
  return `$${cost.toFixed(3)} ${currency}`;
}

/**
 * Проверка, что у модели настроена цена.
 */
export function isPriceConfigured(model: ModelConfig): boolean {
  return model.tier === 'local-light' || (model.inputPricePerMTok > 0 && model.outputPricePerMTok > 0);
}
