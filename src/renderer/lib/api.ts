// renderer-side API — типы моста, который выставил preload.
// Вне Electron (vite dev) делаем заглушку, чтобы UI можно было посмотреть в браузере.

import type { RouteDecision, LLMMessage, LLMResponse } from '@shared/types';
import { BUILTIN_MODELS, BUILTIN_TOPOLOGIES, BUILTIN_ROLES, BUILTIN_CASE_STUDIES } from '@shared/masrouterData';

export interface MasRouterApi {
  getVersion: () => Promise<string>;
  getPlatform: () => Promise<string>;
  openExternal: (url: string) => Promise<{ ok: boolean; error?: string }>;
  openPath: (p: string) => Promise<{ ok: boolean; error?: string }>;
  bootstrap: () => Promise<{
    version: string;
    platform: string;
    settings: any;
    constants: { GAMMA: number; LAMBDAS: { ECO: 25; BALANCED: 15; QUALITY: 5 } };
  }>;
  routerCalculate: (input: unknown) => Promise<RouteDecision>;
  routerPing: () => Promise<string>;
  providerList: () => Promise<any[]>;
  providerTest: (id: string, model: string) => Promise<{ ok: boolean; message: string; latencyMs?: number }>;
  providerChat: (id: string, model: string, messages: LLMMessage[]) => Promise<LLMResponse>;
  storageGet: (key: string) => Promise<unknown>;
  storageSet: (key: string, value: unknown) => Promise<{ ok: boolean }>;
  storageExport: () => Promise<{ ok: boolean; canceled?: boolean; path?: string; error?: string }>;
  storageImport: () => Promise<{ ok: boolean; canceled?: boolean; error?: string }>;
  storageReset: () => Promise<{ ok: boolean }>;
  apiKeySet: (providerId: string, key: string) => Promise<{ ok: boolean; mask: string }>;
  apiKeyMask: (providerId: string) => Promise<string>;
  apiKeyDelete: (providerId: string) => Promise<{ ok: boolean }>;
  codexCreateTask: (args: any) => Promise<{ ok: boolean; path: string }>;
  codexCopyCommand: (args: any) => Promise<{ ok: boolean; command: string }>;
  codexCopySsh: (args: any) => Promise<{ ok: boolean; command: string }>;
  shellRun: (args: any) => Promise<any>;
  logsList: () => Promise<any[]>;
  logsClear: () => Promise<{ ok: boolean }>;
  promptAppend: (entry: unknown) => Promise<{ ok: boolean }>;
  promptList: () => Promise<any[]>;
  costAppend: (entry: unknown) => Promise<{ ok: boolean }>;
  costList: () => Promise<any[]>;
}

declare global {
  interface Window {
    masrouter: MasRouterApi;
  }
}

const MOCK_PROVIDERS = [
  { id: 'ollama-local', kind: 'ollama', label: 'Ollama Local', baseUrl: 'http://127.0.0.1:11434', apiKeyMasked: '', enabled: false },
  { id: 'openai-default', kind: 'openai', label: 'OpenAI', baseUrl: 'https://api.openai.com/v1', apiKeyMasked: '', enabled: false },
  { id: 'minimax-default', kind: 'minimax', label: 'MiniMax', baseUrl: 'https://api.minimax.chat/v1', apiKeyMasked: '', enabled: false },
  { id: 'stepfun-default', kind: 'stepfun', label: 'StepFun', baseUrl: 'https://api.stepfun.com/v1', apiKeyMasked: '', enabled: false },
  { id: 'openai-compatible-default', kind: 'openai-compatible', label: 'OpenAI-compatible (Claude / Gemini / локальный прокси)', baseUrl: '', apiKeyMasked: '', enabled: false }
];

const MOCK_SETTINGS = {
  theme: 'dark' as const,
  language: 'ru' as const,
  autoLaunch: false,
  shellEnabled: false,
  onboardingDone: false,
  safeStorageUnlocked: false
};

const mockFallback: MasRouterApi = {
  getVersion: async () => '0.1.0 (browser preview)',
  getPlatform: async () => 'browser',
  openExternal: async () => ({ ok: true }),
  openPath: async () => ({ ok: true }),
  bootstrap: async () => ({
    version: '0.1.0 (browser preview)',
    platform: 'browser',
    settings: MOCK_SETTINGS,
    constants: { GAMMA: 6, LAMBDAS: { ECO: 25, BALANCED: 15, QUALITY: 5 } }
  }),
  routerCalculate: async () => {
    throw new Error('routerCalculate недоступен вне Electron — откройте в установленном приложении');
  },
  routerPing: async () => 'pong (mock)',
  providerList: async () => MOCK_PROVIDERS,
  providerTest: async () => ({ ok: false, message: 'Browser preview — тест недоступен' }),
  providerChat: async () => {
    throw new Error('LLM недоступен в browser preview');
  },
  storageGet: async (key: string) => {
    const map: Record<string, unknown> = {
      models: BUILTIN_MODELS,
      roles: BUILTIN_ROLES,
      topologies: BUILTIN_TOPOLOGIES,
      providers: MOCK_PROVIDERS,
      caseStudies: BUILTIN_CASE_STUDIES,
      codexProfiles: [
        { id: 'codex-default', name: 'Codex CLI по умолчанию', cliPath: 'codex', commandTemplate: 'codex --prompt-file "{task_file}" --model "{model}" --cd "{project_path}"', projectPath: '', gitBranch: 'main' }
      ],
      serverProfiles: [],
      promptHistory: [],
      costLogs: [],
      appLogs: []
    };
    return map[key] ?? null;
  },
  storageSet: async () => ({ ok: true }),
  storageExport: async () => ({ ok: false, canceled: true }),
  storageImport: async () => ({ ok: false, canceled: true }),
  storageReset: async () => ({ ok: true }),
  apiKeySet: async () => ({ ok: true, mask: '****' }),
  apiKeyMask: async () => '',
  apiKeyDelete: async () => ({ ok: true }),
  codexCreateTask: async () => ({ ok: false, path: '' }),
  codexCopyCommand: async () => ({ ok: true, command: 'codex --prompt-file "..." --model "..."' }),
  codexCopySsh: async () => ({ ok: true, command: 'ssh -p 22 -i ~/.ssh/id_ed25519 user@host "cd /path && git status"' }),
  shellRun: async () => ({ ok: false, blocked: true, blockReason: 'Browser preview' }),
  logsList: async () => [],
  logsClear: async () => ({ ok: true }),
  promptAppend: async () => ({ ok: true }),
  promptList: async () => [],
  costAppend: async () => ({ ok: true }),
  costList: async () => []
};

export const api: MasRouterApi = (typeof window !== 'undefined' && window.masrouter) || mockFallback;
