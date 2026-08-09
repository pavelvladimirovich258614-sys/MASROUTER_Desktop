import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { formatDate, copyToClipboard, lambdaFor } from '../lib/validators';
import { useAppStore } from '../store/appStore';

export const PromptLabPage: React.FC = () => {
  const toast = useAppStore((s) => s.toast);
  const [history, setHistory] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>('');

  useEffect(() => {
    api.promptList().then((h) => setHistory(h as any[]));
  }, []);

  const filtered = filter
    ? history.filter((h) => h.taskDescription?.toLowerCase().includes(filter.toLowerCase()) || h.tags?.includes(filter))
    : history;

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <div className="page__title">Prompt Lab</div>
          <div className="page__subtitle">История сгенерированных Final Prompt. {history.length} записей.</div>
        </div>
      </div>

      <div className="form-field">
        <input
          className="input"
          placeholder="Фильтр по описанию или тегу…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="card empty">
          <div className="empty__title">История пуста</div>
          <div>Рассчитайте маршрут в <a href="#/router">Маршрутизаторе</a>.</div>
        </div>
      ) : (
        filtered.map((h) => (
          <div key={h.id} className="card" style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>{h.taskDescription?.slice(0, 120) || '—'}</strong>
              <span className="muted mono" style={{ fontSize: 11 }}>{formatDate(h.timestamp)}</span>
            </div>
            <div className="row" style={{ marginTop: 6, marginBottom: 6 }}>
              <span className={`badge cost-${(h.costMode || 'eco').toLowerCase()}`}>{h.costMode}</span>
              <span className="badge">λ={lambdaFor(h.costMode)}</span>
              <span className="badge">{h.topology}</span>
              <span className="badge">{h.agentCount} агентов</span>
              {h.tags?.map((t: string) => <span key={t} className="badge">#{t}</span>)}
            </div>
            <details>
              <summary className="muted" style={{ cursor: 'pointer', fontSize: 12 }}>Показать Final Prompt</summary>
              <pre className="code-block" style={{ marginTop: 8 }}>{h.finalPrompt}</pre>
              <div className="row" style={{ marginTop: 8 }}>
                <button
                  className="btn btn--small"
                  onClick={async () => {
                    const ok = await copyToClipboard(h.finalPrompt);
                    toast(ok ? 'success' : 'error', ok ? 'Скопировано' : 'Ошибка');
                  }}
                >
                  📋 Копировать
                </button>
              </div>
            </details>
          </div>
        ))
      )}
    </div>
  );
};
