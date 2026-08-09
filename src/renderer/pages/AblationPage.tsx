import React from 'react';
import { ABLATION_TABLE, SENSITIVITY, PLUGIN_RESULTS } from '../../../shared/masrouterData';

export const AblationPage: React.FC = () => {
  return (
    <div className="page">
      <div className="page__header">
        <div>
          <div className="page__title">Ablation Study (Таблица 3)</div>
          <div className="page__subtitle">Источник: arXiv:2502.11133, раздел 5.5</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Вариант</th>
              <th>GSM8K</th>
              <th>GSM8K cost ($)</th>
              <th>MATH</th>
              <th>MATH cost ($)</th>
              <th>Комментарий</th>
            </tr>
          </thead>
          <tbody>
            {ABLATION_TABLE.map((row) => (
              <tr key={row.variant} style={{ background: row.variant.includes('Fθm') ? 'rgba(255,84,112,0.06)' : undefined }}>
                <td><strong>{row.variant}</strong></td>
                <td className="mono">{row.gsm8k}</td>
                <td className="mono">${row.gsm8kCost.toFixed(2)}</td>
                <td className="mono">{row.math}</td>
                <td className="mono">${row.mathCost.toFixed(2)}</td>
                <td style={{ fontSize: 12 }}>{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="warning-banner" style={{ marginTop: 12 }}>
          ⚠ Без Fθm — самое большое падение performance (−2.09% GSM8K, −4.34% MATH). Это доказывает, что выбор модели критичен.
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card__title">Sensitivity: γ (число агентов)</div>
          <div className="card__subtitle">{SENSITIVITY.gamma.description}</div>
          <table className="data-table">
            <thead><tr><th>γ</th><th>Performance</th></tr></thead>
            <tbody>
              {SENSITIVITY.gamma.points.map((p) => (
                <tr key={p.gamma}>
                  <td className="mono">{p.gamma}</td>
                  <td className="mono">{p.performance}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>{SENSITIVITY.gamma.recommendation}</div>
        </div>
        <div className="card">
          <div className="card__title">Sensitivity: λ (trade-off)</div>
          <div className="card__subtitle">{SENSITIVITY.lambda.description}</div>
          <table className="data-table">
            <thead><tr><th>λ</th><th>Mode</th><th>Overhead reduction</th></tr></thead>
            <tbody>
              {SENSITIVITY.lambda.points.map((p) => (
                <tr key={p.lambda}>
                  <td className="mono">{p.lambda}</td>
                  <td>{p.mode}</td>
                  <td className="mono">{(p.overheadReduction * 100).toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>{SENSITIVITY.lambda.recommendation}</div>
        </div>
      </div>

      <div className="card">
        <div className="card__title">Plug-in результаты (Таблица 2): MAD + MasRouter</div>
        <div className="card__subtitle">MasRouter как drop-in замена маршрутизации в существующих MAS-фреймворках.</div>
        <table className="data-table" style={{ marginTop: 10 }}>
          <thead>
            <tr>
              <th>Benchmark</th>
              <th>MAD baseline</th>
              <th>MAD cost</th>
              <th>+MasRouter</th>
              <th>+MasRouter cost</th>
              <th>Δ perf</th>
              <th>Δ cost</th>
            </tr>
          </thead>
          <tbody>
            {PLUGIN_RESULTS.map((p) => {
              const dPerf = p.withMasRouter - p.baseline;
              const dCost = ((p.withMasRouterCost - p.baselineCost) / p.baselineCost) * 100;
              return (
                <tr key={p.benchmark}>
                  <td><strong>{p.benchmark}</strong></td>
                  <td className="mono">{p.baseline}</td>
                  <td className="mono">${p.baselineCost.toFixed(3)}</td>
                  <td className="mono" style={{ color: 'var(--color-accent-2)' }}>{p.withMasRouter}</td>
                  <td className="mono" style={{ color: 'var(--color-accent-2)' }}>${p.withMasRouterCost.toFixed(3)}</td>
                  <td className="mono">+{dPerf.toFixed(2)}</td>
                  <td className="mono" style={{ color: dCost < 0 ? 'var(--color-accent-2)' : 'var(--color-danger)' }}>{dCost.toFixed(1)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
