import React, { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { api } from '../lib/api';
import type { ModelConfig, ProviderConfig } from '../../../shared/types';

export const ModelsPage: React.FC = () => {
  const models = useAppStore((s) => s.models);
  const providers = useAppStore((s) => s.providers);
  const refresh = useAppStore((s) => s.refresh);
  const toast = useAppStore((s) => s.toast);

  const [testing, setTesting] = useState<string | null>(null);
  const [keyModal, setKeyModal] = useState<{ providerId: string; key: string } | null>(null);

  async function toggleEnabled(id: string) {
    const next = models.map((m) => m.id === id ? { ...m, enabled: !m.enabled } : m);
    await api.storageSet('models', next);
    await refresh();
  }

  async function testProvider(provider: ProviderConfig, model: ModelConfig) {
    setTesting(provider.id);
    try {
      const r = await api.providerTest(provider.id, model.id);
      toast(r.ok ? 'success' : 'warning', `${provider.label}: ${r.message}`);
    } catch (e) {
      toast('error', 'Ошибка: ' + (e as Error).message);
    } finally {
      setTesting(null);
    }
  }

  async function setKey() {
    if (!keyModal) return;
    try {
      await api.apiKeySet(keyModal.providerId, keyModal.key);
      toast('success', 'API-ключ сохранён (зашифрован)');
      setKeyModal(null);
    } catch (e) {
      toast('error', (e as Error).message);
    }
  }

  async function toggleProviderEnabled(id: string) {
    // Оптимистичное обновление — без вызова refresh(), чтобы состояние не
    // сбрасывалось обратно (особенно важно в browser preview).
    const next = providers.map((x) => x.id === id ? { ...x, enabled: !x.enabled } : x);
    useAppStore.setState({ providers: next });
    await api.storageSet('providers', next);
  }

  async function updateProviderBaseUrl(id: string, baseUrl: string) {
    const next = providers.map((x) => x.id === id ? { ...x, baseUrl } : x);
    useAppStore.setState({ providers: next });
    await api.storageSet('providers', next);
    toast('success', 'Base URL сохранён');
  }

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <div className="page__title">Модели и провайдеры</div>
          <div className="page__subtitle">Подключение LLM-провайдеров и управление библиотекой моделей.</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20, background: 'var(--color-panel-2)' }}>
        <div className="card__title" style={{ fontSize: 14 }}>Что это и зачем</div>
        <div className="muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
          <strong>Провайдер</strong> — это сервис, через который идут запросы (Ollama локально, OpenAI в облаке, MiniMax, StepFun, OpenAI-compatible).
          <br />
          <strong>Модель</strong> — конкретный LLM (gpt-4o-mini, claude-3-5-haiku, …). У каждой модели есть тир: <em>cheap</em> / <em>balanced</em> / <em>strong</em> / <em>local-light</em>.
          Каскад MasRouter выбирает модель по тиру: QUALITY → strong, BALANCED → balanced, ECO → cheap.
          <br /><br />
          <strong>Шаги подключения:</strong>
          <ol style={{ paddingLeft: 20, marginTop: 6 }}>
            <li>Отредактируй <strong>Base URL</strong> если у тебя кастомный endpoint (по умолчанию уже стоят правильные для каждого провайдера).</li>
            <li>Нажми <strong>«Установить ключ»</strong> в колонке API Key, введи ключ — сохранится зашифрованным (safeStorage, ОС-уровень).</li>
            <li>Поставь чекбокс <strong>«Включён»</strong> в строке провайдера.</li>
            <li>Нажми <strong>«✓ Тест»</strong> — приложение реально постучится в API и покажет результат (HTTP-статус + latency).</li>
            <li>В таблице «Модели (Приложение E.1)» поставь чекбокс <strong>«Включена»</strong> на нужных моделях. Только они попадут в кандидаты для маршрутизации.</li>
          </ol>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card__title">Провайдеры</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Провайдер</th>
              <th>Kind</th>
              <th style={{ minWidth: 240 }}>Base URL</th>
              <th>API Key</th>
              <th>Вкл</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {providers.map((p) => {
              const defModel = models.find((m) => m.provider === p.kind);
              return (
                <tr key={p.id}>
                  <td><strong>{p.label}</strong></td>
                  <td className="mono" style={{ fontSize: 12, color: 'var(--color-muted-strong)' }}>{p.kind}</td>
                  <td>
                    <input
                      className="input"
                      style={{ fontSize: 12, padding: '6px 8px', color: 'var(--color-text)', background: 'var(--color-panel-2)' }}
                      value={p.baseUrl}
                      placeholder="https://api.example.com/v1"
                      onChange={(e) => updateProviderBaseUrl(p.id, e.target.value)}
                    />
                  </td>
                  <td>
                    <ProviderKeyCell provider={p} onSetKey={() => setKeyModal({ providerId: p.id, key: '' })} />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={p.enabled}
                      onChange={() => toggleProviderEnabled(p.id)}
                      style={{ width: 18, height: 18, cursor: 'pointer' }}
                    />
                  </td>
                  <td>
                    <button
                      className="btn btn--small"
                      disabled={!p.enabled || !defModel || testing === p.id}
                      onClick={() => defModel && testProvider(p, defModel)}
                    >
                      {testing === p.id ? '⏳ …' : '✓ Тест'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="card__title">Модели (Приложение E.1)</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Название</th>
              <th>Tier</th>
              <th>Provider</th>
              <th>$ in/1M</th>
              <th>$ out/1M</th>
              <th>MMLU</th>
              <th>HumanEval</th>
              <th>MATH</th>
              <th>Вкл</th>
            </tr>
          </thead>
          <tbody>
            {models.map((m) => (
              <tr key={m.id}>
                <td className="mono" style={{ fontSize: 12, color: 'var(--color-text)' }}>{m.id}</td>
                <td><strong>{m.name}</strong></td>
                <td><span className="badge">{m.tier}</span></td>
                <td className="mono" style={{ fontSize: 12, color: 'var(--color-muted-strong)' }}>{m.provider}</td>
                <td className="mono" style={{ color: 'var(--color-text)' }}>{m.tier === 'local-light' ? '$0' : `$${m.inputPricePerMTok}`}</td>
                <td className="mono" style={{ color: 'var(--color-text)' }}>{m.tier === 'local-light' ? '$0' : `$${m.outputPricePerMTok}`}</td>
                <td className="mono" style={{ color: 'var(--color-text)' }}>{m.benchmarks?.mmlu ?? '—'}</td>
                <td className="mono" style={{ color: 'var(--color-text)' }}>{m.benchmarks?.humaneval ?? '—'}</td>
                <td className="mono" style={{ color: 'var(--color-text)' }}>{m.benchmarks?.math ?? '—'}</td>
                <td>
                  <input
                    type="checkbox"
                    checked={m.enabled}
                    onChange={() => toggleEnabled(m.id)}
                    style={{ width: 18, height: 18, cursor: 'pointer' }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {keyModal && (
        <div className="modal-overlay" onClick={() => setKeyModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__title">API-ключ для {providers.find((p) => p.id === keyModal.providerId)?.label}</div>
            <div className="form-field">
              <label className="form-field__label">API Key</label>
              <input
                className="input"
                type="password"
                value={keyModal.key}
                onChange={(e) => setKeyModal({ ...keyModal, key: e.target.value })}
                placeholder="sk-... или иной ключ"
                autoFocus
              />
              <div className="form-field__hint">
                Ключ будет зашифрован через safeStorage. В UI отображается только маска.
                Чтобы изменить — нажми «Изменить ключ» в таблице.
              </div>
            </div>
            <div className="modal__actions">
              <button className="btn" onClick={() => setKeyModal(null)}>Отмена</button>
              <button className="btn btn--primary" onClick={setKey}>Сохранить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ProviderKeyCell: React.FC<{ provider: ProviderConfig; onSetKey: () => void }> = ({ provider, onSetKey }) => {
  const [mask, setMask] = useState<string>('');
  React.useEffect(() => {
    api.apiKeyMask(provider.id).then(setMask);
  }, [provider.id]);
  if (!mask) {
    return <button className="btn btn--small" onClick={onSetKey}>+ Установить ключ</button>;
  }
  return (
    <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
      <span style={{ color: 'var(--color-text)', fontWeight: 500 }}>{mask}</span>
      <button className="btn btn--small" onClick={onSetKey}>Изменить</button>
    </span>
  );
};
