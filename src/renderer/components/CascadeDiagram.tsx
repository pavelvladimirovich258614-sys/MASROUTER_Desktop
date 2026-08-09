import React from 'react';
import type { RouteDecision } from '../../../shared/types';

export const CascadeDiagram: React.FC<{ decision: RouteDecision }> = ({ decision }) => {
  const ftNode = decision.cascade.find((c) => c.stage === 'Fθt');
  const frNode = decision.cascade.find((c) => c.stage === 'Fθr');
  const fmNode = decision.cascade.find((c) => c.stage === 'Fθm');
  return (
    <div className="cascade">
      <div className="cascade__node cascade__node--active">
        <div className="cascade__node-title">Fθt</div>
        <div className="cascade__node-value">{ftNode?.selected || '—'}</div>
        <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>collaboration</div>
      </div>
      <div className="cascade__arrow">→</div>
      <div className="cascade__node cascade__node--active">
        <div className="cascade__node-title">Fθr</div>
        <div className="cascade__node-value">{frNode?.selected?.split(' → ').length || 0} ролей</div>
        <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>role allocation</div>
      </div>
      <div className="cascade__arrow">→</div>
      <div className="cascade__node cascade__node--active">
        <div className="cascade__node-title">Fθm</div>
        <div className="cascade__node-value">{fmNode?.selected?.split(' → ').length || 0} моделей</div>
        <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>LLM routing</div>
      </div>
    </div>
  );
};
