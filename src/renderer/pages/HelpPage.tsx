import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { HELP_ARTICLES, findArticle } from '../help/helpArticles';

export const HelpPage: React.FC = () => {
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string>(HELP_ARTICLES[0].id);

  useEffect(() => {
    const hash = location.hash;
    const m = hash.match(/id=([^&]+)/);
    if (m) {
      const a = findArticle(m[1]);
      if (a) setSelectedId(a.id);
    }
  }, [location.hash]);

  const filtered = query
    ? HELP_ARTICLES.filter(
        (a) =>
          a.title.toLowerCase().includes(query.toLowerCase()) ||
          a.short.toLowerCase().includes(query.toLowerCase())
      )
    : HELP_ARTICLES;

  const selected = HELP_ARTICLES.find((a) => a.id === selectedId) || HELP_ARTICLES[0];

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <div className="page__title">Справка</div>
          <div className="page__subtitle">{HELP_ARTICLES.length} статей о каскаде Fθ, провайдерах и Codex CLI.</div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: 20 }}>
        <div className="card">
          <input
            className="input"
            placeholder="Поиск по справке…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ marginBottom: 10 }}
          />
          {filtered.map((a) => (
            <div
              key={a.id}
              onClick={() => setSelectedId(a.id)}
              style={{
                padding: '10px 12px',
                borderRadius: 8,
                cursor: 'pointer',
                background: selectedId === a.id ? 'var(--color-hover)' : 'transparent',
                borderLeft: selectedId === a.id ? '3px solid var(--color-accent)' : '3px solid transparent',
                marginBottom: 4
              }}
            >
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>{a.title}</div>
              <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>{a.short}</div>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="card__title">{selected.title}</div>
          <div className="card__subtitle">{selected.short}</div>
          <ol style={{ paddingLeft: 20, marginTop: 10 }}>
            {selected.steps.map((s, i) => (
              <li key={i} style={{ marginBottom: 6, fontSize: 13 }}>{s}</li>
            ))}
          </ol>
          {selected.relatedButtons.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Связанные кнопки:</div>
              <div className="row">
                {selected.relatedButtons.map((b) => <span key={b} className="badge">{b}</span>)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
