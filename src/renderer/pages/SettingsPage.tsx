import React from 'react';
import { useAppStore } from '../store/appStore';
import { api } from '../lib/api';
import { DEFAULT_CODEX_TEMPLATE } from '../../../shared/constants';

export const SettingsPage: React.FC = () => {
  const settings = useAppStore((s) => s.settings);
  const setSetting = useAppStore((s) => s.setSetting);
  const setTheme = useAppStore((s) => s.setTheme);
  const refresh = useAppStore((s) => s.refresh);
  const toast = useAppStore((s) => s.toast);

  if (!settings) return <div className="muted">Загрузка…</div>;

  async function exportData() {
    const r = await api.storageExport();
    if (r.ok) toast('success', `Экспортировано: ${r.path}`);
    else if (!r.canceled) toast('error', r.error || 'Ошибка');
  }

  async function importData() {
    const r = await api.storageImport();
    if (r.ok) {
      toast('success', 'Импорт выполнен');
      await refresh();
    } else if (!r.canceled) {
      toast('error', r.error || 'Ошибка');
    }
  }

  async function resetData() {
    if (!confirm('Сбросить все данные? Это действие нельзя отменить.')) return;
    await api.storageReset();
    await refresh();
    toast('success', 'Все данные сброшены');
  }

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <div className="page__title">Настройки</div>
          <div className="page__subtitle">Тема, безопасность, пути по умолчанию, экспорт/импорт.</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card__title">Внешний вид</div>
        <div className="row" style={{ marginTop: 10 }}>
          <button className={`btn ${settings.theme === 'dark' ? 'btn--primary' : ''}`} onClick={() => setTheme('dark')}>☾ Тёмная</button>
          <button className={`btn ${settings.theme === 'light' ? 'btn--primary' : ''}`} onClick={() => setTheme('light')}>☼ Светлая</button>
          <button className={`btn ${settings.theme === 'system' ? 'btn--primary' : ''}`} onClick={() => setTheme('system')}>⚙ Системная</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card__title">Безопасность</div>
        <div className="form-field" style={{ marginTop: 10 }}>
          <label
            className={`toggle ${settings.shellEnabled ? 'toggle--on' : ''}`}
            onClick={() => setSetting('shellEnabled', !settings.shellEnabled)}
          >
            <div className="toggle__track"><div className="toggle__thumb" /></div>
            <span>Shell-команды (SSH, git status, npm test) — ВЫКЛЮЧЕНЫ по умолчанию</span>
          </label>
          <div className="form-field__hint">
            Whitelist: ssh git status, git log, git branch, node/npm --version. Stoplist: rm -rf, sudo, reboot, dd, mkfs, chmod 777.
          </div>
        </div>
        <div className="form-field">
          <label
            className={`toggle ${settings.autoLaunch ? 'toggle--on' : ''}`}
            onClick={() => setSetting('autoLaunch', !settings.autoLaunch)}
          >
            <div className="toggle__track"><div className="toggle__thumb" /></div>
            <span>Автозапуск при старте системы</span>
          </label>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card__title">Дефолты для Codex</div>
        <div className="form-field">
          <label className="form-field__label">Project Path по умолчанию</label>
          <input
            className="input"
            value={settings.defaultProjectPath || ''}
            onChange={(e) => setSetting('defaultProjectPath', e.target.value)}
            placeholder="D:\my-project"
          />
        </div>
        <div className="form-field">
          <label className="form-field__label">Git Branch по умолчанию</label>
          <input
            className="input"
            value={settings.defaultGitBranch || ''}
            onChange={(e) => setSetting('defaultGitBranch', e.target.value)}
            placeholder="main"
          />
        </div>
        <div className="form-field">
          <label className="form-field__label">Server Host по умолчанию</label>
          <input
            className="input"
            value={settings.defaultServerHost || ''}
            onChange={(e) => setSetting('defaultServerHost', e.target.value)}
            placeholder="ssh.example.com"
          />
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card__title">Данные</div>
        <div className="row" style={{ marginTop: 10 }}>
          <button className="btn" onClick={exportData}>📤 Экспорт</button>
          <button className="btn" onClick={importData}>📥 Импорт</button>
          <button className="btn btn--danger" onClick={resetData}>🗑 Сброс</button>
        </div>
        <div className="form-field__hint" style={{ marginTop: 8 }}>
          Данные хранятся локально через electron-store (userData/masrouter-data.json). API-ключи — в safeStorage.
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card__title">Помощь</div>
        <div className="row" style={{ marginTop: 10 }}>
          <button
            className="btn"
            onClick={async () => {
              await setSetting('onboardingDone', false);
              toast('success', 'Онбординг запустится при следующем обновлении страницы (или перезапуске приложения)');
            }}
          >
            🎓 Перезапустить онбординг
          </button>
        </div>
        <div className="form-field__hint" style={{ marginTop: 8 }}>
          Показывает пошаговый тур по 6 экранам приложения (Sidebar, Маршрутизатор, Модели, Case Study, Codex CLI, Справка).
        </div>
      </div>

      <div className="card">
        <div className="card__title">Шаблон команды Codex (по умолчанию)</div>
        <pre className="code-block" style={{ marginTop: 10 }}>{DEFAULT_CODEX_TEMPLATE}</pre>
        <div className="muted" style={{ fontSize: 11, marginTop: 8 }}>
          Доступные переменные: {'{task_file}'}, {'{prompt}'}, {'{model}'}, {'{project_path}'}, {'{git_branch}'}, {'{server_host}'}, {'{ssh_user}'}, {'{ssh_key}'}.
        </div>
      </div>
    </div>
  );
};
