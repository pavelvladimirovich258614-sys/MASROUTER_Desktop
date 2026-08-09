import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAppStore } from '../store/appStore';

const NAV = [
  { path: '/', label: 'Дашборд', icon: '◆' },
  { path: '/router', label: 'Маршрутизатор', icon: '➤' },
  { path: '/case-study', label: 'Case Study', icon: '◉' },
  { path: '/ablation', label: 'Ablation', icon: '◬' },
  { path: '/models', label: 'Модели', icon: '◰' },
  { path: '/roles', label: 'Роли', icon: '◇' },
  { path: '/topologies', label: 'Топологии', icon: '⌬' },
  { path: '/chain', label: 'Chain Builder', icon: '⇄' },
  { path: '/prompt-lab', label: 'Prompt Lab', icon: '✎' },
  { path: '/cost', label: 'Стоимость', icon: '$' },
  { path: '/codex', label: 'Codex CLI', icon: '>' },
  { path: '/logs', label: 'Логи', icon: '≡' },
  { path: '/settings', label: 'Настройки', icon: '⚙' }
];

export const Sidebar: React.FC = () => {
  const version = useAppStore((s) => s.version);
  const providers = useAppStore((s) => s.providers);
  const connectedCount = providers.filter((p) => p.enabled).length;

  return (
    <aside className="app__sidebar">
      <div style={{ padding: '20px 18px 14px' }}>
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: 1,
            color: 'var(--color-accent)',
            fontFamily: "'JetBrains Mono', monospace"
          }}
        >
          MASROUTER
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 2 }}>
          Multi-Agent System Router
        </div>
      </div>
      <nav style={{ flex: 1, padding: '0 8px' }}>
        {NAV.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 12px',
              margin: '2px 0',
              borderRadius: 10,
              color: isActive ? 'var(--color-accent)' : 'var(--color-text)',
              background: isActive ? 'var(--color-hover)' : 'transparent',
              fontSize: 13.5,
              fontWeight: isActive ? 600 : 500,
              borderLeft: isActive ? '3px solid var(--color-accent)' : '3px solid transparent',
              transition: 'all 180ms ease'
            })}
          >
            <span style={{ opacity: 0.7, fontSize: 14 }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div
        style={{
          padding: '14px 18px',
          borderTop: '1px solid var(--color-border)',
          fontSize: 11,
          color: 'var(--color-muted)'
        }}
      >
        <div>v{version}</div>
        <div style={{ marginTop: 4 }}>
          Провайдеры:{' '}
          <span style={{ color: connectedCount > 0 ? 'var(--color-accent-2)' : 'var(--color-muted)' }}>
            {connectedCount}/{providers.length}
          </span>
        </div>
      </div>
    </aside>
  );
};
