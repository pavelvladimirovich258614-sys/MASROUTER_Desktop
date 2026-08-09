import React from 'react';
import { BUILTIN_CASE_STUDIES } from '../../../shared/masrouterData';
import { useAppStore } from '../store/appStore';
import { useNavigate } from 'react-router-dom';

export const CaseStudyPage: React.FC = () => {
  const calculate = useAppStore((s) => s.calculate);
  const models = useAppStore((s) => s.models);
  const toast = useAppStore((s) => s.toast);
  const navigate = useNavigate();

  async function loadTemplate(t: typeof BUILTIN_CASE_STUDIES[0]) {
    const input = {
      taskDescription: t.question,
      taskType: 'analysis' as const,
      complexity: 'High' as const,
      riskFlags: { money: false, payment: false, discount: false, security: false, database: false, deploy: false, serverEdit: false },
      budgetMode: 'AUTO' as const,
      availableModels: models.filter((m) => m.enabled).length > 0 ? models.filter((m) => m.enabled) : models
    };
    const decision = await calculate(input);
    if (decision) {
      toast('success', `Шаблон "${t.title}" загружен. Откройте Router для просмотра.`);
      navigate('/router');
    }
  }

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <div className="page__title">Case Study (Приложение C)</div>
          <div className="page__subtitle">5 шаблонов из статьи. Клик загружает задачу в Маршрутизатор.</div>
        </div>
      </div>

      <div className="grid-auto">
        {BUILTIN_CASE_STUDIES.map((t) => (
          <div key={t.id} className="card card--hoverable" style={{ cursor: 'pointer' }} onClick={() => loadTemplate(t)}>
            <div className="row" style={{ marginBottom: 8 }}>
              <span className="badge badge--accent">{t.benchmark}</span>
              <span className="badge">{t.topology}</span>
            </div>
            <div className="card__title">{t.title}</div>
            <div className="card__subtitle">{t.description}</div>
            <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
              <strong>Цепочка:</strong> {t.chain.join(' → ')}
            </div>
            <div className="muted" style={{ fontSize: 11, marginTop: 6, fontStyle: 'italic' }}>
              {t.notes}
            </div>
            <div className="muted" style={{ fontSize: 11, marginTop: 8 }}>
              Вопрос: «{t.question.slice(0, 80)}{t.question.length > 80 ? '…' : ''}»
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
