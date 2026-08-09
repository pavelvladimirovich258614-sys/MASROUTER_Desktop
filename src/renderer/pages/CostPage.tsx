import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { formatDate } from '../lib/validators';

export const CostPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [modelFilter, setModelFilter] = useState<string>('');
  const [modeFilter, setModeFilter] = useState<string>('');

  useEffect(() => {
    api.costList().then((c) => setLogs(c as any[]));
  }, []);

  const filtered = logs.filter((l) => {
    if (modelFilter && l.modelId !== modelFilter) return false;
    if (modeFilter && l.costMode !== modeFilter) return false;
    return true;
  });
  const total = filtered.reduce((acc, l) => acc + (l.estimatedCost || 0), 0);

  // Простая агрегация по дням для sparkline.
  const byDay: Record<string, number> = {};
  filtered.forEach((l) => {
    const day = new Date(l.timestamp).toISOString().slice(0, 10);
    byDay[day] = (byDay[day] || 0) + (l.estimatedCost || 0);
  });
  const days = Object.keys(byDay).sort();
  const maxDay = Math.max(0.001, ...Object.values(byDay));

  const allModels = Array.from(new Set(logs.map((l) => l.modelId)));

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <div className="page__title">Стоимость</div>
          <div className="page__subtitle">Лог API-вызовов, агрегация по моделям и режимам.</div>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card__subtitle">Всего запросов</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{filtered.length}</div>
        </div>
        <div className="card">
          <div className="card__subtitle">Сумма</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-accent)' }}>${total.toFixed(4)}</div>
        </div>
        <div className="card">
          <div className="card__subtitle">Дней с активностью</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{days.length}</div>
        </div>
      </div>

      {days.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card__title">По дням</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 100, marginTop: 10 }}>
            {days.map((d) => {
              const h = (byDay[d] / maxDay) * 100;
              return (
                <div key={d} title={`${d}: $${byDay[d].toFixed(4)}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: '100%', height: `${h}%`, background: 'var(--gradient-primary)', borderRadius: 4, minHeight: 2 }} />
                  <div className="muted" style={{ fontSize: 9, marginTop: 4, transform: 'rotate(-45deg)', whiteSpace: 'nowrap' }}>{d.slice(5)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="row">
          <select className="select" value={modelFilter} onChange={(e) => setModelFilter(e.target.value)} style={{ maxWidth: 240 }}>
            <option value="">Все модели</option>
            {allModels.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <select className="select" value={modeFilter} onChange={(e) => setModeFilter(e.target.value)} style={{ maxWidth: 200 }}>
            <option value="">Все режимы</option>
            <option value="ECO">ECO</option>
            <option value="BALANCED">BALANCED</option>
            <option value="QUALITY">QUALITY</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card empty">
          <div className="empty__title">Лог пуст</div>
          <div>Отправьте запрос через Маршрутизатор, чтобы увидеть записи.</div>
        </div>
      ) : (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Время</th>
                <th>Модель</th>
                <th>Режим</th>
                <th>in tokens</th>
                <th>out tokens</th>
                <th>Cost</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 200).map((l) => (
                <tr key={l.id}>
                  <td className="mono" style={{ fontSize: 11 }}>{formatDate(l.timestamp)}</td>
                  <td className="mono" style={{ fontSize: 11 }}>{l.modelId}</td>
                  <td>{l.costMode && <span className={`badge cost-${l.costMode.toLowerCase()}`}>{l.costMode}</span>}</td>
                  <td className="mono">{l.inputTokens}</td>
                  <td className="mono">{l.outputTokens}</td>
                  <td className="mono" style={{ color: 'var(--color-accent)' }}>${(l.estimatedCost || 0).toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length > 200 && (
            <div className="muted" style={{ fontSize: 11, textAlign: 'center', marginTop: 10 }}>
              Показано 200 из {filtered.length} записей
            </div>
          )}
        </div>
      )}
    </div>
  );
};
