// Предзаполненные данные MASROUTER — берутся напрямую из статьи arXiv:2502.11133.
// Источники по строкам в файле _masrouter_extracted.txt указаны в комментариях.
//
// Численные параметры, метрики моделей, ablation и case study сверены с оригиналом.
// НЕ ИЗМЕНЯТЬ наугад — это reference data.

import type {
  CaseStudyTemplate,
  ModelConfig,
  RoleConfig,
  Topology,
  TopologyConfig
} from './types';

// =============================================================================
// РОЛИ — 9 из Приложения E.2 + 9 серверных = 18 (см. мета-промпт раздел E)
// =============================================================================

export const BUILTIN_ROLES: RoleConfig[] = [
  // === Из статьи (9) ===
  {
    id: 'MathAnalyst',
    name: 'MathAnalyst',
    description: 'Разбирает математическую задачу: выделяет данные, цель, ограничения.',
    outputFormat: '<ANALYSIS>\n- дано:\n- найти:\n- метод:\n</ANALYSIS>',
    allowedActions: ['анализ условий', 'выбор метода', 'декомпозиция'],
    forbiddenActions: ['писать код', 'менять файлы'],
    riskLevel: 1,
    category: 'math',
    builtin: true
  },
  {
    id: 'MathTeacher',
    name: 'MathTeacher',
    description: 'Объясняет ход решения по шагам, проверяет ответ.',
    outputFormat: '<SOLUTION>\nшаг 1: ...\nшаг 2: ...\nответ: ...\n</SOLUTION>',
    allowedActions: ['пошаговое решение', 'проверка', 'объяснение'],
    forbiddenActions: ['править инфраструктуру'],
    riskLevel: 1,
    category: 'math',
    builtin: true
  },
  {
    id: 'Inspector',
    name: 'Inspector',
    description: 'Проверяет решение/код на корректность, ищет баги.',
    outputFormat: '<INSPECTION>\n- найдено:\n- рекомендации:\n</INSPECTION>',
    allowedActions: ['проверка', 'выявление багов', 'рекомендации'],
    forbiddenActions: ['вносить правки без подтверждения'],
    riskLevel: 2,
    category: 'analysis',
    builtin: true
  },
  {
    id: 'AlgorithmDesigner',
    name: 'Algorithm Designer',
    description: 'Проектирует алгоритм: выбирает структуры данных, сложность.',
    outputFormat: '<DESIGN>\nалгоритм: ...\nсложность: O(...)\n</DESIGN>',
    allowedActions: ['проектирование', 'выбор структур данных', 'оценка сложности'],
    forbiddenActions: ['реализация', 'деплой'],
    riskLevel: 2,
    category: 'code',
    builtin: true
  },
  {
    id: 'BugFixer',
    name: 'BugFixer',
    description: 'Локализует баг и предлагает минимальный патч.',
    outputFormat: '<PATCH>\ndiff:\n...\n</PATCH>',
    allowedActions: ['локализация бага', 'минимальный патч', 'объяснение причины'],
    forbiddenActions: ['рефакторинг', 'изменение архитектуры'],
    riskLevel: 2,
    category: 'code',
    builtin: true
  },
  {
    id: 'TestAnalyst',
    name: 'Test Analyst',
    description: 'Проектирует тест-кейсы и команды проверки.',
    outputFormat: '<TEST>\nкейсы:\n- ...\nкоманда: ...\n</TEST>',
    allowedActions: ['проектирование тестов', 'команды проверки', 'проверка edge cases'],
    forbiddenActions: ['править продакшен-код'],
    riskLevel: 1,
    category: 'analysis',
    builtin: true
  },
  {
    id: 'Critic',
    name: 'Critic',
    description: 'Критически оценивает ответ, ищет слабые места.',
    outputFormat: '<CRITIQUE>\n- сильные стороны:\n- слабые стороны:\n- рекомендации:\n</CRITIQUE>',
    allowedActions: ['критика', 'выявление пробелов', 'альтернативные подходы'],
    forbiddenActions: ['финальное решение'],
    riskLevel: 1,
    category: 'meta',
    builtin: true
  },
  {
    id: 'WikiSearcher',
    name: 'WikiSearcher',
    description: 'Ищет релевантные сведения в базе знаний / вики.',
    outputFormat: '<EVIDENCE>\n- факт 1 (источник)\n- факт 2 (источник)\n</EVIDENCE>',
    allowedActions: ['поиск фактов', 'цитирование источников'],
    forbiddenActions: ['генерировать без источника'],
    riskLevel: 1,
    category: 'analysis',
    builtin: true
  },
  {
    id: 'Historian',
    name: 'Historian',
    description: 'Собирает исторический контекст / аналогии.',
    outputFormat: '<CONTEXT>\nхронология:\n- ...\n</CONTEXT>',
    allowedActions: ['исторический контекст', 'аналогии'],
    forbiddenActions: ['выдумывать без источника'],
    riskLevel: 1,
    category: 'analysis',
    builtin: true
  },
  // === Серверные (9) ===
  {
    id: 'Analyst',
    name: 'Analyst',
    description: 'Читает файлы/логи, составляет аналитический отчёт.',
    outputFormat: '<ANALYSIS>\n- контекст:\n- наблюдения:\n- рекомендации:\n</ANALYSIS>',
    allowedActions: ['чтение файлов', 'чтение логов', 'анализ'],
    forbiddenActions: ['правка файлов', 'запуск команд на сервере'],
    riskLevel: 1,
    category: 'analysis',
    builtin: true
  },
  {
    id: 'Implementer',
    name: 'Implementer',
    description: 'Делает минимальную точечную правку в указанном файле.',
    outputFormat: '<PATCH>\nфайл: ...\ndiff: ...\nкоманда проверки: ...\n</PATCH>',
    allowedActions: ['правка одного файла', 'git add', 'git commit'],
    forbiddenActions: ['рефакторинг', 'правка соседних файлов', 'миграции'],
    riskLevel: 2,
    category: 'code',
    builtin: true
  },
  {
    id: 'Tester',
    name: 'Tester',
    description: 'Запускает команды проверки (тесты, smoke).',
    outputFormat: '<TEST>\nкоманда: ...\nрезультат: PASS|FAIL\nлог: ...\n</TEST>',
    allowedActions: ['запуск тестов', 'сборка логов', 'smoke'],
    forbiddenActions: ['правка кода', 'деплой'],
    riskLevel: 2,
    category: 'server',
    builtin: true
  },
  {
    id: 'Reviewer',
    name: 'Reviewer',
    description: 'Принимает или отклоняет правку. Финальное APPROVED/REJECTED.',
    outputFormat: '<REVIEW>\nverdict: APPROVED|REJECTED\nпричина: ...\n</REVIEW>',
    allowedActions: ['вердикт APPROVED/REJECTED', 'комментарии'],
    forbiddenActions: ['правка кода', 'обход чеклистов'],
    riskLevel: 3,
    category: 'meta',
    builtin: true
  },
  {
    id: 'SecurityReviewer',
    name: 'SecurityReviewer',
    description: 'Проверяет деньги, оплату, БД, безопасность. Обязателен для Risk=3.',
    outputFormat: '<SECURITY>\n- риски:\n- блокеры:\n- рекомендации:\n</SECURITY>',
    allowedActions: ['security-аудит', 'проверка прав доступа'],
    forbiddenActions: ['правка продакшена без подтверждения'],
    riskLevel: 3,
    category: 'security',
    builtin: true
  },
  {
    id: 'Architect',
    name: 'Architect',
    description: 'Проектирует схему данных и API-контракты.',
    outputFormat: '<ARCHITECTURE>\nсхема: ...\nконтракты: ...\n</ARCHITECTURE>',
    allowedActions: ['схема БД', 'API-контракты', 'high-level дизайн'],
    forbiddenActions: ['детали реализации', 'деплой'],
    riskLevel: 2,
    category: 'server',
    builtin: true
  },
  {
    id: 'LogReader',
    name: 'LogReader',
    description: 'Читает серверные логи и выделяет ошибки.',
    outputFormat: '<LOGS>\n- ошибки:\n- контекст:\n- гипотезы:\n</LOGS>',
    allowedActions: ['чтение логов', 'выделение ошибок'],
    forbiddenActions: ['правка файлов', 'рестарт сервисов'],
    riskLevel: 2,
    category: 'server',
    builtin: true
  },
  {
    id: 'Deployer',
    name: 'Deployer',
    description: 'Готовит план деплоя с rollback.',
    outputFormat: '<DEPLOY_PLAN>\nшаги: ...\nrollback: ...\nчек-лист: ...\n</DEPLOY_PLAN>',
    allowedActions: ['план деплоя', 'rollback-план'],
    forbiddenActions: ['сам деплой', 'правка кода'],
    riskLevel: 3,
    category: 'server',
    builtin: true
  },
  {
    id: 'Reflector',
    name: 'Reflector',
    description: 'Рефлексия и улучшение ответа. Итоговая версия.',
    outputFormat: '<REFINED>\nфинальный ответ: ...\nулучшения: ...\n</REFINED>',
    allowedActions: ['рефлексия', 'улучшение формулировок'],
    forbiddenActions: ['выход за пределы задачи'],
    riskLevel: 1,
    category: 'meta',
    builtin: true
  }
];

// Карта для быстрого поиска по id.
export const ROLE_MAP: Record<string, RoleConfig> = Object.fromEntries(
  BUILTIN_ROLES.map((r) => [r.id, r])
);

// =============================================================================
// МОДЕЛИ — Приложение E.1 статьи + Local Ollama
// Цены: USD за 1М токенов. Метрики — из того же приложения.
// =============================================================================

export const BUILTIN_MODELS: ModelConfig[] = [
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o mini',
    provider: 'openai',
    tier: 'balanced',
    inputPricePerMTok: 0.15,
    outputPricePerMTok: 0.6,
    contextWindow: 128_000,
    enabled: false,
    benchmarks: { mmlu: 77.8, gpqa: 40.2, humaneval: 85.7, math: 66.09 },
    notes: 'OpenAI. Баланс цена/качество. См. E.1.'
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    provider: 'openai-compatible',
    tier: 'cheap',
    inputPricePerMTok: 0.1,
    outputPricePerMTok: 0.5,
    contextWindow: 200_000,
    enabled: false,
    benchmarks: { mmlu: 67.9, gpqa: 41.6, humaneval: 86.3, math: 65.9 },
    notes: 'Anthropic через OpenAI-совместимый API. См. E.1.'
  },
  {
    id: 'gemini-1.5-flash-latest',
    name: 'Gemini 1.5 Flash',
    provider: 'openai-compatible',
    tier: 'balanced',
    inputPricePerMTok: 0.15,
    outputPricePerMTok: 0.6,
    contextWindow: 1_000_000,
    enabled: false,
    benchmarks: { mmlu: 80.0, gpqa: 39.5, humaneval: 82.6, math: 74.4 },
    notes: 'Google. Сильный MATH. См. E.1.'
  },
  {
    id: 'Meta-Llama-3.1-70B-Instruct',
    name: 'Llama 3.1 70B Instruct',
    provider: 'openai-compatible',
    tier: 'strong',
    inputPricePerMTok: 0.2,
    outputPricePerMTok: 0.2,
    contextWindow: 128_000,
    enabled: false,
    benchmarks: { mmlu: 79.1, gpqa: 46.7, humaneval: 80.7, math: 60.3 },
    notes: 'Лучший GPQA в пуле. См. E.1.'
  },
  {
    id: 'deepseek-chat',
    name: 'DeepSeek Chat',
    provider: 'openai-compatible',
    tier: 'strong',
    inputPricePerMTok: 0.27,
    outputPricePerMTok: 1.1,
    contextWindow: 64_000,
    enabled: false,
    benchmarks: { mmlu: 88.5, gpqa: 59.1, humaneval: 88.4, math: 85.1 },
    notes: 'Лидер пула по MMLU/HumanEval/MATH. См. E.1.'
  },
  {
    id: 'local-llama-3.2-3b',
    name: 'Local Llama 3.2 3B (Ollama)',
    provider: 'ollama',
    tier: 'local-light',
    inputPricePerMTok: 0,
    outputPricePerMTok: 0,
    contextWindow: 8_192,
    enabled: false,
    notes: 'Локально через Ollama. Бесплатно, ECO-режим.'
  }
];

// =============================================================================
// ТОПОЛОГИИ — Приложение E.3 статьи + серверные варианты
// =============================================================================

export const BUILTIN_TOPOLOGIES: TopologyConfig[] = [
  {
    id: 'Single',
    name: 'Single / IO',
    description: 'Один агент, нет передачи сообщений. Самый дешёвый режим.',
    costImpact: 'low',
    whenToUse: 'Атомарные правки: текст, кнопка, переименование, простой конфиг.',
    paperReference: 'Приложение E.3 (IO)'
  },
  {
    id: 'CoT',
    name: 'Chain-of-Thought',
    description: 'Один агент с пошаговыми рассуждениями.',
    costImpact: 'low',
    whenToUse: 'Простые логические задачи, требующие явных шагов.',
    paperReference: 'Приложение E.3 (CoT)'
  },
  {
    id: 'Chain',
    name: 'Chain',
    description: 'Последовательная цепочка агентов, один передаёт другому. Стандарт для серверных правок.',
    costImpact: 'medium',
    whenToUse: 'API, фильтры, сортировка, валидация, тесты, серверные правки с handoff.',
    paperReference: 'Раздел 5.1, Таблица 1 (Chain)'
  },
  {
    id: 'Tree',
    name: 'Tree',
    description: 'Иерархия: один агент распределяет задачи подчинённым.',
    costImpact: 'high',
    whenToUse: 'Несколько независимых компонентов, большие фичи.',
    paperReference: 'Раздел 5.1 (Tree)'
  },
  {
    id: 'FullConnected',
    name: 'FullConnected / Complete Graph',
    description: 'Каждый агент видит ответы всех. Дорого, но полно.',
    costImpact: 'high',
    whenToUse: 'Сложные задачи с несколькими экспертизами (MATH, HumanEval hard).',
    paperReference: 'Раздел 5.1, Таблица 1 (FullConnected)'
  },
  {
    id: 'Debate',
    name: 'Debate / LLM-Debate',
    description: 'Аргументативный диалог между агентами с разными ролями.',
    costImpact: 'high',
    whenToUse: 'Спорные/неоднозначные вопросы, QUALITY + явный флаг «дебаты».',
    paperReference: 'Раздел 5.1, Таблица 1 (Debate)'
  },
  {
    id: 'Reflection',
    name: 'Reflection',
    description: 'Ответ → рефлексия → улучшенный ответ.',
    costImpact: 'medium',
    whenToUse: 'Пост-обработка, улучшение уже сгенерированного ответа.',
    paperReference: 'Раздел 5.1, Приложение E.3 (Reflection)'
  }
];

// =============================================================================
// CASE STUDY — Приложение C статьи (5 примеров)
// =============================================================================

export const BUILTIN_CASE_STUDIES: CaseStudyTemplate[] = [
  {
    id: 'cs-mmlu-bribe',
    benchmark: 'MMLU',
    title: 'MMLU: юридический вопрос о взятках',
    description: 'Спорный правовой вопрос, требует контекста и дебатов.',
    question: 'Является ли действие X взяткой в соответствии с законами штата Y?',
    chain: ['Historian', 'WikiSearcher', 'Critic', 'Reflector'],
    topology: 'Debate',
    notes: 'Источник: Приложение C, MMLU. Цепочка Historian → Wiki Searcher → Critic → Reflector, LLM-Debate.'
  },
  {
    id: 'cs-gsm8k-pies',
    benchmark: 'GSM8K',
    title: 'GSM8K: простые пироги',
    description: 'Арифметическая задача на 2-3 действия.',
    question: 'У фермера 15 пирогов, он продал 4, потом испёк ещё 7. Сколько осталось?',
    chain: ['MathAnalyst', 'Inspector', 'MathTeacher'],
    topology: 'Chain',
    notes: 'Источник: Приложение C, GSM8K. Цепочка MathSolver → Inspector → MathTeacher, Chain.'
  },
  {
    id: 'cs-math-geometry',
    benchmark: 'MATH',
    title: 'MATH: геометрия полуокружностей',
    description: 'Сложная геометрическая задача, требует нескольких экспертиз.',
    question: 'Найдите площадь заштрихованной области между двумя полуокружностями...',
    chain: ['MathAnalyst', 'AlgorithmDesigner', 'MathTeacher', 'Inspector', 'Reflector'],
    topology: 'FullConnected',
    notes: 'Источник: Приложение C, MATH. Цепочка MathAnalyst → Engineer → MathSolver → Scientist → MathTeacher → Mathematician, Complete Graph.'
  },
  {
    id: 'cs-humaneval-bored',
    benchmark: 'HumanEval',
    title: 'HumanEval: is_bored',
    description: 'Простая задача на Python, лёгкий фикс.',
    question: 'Реализовать функцию is_bored(S), которая считает скучные предложения.',
    chain: ['AlgorithmDesigner', 'BugFixer', 'TestAnalyst', 'Reflector'],
    topology: 'Reflection',
    notes: 'Источник: Приложение C, HumanEval (простой). Programming Expert → BugFixer → Test Analyst → Reflection.'
  },
  {
    id: 'cs-humaneval-collision',
    benchmark: 'HumanEval',
    title: 'HumanEval: car_race_collision (сложный)',
    description: 'Сложная задача на алгоритмы, требует полного пайплайна.',
    question: 'Реализовать функцию car_race_collision(n: int) -> List[int].',
    chain: ['BugFixer', 'AlgorithmDesigner', 'Implementer', 'TestAnalyst', 'Reflector'],
    topology: 'FullConnected',
    notes: 'Источник: Приложение C, HumanEval (сложный). BugFixer → PlanSolver → Programming Expert → Test Analyst → Algorithm Designer → Reflect Programmer → Complete Graph.'
  }
];

// =============================================================================
// ABLATION STUDY — Таблица 3 статьи
// =============================================================================

export interface AblationRow {
  variant: string;
  gsm8k: number;
  gsm8kCost: number;
  math: number;
  mathCost: number;
  note: string;
}

export const ABLATION_TABLE: AblationRow[] = [
  {
    variant: 'Vanilla MasRouter',
    gsm8k: 95.45,
    gsm8kCost: 1.59,
    math: 75.42,
    mathCost: 3.58,
    note: 'Базовая конфигурация. Все три контроллера Fθt, Fθr, Fθm включены.'
  },
  {
    variant: 'w/o Fθt (без collaboration determiner)',
    gsm8k: 93.84,
    gsm8kCost: 2.38,
    math: 72.77,
    mathCost: 4.48,
    note: 'Без Fθt: топология фиксирована, нет адаптации под задачу.'
  },
  {
    variant: 'w/o Fθr (без role allocator)',
    gsm8k: 94.7,
    gsm8kCost: 1.67,
    math: 73.01,
    mathCost: 3.63,
    note: 'Без Fθr: роли назначаются эвристикой, а не policy gradient.'
  },
  {
    variant: 'w/o Fθm (без LLM router) — САМОЕ БОЛЬШОЕ ПАДЕНИЕ',
    gsm8k: 93.36,
    gsm8kCost: 1.98,
    math: 71.08,
    mathCost: 4.16,
    note: 'Без Fθm: −2.09% GSM8K, −4.34% MATH. Выбор модели критичен.'
  },
  {
    variant: 'w/o C(·) (без multinomial cost term)',
    gsm8k: 95.63,
    gsm8kCost: 2.45,
    math: 75.18,
    mathCost: 5.07,
    note: 'Без стоимостного члена: +0.18% GSM8K, но +54.09% по стоимости. Экономичность теряется.'
  }
];

// =============================================================================
// SENSITIVITY — раздел 5.5 статьи
// =============================================================================

export const SENSITIVITY = {
  gamma: {
    description: 'Максимальное число агентов γ. γ=2 → 6 даёт +2.12% performance; γ>6 даёт ×1.5 cost без значимого прироста.',
    points: [
      { gamma: 2, performance: 88.5 },
      { gamma: 4, performance: 89.7 },
      { gamma: 6, performance: 90.62 },
      { gamma: 8, performance: 90.65 }
    ],
    recommendation: 'γ=6 — оптимум quality/cost в статье.'
  },
  lambda: {
    description: 'Trade-off λ между качеством и стоимостью. λ=5 → 25 снижает overhead на 17.78% при падении performance ~1.3%.',
    points: [
      { lambda: 5, mode: 'QUALITY', overheadReduction: 0 },
      { lambda: 15, mode: 'BALANCED', overheadReduction: 0.1 },
      { lambda: 25, mode: 'ECO', overheadReduction: 0.1778 }
    ],
    recommendation: 'QUALITY для денег/безопасности, ECO для UI-текстов.'
  }
};

// =============================================================================
// PLUG-IN — Таблица 2, MAD + MasRouter
// =============================================================================

export const PLUGIN_RESULTS = [
  { benchmark: 'MMLU', baseline: 81.5, baselineCost: 25.56, withMasRouter: 82.2, withMasRouterCost: 19.39 },
  { benchmark: 'HumanEval', baseline: 86.05, baselineCost: 1.248, withMasRouter: 87.6, withMasRouterCost: 1.096 },
  { benchmark: 'GSM8K', baseline: 94.6, baselineCost: 5.664, withMasRouter: 94.91, withMasRouterCost: 4.702 }
];

// =============================================================================
// MASROUTER BENCHMARKS — Таблица 1, последняя строка
// =============================================================================

export const MASROUTER_BENCHMARKS = {
  mmlu: 84.25,
  gsm8k: 95.45,
  math: 75.42,
  humaneval: 90.62,
  mbpp: 85.93
};

// =============================================================================
// ПРИМЕРЫ ЗАДАЧ — для кнопки "Вставить пример" в RouterPage
// =============================================================================

export const SAMPLE_TASKS = [
  {
    label: 'Простая: поменять текст кнопки',
    task: {
      taskDescription: 'Поменять текст кнопки "Найти туры" на "Подобрать тур" в шапке сайта.',
      taskType: 'code-edit' as const,
      complexity: 'Low' as const,
      riskFlags: { money: false, payment: false, discount: false, security: false, database: false, deploy: false, serverEdit: false }
    },
    expected: { risk: 1, costMode: 'ECO' as const, lambda: 25 as const, topology: 'Single' as Topology, agentCount: 1 }
  },
  {
    label: 'Средняя: добавить сортировку',
    task: {
      taskDescription: 'Добавить сортировку туров по дате вылета на странице каталога.',
      taskType: 'feature' as const,
      complexity: 'Medium' as const,
      riskFlags: { money: false, payment: false, discount: false, security: false, database: false, deploy: false, serverEdit: false }
    },
    expected: { risk: 2, costMode: 'BALANCED' as const, lambda: 15 as const, topology: 'Chain' as Topology, agentCount: 3 }
  },
  {
    label: 'Рискованная: баг в скидке',
    task: {
      taskDescription: 'Исправить баг в расчёте скидки на тур: при применении двух промокодов скидка считается неверно.',
      taskType: 'bug-fix' as const,
      complexity: 'High' as const,
      riskFlags: { money: true, payment: true, discount: true, security: false, database: false, deploy: false, serverEdit: false }
    },
    expected: { risk: 3, costMode: 'QUALITY' as const, lambda: 5 as const, topology: 'Chain' as Topology, agentCount: 4 }
  },
  {
    label: 'Серверная: проверить логи',
    task: {
      taskDescription: 'Проверить логи nginx на сервере и перезапустить сервис после подтверждения.',
      taskType: 'server-edit' as const,
      complexity: 'Medium' as const,
      riskFlags: { money: false, payment: false, discount: false, security: false, database: false, deploy: false, serverEdit: true }
    },
    expected: { risk: 2, costMode: 'BALANCED' as const, lambda: 15 as const, topology: 'Chain' as Topology, agentCount: 3 }
  },
  {
    label: 'Деплой: план новой версии',
    task: {
      taskDescription: 'Подготовить план деплоя новой версии туристического Telegram-бота.',
      taskType: 'deploy' as const,
      complexity: 'High' as const,
      riskFlags: { money: false, payment: false, discount: false, security: false, database: false, deploy: true, serverEdit: false }
    },
    expected: { risk: 3, costMode: 'QUALITY' as const, lambda: 5 as const, topology: 'Chain' as Topology, agentCount: 4 }
  }
];

// Дефолтные значения для каскада.
export const DEFAULT_TEMPERATURE = 0.7;
export const DEFAULT_MAX_TOKENS = 2048;

// Дефолтный input/output tokens для оценки стоимости одной итерации.
export const DEFAULT_ESTIMATED_TOKENS = {
  input: 1500,
  output: 800
};
