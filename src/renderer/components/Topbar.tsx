import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAppStore } from '../store/appStore';

const TITLES: Record<string, string> = {
  '/': 'Дашборд',
  '/router': 'Маршрутизатор',
  '/case-study': 'Case Study',
  '/ablation': 'Ablation Study',
  '/models': 'Модели',
  '/roles': 'Роли',
  '/topologies': 'Топологии',
  '/chain': 'Chain Builder',
  '/prompt-lab': 'Prompt Lab',
  '/cost': 'Стоимость',
  '/codex': 'Codex CLI',
  '/logs': 'Логи',
  '/settings': 'Настройки',
  '/help': 'Справка'
};

export const Topbar: React.FC = () => {
  const location = useLocation();
  const settings = useAppStore((s) => s.settings);
  const setTheme = useAppStore((s) => s.setTheme);
  const providers = useAppStore((s) => s.providers);
  const enabledCount = providers.filter((p) => p.enabled).length;
  const title = TITLES[location.pathname] || 'MASROUTER';

  return (
    <header className="app__topbar">
      <div style={{ fontSize: 15, fontWeight: 600 }}>{title}</div>
      <div style={{ flex: 1 }} />
      <span
        className={`badge ${enabledCount > 0 ? 'badge--green' : ''}`}
        title="Количество подключённых провайдеров"
      >
        ◉ {enabledCount} провайдер{enabledCount === 1 ? '' : enabledCount < 5 ? 'а' : 'ов'}
      </span>
      <button
        className="btn btn--ghost"
        onClick={() => setTheme(settings?.theme === 'light' ? 'dark' : 'light')}
        title="Переключить тему"
      >
        {settings?.theme === 'light' ? '☾ Тёмная' : '☼ Светлая'}
      </button>
      <a className="btn btn--ghost" href="#/help" title="Открыть справку">
        ? Справка
      </a>
    </header>
  );
};
