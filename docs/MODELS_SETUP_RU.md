# Настройка моделей

## Ollama (рекомендуется для старта)

Локально, бесплатно, без API-ключа.

```bash
# 1. Установите Ollama
# https://ollama.com/download

# 2. Запустите сервер
ollama serve

# 3. Скачайте модель
ollama pull llama3.2:3b
# или: ollama pull qwen2.5:3b
# или: ollama pull mistral:7b
```

В MASROUTER:

1. **Модели** → Провайдер **Ollama Local** (включён по умолчанию).
2. Убедитесь, что чекбокс «Включён» активен.
3. Нажмите **✓ Тест** — приложение обратится к `http://127.0.0.1:11434/api/tags` и проверит наличие модели.
4. В таблице **Модели** включите **Local Llama 3.2 3B (Ollama)**.

Если видите ошибку «Ollama недоступен» — запустите `ollama serve` в отдельном терминале.

## OpenAI

1. Зарегистрируйтесь на https://platform.openai.com.
2. Создайте API-ключ в https://platform.openai.com/api-keys.
3. В MASROUTER: **Модели** → Провайдер **OpenAI** → **+ Установить** в столбце API Key.
4. Введите ключ. Он зашифруется через `safeStorage` и сохранится локально.
5. Включите провайдера, нажмите **✓ Тест**.
6. В Моделях включите `gpt-4o-mini` (или другую).

## OpenAI-compatible (Claude, Gemini, локальные прокси)

1. **Settings** → отредактируйте провайдера или добавьте нового.
2. Укажите **Base URL**:
   - Anthropic (через прокси): например, `https://your-proxy.com/v1`.
   - Google Gemini: `https://generativelanguage.googleapis.com/v1beta/openai`.
   - Локальный vLLM: `http://localhost:8000/v1`.
3. Введите **API Key** (или оставьте пустым для локального).
4. Включите и протестируйте.

## MiniMax

OpenAI-compatible шаблон. Base URL и API-ключ зависят от провайдера — см. документацию MiniMax.

## StepFun

1. Зарегистрируйтесь на https://platform.stepfun.com.
2. Создайте API-ключ.
3. **Модели** → Провайдер **StepFun** → введите ключ → включите → тест.

## Custom REST

Для нестандартных API:

1. **Settings** → добавьте провайдера kind=`custom`.
2. Укажите:
   - **URL**: полный endpoint.
   - **Method**: POST/GET.
   - **Headers**: JSON-словарь.
   - **Body Template**: с переменными `{model}`, `{messages}`, `{temperature}`, `{maxTokens}`.
   - **Response Path**: путь к content в JSON-ответе через точку (например, `data.choices.0.message.content`).
3. Включите и протестируйте.

## Цены моделей (Приложение E.1)

| Модель | in/1M | out/1M |
|---|---|---|
| gpt-4o-mini | $0.15 | $0.60 |
| claude-3-5-haiku | $0.10 | $0.50 |
| gemini-1.5-flash | $0.15 | $0.60 |
| llama-3.1-70b | $0.20 | $0.20 |
| deepseek-chat | $0.27 | $1.10 |
| local-ollama | $0 | $0 |

Local модель → 0 в расчёте стоимости.

## Метрики моделей (Приложение E.1)

| Модель | MMLU | GPQA | HumanEval | MATH |
|---|---|---|---|---|
| GPT-4o mini | 77.8 | 40.2 | 85.7 | 66.09 |
| Claude 3.5 Haiku | 67.9 | 41.6 | 86.3 | 65.9 |
| Gemini 1.5 Flash | 80.0 | 39.5 | 82.6 | 74.4 |
| Llama 3.1 70B | 79.1 | 46.7 | 80.7 | 60.3 |
| DeepSeek Chat | 88.5 | 59.1 | 88.4 | 85.1 |
| Local Llama 3.2 3B | — | — | — | — |

Эти метрики НЕ используются движком напрямую (он rule-based), но отображаются в UI для справки.
