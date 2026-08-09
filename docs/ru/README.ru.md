# MASROUTER Desktop — Русская документация

> **Локальное десктопное приложение, которое маршрутизирует вызовы LLM в
> Multi-Agent Systems по каскаду Fθ из статьи
> [arXiv:2502.11133](https://arxiv.org/abs/2502.11133) (Yanwei Yue et al.,
> 16 февраля 2025).**

![Баннер](../../assets/banner.png)

Английская версия этого README лежит в корне репозитория:
[README.md](../../README.md). Ветка `main` — основной код, ветка
`docs/ru` — это русскоязычная документация поверх того же кода.

---

## Содержание

1. [Что это и зачем](#что-это-и-зачем)
2. [Какие боли решает](#какие-боли-решает)
3. [Как это работает (схема)](#как-это-работает-схема)
4. [Каскад Fθt → Fθr → Fθm](#каскад-fθt--fθr--fθm)
5. [Архитектура приложения](#архитектура-приложения)
6. [Быстрый старт](#быстрый-старт)
7. [Подключение моделей](#подключение-моделей)
8. [Связка с Codex CLI](#связка-с-codex-cli)
9. [Безопасность](#безопасность)
10. [Сборка installer'а](#сборка-installerа)
11. [Структура проекта](#структура-проекта)
12. [Теория (для тех, кто хочет копнуть)](#теория-для-тех-кто-хочет-копнуть)
13. [Лицензия и благодарности](#лицензия-и-благодарности)

---

## Что это и зачем

MASROUTER Desktop — это локальное приложение под Windows / macOS / Linux,
которое превращает любую вашу задачу в готовый к запуску план работы
multi-agent системы: какую топологию выбрать, какие роли назначить агентам,
какие модели подключить. Считает всё это детерминированно, по явным
правилам из статьи [arXiv:2502.11133](https://arxiv.org/abs/2502.11133).

Ключевая идея простая: вместо того, чтобы каждый раз руками решать, какую
модель и какие роли использовать для очередной задачи, **один раз описать
правила** и дальше получать готовый маршрут за миллисекунды.

Подходит, если вы:

- Разрабатываете или интегрируете AI-агентов в свои продукты.
- Используете Codex / Claude Code / Cursor CLI и хотите заранее знать,
  какая модель и какие роли нужны для конкретной задачи.
- Хотите сэкономить на API без потери качества (или наоборот — поднять
  качество, когда задача того требует).
- Хотите **одну и ту же логику** маршрутизации и в своих продуктах, и в
  локальных скриптах.

---

## Какие боли решает

Когда у вас несколько LLM и несколько агентов, в работе появляются четыре
повторяющиеся боли. MASROUTER закрывает каждую из них явно.

### 1. Утечка денег

**Боль.** Задача «поменять текст кнопки» уходит в 5-агентный Chain на
GPT-4o и стоит $0.20, хотя один вызов на Llama 3.2 3B через Ollama
решил бы её за $0.

**Решение.** Risk Score → Cost Mode. Атомарная правка = Risk = 1 = режим
ECO = λ = 25 = cheap-tier модель = 1 агент. Стоимость: $0.

### 2. Утечка качества

**Боль.** Задача, которая трогает деньги, БД или безопасность, уходит в
дешёвую модель без ревью. Неправильный ответ в коде оплаты — это
production incident.

**Решение.** Любой флаг `money / payment / discount / security / database
/ deploy` поднимает Risk Score до 3. Risk = 3 → QUALITY → λ = 5 →
strong-tier модель → Reviewer + SecurityReviewer обязательно. Алгоритм
нельзя обойти — это правило в коде, не в голове.

### 3. Усталость от решений

**Боль.** Каждый разработчик в команде каждый раз сам решает, какую
модель и какие роли использовать. Разные люди выбирают по-разному для
одной и той же задачи. Получается зоопарк.

**Решение.** `calculateRoute(task) → RouteDecision` — одна функция, один
контракт. Код, тесты, ревью — всё вокруг неё. Любой участник команды
получает одинаковый результат.

### 4. Дыра в аудите

**Боль.** Когда что-то идёт не так, нельзя указать на алгоритм, который
принял решение о маршрутизации. Решение живёт в голове того, кто
писал задачу.

**Решение.** Каждое решение содержит `reason`, `cascade` (что выбрал
каждый из Fθt / Fθr / Fθm), `warnings`, `topologicalMultiplier Γ(k+1)`.
Всё это пишется в логи, в Prompt Lab, в `task.md`. Полный audit trail
из коробки.

---

## Как это работает (схема)

Весь маршрут — это один детерминированный каскад из трёх контроллеров,
прямо из статьи:

```
Q (задача) ──Fθt──▶ T (топология) ──Fθr──▶ {R_i} (роли) ──Fθm──▶ {M_i} (модели)
```

В коде это `src/main/routerEngine.ts` — функция `calculateRoute(input)`.
LLM внутри роутера не используется, только явные правила. Это держит
маршрутизацию быстрой, предсказуемой и тестируемой.

### Полная схема flow

```
┌──────────────────────────────────────────────────────────────────────┐
│  Пользователь вводит задачу в RouterPage                             │
│  (описание, тип, сложность, флаги риска)                             │
└──────────────────────────────────┬───────────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│  ipcMain → ROUTER_CALCULATE                                          │
│  Zod-валидация входа (shared/schemas.ts)                             │
└──────────────────────────────────┬───────────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│  routerEngine.ts: каскад Fθ = Fθm ∘ Fθr ∘ Fθt                        │
│  ─────────────────────────────────────────────────                   │
│  1. computeRiskScore(input)        → 1 / 2 / 3                       │
│  2. computeCostMode(input, risk)    → ECO / BALANCED / QUALITY        │
│  3. determineTopology(input, ...)   → Single / Chain / ...            │
│  4. allocateRoles(input, ...)       → [Analyst, Implementer, ...]    │
│  5. allocateModels(chain, ...)      → [{role, model}, ...]            │
│  6. buildFinalPrompt(...)           → Final Prompt string            │
│  7. estimateCost(steps, tokens)     → $X.XXXX                         │
│  8. topologicalMultiplier           → Γ(k+1)                          │
└──────────────────────────────────┬───────────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│  RouteDecision:                                                       │
│  { riskScore, costMode, lambda, topology, agentCount,                 │
│    cascade: [{stage, selected, rationale}],                           │
│    chain: [{order, role, model, outputFormat}, ...],                  │
│    stopConditions, safetyChecklist, finalPrompt,                       │
│    estimatedCost, warnings, delta, gamma, topologicalMultiplier }     │
└──────────────────────────────────┬───────────────────────────────────┘
                                   │
                ┌──────────────────┼──────────────────┐
                ▼                  ▼                  ▼
        ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
        │  UI-карточка │   │  Prompt Lab  │   │  Codex CLI   │
        │  с cascade   │   │  история     │   │  task.md +   │
        │  diagram     │   │              │   │  команда     │
        └──────────────┘   └──────────────┘   └──────────────┘
                │
                ├─ Копировать в буфер
                ├─ Отправить в LLM (Ollama/OpenAI/StepFun/...)
                └─ Открыть в Codex
```

### Схема Risk → Cost Mode

```
                ┌──────────────────────┐
                │  Вход: задача + risk │
                │  flags + complexity  │
                └──────────┬───────────┘
                           │
                           ▼
        ┌──────────────────────────────────┐
        │  Есть money/payment/discount/   │
        │  security/database/deploy?      │
        └──────┬───────────────────┬──────┘
               │ да                │ нет
               ▼                   ▼
        ┌────────────┐    ┌─────────────────┐
        │ Risk = 3   │    │ complexity=High?│
        │ → QUALITY  │    ├─────┬───────────┤
        │   λ = 5    │    │ да  │ нет       │
        │   strong   │    │ ▼   │ ▼         │
        │   Reviewer │    │R=3  │R=Med?     │
        │   + SecRev │    │QUAL │ ├─да→R=2  │
        └────────────┘    │    │ ├─нет→R=1 │
                          └────┘ └────┬─────┘
                                       │
                                       ▼
                              ┌─────────────────┐
                              │ Cost Mode:      │
                              │ Risk=3 →QUALITY │
                              │ Risk=2 →BALANCED│
                              │ Risk=1,Low →ECO │
                              └─────────────────┘
```

---

## Каскад Fθt → Fθr → Fθm

Три контроллера из раздела 4 статьи реализованы в
`src/main/routerEngine.ts` как набор детерминированных правил. Правила
одни и те же, что в промпте X60 (секция 5), что в статье.

### Fθt — выбор топологии

Решение принимается по типу задачи, риску и сложности:

| Условие | Топология |
|---|---|
| Risk = 1, complexity = Low, нет критических флагов | `Single` |
| Тип: server-edit / code-edit / refactor / test / feature | `Chain` |
| Тип: deploy | `Chain` |
| Тип: analysis + несколько компонентов | `Tree` |
| Упоминание «дебаты» + QUALITY | `Debate` |
| Упоминание «улучшить / отразить» | `Reflection` |
| complexity = High | `CoT` |
| По умолчанию | `Chain` |

### Fθr — выбор ролей

| Условие | Цепочка |
|---|---|
| ECO + Risk = 1 | `[Implementer]` |
| Серверный debug | `[LogReader, Analyst, Implementer, Tester]` |
| Deploy | `[LogReader, Architect, Deployer, Reviewer]` |
| Database / Payment / Discount | `[Analyst, Implementer, SecurityReviewer, Reviewer]` |
| Security | `[Analyst, SecurityReviewer, Reviewer]` |
| QUALITY (дефолт) | `[Analyst, Implementer, Reviewer, SecurityReviewer]` |
| BALANCED | `[Analyst, Implementer, Tester]` |

### Fθm — выбор моделей

| Режим | Тир | Fallback |
|---|---|---|
| QUALITY | `strong` | `balanced` |
| BALANCED | `balanced` | `cheap` |
| ECO | `cheap` | `local-light` → `balanced` |

Каждой роли с `riskLevel = 3` (Reviewer, SecurityReviewer) всегда
назначается `strong`-tier модель, если такая есть.

---

## Архитектура приложения

```
MASROUTER_Desktop/
├── electron.cjs               # Entry Electron
├── package.json
├── tsconfig.json              # Renderer + tests
├── tsconfig.main.json         # Main + preload
├── vite.config.ts
├── electron-builder.yml       # Конфиг installer'ов
├── assets/                    # Иконки + баннер
├── shared/                    # Типы и предзаполненные данные
│   ├── types.ts
│   ├── constants.ts
│   ├── schemas.ts
│   └── masrouterData.ts       # 18 ролей, 6 моделей, 7 топологий, 5 case study
├── src/
│   ├── main/                  # Electron main process
│   │   ├── index.ts
│   │   ├── ipc.ts
│   │   ├── storage.ts         # electron-store + safeStorage
│   │   ├── routerEngine.ts    # Каскад Fθt → Fθr → Fθm
│   │   ├── promptBuilder.ts
│   │   ├── costEstimator.ts
│   │   ├── gamma.ts           # Lanczos approximation Γ(z)
│   │   ├── codex/codexBridge.ts
│   │   ├── shell/safeCommandRunner.ts
│   │   └── providers/         # Ollama, OpenAI, MiniMax, StepFun, Custom REST
│   ├── preload/
│   │   └── index.ts           # contextBridge
│   └── renderer/              # React + Vite
│       ├── App.tsx
│       ├── pages/             # 14 страниц
│       ├── components/
│       ├── store/
│       ├── lib/
│       ├── styles/
│       └── help/helpArticles.ts
├── tests/                     # 46 Vitest тестов
├── docs/                      # Документация
│   └── diagrams/cascade.md
└── .github/
    ├── workflows/build.yml    # CI
    ├── ISSUE_TEMPLATE/
    └── PULL_REQUEST_TEMPLATE.md
```

---

## Быстрый старт

```bash
# Клонировать
git clone https://github.com/pavelvladimirovich258614-sys/MASROUTER_Desktop.git
cd MASROUTER_Desktop

# Установить зависимости
npm install

# Запустить в dev-режиме (Vite + Electron)
npm run dev
```

`npm run dev` поднимает Vite dev server и запускает Electron. Окно
откроется автоматически.

### Альтернативно — собрать и установить

```bash
npm run build         # собрать renderer + main
npm run dist:win      # собрать NSIS installer (Windows)
```

После `npm run dist:win` в `release/` появится:

- `MASROUTER Desktop Setup x.y.z.exe` — установщик
- `MASROUTER Desktop x.y.z portable.exe` — portable

---

## Подключение моделей

### Ollama (рекомендуется для старта)

Бесплатно, локально, без API-ключа.

```bash
# 1. Установить Ollama
# https://ollama.com/download

# 2. Запустить
ollama serve

# 3. Скачать модель
ollama pull llama3.2:3b
```

В MASROUTER: **Модели** → Провайдер **Ollama Local** → включить → **✓ Тест**
→ в таблице Модели включить **Local Llama 3.2 3B (Ollama)**.

### OpenAI

1. Получить ключ на https://platform.openai.com
2. **Модели** → **OpenAI** → **+ Установить** ключ
3. Включить провайдера, **✓ Тест**
4. В Моделях включить `gpt-4o-mini`

### OpenAI-compatible (Claude, Gemini, MiniMax, StepFun)

Указать `Base URL` и `API Key` в Моделях. Для StepFun ключ берётся на
https://platform.stepfun.com.

### Custom REST

Для нестандартных API: URL, method, headers, шаблон тела, response path.

Подробнее: [`docs/MODELS_SETUP_RU.md`](../MODELS_SETUP_RU.md) (на ветке
`main`).

---

## Связка с Codex CLI

1. Установить Codex CLI: `npm i -g @openai/codex` (или аналог).
2. Открыть **Codex CLI** в боковом меню.
3. Выбрать профиль, указать Project Path, Git Branch.
4. Рассчитать маршрут в **Маршрутизаторе**.
5. **📝 Создать task.md** — файл сохранится в Project Path.
6. **📋 Скопировать команду Codex** — буфер обмена получит готовую
   команду с подставленными переменными.

Шаблон по умолчанию:

```
codex --prompt-file "{task_file}" --model "{model}" --cd "{project_path}"
```

Доступные переменные: `{task_file}`, `{prompt}`, `{model}`,
`{project_path}`, `{git_branch}`, `{server_host}`, `{ssh_user}`, `{ssh_key}`.

Подробнее: [`docs/CODEX_INTEGRATION_RU.md`](../CODEX_INTEGRATION_RU.md).

---

## Безопасность

- **Electron**: `contextIsolation: true`, `nodeIntegration: false`,
  `sandbox: true`. Renderer не имеет доступа к Node и файловой системе.
- **API-ключи**: только в `safeStorage` (зашифрованы ОС). В UI — только
  маска.
- **CSP**: разрешены `self` и явно перечисленные домены LLM-провайдеров.
- **Shell-команды**: выключены по умолчанию. Включение в
  **Settings → Безопасность** открывает whitelist (`git status`, `git
  log`, `git branch`, `ssh -i <key> ...`).
- **Stoplist**: `rm -rf`, `sudo`, `reboot`, `shutdown`, `mkfs`, `dd if=`,
  `chmod 777 /`, `curl | sh`, `wget | sh` — никогда не выполняются.
- **Нет телеметрии.** Никаких analytics, никаких crash reporting, никаких
  удалённых вызовов кроме тех, что вы сами делаете к LLM-провайдерам.

---

## Сборка installer'а

```bash
npm run build:icons   # сгенерировать иконки из SVG
npm run build         # собрать renderer + main
npm run dist:win      # Windows (NSIS + portable)
npm run dist:mac      # macOS (DMG + ZIP)
npm run dist:linux    # Linux (AppImage + .deb)
```

Артефакты в `release/`. Размер NSIS installer'а — около 78 МБ (это
норма для Electron-приложения, внутри Chromium 32 + Node 20).

Подробнее: [`docs/BUILD_RU.md`](../BUILD_RU.md).

---

## Структура проекта

Полная структура приведена в английском [`README.md`](../../README.md) в
разделе Project Layout. Здесь — короткая версия:

- **`shared/`** — общие типы, константы, Zod-схемы, предзаполненные
  данные из статьи.
- **`src/main/`** — Electron main process: окно, IPC, хранилище, роутер,
  провайдеры LLM, Codex bridge, shell runner.
- **`src/preload/`** — единственный мост между renderer и main.
- **`src/renderer/`** — React UI: 14 страниц, компоненты, store, стили,
  справка.
- **`tests/`** — 46 Vitest тестов для ядра (gamma, routerEngine,
  promptBuilder, costEstimator).
- **`docs/`** — документация на русском и английском.

---

## Теория (для тех, кто хочет копнуть)

Полное объяснение каскада, формул (12) и (13), ablation study, sensitivity
и plug-in результатов — в [`docs/MASROUTER_THEORY_RU.md`](../MASROUTER_THEORY_RU.md)
(ветка `main`).

Ключевые идеи в двух абзацах.

**Multi-agent systems (MAS)** дают лучшее качество, чем один LLM, но
стоит дороже: каждый вызов каждого агента — это токены. Перед
разработчиком стоит задача: для каждой задачи выбрать архитектуру MAS
(топологию, роли, модели), чтобы балансировать качество и стоимость.

**MasRouter** решает эту задачу policy-gradient'ом, обученным на пяти
бенчмарках. Обученная модель выбирает топологию, цепочку ролей и модели
для каждой роли. Авторы показывают (Таблица 3), что без Fθm — самого
компонента, отвечающего за выбор LLM — падение performance самое большое:
−2.09% на GSM8K, −4.34% на MATH. То есть **выбор модели — самое
критичное звено** во всей цепочке.

MASROUTER Desktop берёт ту же каскадную структуру, но заменяет
обученные policy на явные правила. Trade-off: −explainability, +никакого
обучения, +полная предсказуемость, +легко тестировать. Для большей части
задач (правка кода, серверные правки, деплой, документация) этого
достаточно. Если нужны точные цифры бенчмарков — обучите оригинальный
policy из репозитория статьи и подключите как «LLM-советник» в
`routerEngine.ts`.

---

## Лицензия и благодарности

- **Код**: [MIT](../../LICENSE).
- **Статья**: Yanwei Yue et al., «MasRouter: Learning to Route LLMs for
  Multi-Agent Systems», arXiv:2502.11133, 16 февраля 2025.
  [https://arxiv.org/abs/2502.11133](https://arxiv.org/abs/2502.11133).
- **Оригинальный код авторов**:
  [https://github.com/yanweiyue/masrouter](https://github.com/yanweiyue/masrouter).

Этот проект — независимая реализация каскада из статьи, не форк
оригинального кода. Правила маршрутизации взяты из текста статьи и
сопоставлены с промптом X60 (мета-описание).

Copyright (c) 2026 Pavel Novopoltsev и контрибьюторы MASROUTER.
