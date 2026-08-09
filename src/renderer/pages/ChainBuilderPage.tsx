import React from 'react';
import { useAppStore } from '../store/appStore';

export const ChainBuilderPage: React.FC = () => {
  const lastDecision = useAppStore((s) => s.lastDecision);

  if (!lastDecision) {
    return (
      <div className="page">
        <div className="page__header">
          <div>
            <div className="page__title">Chain Builder</div>
            <div className="page__subtitle">Редактирование цепочки последней рассчитанной задачи.</div>
          </div>
        </div>
        <div className="card empty">
          <div className="empty__title">Нет активной задачи</div>
          <div>Сначала рассчитайте маршрут в <a href="#/router">Маршрутизаторе</a>.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <div className="page__title">Chain Builder</div>
          <div className="page__subtitle">Цепочка шагов из последнего расчёта маршрута.</div>
        </div>
      </div>

      <div className="card">
        <div className="card__title">Цепочка ({lastDecision.chain.length} шагов)</div>
        {lastDecision.chain.map((s) => (
          <div key={s.order} className="chain-step">
            <div className="chain-step__order">{s.order}</div>
            <div>
              <div className="chain-step__name">{s.role.name}</div>
              <div className="chain-step__model">{s.role.description}</div>
              <pre className="code-block" style={{ fontSize: 10, maxHeight: 80, marginTop: 4 }}>{s.outputFormat}</pre>
            </div>
            <div>
              <div className="badge">{s.model.name}</div>
              <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>{s.model.tier}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="muted" style={{ fontSize: 11, marginTop: 12, textAlign: 'center' }}>
        Полное редактирование цепочки (drag-n-drop, добавление/удаление шагов) — в следующей итерации.
      </div>
    </div>
  );
};
