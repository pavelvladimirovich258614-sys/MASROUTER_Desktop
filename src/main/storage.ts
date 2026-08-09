// storage.ts — обёртка над electron-store + safeStorage.
// API-ключи хранятся через safeStorage (зашифрованы системой), в UI только маска.

import Store from 'electron-store';
import { safeStorage } from 'electron';
import { z } from 'zod';
import { BUILTIN_MODELS, BUILTIN_ROLES, BUILTIN_TOPOLOGIES, BUILTIN_CASE_STUDIES } from '../../shared/masrouterData';
import { settingsSchema, providerConfigSchema, codexProfileSchema, serverProfileSchema } from '../../shared/schemas';
import type { Settings, ProviderConfig, CodexProfile, ServerProfile } from '../../shared/types';

// Схема всего стора. Всё типизировано.
const storeSchema = z.object({
  settings: settingsSchema,
  providers: z.array(providerConfigSchema),
  models: z.array(z.any()),
  roles: z.array(z.any()),
  topologies: z.array(z.any()),
  caseStudies: z.array(z.any()),
  codexProfiles: z.array(codexProfileSchema),
  serverProfiles: z.array(serverProfileSchema),
  promptHistory: z.array(z.any()),
  costLogs: z.array(z.any()),
  appLogs: z.array(z.any()),
  __schemaVersion: z.number().optional()
});

export type StoreShape = z.infer<typeof storeSchema>;

const DEFAULTS: StoreShape = {
  settings: {
    theme: 'dark',
    language: 'ru',
    autoLaunch: false,
    shellEnabled: false,
    onboardingDone: false,
    safeStorageUnlocked: safeStorage.isEncryptionAvailable()
  },
  providers: [
    {
      id: 'ollama-local',
      kind: 'ollama',
      label: 'Ollama Local',
      baseUrl: 'http://127.0.0.1:11434',
      apiKeyMasked: '',
      enabled: false
    },
    {
      id: 'openai-default',
      kind: 'openai',
      label: 'OpenAI',
      baseUrl: 'https://api.openai.com/v1',
      apiKeyMasked: '',
      enabled: false
    },
    {
      id: 'minimax-default',
      kind: 'minimax',
      label: 'MiniMax',
      baseUrl: 'https://api.minimax.chat/v1',
      apiKeyMasked: '',
      enabled: false
    },
    {
      id: 'stepfun-default',
      kind: 'stepfun',
      label: 'StepFun',
      baseUrl: 'https://api.stepfun.com/v1',
      apiKeyMasked: '',
      enabled: false
    },
    {
      id: 'openai-compatible-default',
      kind: 'openai-compatible',
      label: 'OpenAI-compatible (Claude / Gemini / локальный прокси)',
      baseUrl: '',
      apiKeyMasked: '',
      enabled: false
    }
  ],
  // Модели НЕ сидируются — пользователь подтягивает их через ✓ Тест у провайдера.
  // Builtin (BUILTIN_MODELS в masrouterData.ts) остаётся как reference для расчёта
  // стоимости в routerEngine, но не попадает в storage.
  models: [],
  roles: BUILTIN_ROLES,
  topologies: BUILTIN_TOPOLOGIES,
  caseStudies: BUILTIN_CASE_STUDIES,
  codexProfiles: [
    {
      id: 'codex-default',
      name: 'Codex CLI по умолчанию',
      cliPath: 'codex',
      commandTemplate: 'codex --prompt-file "{task_file}" --model "{model}" --cd "{project_path}"',
      projectPath: '',
      gitBranch: 'main'
    }
  ],
  serverProfiles: [],
  promptHistory: [],
  costLogs: [],
  appLogs: []
};

let store: Store<StoreShape> | null = null;

/**
 * Версия схемы storage. При изменении схемы (новые seed-провайдеры, новые
 * обязательные поля) — увеличить, чтобы миграция применилась заново.
 */
const STORAGE_SCHEMA_VERSION = 3;

export function initStorage(): void {
  store = new Store<StoreShape>({
    name: 'masrouter-data',
    defaults: DEFAULTS,
    clearInvalidConfig: true
  });
  migrate();
}

/**
 * Миграция storage. Применяется при каждом запуске, идемпотентна.
 * Добавляет недостающие seed-провайдеры / роли / топологии / модели / кейс-стади
 * в существующий store, не затирая пользовательские изменения.
 */
function migrate(): void {
  if (!store) return;
  const cur = store.store;

  // Базовые поля — если их нет, инициализируем дефолтами.
  if (!cur.settings) store.set('settings', DEFAULTS.settings);
  if (!Array.isArray(cur.roles) || cur.roles.length === 0) store.set('roles', DEFAULTS.roles);
  if (!Array.isArray(cur.topologies) || cur.topologies.length === 0) store.set('topologies', DEFAULTS.topologies);
  if (!Array.isArray(cur.caseStudies) || cur.caseStudies.length === 0) store.set('caseStudies', DEFAULTS.caseStudies);
  // Модели: НЕ сидируем defaults. Если пусто — пользователь увидит подсказку
  // "подключите провайдера и нажмите ✓ Тест". Не затираем существующие модели.

  // Провайдеры: мигрируем аккуратно. Если никого нет — ставим defaults.
  // Если есть, но кого-то из defaults не хватает (например, MiniMax) — добавляем.
  let providers: any[] = Array.isArray(cur.providers) ? cur.providers : [];
  if (providers.length === 0) {
    providers = DEFAULTS.providers;
    store.set('providers', providers);
  } else {
    const existingIds = new Set(providers.map((p) => p.id));
    const missing = DEFAULTS.providers.filter((p) => !existingIds.has(p.id));
    if (missing.length > 0) {
      providers = [...providers, ...missing];
      store.set('providers', providers);
    }
  }

  // Codex профиль по умолчанию: если нет ни одного — создаём.
  if (!Array.isArray(cur.codexProfiles) || cur.codexProfiles.length === 0) {
    store.set('codexProfiles', DEFAULTS.codexProfiles);
  }

  // Версия схемы.
  const v = (cur as any).__schemaVersion;
  if (v !== STORAGE_SCHEMA_VERSION) {
    (cur as any).__schemaVersion = STORAGE_SCHEMA_VERSION;
    store.set('__schemaVersion' as any, STORAGE_SCHEMA_VERSION as any);
  }
}

function s(): Store<StoreShape> {
  if (!store) throw new Error('Storage not initialized');
  return store;
}

// === Public API ===
export function getAll() {
  return s().store;
}
export function getSettings(): Settings {
  return s().get('settings');
}
export function setSettings(patch: Partial<Settings>): Settings {
  const cur = s().get('settings');
  const next = { ...cur, ...patch };
  s().set('settings', next);
  return next;
}
export function getProviders(): ProviderConfig[] {
  return s().get('providers');
}
export function setProviders(providers: ProviderConfig[]): void {
  s().set('providers', providers);
}
export function getModels() {
  return s().get('models');
}
export function setModels(models: unknown[]): void {
  s().set('models', models);
}
export function getRoles() {
  return s().get('roles');
}
export function setRoles(roles: unknown[]): void {
  s().set('roles', roles);
}
export function getTopologies() {
  return s().get('topologies');
}
export function setTopologies(topos: unknown[]): void {
  s().set('topologies', topos);
}
export function getCaseStudies() {
  return s().get('caseStudies');
}
export function getCodexProfiles(): CodexProfile[] {
  return s().get('codexProfiles');
}
export function setCodexProfiles(profiles: CodexProfile[]): void {
  s().set('codexProfiles', profiles);
}
export function getServerProfiles(): ServerProfile[] {
  return s().get('serverProfiles');
}
export function setServerProfiles(profiles: ServerProfile[]): void {
  s().set('serverProfiles', profiles);
}
export function getPromptHistory() {
  return s().get('promptHistory');
}
export function appendPromptHistory(entry: unknown): void {
  const cur = s().get('promptHistory');
  s().set('promptHistory', [entry, ...cur].slice(0, 500));
}
export function getCostLogs() {
  return s().get('costLogs');
}
export function appendCostLog(entry: unknown): void {
  const cur = s().get('costLogs');
  s().set('costLogs', [entry, ...cur].slice(0, 5000));
}
export function getAppLogs() {
  return s().get('appLogs');
}
export function appendAppLog(entry: unknown): void {
  const cur = s().get('appLogs');
  s().set('appLogs', [entry, ...cur].slice(0, 5000));
}
export function clearAppLogs(): void {
  s().set('appLogs', []);
}

// === Безопасное хранение API-ключей через safeStorage ===
export function setApiKey(providerId: string, key: string): void {
  if (!safeStorage.isEncryptionAvailable()) {
    // Без шифрования — отказ, чтобы не светить ключ в plain JSON.
    throw new Error('safeStorage недоступен — ключ нельзя сохранить безопасно');
  }
  const enc = safeStorage.encryptString(key).toString('base64');
  s().set(`encKey.${providerId}` as any, enc as any);
  // Маска для отображения.
  const mask = key.length > 8 ? `${key.slice(0, 4)}…${key.slice(-4)}` : '****';
  s().set(`maskKey.${providerId}` as any, mask as any);
}

export function getApiKey(providerId: string): string | null {
  if (!safeStorage.isEncryptionAvailable()) return null;
  const enc = s().get(`encKey.${providerId}` as any) as unknown as string | undefined;
  if (!enc) return null;
  try {
    return safeStorage.decryptString(Buffer.from(enc, 'base64'));
  } catch {
    return null;
  }
}

export function getApiKeyMask(providerId: string): string {
  const mask = s().get(`maskKey.${providerId}` as any) as unknown as string | undefined;
  return mask || '';
}

export function deleteApiKey(providerId: string): void {
  s().delete(`encKey.${providerId}` as any);
  s().delete(`maskKey.${providerId}` as any);
}

// === Экспорт/импорт всего стора ===
export function exportAll(): string {
  return JSON.stringify(s().store, null, 2);
}
export function importAll(json: string): { ok: boolean; error?: string } {
  try {
    const parsed = JSON.parse(json);
    const validated = storeSchema.parse(parsed);
    s().clear();
    s().set(validated as any);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
export function resetAll(): void {
  s().clear();
  Object.entries(DEFAULTS).forEach(([k, v]) => s().set(k as any, v as any));
}
