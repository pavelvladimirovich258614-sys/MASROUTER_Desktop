# Интеграция с Codex CLI

Codex CLI — это CLI-инструмент для выполнения AI-задач из терминала. MASROUTER Desktop генерирует для него готовые артефакты: `task.md` и команду с подставленными переменными.

## Установка Codex CLI

```bash
# Через npm (пример, замените на актуальный пакет)
npm i -g @openai/codex

# Проверка
codex --version
```

Если вы используете другой CLI (Claude Code, Cursor CLI, свой) — настройте шаблон команды под него.

## Настройка в MASROUTER

1. Откройте **Codex CLI** в боковом меню.
2. Выберите профиль Codex (по умолчанию `codex-default`).
3. Укажите **Project Path** — папка, в которой будет создан `task.md`.
4. Укажите **Git Branch** — ветка, в которой идёт работа.
5. Опционально: выберите **серверный профиль** для SSH-контекста.

## Генерация артефактов

### task.md

1. Рассчитайте маршрут в **Маршрутизаторе**.
2. В **Codex CLI** нажмите **📝 Создать task.md**.
3. Файл сохранится в `Project Path/task.md` со всем контекстом: Router Decision, Cascade, Chain Plan, Stop Conditions, Server Safety Checklist, Final Prompt.

### Команда Codex

1. После создания `task.md` нажмите **📋 Скопировать команду Codex**.
2. В буфер обмена уйдёт команда с подставленными `{task_file}`, `{prompt}`, `{model}`, `{project_path}`.

### SSH-команда

1. Создайте **серверный профиль** (host, port, user, ssh key path, project path, branch).
2. В **Codex CLI** выберите серверный профиль.
3. Нажмите **📋 Скопировать SSH команду** — уйдёт whitelist-команда `ssh -p {port} -i {key} {user}@{host} "cd {path} && git status --short && git branch --show-current"`.

## Переменные в шаблоне команды

| Переменная | Описание |
|---|---|
| `{task_file}` | Путь к сгенерированному `task.md` |
| `{prompt}` | Полный Final Prompt (escape-нут в JSON) |
| `{model}` | ID модели из первого шага цепочки |
| `{project_path}` | Project Path |
| `{git_branch}` | Git Branch |
| `{server_host}` | Хост серверного профиля |
| `{ssh_user}` | Пользователь SSH |
| `{ssh_key}` | Путь к SSH-ключу |

## Шаблон по умолчанию

```
codex --prompt-file "{task_file}" --model "{model}" --cd "{project_path}"
```

Можно усложнить:

```
codex --prompt-file "{task_file}" --model "{model}" --cd "{project_path}" --git-branch "{git_branch}" --verbose
```

## Безопасность

- Shell-команды по умолчанию **ВЫКЛЮЧЕНЫ**. Включение в **Settings → Безопасность**.
- Whitelist: только git status, git log, ssh до сервера, node/npm --version.
- Stoplist: `rm -rf`, `sudo`, `reboot`, `dd`, `mkfs`, `chmod 777` и т.д.
- Любая команда без whitelist требует подтверждения пользователя.

## Серверные профили

Создайте через **Codex CLI** → таблица «Серверные профили» → **+ Добавить**.

Поля:
- **Name** — отображаемое имя.
- **Host** — например, `203.0.113.42`.
- **Port** — обычно `22`.
- **User** — например, `deploy`.
- **SSH Key Path** — абсолютный путь к `~/.ssh/id_ed25519`.
- **Project Path** — путь к проекту на сервере.
- **Git Branch** — рабочая ветка.

## Пример полного flow

1. Пользователь создаёт задачу: «Исправить баг в расчёте скидки».
2. Маршрутизатор выдаёт: `Risk=3, Cost Mode=QUALITY, λ=5, Topology=Chain, 4 агента`.
3. На странице **Codex CLI** нажимает «Создать task.md» — файл сохраняется.
4. Нажимает «Скопировать команду» — буфер обмена содержит:
   ```
   codex --prompt-file "D:\my-project\task.md" --model "deepseek-chat" --cd "D:\my-project"
   ```
5. Вставляет в терминал, запускает Codex.
6. Codex читает task.md, выполняет цепочку Analyst → Implementer → Reviewer → SecurityReviewer.
7. Reviewer выдаёт APPROVED/REJECTED. Если REJECTED — пользователь правит task.md и повторяет.
