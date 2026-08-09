// MiniMax provider — заглушка с тем же интерфейсом.
// На момент написания MiniMax — это placeholder, реальный endpoint пользователь
// прописывает сам в настройках.

import { makeOpenAICompatibleProvider, OpenAICompatibleConfig } from './openaiCompatible';
import type { LLMProvider } from '../../../shared/types';

export function makeMiniMaxProvider(cfg: { baseUrl: string; apiKey: string; defaultModel: string }): LLMProvider {
  const wrapped: OpenAICompatibleConfig = {
    baseUrl: cfg.baseUrl,
    apiKey: cfg.apiKey,
    defaultModel: cfg.defaultModel,
    extraHeaders: { 'X-Provider': 'MiniMax' }
  };
  return makeOpenAICompatibleProvider(wrapped);
}
