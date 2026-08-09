// OpenAI-compatible provider — работает с OpenAI, Claude через proxy,
// Gemini, StepFun, и любым другим OpenAI-compatible endpoint.

import type { LLMProvider, LLMMessage, LLMResponse } from '../../../shared/types';

export interface OpenAICompatibleConfig {
  baseUrl: string;
  apiKey: string;
  defaultModel: string;
  extraHeaders?: Record<string, string>;
}

export function makeOpenAICompatibleProvider(cfg: OpenAICompatibleConfig): LLMProvider {
  return {
    kind: 'openai-compatible',
    async testConnection() {
      try {
        const t0 = Date.now();
        const r = await fetch(`${cfg.baseUrl}/models`, {
          method: 'GET',
          headers: {
            ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {}),
            ...(cfg.extraHeaders || {})
          }
        });
        if (!r.ok) {
          return { ok: false, message: `HTTP ${r.status} — проверьте API-ключ и Base URL` };
        }
        return { ok: true, message: 'Подключение успешно', latencyMs: Date.now() - t0 };
      } catch (e) {
        return { ok: false, message: `Ошибка сети: ${(e as Error).message}` };
      }
    },
    async chat(messages: LLMMessage[], opts: { model: string; temperature?: number; maxTokens?: number }): Promise<LLMResponse> {
      const r = await fetch(`${cfg.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {}),
          ...(cfg.extraHeaders || {})
        },
        body: JSON.stringify({
          model: opts.model || cfg.defaultModel,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          temperature: opts.temperature ?? 0.7,
          max_tokens: opts.maxTokens ?? 2048,
          stream: false
        })
      });
      if (!r.ok) {
        const errText = await r.text();
        throw new Error(`Provider ${r.status}: ${errText.slice(0, 300)}`);
      }
      const data: any = await r.json();
      const choice = data?.choices?.[0];
      const content = choice?.message?.content || '';
      const inputTokens = data?.usage?.prompt_tokens || 0;
      const outputTokens = data?.usage?.completion_tokens || 0;
      return {
        content,
        inputTokens,
        outputTokens,
        modelId: opts.model || cfg.defaultModel,
        finishReason: choice?.finish_reason || 'unknown',
        raw: data
      };
    }
  };
}
