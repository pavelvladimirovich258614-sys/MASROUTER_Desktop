import React from 'react';
import { BUILTIN_ROLES } from '../../../shared/masrouterData';

export const RolesPage: React.FC = () => {
  return (
    <div className="page">
      <div className="page__header">
        <div>
          <div className="page__title">Роли (Приложение E.2 + серверные)</div>
          <div className="page__subtitle">{BUILTIN_ROLES.length} предзаполненных ролей: 9 из статьи + 9 серверных.</div>
        </div>
      </div>

      <div className="grid-auto">
        {BUILTIN_ROLES.map((r) => (
          <div key={r.id} className="card">
            <div className="row" style={{ marginBottom: 8 }}>
              <strong>{r.name}</strong>
              <span className="badge">{r.category}</span>
              <span className={`badge ${r.riskLevel === 3 ? 'badge--danger' : r.riskLevel === 2 ? 'badge--warning' : ''}`}>
                risk {r.riskLevel}
              </span>
            </div>
            <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>{r.description}</div>
            <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
              <strong>Output:</strong>
              <pre className="code-block" style={{ fontSize: 10, maxHeight: 120, marginTop: 4 }}>{r.outputFormat}</pre>
            </div>
            <div style={{ marginTop: 8, fontSize: 11 }}>
              <div className="muted" style={{ marginBottom: 4 }}><strong>Allowed:</strong></div>
              <ul style={{ paddingLeft: 16, color: 'var(--color-accent-2)' }}>
                {r.allowedActions.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
              <div className="muted" style={{ marginTop: 4, marginBottom: 4 }}><strong>Forbidden:</strong></div>
              <ul style={{ paddingLeft: 16, color: 'var(--color-danger)' }}>
                {r.forbiddenActions.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
