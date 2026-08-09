// MiniMax provider — обёртка над OpenAI-compatible.
// Делегирует listModels в OpenAI-compatible.

import { makeOpenAICompatibleProvider, OpenAICompatibleConfig, listOpenAICompatibleModels } from './openaiCompatible';
import type { LLMProvider } from '../../../shared/types';

export function makeMiniMaxProvider(cfg: { baseUrl: string; apiKey: string; defaultModel: string }): LLMProvider {
  const wrapped: OpenAICompatibleConfig = {
    baseUrl: cfg.baseUrl,
    apiKey: cfg.apiKey,
    defaultModel: cfg.defaultModel,
    extraHeaders: { 'X-Provider': 'MiniMax' }
  };
  const base = makeOpenAICompatibleProvider(wrapped);
  return {
    ...base,
    async listModels() {
      return listOpenAICompatibleModels(wrapped);
    }
  };
}
