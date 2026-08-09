// appStore — глобальное состояние renderer через zustand.

import { create } from 'zustand';
import type { RouteDecision, Settings, ProviderConfig, ModelConfig } from '../../../shared/types';
import { api } from '../lib/api';
import { BUILTIN_MODELS } from '../../../shared/masrouterData';

interface AppState {
  // Bootstrap
  bootstrapped: boolean;
  version: string;
  platform: string;
  settings: Settings | null;
  // Data
  providers: ProviderConfig[];
  models: ModelConfig[];
  // Latest router decision
  lastDecision: RouteDecision | null;
  calculating: boolean;
  // Toasts
  toasts: { id: string; type: 'info' | 'success' | 'warning' | 'error'; message: string }[];

  // Actions
  bootstrap: () => Promise<void>;
  refresh: () => Promise<void>;
  calculate: (input: unknown) => Promise<RouteDecision | null>;
  setTheme: (theme: 'dark' | 'light' | 'system') => Promise<void>;
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => Promise<void>;
  toast: (type: 'info' | 'success' | 'warning' | 'error', message: string) => void;
  dismissToast: (id: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  bootstrapped: false,
  version: '?',
  platform: '?',
  settings: null,
  providers: [],
  models: BUILTIN_MODELS,
  lastDecision: null,
  calculating: false,
  toasts: [],

  async bootstrap() {
    const b = await api.bootstrap();
    const providers = (await api.providerList()) as ProviderConfig[];
    const models = ((await api.storageGet('models')) as ModelConfig[]) || BUILTIN_MODELS;
    set({ bootstrapped: true, version: b.version, platform: b.platform, settings: b.settings, providers, models });

    // Применяем тему.
    const theme = b.settings.theme || 'dark';
    document.body.classList.remove('theme-dark', 'theme-light');
    document.body.classList.add(theme === 'light' ? 'theme-light' : 'theme-dark');
  },

  async refresh() {
    const providers = (await api.providerList()) as ProviderConfig[];
    const models = ((await api.storageGet('models')) as ModelConfig[]) || BUILTIN_MODELS;
    set({ providers, models });
  },

  async calculate(input) {
    set({ calculating: true });
    try {
      const d = await api.routerCalculate(input);
      set({ lastDecision: d, calculating: false });
      return d;
    } catch (e) {
      get().toast('error', 'Ошибка расчёта маршрута: ' + (e as Error).message);
      set({ calculating: false });
      return null;
    }
  },

  async setTheme(theme) {
    await get().setSetting('theme', theme);
    document.body.classList.remove('theme-dark', 'theme-light');
    document.body.classList.add(theme === 'light' ? 'theme-light' : 'theme-dark');
  },

  async setSetting(key, value) {
    const cur = get().settings;
    if (!cur) return;
    const next = { ...cur, [key]: value };
    await api.storageSet('settings', next);
    set({ settings: next });
  },

  toast(type, message) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    set({ toasts: [...get().toasts, { id, type, message }] });
    setTimeout(() => get().dismissToast(id), 4500);
  },

  dismissToast(id) {
    set({ toasts: get().toasts.filter((t) => t.id !== id) });
  }
}));
