import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { api } from '../lib/api';
import { copyToClipboard } from '../lib/validators';

export const CodexPage: React.FC = () => {
  const settings = useAppStore((s) => s.settings);
  const lastDecision = useAppStore((s) => s.lastDecision);
  const toast = useAppStore((s) => s.toast);

  const [codexProfiles, setCodexProfiles] = useState<any[]>([]);
  const [serverProfiles, setServerProfiles] = useState<any[]>([]);
  const [profileId, setProfileId] = useState<string>('');
  const [serverId, setServerId] = useState<string>('');
  const [projectPath, setProjectPath] = useState<string>('');
  const [gitBranch, setGitBranch] = useState<string>('main');
  const [taskFile, setTaskFile] = useState<string>('');
  const [command, setCommand] = useState<string>('');
  const [sshCommand, setSshCommand] = useState<string>('');

  useEffect(() => {
    api.storageGet('codexProfiles').then((p) => {
      const arr = (p as any[]) || [];
      setCodexProfiles(arr);
      if (arr[0]) setProfileId(arr[0].id);
    });
    api.storageGet('serverProfiles').then((p) => {
      const arr = (p as any[]) || [];
      setServerProfiles(arr);
      if (arr[0]) setServerId(arr[0].id);
    });
    if (settings?.defaultProjectPath) setProjectPath(settings.defaultProjectPath);
    if (settings?.defaultGitBranch) setGitBranch(settings.defaultGitBranch);
  }, [settings]);

  async function createTask() {
    if (!lastDecision) {
      toast('warning', 'Сначала рассчитайте маршрут');
      return;
    }
    if (!profileId) {
      toast('warning', 'Выберите профиль Codex');
      return;
    }
    try {
      const r = await api.codexCreateTask({
        decision: lastDecision,
        profileId,
        projectPath,
        gitBranch,
        serverProfileId: serverId || undefined
      });
      setTaskFile(r.path);
      toast('success', `task.md создан: ${r.path}`);
    } catch (e) {
      toast('error', (e as Error).message);
    }
  }

  async function copyCommand() {
    if (!lastDecision || !profileId) {
      toast('warning', 'Нужен маршрут и профиль');
      return;
    }
    try {
      const r = await api.codexCopyCommand({
        decision: lastDecision,
        profileId,
        projectPath,
        gitBranch,
        taskFile: taskFile || 'task.md',
        serverProfileId: serverId || undefined
      });
      setCommand(r.command);
      const ok = await copyToClipboard(r.command);
      toast(ok ? 'success' : 'warning', ok ? 'Команда скопирована' : 'Не удалось скопировать');
    } catch (e) {
      toast('error', (e as Error).message);
    }
  }

  async function copySsh() {
    if (!serverId) {
      toast('warning', 'Выберите серверный профиль');
      return;
    }
    try {
      const r = await api.codexCopySsh({ serverProfileId: serverId, action: 'status' });
      setSshCommand(r.command);
      const ok = await copyToClipboard(r.command);
      toast(ok ? 'success' : 'warning', ok ? 'SSH команда скопирована' : 'Не удалось скопировать');
    } catch (e) {
      toast('error', (e as Error).message);
    }
  }

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <div className="page__title">Codex CLI</div>
          <div className="page__subtitle">Интеграция с Codex CLI: task.md, шаблоны команд, SSH.</div>
        </div>
      </div>

      <div className="warning-banner">
        ⚠ Shell-команды по умолчанию ВЫКЛЮЧЕНЫ. Включите в Settings → Безопасность. Все команды проходят через whitelist + stoplist.
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card__title">Профили</div>
          <div className="form-field">
            <label className="form-field__label">Codex профиль</label>
            <select className="select" value={profileId} onChange={(e) => setProfileId(e.target.value)}>
              {codexProfiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label className="form-field__label">Серверный профиль (опц.)</label>
            <select className="select" value={serverId} onChange={(e) => setServerId(e.target.value)}>
              <option value="">— Не использовать —</option>
              {serverProfiles.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.host})</option>)}
            </select>
          </div>
          <div className="form-field">
            <label className="form-field__label">Project Path</label>
            <input className="input" value={projectPath} onChange={(e) => setProjectPath(e.target.value)} placeholder="D:\my-project" />
          </div>
          <div className="form-field">
            <label className="form-field__label">Git Branch</label>
            <input className="input" value={gitBranch} onChange={(e) => setGitBranch(e.target.value)} />
          </div>
        </div>

        <div className="card">
          <div className="card__title">Действия</div>
          <div className="col">
            <button className="btn btn--primary" onClick={createTask}>📝 Создать task.md</button>
            <button className="btn" onClick={copyCommand}>📋 Скопировать команду Codex</button>
            <button className="btn" onClick={copySsh}>📋 Скопировать SSH команду</button>
          </div>
          {taskFile && (
            <div style={{ marginTop: 12 }}>
              <div className="muted" style={{ fontSize: 11 }}>task.md:</div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--color-accent)' }}>{taskFile}</div>
            </div>
          )}
          {command && (
            <div style={{ marginTop: 12 }}>
              <div className="muted" style={{ fontSize: 11 }}>Команда:</div>
              <pre className="code-block">{command}</pre>
            </div>
          )}
          {sshCommand && (
            <div style={{ marginTop: 12 }}>
              <div className="muted" style={{ fontSize: 11 }}>SSH:</div>
              <pre className="code-block">{sshCommand}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
