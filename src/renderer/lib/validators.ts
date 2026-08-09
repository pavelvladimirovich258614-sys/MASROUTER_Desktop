// Простые хелперы для UI. Зеркалят части shared логики без зависимости на Node-only модули.

import type { CostMode, RiskLevel, Topology, ModelTier } from '../../../shared/types';

export function riskLabel(r: RiskLevel): string {
  return ['Низкий (1)', 'Средний (2)', 'Высокий (3)'][r - 1] || String(r);
}

export function costModeLabel(c: CostMode): string {
  switch (c) {
    case 'ECO':
      return 'ECO — экономия';
    case 'BALANCED':
      return 'BALANCED — баланс';
    case 'QUALITY':
      return 'QUALITY — качество';
  }
}

export function costModeClass(c: CostMode): string {
  return `cost-${c.toLowerCase()}`;
}

export function topologyLabel(t: Topology): string {
  switch (t) {
    case 'Single':
      return 'Single / IO';
    case 'CoT':
      return 'Chain-of-Thought';
    case 'Chain':
      return 'Chain (цепочка)';
    case 'Tree':
      return 'Tree (иерархия)';
    case 'FullConnected':
      return 'FullConnected (граф)';
    case 'Debate':
      return 'Debate (дебаты)';
    case 'Reflection':
      return 'Reflection (рефлексия)';
  }
}

export function modelTierLabel(t: ModelTier): string {
  switch (t) {
    case 'cheap':
      return 'cheap';
    case 'balanced':
      return 'balanced';
    case 'strong':
      return 'strong';
    case 'local-light':
      return 'local-light';
  }
}

export function lambdaFor(mode: CostMode): 5 | 15 | 25 {
  return mode === 'QUALITY' ? 5 : mode === 'BALANCED' ? 15 : 25;
}

export function gammaFor(): 6 {
  return 6;
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function copyToClipboard(text: string): Promise<boolean> {
  if (navigator?.clipboard?.writeText) {
    return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
  }
  // Fallback для старых сред.
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return Promise.resolve(ok);
  } catch {
    return Promise.resolve(false);
  }
}
