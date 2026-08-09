// ipc.ts — единая точка регистрации IPC-обработчиков между main и renderer.
// Все запросы проходят через whitelist каналов, никакого динамического IPC.

import { ipcMain, shell, app, BrowserWindow, dialog } from 'electron';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { IPC } from '../../shared/constants';
import { calculateRoute } from './routerEngine';
import {
  getAll,
  getSettings,
  setSettings,
  getProviders,
  setProviders,
  getModels,
  setModels,
  getRoles,
  setRoles,
  getTopologies,
  setTopologies,
  getCodexProfiles,
  setCodexProfiles,
  getServerProfiles,
  setServerProfiles,
  getPromptHistory,
  appendPromptHistory,
  getCostLogs,
  appendCostLog,
  getAppLogs,
  appendAppLog,
  clearAppLogs,
  setApiKey,
  getApiKeyMask,
  deleteApiKey,
  exportAll,
  importAll,
  resetAll
} from './storage';
import { buildProvider } from './providers/providerManager';
import { createTaskFile, buildCodexCommand, buildSshCommand } from './codex/codexBridge';
import { runSafe } from './shell/safeCommandRunner';
import { routerInputSchema, providerConfigSchema, codexProfileSchema, serverProfileSchema, settingsSchema } from '../../shared/schemas';
import type { RouteDecision, ProviderConfig } from '../../shared/types';

let mainWindow: BrowserWindow | null = null;

export function setMainWindow(w: BrowserWindow) {
  mainWindow = w;
}

function log(level: 'info' | 'warning' | 'error' | 'security' | 'cost' | 'api', source: string, message: string, details?: unknown) {
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    level,
    source,
    message,
    details
  };
  appendAppLog(entry);
  // Дублируем в консоль main.
  const fn = level === 'error' ? console.error : level === 'warning' ? console.warn : console.log;
  fn(`[${level}] ${source}: ${message}`, details ?? '');
}

export function registerIpc(): void {
  // === System ===
  ipcMain.handle(IPC.SYSTEM_GET_VERSION, () => app.getVersion());
  ipcMain.handle(IPC.SYSTEM_GET_PLATFORM, () => process.platform);
  ipcMain.handle(IPC.SYSTEM_OPEN_EXTERNAL, async (_e, url: string) => {
    if (typeof url !== 'string' || !/^https?:\/\//.test(url)) {
      return { ok: false, error: 'Только http(s) URL разрешены' };
    }
    await shell.openExternal(url);
    return { ok: true };
  });

  ipcMain.handle(IPC.APP_BOOTSTRAP, () => {
    return {
      version: app.getVersion(),
      platform: process.platform,
      settings: getSettings(),
      constants: {
        GAMMA: 6,
        LAMBDAS: { ECO: 25, BALANCED: 15, QUALITY: 5 }
      }
    };
  });

  ipcMain.handle(IPC.APP_OPEN_PATH, async (_e, p: string) => {
    if (typeof p !== 'string') return { ok: false };
    try {
      await shell.openPath(p);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  });

  // === Router ===
  ipcMain.handle(IPC.ROUTER_PING, () => 'pong');

  ipcMain.handle(IPC.ROUTER_CALCULATE, (_e, input: unknown) => {
    const parsed = routerInputSchema.safeParse(input);
    if (!parsed.success) {
      log('error', 'router', 'Invalid router input', parsed.error.flatten());
      throw new Error('Невалидный вход: ' + JSON.stringify(parsed.error.flatten()));
    }
    const decision: RouteDecision = calculateRoute(parsed.data);
    log('info', 'router', `Route: ${decision.costMode}/${decision.topology}/${decision.agentCount}`, {
      risk: decision.riskScore,
      warnings: decision.warnings
    });
    return decision;
  });

  // === Providers ===
  ipcMain.handle(IPC.PROVIDER_LIST, () => getProviders());

  ipcMain.handle(IPC.PROVIDER_TEST, async (_e, providerId: string, defaultModel: string) => {
    const provider = getProviders().find((p) => p.id === providerId);
    if (!provider) return { ok: false, message: 'Провайдер не найден' };
    const p = buildProvider(provider, defaultModel);
    if (!p) return { ok: false, message: 'Провайдер выключен' };
    const result = await p.testConnection();
    log(result.ok ? 'info' : 'warning', 'provider', `Test ${provider.label}: ${result.message}`);
    return result;
  });

  ipcMain.handle(IPC.PROVIDER_CHAT, async (_e, providerId: string, model: string, messages: unknown) => {
    const provider = getProviders().find((p) => p.id === providerId);
    if (!provider) throw new Error('Провайдер не найден');
    const p = buildProvider(provider, model);
    if (!p) throw new Error('Провайдер выключен');
    try {
      const result = await p.chat(messages as any, { model });
      log('api', 'provider', `Chat ${provider.label}/${model}: ${result.inputTokens}+${result.outputTokens} tokens`);
      return result;
    } catch (e) {
      log('error', 'provider', `Chat failed: ${(e as Error).message}`);
      throw e;
    }
  });

  // === Storage generic ===
  ipcMain.handle(IPC.STORAGE_GET, (_e, key: string) => {
    const all: any = getAll();
    return all[key];
  });

  ipcMain.handle(IPC.STORAGE_SET, (_e, key: string, value: unknown) => {
    const map: Record<string, (v: any) => void> = {
      settings: (v) => setSettings(settingsSchema.parse(v)),
      providers: (v) => setProviders((v as ProviderConfig[]).map((p) => providerConfigSchema.parse(p))),
      models: (v) => setModels(v),
      roles: (v) => setRoles(v),
      topologies: (v) => setTopologies(v),
      codexProfiles: (v) => setCodexProfiles((v as any[]).map((p) => codexProfileSchema.parse(p))),
      serverProfiles: (v) => setServerProfiles((v as any[]).map((p) => serverProfileSchema.parse(p)))
    };
    const fn = map[key];
    if (!fn) throw new Error(`Unknown storage key: ${key}`);
    fn(value);
    return { ok: true };
  });

  ipcMain.handle(IPC.STORAGE_EXPORT, async () => {
    const json = exportAll();
    const win = mainWindow!;
    const r = await dialog.showSaveDialog(win, {
      defaultPath: 'masrouter-export.json',
      filters: [{ name: 'JSON', extensions: ['json'] }]
    });
    if (r.canceled || !r.filePath) return { ok: false, canceled: true };
    await fs.writeFile(r.filePath, json, 'utf8');
    return { ok: true, path: r.filePath };
  });

  ipcMain.handle(IPC.STORAGE_IMPORT, async () => {
    const win = mainWindow!;
    const r = await dialog.showOpenDialog(win, {
      filters: [{ name: 'JSON', extensions: ['json'] }],
      properties: ['openFile']
    });
    if (r.canceled || !r.filePaths[0]) return { ok: false, canceled: true };
    const json = await fs.readFile(r.filePaths[0], 'utf8');
    const res = importAll(json);
    if (res.ok) log('security', 'storage', `Импорт выполнен: ${r.filePaths[0]}`);
    return res;
  });

  ipcMain.handle(IPC.STORAGE_RESET, () => {
    resetAll();
    log('security', 'storage', 'Сброс всех данных');
    return { ok: true };
  });

  // === API keys (отдельный канал — ключи в safeStorage) ===
  ipcMain.handle('apikey:set', (_e, providerId: string, key: string) => {
    if (typeof key !== 'string' || key.length === 0) throw new Error('Пустой ключ');
    setApiKey(providerId, key);
    log('security', 'storage', `API key set for ${providerId}`);
    return { ok: true, mask: getApiKeyMask(providerId) };
  });

  ipcMain.handle('apikey:mask', (_e, providerId: string) => getApiKeyMask(providerId));
  ipcMain.handle('apikey:delete', (_e, providerId: string) => {
    deleteApiKey(providerId);
    return { ok: true };
  });

  // === Codex ===
  ipcMain.handle(IPC.CODEX_CREATE_TASK, async (_e, args: { decision: RouteDecision; profileId: string; projectPath: string; gitBranch: string; serverProfileId?: string }) => {
    const profile = getCodexProfiles().find((p) => p.id === args.profileId);
    if (!profile) throw new Error('Codex профиль не найден');
    const serverProfile = args.serverProfileId
      ? getServerProfiles().find((p) => p.id === args.serverProfileId)
      : undefined;
    const filePath = await createTaskFile({
      decision: args.decision,
      profile,
      serverProfile,
      projectPath: args.projectPath,
      gitBranch: args.gitBranch
    });
    log('info', 'codex', `task.md создан: ${filePath}`);
    return { ok: true, path: filePath };
  });

  ipcMain.handle(IPC.CODEX_COPY_COMMAND, (_e, args: { decision: RouteDecision; profileId: string; projectPath: string; gitBranch: string; taskFile: string; serverProfileId?: string }) => {
    const profile = getCodexProfiles().find((p) => p.id === args.profileId);
    if (!profile) throw new Error('Codex профиль не найден');
    const sp = args.serverProfileId ? getServerProfiles().find((p) => p.id === args.serverProfileId) : undefined;
    const firstModel = args.decision.chain[0]?.model.id || 'gpt-4o-mini';
    const cmd = buildCodexCommand(profile.commandTemplate, {
      task_file: args.taskFile,
      prompt: args.decision.finalPrompt,
      model: firstModel,
      project_path: args.projectPath,
      git_branch: args.gitBranch,
      server_host: sp?.host,
      ssh_user: sp?.user,
      ssh_key: sp?.sshKeyPath
    });
    return { ok: true, command: cmd };
  });

  ipcMain.handle(IPC.CODEX_COPY_SSH, (_e, args: { serverProfileId: string; action?: 'status' | 'logs'; logFile?: string }) => {
    const sp = getServerProfiles().find((p) => p.id === args.serverProfileId);
    if (!sp) throw new Error('Server профиль не найден');
    const cmd = buildSshCommand(sp, args.action || 'status', args.logFile);
    return { ok: true, command: cmd };
  });

  // === Shell ===
  ipcMain.handle(IPC.SHELL_RUN, async (_e, args: { command: string; args: string[]; cwd?: string; timeoutMs?: number; userConfirmed: boolean }) => {
    const settings = getSettings();
    if (!settings.shellEnabled) {
      return { ok: false, code: -1, stdout: '', stderr: '', blocked: true, blockReason: 'Shell выключен в настройках. Включите в Settings → Безопасность.' };
    }
    const r = await runSafe(args);
    log(r.ok ? 'info' : 'warning', 'shell', `Run: ${args.command} ${args.args.join(' ')}`, r);
    return r;
  });

  // === Logs ===
  ipcMain.handle(IPC.LOGS_LIST, () => getAppLogs());
  ipcMain.handle(IPC.LOGS_CLEAR, () => {
    clearAppLogs();
    return { ok: true };
  });

  // === Prompt history ===
  ipcMain.handle('prompt:append', (_e, entry: unknown) => {
    appendPromptHistory(entry);
    return { ok: true };
  });
  ipcMain.handle('prompt:list', () => getPromptHistory());

  // === Cost log ===
  ipcMain.handle('cost:append', (_e, entry: unknown) => {
    appendCostLog(entry);
    return { ok: true };
  });
  ipcMain.handle('cost:list', () => getCostLogs());

  log('info', 'main', 'IPC handlers зарегистрированы');
}
