import React, { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { api } from '../lib/api';
import { SAMPLE_TASKS } from '../../../shared/masrouterData';
import { CascadeDiagram } from '../components/CascadeDiagram';
import { HelpTip } from '../components/HelpTip';
import { costModeLabel, costModeClass, topologyLabel, copyToClipboard } from '../lib/validators';
import type { RouteDecision, TaskType, Complexity } from '../../../shared/types';

const TASK_TYPES: { value: TaskType; label: string }[] = [
  { value: 'code-edit', label: 'Правка кода' },
  { value: 'bug-fix', label: 'Исправление бага' },
  { value: 'feature', label: 'Новая фича' },
  { value: 'refactor', label: 'Рефакторинг' },
  { value: 'database', label: 'База данных' },
  { value: 'payment', label: 'Оплата' },
  { value: 'discount', label: 'Скидки' },
  { value: 'deploy', label: 'Деплой' },
  { value: 'server-edit', label: 'Серверная правка' },
  { value: 'security', label: 'Безопасность' },
  { value: 'documentation', label: 'Документация' },
  { value: 'test', label: 'Тесты' },
  { value: 'analysis', label: 'Анализ' },
  { value: 'config', label: 'Конфигурация' }
];

const RISK_FLAGS: { key: keyof typeof EMPTY_RISK; label: string }[] = [
  { key: 'money', label: 'Деньги' },
  { key: 'payment', label: 'Оплата' },
  { key: 'discount', label: 'Скидки' },
  { key: 'security', label: 'Безопасность' },
  { key: 'database', label: 'База данных' },
  { key: 'deploy', label: 'Деплой' },
  { key: 'serverEdit', label: 'Серверная правка' }
];

const EMPTY_RISK = { money: false, payment: false, discount: false, security: false, database: false, deploy: false, serverEdit: false };

export const RouterPage: React.FC = () => {
  const calculate = useAppStore((s) => s.calculate);
  const calculating = useAppStore((s) => s.calculating);
  const models = useAppStore((s) => s.models);
  const toast = useAppStore((s) => s.toast);

  const [description, setDescription] = useState('');
  const [taskType, setTaskType] = useState<TaskType>('code-edit');
  const [complexity, setComplexity] = useState<Complexity>('Low');
  const [budget, setBudget] = useState<'AUTO' | 'ECO' | 'BALANCED' | 'QUALITY'>('AUTO');
  const [risk, setRisk] = useState(EMPTY_RISK);
  const [decision, setDecision] = useState<RouteDecision | null>(null);

  const enabledModels = models.filter((m) => m.enabled);

  async function onCalculate() {
    if (!description.trim()) {
      toast('warning', 'Опишите задачу');
      return;
    }
    const result = await calculate({
      taskDescription: description,
      taskType,
      complexity,
      riskFlags: risk,
      budgetMode: budget,
      availableModels: enabledModels.length > 0 ? enabledModels : models
    });
    if (result) {
      setDecision(result);
      // Сохраняем в history.
      await api.promptAppend({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: Date.now(),
        taskDescription: description,
        costMode: result.costMode,
        topology: result.topology,
        agentCount: result.agentCount,
        finalPrompt: result.finalPrompt,
        reused: false,
        tags: [taskType, complexity]
      });
    }
  }

  function loadSample(idx: number) {
    const s = SAMPLE_TASKS[idx];
    setDescription(s.task.taskDescription);
    setTaskType(s.task.taskType);
    setComplexity(s.task.complexity);
    setRisk(s.task.riskFlags);
  }

  async function copyFinalPrompt() {
    if (!decision) return;
    const ok = await copyToClipboard(decision.finalPrompt);
    toast(ok ? 'success' : 'error', ok ? 'Скопировано в буфер обмена' : 'Не удалось скопировать');
  }

  async function sendToProvider() {
    if (!decision) return;
    const firstStep = decision.chain[0];
    if (!firstStep) {
      toast('warning', 'Нет шагов для отправки');
      return;
    }
    const enabledProviders = (await api.providerList()) as any[];
    const provider = enabledProviders.find((p) => p.enabled);
    if (!provider) {
      toast('warning', 'Нет подключённого провайдера. Откройте Models.');
      return;
    }
    try {
      const r = await api.providerChat(provider.id, firstStep.model.id, [
        { role: 'system', content: `Ты — ${firstStep.role.name}.` },
        { role: 'user', content: decision.finalPrompt }
      ]);
      toast('success', `Получен ответ: ${r.content.slice(0, 100)}…`);
    } catch (e) {
      toast('error', 'Ошибка: ' + (e as Error).message);
    }
  }

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <div className="page__title">Маршрутизатор задач</div>
          <div className="page__subtitle">Каскад Fθt → Fθr → Fθm из статьи arXiv:2502.11133</div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: 20 }}>
        <div className="card">
          <div className="card__title">
            Описание задачи <HelpTip articleId="how-to-create-task" text="Как создать задачу" />
          </div>
          <div className="form-field">
            <textarea
              className="textarea"
              placeholder="Например: Исправить баг в расчёте скидки…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="form-field__hint">
              Атомарная правка = один файл, одно изменение.
            </div>
          </div>

          <div className="form-field">
            <label className="form-field__label">Тип задачи</label>
            <select className="select" value={taskType} onChange={(e) => setTaskType(e.target.value as TaskType)}>
              {TASK_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label className="form-field__label">Сложность</label>
            <select className="select" value={complexity} onChange={(e) => setComplexity(e.target.value as Complexity)}>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          <div className="form-field">
            <label className="form-field__label">Бюджет</label>
            <select className="select" value={budget} onChange={(e) => setBudget(e.target.value as any)}>
              <option value="AUTO">AUTO (по Risk)</option>
              <option value="ECO">ECO (принудительно)</option>
              <option value="BALANCED">BALANCED (принудительно)</option>
              <option value="QUALITY">QUALITY (принудительно)</option>
            </select>
          </div>

          <div className="form-field">
            <label className="form-field__label">
              Флаги риска <HelpTip articleId="risk-flags" text="Что означают флаги" />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
              {RISK_FLAGS.map((f) => (
                <label key={f.key} className="checkbox">
                  <input
                    type="checkbox"
                    checked={risk[f.key]}
                    onChange={(e) => setRisk({ ...risk, [f.key]: e.target.checked })}
                  />
                  <span style={{ fontSize: 13 }}>{f.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="row" style={{ marginTop: 8 }}>
            <button className="btn btn--primary" onClick={onCalculate} disabled={calculating}>
              {calculating ? 'Расчёт…' : 'Рассчитать маршрут'}
            </button>
          </div>

          <div className="divider" />
          <div className="card__subtitle">Вставить пример:</div>
          <div className="row" style={{ marginTop: 6 }}>
            {SAMPLE_TASKS.map((s, i) => (
              <button key={i} className="btn btn--small" onClick={() => loadSample(i)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          {!decision && (
            <div className="card empty">
              <div className="empty__title">Маршрут ещё не рассчитан</div>
              <div>Заполните форму слева и нажмите «Рассчитать маршрут».</div>
            </div>
          )}

          {decision && (
            <>
              <div className="card" style={{ marginBottom: 16 }}>
                <div className="row" style={{ marginBottom: 8 }}>
                  <span className={`badge risk-badge risk-${decision.riskScore}`}>Risk {decision.riskScore}</span>
                  <span className={`badge ${costModeClass(decision.costMode)}`}>{costModeLabel(decision.costMode)}</span>
                  <span className="badge">λ={decision.lambda}</span>
                  <span className="badge">{topologyLabel(decision.topology)}</span>
                  <span className="badge">агентов: {decision.agentCount}</span>
                </div>
                <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>{decision.reason}</div>
                <CascadeDiagram decision={decision} />
                <div className="muted" style={{ fontSize: 11 }}>
                  δ(H) = {decision.delta.toFixed(3)}, γ = {decision.gamma}, Γ(k+1) = {decision.topologicalMultiplier.toFixed(4)}
                </div>
              </div>

              {decision.warnings.length > 0 && (
                <div className="warning-banner" style={{ marginBottom: 12 }}>
                  ⚠ {decision.warnings.join(' • ')}
                </div>
              )}

              <div className="card" style={{ marginBottom: 16 }}>
                <div className="card__title">Цепочка ролей (Fθr)</div>
                {decision.chain.map((s) => (
                  <div key={s.order} className="chain-step">
                    <div className="chain-step__order">{s.order}</div>
                    <div>
                      <div className="chain-step__name">{s.role.name}</div>
                      <div className="chain-step__model">{s.role.description}</div>
                    </div>
                    <div>
                      <div className="badge">{s.model.name}</div>
                      <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>{s.model.tier}</div>
                    </div>
                  </div>
                ))}
              </div>

              {decision.stopConditions.length > 0 && (
                <div className="card" style={{ marginBottom: 16 }}>
                  <div className="card__title">Stop Conditions</div>
                  <ul style={{ paddingLeft: 18, fontSize: 13 }}>
                    {decision.stopConditions.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                </div>
              )}

              {decision.safetyChecklist.length > 0 && (
                <div className="card" style={{ marginBottom: 16 }}>
                  <div className="card__title">Server Safety Checklist</div>
                  <ul style={{ paddingLeft: 18, fontSize: 13 }}>
                    {decision.safetyChecklist.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                </div>
              )}

              <div className="card">
                <div className="card__title">Final Prompt</div>
                <div className="row" style={{ marginBottom: 8 }}>
                  <button className="btn btn--small" onClick={copyFinalPrompt}>📋 Копировать</button>
                  <button className="btn btn--small" onClick={sendToProvider}>→ Отправить в модель</button>
                  <a className="btn btn--small" href="#/codex">Open in Codex</a>
                </div>
                <pre className="code-block">{decision.finalPrompt}</pre>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
