import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { api } from '../lib/api';
import { MASROUTER_BENCHMARKS } from '../../../shared/masrouterData';
import { formatDate, lambdaFor } from '../lib/validators';

export const Dashboard: React.FC = () => {
  const providers = useAppStore((s) => s.providers);
  const lastDecision = useAppStore((s) => s.lastDecision);
  const [history, setHistory] = useState<any[]>([]);
  const [costLogs, setCostLogs] = useState<any[]>([]);

  useEffect(() => {
    api.promptList().then((h) => setHistory((h as any[]).slice(0, 5)));
    api.costList().then((c) => setCostLogs((c as any[]).slice(0, 50)));
  }, [lastDecision]);

  const totalCost = costLogs.reduce((acc, c) => acc + (c.estimatedCost || 0), 0);
  const ecoCount = costLogs.filter((c) => c.costMode === 'ECO').length;
  const balCount = costLogs.filter((c) => c.costMode === 'BALANCED').length;
  const qualCount = costLogs.filter((c) => c.costMode === 'QUALITY').length;

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <div className="page__title">Добро пожаловать в MASROUTER</div>
          <div className="page__subtitle">
            Локальный маршрутизатор LLM по логике каскада Fθ из статьи arXiv:2502.11133.
          </div>
        </div>
      </div>

      <div className="grid-auto" style={{ marginBottom: 20 }}>
        <div className="card card--hoverable">
          <div className="card__title">Новая задача</div>
          <div className="card__subtitle">Создать задачу, рассчитать маршрут и получить Final Prompt.</div>
          <Link to="/router" className="btn btn--primary">Открыть маршрутизатор</Link>
        </div>
        <div className="card card--hoverable">
          <div className="card__title">Настроить модели</div>
          <div className="card__subtitle">Подключить Ollama, OpenAI, Claude, Gemini, StepFun или MiniMax.</div>
          <Link to="/models" className="btn">Открыть модели</Link>
        </div>
        <div className="card card--hoverable">
          <div className="card__title">Справка</div>
          <div className="card__subtitle">15 статей о каскаде Fθ, ECO/BALANCED/QUALITY, провайдерах и Codex CLI.</div>
          <Link to="/help" className="btn">Открыть справку</Link>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card__subtitle">Подключено провайдеров</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-accent)' }}>
            {providers.filter((p) => p.enabled).length} <span style={{ fontSize: 14, color: 'var(--color-muted)' }}>/ {providers.length}</span>
          </div>
        </div>
        <div className="card">
          <div className="card__subtitle">Запросов всего</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{costLogs.length}</div>
          <div className="muted" style={{ fontSize: 11 }}>суммарно ${totalCost.toFixed(4)}</div>
        </div>
        <div className="card">
          <div className="card__subtitle">Режимы</div>
          <div className="row" style={{ marginTop: 6 }}>
            <span className="badge cost-eco">ECO {ecoCount}</span>
            <span className="badge cost-balanced">BAL {balCount}</span>
            <span className="badge cost-quality">QUAL {qualCount}</span>
          </div>
        </div>
      </div>

      {lastDecision && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card__title">Последний маршрут</div>
          <div className="row" style={{ marginBottom: 10 }}>
            <span className={`badge risk-badge risk-${lastDecision.riskScore}`}>Risk {lastDecision.riskScore}</span>
            <span className={`badge cost-${lastDecision.costMode.toLowerCase()}`}>{lastDecision.costMode}</span>
            <span className="badge">λ={lastDecision.lambda}</span>
            <span className="badge">{lastDecision.topology}</span>
            <span className="badge">агентов: {lastDecision.agentCount}</span>
          </div>
          <div className="muted" style={{ fontSize: 12 }}>{lastDecision.reason}</div>
        </div>
      )}

      <div className="card">
        <div className="card__title">Бенчмарки MasRouter (Таблица 1, последняя строка)</div>
        <div className="grid-3" style={{ marginTop: 10 }}>
          {Object.entries(MASROUTER_BENCHMARKS).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dashed var(--color-border)' }}>
              <span className="muted" style={{ fontSize: 12, textTransform: 'uppercase' }}>{k}</span>
              <span className="mono" style={{ fontWeight: 600, color: 'var(--color-accent)' }}>{v}</span>
            </div>
          ))}
        </div>
        <div className="muted" style={{ fontSize: 11, marginTop: 10 }}>
          Источник: arXiv:2502.11133, Таблица 1. γ=6, λ=15, policy gradient.
        </div>
      </div>

      {history.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card__title">Недавние промпты</div>
          {history.map((h: any) => (
            <div key={h.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13 }}>{h.taskDescription?.slice(0, 80) || '—'}</span>
                <span className="muted mono" style={{ fontSize: 11 }}>{formatDate(h.timestamp)}</span>
              </div>
              <div className="row" style={{ marginTop: 4 }}>
                <span className={`badge cost-${(h.costMode || 'eco').toLowerCase()}`}>{h.costMode}</span>
                <span className="badge">{h.topology}</span>
                <span className="badge">λ={lambdaFor(h.costMode)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
