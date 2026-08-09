import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAppStore } from '../store/appStore';
import { formatDate } from '../lib/validators';

export const LogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>('');
  const toast = useAppStore((s) => s.toast);

  useEffect(() => {
    api.logsList().then((l) => setLogs(l as any[]));
  }, []);

  async function clear() {
    if (!confirm('Очистить все логи?')) return;
    await api.logsClear();
    setLogs([]);
    toast('success', 'Логи очищены');
  }

  const filtered = filter ? logs.filter((l) => l.level === filter || l.source?.includes(filter)) : logs;

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <div className="page__title">Логи</div>
          <div className="page__subtitle">{logs.length} записей. API-ключи не логируются.</div>
        </div>
        <button className="btn" onClick={clear}>🗑 Очистить</button>
      </div>

      <div className="row" style={{ marginBottom: 12 }}>
        {['info', 'warning', 'error', 'security', 'cost', 'api'].map((lvl) => (
          <button
            key={lvl}
            className={`btn btn--small ${filter === lvl ? 'btn--primary' : ''}`}
            onClick={() => setFilter(filter === lvl ? '' : lvl)}
          >
            {lvl}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card empty">
          <div className="empty__title">Лог пуст</div>
        </div>
      ) : (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr><th>Время</th><th>Level</th><th>Source</th><th>Сообщение</th></tr>
            </thead>
            <tbody>
              {filtered.slice(0, 500).map((l) => (
                <tr key={l.id}>
                  <td className="mono" style={{ fontSize: 11 }}>{formatDate(l.timestamp)}</td>
                  <td>
                    <span className={`badge ${l.level === 'error' ? 'badge--danger' : l.level === 'warning' ? 'badge--warning' : l.level === 'security' ? 'badge--info' : ''}`}>
                      {l.level}
                    </span>
                  </td>
                  <td className="mono" style={{ fontSize: 11 }}>{l.source}</td>
                  <td style={{ fontSize: 12 }}>{l.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length > 500 && (
            <div className="muted" style={{ fontSize: 11, textAlign: 'center', marginTop: 10 }}>
              Показано 500 из {filtered.length} записей
            </div>
          )}
        </div>
      )}
    </div>
  );
};
