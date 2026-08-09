import React, { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { api } from '../lib/api';
import type { ModelConfig, ProviderConfig, ProviderKind } from '../../../shared/types';

const PROVIDER_KIND_LABEL: Record<ProviderKind, string> = {
  ollama: 'Ollama',
  openai: 'OpenAI',
  'openai-compatible': 'OpenAI-compatible',
  minimax: 'MiniMax',
  stepfun: 'StepFun',
  custom: 'Custom'
};

function inferTier(modelId: string): 'cheap' | 'balanced' | 'strong' | 'local-light' {
  const id = modelId.toLowerCase();
  if (id.includes('mini') || id.includes('haiku') || id.includes('flash') || id.includes('lite') ||
      id.includes('small') || id.includes('3b') || id.includes('7b') || id.includes('nano')) {
    return 'cheap';
  }
  if (id.includes('deepseek') || id.includes('opus') || id.includes('gpt-4') || id.includes('pro') ||
      id.includes('large') || id.includes('70b') || id.includes('405b')) {
    return 'strong';
  }
  if (id.includes('llama') || id.includes('mistral') || id.includes('qwen') || id.includes('local')) {
    return 'local-light';
  }
  return 'balanced';
}

function inferPrice(tier: 'cheap' | 'balanced' | 'strong' | 'local-light'): { in: number; out: number } {
  switch (tier) {
    case 'cheap': return { in: 0.10, out: 0.50 };
    case 'balanced': return { in: 0.15, out: 0.60 };
    case 'strong': return { in: 0.27, out: 1.10 };
    case 'local-light': return { in: 0, out: 0 };
  }
}

export const ModelsPage: React.FC = () => {
  const models = useAppStore((s) => s.models);
  const providers = useAppStore((s) => s.providers);
  const refresh = useAppStore((s) => s.refresh);
  const toast = useAppStore((s) => s.toast);

  const [testing, setTesting] = useState<string | null>(null);
  const [loadingModels, setLoadingModels] = useState<string | null>(null);
  const [keyModal, setKeyModal] = useState<{ providerId: string; key: string } | null>(null);

  async function toggleProviderEnabled(id: string) {
    const next = providers.map((x) => x.id === id ? { ...x, enabled: !x.enabled } : x);
    useAppStore.setState({ providers: next });
    await api.storageSet('providers', next);
  }

  async function updateProviderBaseUrl(id: string, baseUrl: string) {
    const next = providers.map((x) => x.id === id ? { ...x, baseUrl } : x);
    useAppStore.setState({ providers: next });
    await api.storageSet('providers', next);
  }

  async function toggleModelEnabled(id: string) {
    const next = models.map((m) => m.id === id ? { ...m, enabled: !m.enabled } : m);
    useAppStore.setState({ models: next });
    await api.storageSet('models', next);
  }

  async function testProvider(provider: ProviderConfig) {
    setTesting(provider.id);
    try {
      const r = await api.providerTest(provider.id, 'placeholder');
      toast(r.ok ? 'success' : 'warning', `${provider.label}: ${r.message}`);
      if (r.ok) {
        // Сразу подтягиваем модели при успешном тесте.
        await loadModels(provider);
      }
    } catch (e) {
      toast('error', 'Ошибка: ' + (e as Error).message);
    } finally {
      setTesting(null);
    }
  }

  async function loadModels(provider: ProviderConfig) {
    setLoadingModels(provider.id);
    try {
      const remote = await api.providerListModels(provider.id);
      if (remote.length === 0) {
        toast('warning', `${provider.label}: сервер вернул 0 моделей`);
        return;
      }
      // Мержим: удаляем старые модели этого провайдера, добавляем свежие.
      const others = models.filter((m) => m.provider !== provider.kind);
      const fresh: ModelConfig[] = remote.map((m) => {
        const t = inferTier(m.id);
        const p = inferPrice(t);
        return {
          id: m.id,
          name: m.id,
          provider: provider.kind,
          tier: t,
          inputPricePerMTok: p.in,
          outputPricePerMTok: p.out,
          contextWindow: 8192,
          enabled: true,
          notes: m.ownedBy ? `Подтянуто с ${provider.label} (${m.ownedBy})` : `Подтянуто с ${provider.label}`
        };
      });
      const next = [...others, ...fresh];
      useAppStore.setState({ models: next });
      await api.storageSet('models', next);
      toast('success', `${provider.label}: подтянуто ${fresh.length} моделей`);
    } catch (e) {
      toast('error', `${provider.label}: ${(e as Error).message}`);
    } finally {
      setLoadingModels(null);
    }
  }

  async function clearProviderKey(provider: ProviderConfig) {
    if (!confirm(`Удалить сохранённый API-ключ для ${provider.label}?`)) return;
    await api.apiKeyDelete(provider.id);
    toast('success', 'API-ключ удалён');
    await refresh();
  }

  async function clearModelsForProvider(provider: ProviderConfig) {
    if (!confirm(`Удалить все модели, подтянутые с ${provider.label}?`)) return;
    const next = models.filter((m) => m.provider !== provider.kind);
    useAppStore.setState({ models: next });
    await api.storageSet('models', next);
    toast('success', `Модели ${provider.label} удалены`);
  }

  async function clearAllModels() {
    if (!confirm('Удалить ВСЕ модели из библиотеки?')) return;
    useAppStore.setState({ models: [] });
    await api.storageSet('models', []);
    toast('success', 'Библиотека моделей очищена');
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

  // Группируем модели по провайдеру для читаемого вывода.
  const modelsByProvider = models.reduce<Record<string, ModelConfig[]>>((acc, m) => {
    const key = m.provider || 'unknown';
    (acc[key] = acc[key] || []).push(m);
    return acc;
  }, {});

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <div className="page__title">Модели и провайдеры</div>
          <div className="page__subtitle">Подключение LLM-провайдеров. Модели подтягиваются автоматически.</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20, background: 'var(--color-panel-2)' }}>
        <div className="card__title" style={{ fontSize: 14 }}>Как это работает</div>
        <div className="muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
          <ol style={{ paddingLeft: 20, marginTop: 6 }}>
            <li>Открой <strong>«+ Установить ключ»</strong> в строке провайдера, введи ключ. Сохранится зашифрованным (safeStorage).</li>
            <li>Если у тебя кастомный endpoint (например, tokenplana, локальный прокси) — отредактируй <strong>Base URL</strong> прямо в таблице.</li>
            <li>Поставь чекбокс <strong>«Вкл»</strong> у провайдера.</li>
            <li>Нажми <strong>«✓ Тест»</strong> — приложение постучится в API и <strong>сразу подтянет список моделей</strong> в таблицу ниже. Стоимость и tier определятся автоматически по имени модели.</li>
            <li>В таблице моделей отметь чекбоксы тех, что хочешь использовать в маршрутизации. Не нужные — выключи.</li>
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
              <th style={{ minWidth: 200 }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {providers.map((p) => (
              <tr key={p.id}>
                <td>
                  <strong style={{ color: 'var(--color-text)' }}>{p.label}</strong>
                  {PROVIDER_KIND_LABEL[p.kind] && (
                    <div style={{ fontSize: 11, marginTop: 2, color: 'var(--color-text)', opacity: 0.75 }}>{PROVIDER_KIND_LABEL[p.kind]}</div>
                  )}
                </td>
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
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button
                      className="btn btn--small"
                      disabled={!p.enabled || testing === p.id || loadingModels === p.id}
                      onClick={() => testProvider(p)}
                    >
                      {testing === p.id ? '⏳ …' : '✓ Тест + модели'}
                    </button>
                    <button
                      className="btn btn--small"
                      disabled={!p.enabled || loadingModels === p.id}
                      onClick={() => loadModels(p)}
                      title="Загрузить список моделей с провайдера"
                    >
                      {loadingModels === p.id ? '⏳ …' : '↻ Модели'}
                    </button>
                    <button
                      className="btn btn--small btn--ghost"
                      onClick={() => clearProviderKey(p)}
                      title="Удалить сохранённый API-ключ"
                    >
                      🗑 Ключ
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div className="card__title">Модели в библиотеке ({models.length})</div>
            <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
              Модели подтягиваются автоматически при нажатии «✓ Тест + модели». Никаких «чужих» моделей — только то, что ты сам подключил.
            </div>
          </div>
          {models.length > 0 && (
            <button className="btn btn--small btn--danger" onClick={clearAllModels}>
              Очистить все
            </button>
          )}
        </div>

        {models.length === 0 ? (
          <div className="empty">
            <div className="empty__title">Библиотека пуста</div>
            <div>Подключи провайдера выше, введи ключ, поставь чекбокс «Вкл» и нажми «✓ Тест + модели» — список подтянется автоматически.</div>
          </div>
        ) : (
          Object.entries(modelsByProvider).map(([kind, ms]) => {
            const prov = providers.find((p) => p.kind === kind);
            return (
              <div key={kind} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-accent)' }}>
                    {PROVIDER_KIND_LABEL[kind as ProviderKind] || kind} ({ms.length})
                  </div>
                  {prov && (
                    <button
                      className="btn btn--small btn--ghost"
                      onClick={() => clearModelsForProvider(prov)}
                      title="Удалить все модели этого провайдера"
                    >
                      🗑 Удалить все
                    </button>
                  )}
                </div>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Tier</th>
                      <th>$ in/1M</th>
                      <th>$ out/1M</th>
                      <th>Заметка</th>
                      <th>Вкл</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ms.map((m) => (
                      <tr key={m.id}>
                        <td className="mono" style={{ fontSize: 12, color: 'var(--color-text)' }}>{m.id}</td>
                        <td><span className="badge">{m.tier}</span></td>
                        <td className="mono" style={{ color: 'var(--color-text)' }}>{m.tier === 'local-light' ? '$0' : `$${m.inputPricePerMTok}`}</td>
                        <td className="mono" style={{ color: 'var(--color-text)' }}>{m.tier === 'local-light' ? '$0' : `$${m.outputPricePerMTok}`}</td>
                        <td className="muted" style={{ fontSize: 11 }}>{m.notes || '—'}</td>
                        <td>
                          <input
                            type="checkbox"
                            checked={m.enabled}
                            onChange={() => toggleModelEnabled(m.id)}
                            style={{ width: 18, height: 18, cursor: 'pointer' }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })
        )}
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
                Удалить ключ: «🗑 Ключ» в строке провайдера.
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
