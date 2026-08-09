// Ollama provider — локальный LLM через /api/tags и /api/chat.

import type { LLMProvider, LLMMessage, LLMResponse } from '../../../shared/types';

export interface OllamaConfig {
  baseUrl: string;
  model: string;
}

export function makeOllamaProvider(cfg: OllamaConfig): LLMProvider {
  return {
    kind: 'ollama',
    async testConnection() {
      try {
        const t0 = Date.now();
        const r = await fetch(`${cfg.baseUrl}/api/tags`, { method: 'GET' });
        if (!r.ok) {
          return { ok: false, message: `HTTP ${r.status} — Ollama недоступен. Запустите: ollama serve` };
        }
        const data: any = await r.json();
        const models: string[] = (data.models || []).map((m: any) => m.name);
        const hasModel = models.includes(cfg.model) || models.some((m) => m.startsWith(cfg.model));
        return {
          ok: hasModel,
          message: hasModel
            ? `Ollama OK, модель ${cfg.model} доступна`
            : `Ollama OK, но модель ${cfg.model} не найдена. Доступные: ${models.slice(0, 5).join(', ')}. Установите: ollama pull ${cfg.model}`,
          latencyMs: Date.now() - t0
        };
      } catch (e) {
        return {
          ok: false,
          message: `Не удалось подключиться к Ollama по ${cfg.baseUrl}. ${(e as Error).message}. Запустите: ollama serve`
        };
      }
    },
    async chat(messages: LLMMessage[], opts: { model: string; temperature?: number; maxTokens?: number }): Promise<LLMResponse> {
      const r = await fetch(`${cfg.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: opts.model || cfg.model,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          stream: false,
          options: {
            temperature: opts.temperature ?? 0.7,
            num_predict: opts.maxTokens ?? 2048
          }
        })
      });
      if (!r.ok) {
        const errText = await r.text();
        throw new Error(`Ollama ${r.status}: ${errText.slice(0, 200)}`);
      }
      const data: any = await r.json();
      const content = data?.message?.content || '';
      const inputTokens = data?.prompt_eval_count || 0;
      const outputTokens = data?.eval_count || 0;
      return {
        content,
        inputTokens,
        outputTokens,
        modelId: opts.model || cfg.model,
        finishReason: data?.done ? 'stop' : 'unknown',
        raw: data
      };
    }
  };
}
