// StepFun provider — OpenAI-compatible, ключ из кабинета StepFun.

import { makeOpenAICompatibleProvider, OpenAICompatibleConfig, listOpenAICompatibleModels } from './openaiCompatible';
import type { LLMProvider } from '../../../shared/types';

export function makeStepFunProvider(cfg: { apiKey: string; defaultModel: string }): LLMProvider {
  const wrapped: OpenAICompatibleConfig = {
    baseUrl: 'https://api.stepfun.com/v1',
    apiKey: cfg.apiKey,
    defaultModel: cfg.defaultModel
  };
  const base = makeOpenAICompatibleProvider(wrapped);
  return {
    ...base,
    async listModels() {
      return listOpenAICompatibleModels(wrapped);
    }
  };
}
