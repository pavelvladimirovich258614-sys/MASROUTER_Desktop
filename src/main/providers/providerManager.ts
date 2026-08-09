// providerManager — единая точка входа для LLM-провайдеров.
// По provider id поднимает нужную реализацию, инжектит API-ключ из safeStorage.

import type { LLMProvider, ProviderConfig } from '../../../shared/types';
import { getApiKey } from '../storage';
import { makeOllamaProvider } from './ollama';
import { makeOpenAICompatibleProvider } from './openaiCompatible';
import { makeMiniMaxProvider } from './minimax';
import { makeStepFunProvider } from './stepfun';
import { makeCustomProvider } from './custom';

export function buildProvider(provider: ProviderConfig, defaultModel: string): LLMProvider | null {
  if (!provider.enabled) return null;
  const key = getApiKey(provider.id) || '';
  switch (provider.kind) {
    case 'ollama':
      return makeOllamaProvider({ baseUrl: provider.baseUrl, model: defaultModel });
    case 'openai':
      return makeOpenAICompatibleProvider({
        baseUrl: provider.baseUrl,
        apiKey: key,
        defaultModel
      });
    case 'openai-compatible':
      return makeOpenAICompatibleProvider({
        baseUrl: provider.baseUrl,
        apiKey: key,
        defaultModel,
        extraHeaders: provider.headers
      });
    case 'minimax':
      return makeMiniMaxProvider({ baseUrl: provider.baseUrl, apiKey: key, defaultModel });
    case 'stepfun':
      return makeStepFunProvider({ apiKey: key, defaultModel });
    case 'custom':
      // Custom провайдер требует дополнительной конфигурации; базовая заглушка.
      return makeCustomProvider({
        url: provider.baseUrl,
        method: 'POST',
        headers: provider.headers,
        bodyTemplate:
          '{"model":"{model}","messages":{messages},"temperature":{temperature},"max_tokens":{maxTokens}}',
        responsePath: 'choices.0.message.content'
      });
    default:
      return null;
  }
}
