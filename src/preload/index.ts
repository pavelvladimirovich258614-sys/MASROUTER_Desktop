// src/preload/index.ts — единственный мост между renderer и main.
// nodeIntegration: false, contextIsolation: true, sandbox: true.

import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from '../../shared/constants';
import type { RouteDecision, LLMMessage } from '../../shared/types';

const api = {
  // System
  getVersion: () => ipcRenderer.invoke(IPC.SYSTEM_GET_VERSION),
  getPlatform: () => ipcRenderer.invoke(IPC.SYSTEM_GET_PLATFORM),
  openExternal: (url: string) => ipcRenderer.invoke(IPC.SYSTEM_OPEN_EXTERNAL, url),
  openPath: (p: string) => ipcRenderer.invoke(IPC.APP_OPEN_PATH, p),
  bootstrap: () => ipcRenderer.invoke(IPC.APP_BOOTSTRAP),

  // Router
  routerCalculate: (input: unknown) => ipcRenderer.invoke(IPC.ROUTER_CALCULATE, input),
  routerPing: () => ipcRenderer.invoke(IPC.ROUTER_PING),

  // Providers
  providerList: () => ipcRenderer.invoke(IPC.PROVIDER_LIST),
  providerTest: (id: string, model: string) => ipcRenderer.invoke(IPC.PROVIDER_TEST, id, model),
  providerChat: (id: string, model: string, messages: LLMMessage[]) =>
    ipcRenderer.invoke(IPC.PROVIDER_CHAT, id, model, messages),

  // Storage
  storageGet: (key: string) => ipcRenderer.invoke(IPC.STORAGE_GET, key),
  storageSet: (key: string, value: unknown) => ipcRenderer.invoke(IPC.STORAGE_SET, key, value),
  storageExport: () => ipcRenderer.invoke(IPC.STORAGE_EXPORT),
  storageImport: () => ipcRenderer.invoke(IPC.STORAGE_IMPORT),
  storageReset: () => ipcRenderer.invoke(IPC.STORAGE_RESET),

  // API keys (masked)
  apiKeySet: (providerId: string, key: string) => ipcRenderer.invoke('apikey:set', providerId, key),
  apiKeyMask: (providerId: string) => ipcRenderer.invoke('apikey:mask', providerId),
  apiKeyDelete: (providerId: string) => ipcRenderer.invoke('apikey:delete', providerId),

  // Codex
  codexCreateTask: (args: {
    decision: RouteDecision;
    profileId: string;
    projectPath: string;
    gitBranch: string;
    serverProfileId?: string;
  }) => ipcRenderer.invoke(IPC.CODEX_CREATE_TASK, args),
  codexCopyCommand: (args: {
    decision: RouteDecision;
    profileId: string;
    projectPath: string;
    gitBranch: string;
    taskFile: string;
    serverProfileId?: string;
  }) => ipcRenderer.invoke(IPC.CODEX_COPY_COMMAND, args),
  codexCopySsh: (args: { serverProfileId: string; action?: 'status' | 'logs'; logFile?: string }) =>
    ipcRenderer.invoke(IPC.CODEX_COPY_SSH, args),

  // Shell
  shellRun: (args: { command: string; args: string[]; cwd?: string; timeoutMs?: number; userConfirmed: boolean }) =>
    ipcRenderer.invoke(IPC.SHELL_RUN, args),

  // Logs
  logsList: () => ipcRenderer.invoke(IPC.LOGS_LIST),
  logsClear: () => ipcRenderer.invoke(IPC.LOGS_CLEAR),

  // Prompt history
  promptAppend: (entry: unknown) => ipcRenderer.invoke('prompt:append', entry),
  promptList: () => ipcRenderer.invoke('prompt:list'),

  // Cost log
  costAppend: (entry: unknown) => ipcRenderer.invoke('cost:append', entry),
  costList: () => ipcRenderer.invoke('cost:list')
};

contextBridge.exposeInMainWorld('masrouter', api);

export type MasRouterApi = typeof api;
