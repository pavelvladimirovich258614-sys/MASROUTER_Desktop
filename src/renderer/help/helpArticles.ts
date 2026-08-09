// Help articles — 15 статей по требованию спеки.

export interface HelpArticle {
  id: string;
  title: string;
  short: string;
  steps: string[];
  relatedButtons: string[];
}

export const HELP_ARTICLES: HelpArticle[] = [
  {
    id: 'how-to-create-task',
    title: 'Как создать задачу',
    short: 'Заполните описание, выберите тип и сложность, отметьте флаги риска.',
    steps: [
      'Откройте «Маршрутизатор» в боковом меню.',
      'Введите описание задачи — одна атомарная правка.',
      'Выберите тип (Правка кода, Баг, Деплой, и т.д.).',
      'Укажите сложность: Low / Medium / High.',
      'Отметьте флаги риска, если задача затрагивает деньги, БД, безопасность и т.п.',
      'Нажмите «Рассчитать маршрут».',
      'Скопируйте Final Prompt или отправьте в подключённую модель.'
    ],
    relatedButtons: ['Рассчитать маршрут', 'Копировать', 'Отправить в модель']
  },
  {
    id: 'cost-modes',
    title: 'Что такое ECO / BALANCED / QUALITY',
    short: 'Три режима работы каскада MasRouter, основанные на λ.',
    steps: [
      'ECO (λ=25): дешёвые модели, минимум агентов. Подходит для текстов, кнопок, переименований.',
      'BALANCED (λ=15): баланс цены и качества. API, фильтры, сортировка, тесты.',
      'QUALITY (λ=5): дорогие модели, больше агентов, Reviewer обязателен. Деньги, оплата, безопасность, БД, деплой.',
      'Режим выбирается автоматически по Risk Score, либо принудительно через поле «Бюджет».'
    ],
    relatedButtons: ['Бюджет', 'Risk Score']
  },
  {
    id: 'eco-discount-warning',
    title: 'Почему нельзя использовать ECO для скидок',
    short: 'Скидки = деньги = Risk=3 → QUALITY обязательно.',
    steps: [
      'Любой флаг из {money, payment, discount, security, database, deploy} поднимает Risk Score до 3.',
      'Risk=3 → QUALITY + λ=5 + strong-tier модель + Reviewer + SecurityReviewer.',
      'ECO для скидок — это баг в логике каскада, потенциальные финансовые потери.',
      'В коде это правило явно: см. routerEngine.ts → computeRiskScore.'
    ],
    relatedButtons: ['Risk Score', 'Бюджет']
  },
  {
    id: 'connect-ollama',
    title: 'Как подключить Ollama',
    short: 'Локальный LLM через Ollama. Бесплатно, без API-ключа.',
    steps: [
      'Установите Ollama: https://ollama.com/download.',
      'Запустите: ollama serve (по умолчанию http://127.0.0.1:11434).',
      'Скачайте модель: ollama pull llama3.2:3b (или любую другую).',
      'В MASROUTER: Модели → Провайдеры → Ollama Local → включите чекбокс «Включён».',
      'Нажмите «✓ Тест» — приложение проверит /api/tags и наличие модели.',
      'В Модели включите «Local Llama 3.2 3B (Ollama)».',
      'Готово — можно отправлять задачи.'
    ],
    relatedButtons: ['Тест', 'Ollama Local']
  },
  {
    id: 'connect-minimax',
    title: 'Как подключить MiniMax',
    short: 'MiniMax-совместимый endpoint, настраивается вручную.',
    steps: [
      'Получите API-ключ в кабинете MiniMax.',
      'В MASROUTER: Модели → Провайдеры → «MiniMax» (или добавьте OpenAI-compatible).',
      'Укажите Base URL (например, https://api.minimax.chat/v1).',
      'Нажмите «+ Установить» в столбце API Key, введите ключ.',
      'Включите провайдера и протестируйте.'
    ],
    relatedButtons: ['API Key', 'Base URL']
  },
  {
    id: 'connect-stepfun',
    title: 'Как подключить StepFun',
    short: 'StepFun — OpenAI-compatible, ключ из кабинета.',
    steps: [
      'Получите ключ на https://platform.stepfun.com.',
      'В MASROUTER: Модели → Провайдеры → StepFun.',
      'Введите API-ключ.',
      'Включите провайдера и протестируйте.'
    ],
    relatedButtons: ['StepFun', 'API Key']
  },
  {
    id: 'connect-openai',
    title: 'Как подключить OpenAI',
    short: 'OpenAI напрямую через api.openai.com.',
    steps: [
      'Получите API-ключ на https://platform.openai.com.',
      'В MASROUTER: Модели → Провайдеры → OpenAI.',
      'Введите ключ.',
      'Включите провайдера, протестируйте.',
      'В Модели включите gpt-4o-mini (или другую модель).'
    ],
    relatedButtons: ['OpenAI', 'API Key']
  },
  {
    id: 'codex-setup',
    title: 'Как настроить Codex CLI',
    short: 'Интеграция с Codex CLI для автоматического выполнения задач.',
    steps: [
      'Установите Codex CLI: npm i -g @openai/codex (или другая команда).',
      'В MASROUTER: Codex CLI.',
      'Укажите путь к CLI (по умолчанию «codex»).',
      'Отредактируйте шаблон команды (переменные в фигурных скобках).',
      'Укажите Project Path, Git Branch.',
      'Рассчитайте маршрут → Создать task.md → Скопировать команду.'
    ],
    relatedButtons: ['Создать task.md', 'Скопировать команду']
  },
  {
    id: 'run-chain',
    title: 'Как выполнить цепочку шагов',
    short: 'Каждый шаг выполняется отдельной ролью с отдельной моделью.',
    steps: [
      'После расчёта маршрута откройте RouterPage → Final Prompt.',
      'Нажмите «→ Отправить в модель» — будет отправлен весь Final Prompt.',
      'Для пошагового выполнения используйте Chain Builder.',
      'Результат каждого шага сохраняется в формате <ANALYSIS>, <PATCH>, <TEST>, <REVIEW>.'
    ],
    relatedButtons: ['Отправить в модель', 'Chain Builder']
  },
  {
    id: 'view-cost',
    title: 'Как посмотреть стоимость',
    short: 'Каждый вызов LLM логируется с подсчётом input/output токенов.',
    steps: [
      'Откройте «Стоимость» в боковом меню.',
      'Наверху — общая статистика: запросов, сумма, дней.',
      'Sparkline показывает динамику по дням.',
      'Фильтры по моделям и режимам (ECO/BALANCED/QUALITY).',
      'Таблица содержит детали: время, модель, токены, стоимость.'
    ],
    relatedButtons: ['Фильтр', 'Лог']
  },
  {
    id: 'backup-before-server',
    title: 'Как сделать backup перед серверной правкой',
    short: 'Чеклист безопасности для любых серверных изменений.',
    steps: [
      'Создайте snapshot / backup на сервере.',
      'Создайте отдельную git-ветку.',
      'Убедитесь, что правка атомарна и обратима.',
      'Подготовьте команду проверки (test / smoke).',
      'Подготовьте rollback-план.',
      'Сначала примените на staging.'
    ],
    relatedButtons: ['Server Safety Checklist', 'Server Edit']
  },
  {
    id: 'build-installer',
    title: 'Как собрать installer',
    short: 'npm run dist собирает .exe / .dmg / .AppImage через electron-builder.',
    steps: [
      'Установите зависимости: npm install.',
      'Соберите renderer и main: npm run build.',
      'Соберите installer: npm run dist.',
      'Артефакты появятся в папке release/.',
      'Windows: MASROUTER Desktop Setup x.y.z.exe (NSIS) + portable .exe.',
      'macOS: MASROUTER Desktop-x.y.z.dmg + .zip.',
      'Linux: .AppImage + .deb.'
    ],
    relatedButtons: ['npm run dist', 'electron-builder']
  },
  {
    id: 'cascade-theory',
    title: 'Каскад Fθt → Fθr → Fθm — что это',
    short: 'Три контроллера из статьи arXiv:2502.11133.',
    steps: [
      'Fθt (collaboration determiner): Q → T. Выбирает топологию (Single/Chain/Tree/FullConnected/Debate/Reflection).',
      'Fθr (role allocator): (Q,T) → {R_i}. Подбирает цепочку ролей.',
      'Fθm (LLM router): (Q,T,{R_i}) → {M_i}. Назначает модели каждой роли.',
      'Целевая функция: max E[U − λ·C].',
      'Fθ = Fθm ∘ Fθr ∘ Fθt — каскад применяется последовательно.'
    ],
    relatedButtons: ['Cascade Diagram', 'Fθt', 'Fθr', 'Fθm']
  },
  {
    id: 'gamma-lambda',
    title: 'Что такое γ и λ',
    short: 'Параметры из раздела 5.1 статьи.',
    steps: [
      'γ = 6 — максимальное число агентов в системе.',
      'δ(H) — обучаемая функция сложности в [0,1].',
      'k = ⌈δ(H)·γ⌉ — число агентов.',
      'λ ∈ {5, 15, 25} — trade-off между качеством (U) и стоимостью (C).',
      'λ=5 (QUALITY): максимум качества, минимум экономии.',
      'λ=15 (BALANCED): компромисс.',
      'λ=25 (ECO): максимум экономии, риск снижения качества.'
    ],
    relatedButtons: ['λ', 'γ']
  },
  {
    id: 'gamma-function',
    title: 'Гамма-функция в MasRouter — зачем',
    short: 'Γ(z) используется в формуле (12) для аппроксимации мультиномиального коэффициента.',
    steps: [
      'C(k; n_1, …, n_Nm) ≈ Γ(δ(H)·γ+1) / [Γ(n_1+1)·…·Γ(n_Nm+1)].',
      'Γ(z) — расширение факториала на вещественные числа.',
      'В UI Topological Multiplier = Γ(k+1) показывает «ёмкость» топологии.',
      'Реализация в MASROUTER Desktop: Lanczos approximation (g=7, n=9).',
      'См. src/main/gamma.ts.'
    ],
    relatedButtons: ['Γ(k+1)', 'Topological Multiplier']
  }
];

export function findArticle(id: string): HelpArticle | undefined {
  return HELP_ARTICLES.find((a) => a.id === id);
}
