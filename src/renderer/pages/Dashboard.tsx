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
  const enabledProviders = providers.filter((p) => p.enabled).length;

  return (
    <div className="page">
      {/* === ЧТО ЭТО ТАКОЕ — большой вводный блок === */}
      <div className="card" style={{ marginBottom: 20, background: 'var(--color-panel-2)' }}>
        <div className="card__title" style={{ fontSize: 18 }}>Что такое MASROUTER Desktop</div>
        <div className="muted" style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 10 }}>
          <strong>Локальное десктопное приложение, которое маршрутизирует вызовы LLM в Multi-Agent Systems
          по каскаду Fθ из статьи arXiv:2502.11133</strong> (Yanwei Yue et al., 16 февраля 2025).
          Вместо того чтобы каждый раз руками решать, какую модель и какие роли использовать
          для очередной задачи — одна функция <code>calculateRoute(task)</code> выдаёт
          готовый план: топологию, цепочку ролей, модели, стоимость.
        </div>

        <div className="card__title" style={{ fontSize: 14, marginTop: 12 }}>Какие боли закрывает</div>
        <ul style={{ paddingLeft: 20, fontSize: 13, lineHeight: 1.6 }}>
          <li><strong>Утечка денег.</strong> Атомарная правка = Risk=1 = режим ECO = дешёвая модель = $0.</li>
          <li><strong>Утечка качества.</strong> Деньги / оплата / безопасность / БД = Risk=3 = QUALITY = strong-tier + Reviewer.</li>
          <li><strong>Усталость от решений.</strong> Одна функция, один контракт — никакого зоопарка.</li>
          <li><strong>Дыра в аудите.</strong> Каждый <code>RouteDecision</code> содержит reason, cascade Fθt→Fθr→Fθm, warnings.</li>
        </ul>

        <div className="card__title" style={{ fontSize: 14, marginTop: 12 }}>Как пользоваться — 3 шага</div>
        <ol style={{ paddingLeft: 20, fontSize: 13, lineHeight: 1.7 }}>
          <li>
            <strong>Подключи модель</strong> → <Link to="/models">Модели</Link>. Самое простое — Ollama
            (бесплатно, без ключа: <code>ollama serve</code> + <code>ollama pull llama3.2:3b</code>).
            Или OpenAI / MiniMax / StepFun / OpenAI-compatible.
          </li>
          <li>
            <strong>Создай задачу</strong> → <Link to="/router">Маршрутизатор</Link>. Заполни описание,
            тип, сложность, флаги риска → «Рассчитать маршрут». Справа получишь Risk Score, Cost Mode,
            λ, цепочку ролей, Final Prompt.
          </li>
          <li>
            <strong>Используй результат</strong> — скопируй Final Prompt, отправь в модель прямо из приложения,
            или открой в Codex CLI → <Link to="/codex">Codex CLI</Link>. История сохранится в <Link to="/prompt-lab">Prompt Lab</Link>.
          </li>
        </ol>

        <div className="card__title" style={{ fontSize: 14, marginTop: 12 }}>Разделы приложения</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginTop: 8 }}>
          <SidebarItem to="/router" title="Маршрутизатор" body="Создать задачу, рассчитать маршрут, скопировать Final Prompt." />
          <SidebarItem to="/models" title="Модели" body="Подключить Ollama, OpenAI, MiniMax, StepFun, OpenAI-compatible." />
          <SidebarItem to="/case-study" title="Case Study" body="5 готовых workflow из статьи (MMLU, GSM8K, MATH, HumanEval)." />
          <SidebarItem to="/ablation" title="Ablation" body="Таблица из раздела 5.5 — почему выбор модели критичен." />
          <SidebarItem to="/roles" title="Роли" body="18 ролей: 9 из статьи + 9 серверных." />
          <SidebarItem to="/topologies" title="Топологии" body="7 режимов collaboration: Single, Chain, Tree, FullConnected, …" />
          <SidebarItem to="/chain" title="Chain Builder" body="Просмотр и запуск цепочки шагов последнего маршрута." />
          <SidebarItem to="/prompt-lab" title="Prompt Lab" body="История сгенерированных Final Prompt с фильтрами." />
          <SidebarItem to="/cost" title="Стоимость" body="Лог API-вызовов, агрегация по моделям и режимам." />
          <SidebarItem to="/codex" title="Codex CLI" body="Генератор task.md + копирование команды Codex + SSH." />
          <SidebarItem to="/logs" title="Логи" body="Системный лог приложения: info / warning / error / security." />
          <SidebarItem to="/settings" title="Настройки" body="Тема, безопасность, экспорт/импорт, перезапуск онбординга." />
          <SidebarItem to="/help" title="Справка" body="15 статей на русском: каскад Fθ, провайдеры, Codex, безопасность." />
        </div>
      </div>

      <div className="page__header">
        <div>
          <div className="page__title">Текущее состояние</div>
          <div className="page__subtitle">Что подключено и что считалось</div>
        </div>
      </div>

      <div className="grid-auto" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card__subtitle">Подключено провайдеров</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-accent)' }}>
            {enabledProviders} <span style={{ fontSize: 14, color: 'var(--color-muted)' }}>/ {providers.length}</span>
          </div>
          <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>
            Включите провайдера в <Link to="/models">Моделях</Link> (чекбокс «Включён») и протестируйте.
          </div>
        </div>
        <div className="card">
          <div className="card__subtitle">API-вызовов всего</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{costLogs.length}</div>
          <div className="muted" style={{ fontSize: 11 }}>суммарно ${totalCost.toFixed(4)}</div>
        </div>
        <div className="card">
          <div className="card__subtitle">Режимы маршрутизации</div>
          <div className="row" style={{ marginTop: 6 }}>
            <span className="badge cost-eco">ECO {ecoCount}</span>
            <span className="badge cost-balanced">BAL {balCount}</span>
            <span className="badge cost-quality">QUAL {qualCount}</span>
          </div>
        </div>
        <div className="card">
          <div className="card__subtitle">Моделей в библиотеке</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{useAppStore.getState().models.length}</div>
          <div className="muted" style={{ fontSize: 11 }}>6 предзаполненных из Приложения E.1</div>
        </div>
      </div>

      {enabledProviders === 0 && (
        <div className="warning-banner" style={{ marginBottom: 20 }}>
          ⚠ Провайдеры не подключены. Без активного провайдера кнопка «Отправить в модель» в Маршрутизаторе не сработает. Final Prompt можно копировать и отправлять вручную. <Link to="/models"><strong>Подключить модель →</strong></Link>
        </div>
      )}

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
        <div className="card__title">Бенчмарки MasRouter (Таблица 1 статьи, последняя строка)</div>
        <div className="card__subtitle">Результаты, которых достигает каскад Fθ на 5 стандартных бенчмарках.</div>
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

const SidebarItem: React.FC<{ to: string; title: string; body: string }> = ({ to, title, body }) => (
  <Link
    to={to}
    style={{
      display: 'block',
      padding: '10px 12px',
      background: 'var(--color-panel)',
      border: '1px solid var(--color-border)',
      borderRadius: 10,
      textDecoration: 'none',
      color: 'var(--color-text)',
      transition: 'border-color 180ms ease'
    }}
    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-accent)')}
    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
  >
    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{title}</div>
    <div className="muted" style={{ fontSize: 12, lineHeight: 1.4 }}>{body}</div>
  </Link>
);
