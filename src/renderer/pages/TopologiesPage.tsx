import React from 'react';
import { BUILTIN_TOPOLOGIES } from '../../../shared/masrouterData';

export const TopologiesPage: React.FC = () => {
  return (
    <div className="page">
      <div className="page__header">
        <div>
          <div className="page__title">Топологии (Приложение E.3)</div>
          <div className="page__subtitle">Режимы collaboration: 6 из статьи + серверные варианты.</div>
        </div>
      </div>

      <div className="grid-auto">
        {BUILTIN_TOPOLOGIES.map((t) => (
          <div key={t.id} className="card card--hoverable">
            <div className="row" style={{ marginBottom: 8 }}>
              <strong style={{ fontSize: 15 }}>{t.name}</strong>
              <span className={`badge ${t.costImpact === 'high' ? 'badge--danger' : t.costImpact === 'medium' ? 'badge--warning' : 'badge--green'}`}>
                cost: {t.costImpact}
              </span>
            </div>
            <div className="muted" style={{ fontSize: 13, marginBottom: 10 }}>{t.description}</div>
            <div style={{ fontSize: 12 }}>
              <strong>Когда:</strong> {t.whenToUse}
            </div>
            <div className="muted" style={{ fontSize: 11, marginTop: 8, fontStyle: 'italic' }}>
              {t.paperReference}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
