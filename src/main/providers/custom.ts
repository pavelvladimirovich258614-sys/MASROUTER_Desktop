// Custom REST provider — полностью пользовательский запрос.

import type { LLMProvider, LLMMessage, LLMResponse } from '../../../shared/types';

export interface CustomConfig {
  url: string;
  method: 'POST' | 'GET';
  headers?: Record<string, string>;
  bodyTemplate: string; // шаблон с {model}, {messages}, {temperature}, {maxTokens}
  responsePath: string; // путь к content в ответе через точку: "data.choices.0.message.content"
}

function getByPath(obj: any, path: string): any {
  return path.split('.').reduce((acc, k) => (acc == null ? acc : acc[k]), obj);
}

export function makeCustomProvider(cfg: CustomConfig): LLMProvider {
  return {
    kind: 'custom',
    async testConnection() {
      try {
        const t0 = Date.now();
        const r = await fetch(cfg.url, { method: 'GET', headers: cfg.headers });
        return { ok: r.ok, message: r.ok ? 'OK' : `HTTP ${r.status}`, latencyMs: Date.now() - t0 };
      } catch (e) {
        return { ok: false, message: (e as Error).message };
      }
    },
    async chat(messages: LLMMessage[], opts: { model: string; temperature?: number; maxTokens?: number }): Promise<LLMResponse> {
      const body = cfg.bodyTemplate
        .replace(/\{model\}/g, opts.model)
        .replace(/\{messages\}/g, JSON.stringify(messages))
        .replace(/\{temperature\}/g, String(opts.temperature ?? 0.7))
        .replace(/\{maxTokens\}/g, String(opts.maxTokens ?? 2048));
      const r = await fetch(cfg.url, {
        method: cfg.method,
        headers: { 'Content-Type': 'application/json', ...(cfg.headers || {}) },
        body
      });
      if (!r.ok) {
        throw new Error(`Custom ${r.status}: ${(await r.text()).slice(0, 200)}`);
      }
      const data: any = await r.json();
      const content = getByPath(data, cfg.responsePath) ?? '';
      return {
        content: String(content),
        inputTokens: data?.usage?.prompt_tokens || 0,
        outputTokens: data?.usage?.completion_tokens || 0,
        modelId: opts.model,
        raw: data
      };
    }
  };
}
