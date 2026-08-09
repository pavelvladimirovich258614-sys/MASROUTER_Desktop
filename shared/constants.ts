// Численные константы из раздела 5.1 статьи arXiv:2502.11133.
// НЕ МЕНЯТЬ — это параметры из оригинальной работы MasRouter.

export const MASROUTER_CONSTANTS = {
  // learning rate
  ALPHA: 0.01,
  // temperature policy gradient
  TAU: 1,
  // максимальное число агентов
  GAMMA: 6,
  // λ ∈ {5, 15, 25} — trade-off quality vs cost
  LAMBDAS: { ECO: 25, BALANCED: 15, QUALITY: 5 } as const,
  // число итераций policy gradient
  K_ITERATIONS: [5, 10] as const,
  // температура по умолчанию
  T_DEFAULT: 1.0
} as const;

export const APP_VERSION = '0.1.0';
export const APP_NAME = 'MASROUTER Desktop';
export const APP_DESCRIPTION = 'Multi-Agent System Router — десктоп';

// Топики для IPC.
export const IPC = {
  // engine
  ROUTER_CALCULATE: 'router:calculate',
  ROUTER_PING: 'router:ping',
  // providers
  PROVIDER_TEST: 'provider:test',
  PROVIDER_CHAT: 'provider:chat',
  PROVIDER_LIST: 'provider:list',
  PROVIDER_LIST_MODELS: 'provider:listModels',
  // storage
  STORAGE_GET: 'storage:get',
  STORAGE_SET: 'storage:set',
  STORAGE_EXPORT: 'storage:export',
  STORAGE_IMPORT: 'storage:import',
  STORAGE_RESET: 'storage:reset',
  // codex
  CODEX_CREATE_TASK: 'codex:createTask',
  CODEX_COPY_COMMAND: 'codex:copyCommand',
  CODEX_COPY_SSH: 'codex:copySsh',
  // shell
  SHELL_RUN: 'shell:run',
  // system
  SYSTEM_OPEN_EXTERNAL: 'system:openExternal',
  SYSTEM_GET_VERSION: 'system:getVersion',
  SYSTEM_GET_PLATFORM: 'system:getPlatform',
  // logs
  LOGS_LIST: 'logs:list',
  LOGS_CLEAR: 'logs:clear',
  // app
  APP_BOOTSTRAP: 'app:bootstrap',
  APP_OPEN_PATH: 'app:openPath'
} as const;

// Дефолтные значения шаблонов Codex CLI.
export const DEFAULT_CODEX_TEMPLATE =
  'codex --prompt-file "{task_file}" --model "{model}" --cd "{project_path}"';

// Дефолтный список стоп-условий для серверных правок.
export const DEFAULT_STOP_CONDITIONS = [
  'если нужна миграция БД',
  'если нужно менять оплату',
  'если нужно перезапускать прод',
  'если нужно менять деплой',
  'если появляется риск сломать данные',
  'если требуется менять переменные окружения'
];

// Дефолтный чеклист безопасности для серверной правки.
export const DEFAULT_SAFETY_CHECKLIST = [
  'сделан backup / snapshot',
  'создана отдельная git-ветка',
  'правка атомарна и обратима',
  'есть команда проверки (test / smoke)',
  'есть rollback-план',
  'изменения проверены на staging'
];

// Whitelist команд shell.
export const SHELL_WHITELIST = [
  'ssh -p {port} -i {key} {user}@{host} "cd {path} && git status --short && git branch --show-current"',
  'ssh -p {port} -i {key} {user}@{host} "cd {path} && tail -n 200 {log_file}"',
  'git status --short',
  'git log --oneline -n 20',
  'git branch --show-current',
  'node --version',
  'npm --version'
];

// Stoplist — опасные команды никогда не выполняются.
export const SHELL_STOPLIST = [
  'rm -rf',
  'sudo',
  'reboot',
  'shutdown',
  'mkfs',
  'dd if=',
  'chmod 777 /',
  'curl | sh',
  'wget | sh',
  ':(){:|:&};:'
];
