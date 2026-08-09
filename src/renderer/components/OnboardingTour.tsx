import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { api } from '../lib/api';

interface OnboardingStep {
  id: string;
  title: string;
  body: string;
  // Маршрут, на который переходим перед подсветкой.
  route?: string;
  // CSS-селектор элемента, который нужно подсветить.
  selector?: string;
  // Позиция карточки относительно подсвеченного элемента.
  cardPosition?: 'right' | 'bottom' | 'center';
}

const STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Добро пожаловать в MASROUTER Desktop',
    body:
      'Это локальный маршрутизатор LLM в Multi-Agent Systems по логике каскада Fθ из статьи arXiv:2502.11133. ' +
      'Пройдите короткий тур — 6 шагов по 30 секунд каждый — и научитесь основным кнопкам.',
    cardPosition: 'center'
  },
  {
    id: 'sidebar',
    title: 'Боковая панель — основные разделы',
    body:
      'Слева — все страницы приложения. Сверху логотип и версия, снизу — статус подключённых провайдеров. ' +
      'Подсвеченный пункт — текущая страница. Кликните по любому, чтобы перейти.',
    selector: '.app__sidebar',
    cardPosition: 'right'
  },
  {
    id: 'router',
    title: 'Маршрутизатор — главный экран',
    body:
      'Здесь вы создаёте задачу. Заполните описание, выберите тип, сложность и флаги риска — ' +
      'и нажмите «Рассчитать маршрут». Справа появится карточка с Risk Score, Cost Mode, λ, цепочкой ролей и Final Prompt. ' +
      'Можно скопировать, отправить в модель или открыть в Codex.',
    route: '/router',
    selector: '.app__main',
    cardPosition: 'right'
  },
  {
    id: 'models',
    title: 'Модели — подключение провайдеров',
    body:
      'Здесь включаются Ollama, OpenAI, MiniMax, StepFun и OpenAI-compatible провайдеры. ' +
      'Нажмите «+ Установить» в колонке API Key, чтобы ввести ключ (хранится зашифрованным). ' +
      'Кнопка «✓ Тест» проверит подключение. После этого включите нужные модели в таблице ниже.',
    route: '/models',
    selector: '.app__main',
    cardPosition: 'right'
  },
  {
    id: 'case-study',
    title: 'Case Study — примеры из статьи',
    body:
      '5 готовых workflow из Приложения C статьи: MMLU, GSM8K, MATH, HumanEval (простой и сложный). ' +
      'Клик по карточке загружает задачу в Маршрутизатор с предзаполненной цепочкой ролей.',
    route: '/case-study',
    selector: '.app__main',
    cardPosition: 'right'
  },
  {
    id: 'codex',
    title: 'Codex CLI — интеграция',
    body:
      'После расчёта маршрута можно создать task.md в вашем проекте и скопировать команду Codex ' +
      'с подставленными переменными. Доступны также SSH-команды по whitelist (статус репозитория, логи).',
    route: '/codex',
    selector: '.app__main',
    cardPosition: 'right'
  },
  {
    id: 'help',
    title: 'Справка — 15 статей на русском',
    body:
      'В разделе «Справка» — поиск по 15 статьям: как создать задачу, что такое ECO/BALANCED/QUALITY, ' +
      'почему нельзя ECO для скидок, как подключить Ollama / OpenAI / MiniMax / StepFun, как настроить Codex, ' +
      'как собрать installer, и объяснение каскада Fθ. В любой момент: в Topbar кнопка «? Справка».',
    route: '/help',
    selector: '.app__main',
    cardPosition: 'right'
  },
  {
    id: 'done',
    title: 'Готово!',
    body:
      'Начните с раздела «Модели» — подключите Ollama (это бесплатно и без ключа: ollama serve + ollama pull llama3.2:3b). ' +
      'Затем откройте «Маршрутизатор», вставьте пример задачи и нажмите «Рассчитать маршрут». ' +
      'Тур можно перезапустить из «Настройки» → «Сбросить onboarding».',
    cardPosition: 'center'
  }
];

export const OnboardingTour: React.FC = () => {
  const settings = useAppStore((s) => s.settings);
  const setSetting = useAppStore((s) => s.setSetting);
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const visible = !!settings && !settings.onboardingDone;
  const current = STEPS[step];

  // Навигация на нужный route + подсветка элемента.
  useEffect(() => {
    if (!visible) return;
    if (current.route) {
      navigate(current.route);
    }
    // Подождём, пока DOM обновится.
    const t = setTimeout(() => {
      if (current.selector) {
        const el = document.querySelector(current.selector) as HTMLElement | null;
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTargetRect(el.getBoundingClientRect());
        } else {
          setTargetRect(null);
        }
      } else {
        setTargetRect(null);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [step, visible, current, navigate]);

  // При resize пересчитываем rect.
  useEffect(() => {
    if (!visible) return;
    const handler = () => {
      if (current.selector) {
        const el = document.querySelector(current.selector) as HTMLElement | null;
        setTargetRect(el ? el.getBoundingClientRect() : null);
      }
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [step, visible, current]);

  if (!visible) return null;

  function next() {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      finish();
    }
  }

  function back() {
    if (step > 0) setStep(step - 1);
  }

  async function finish() {
    await setSetting('onboardingDone', true);
  }

  function skip() {
    finish();
  }

  function restartTour() {
    setSetting('onboardingDone', false);
    setStep(0);
  }
  // expose для отладки из devtools
  if (typeof window !== 'undefined') {
    (window as any).__masrouterRestartTour = restartTour;
  }

  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  // Стили для spotlight.
  const spotlightStyle: React.CSSProperties = targetRect
    ? {
        position: 'fixed',
        top: targetRect.top - 8,
        left: targetRect.left - 8,
        width: targetRect.width + 16,
        height: targetRect.height + 16,
        borderRadius: 12,
        boxShadow: '0 0 0 9999px rgba(5, 8, 10, 0.78), 0 0 24px rgba(20, 241, 217, 0.5)',
        zIndex: 9998,
        pointerEvents: 'none',
        transition: 'all 200ms ease'
      }
    : {};

  // Позиция карточки.
  const cardStyle: React.CSSProperties = (() => {
    if (current.cardPosition === 'center' || !targetRect) {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 9999
      };
    }
    // Справа от target.
    if (current.cardPosition === 'right') {
      const cardWidth = 400;
      const left = Math.min(targetRect.right + 20, window.innerWidth - cardWidth - 20);
      const top = Math.max(20, Math.min(targetRect.top, window.innerHeight - 380));
      return { position: 'fixed', top, left, width: cardWidth, zIndex: 9999 };
    }
    // Снизу.
    const left = Math.max(20, Math.min(targetRect.left, window.innerWidth - 420));
    const top = Math.min(targetRect.bottom + 20, window.innerHeight - 320);
    return { position: 'fixed', top, left, width: 400, zIndex: 9999 };
  })();

  return (
    <>
      {targetRect && <div style={spotlightStyle} />}
      <div ref={cardRef} className="onboarding-card" style={cardStyle}>
        <div className="onboarding-card__step">
          Шаг {step + 1} из {STEPS.length}
        </div>
        <div className="onboarding-card__title">{current.title}</div>
        <div className="onboarding-card__body">{current.body}</div>
        <div className="onboarding-card__actions">
          <button className="btn btn--small btn--ghost" onClick={skip}>
            Пропустить
          </button>
          <div style={{ flex: 1 }} />
          {!isFirst && (
            <button className="btn btn--small" onClick={back}>
              ← Назад
            </button>
          )}
          <button className="btn btn--small btn--primary" onClick={next}>
            {isLast ? 'Готово' : 'Далее →'}
          </button>
        </div>
      </div>
    </>
  );
};
