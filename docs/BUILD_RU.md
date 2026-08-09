# Сборка MASROUTER Desktop

## Требования

- **Node.js 20+** (проверено на 22.11)
- **npm 10+** (или pnpm/yarn)
- **Git** (для CI)

## Установка зависимостей

```bash
npm install
```

Это поставит:
- `electron@32` — десктоп-рантайм.
- `react@18` + `react-dom@18` + `react-router-dom@6` — UI.
- `vite@5` — сборщик renderer.
- `electron-builder@25` — сборка installer'ов.
- `electron-store@8` — персистентное хранилище.
- `zustand@4` — стейт-менеджер.
- `zod@3` — валидация.
- `typescript@5.5` + `vitest@2` + `eslint@8` + `prettier@3` — DX.

## Разработка

### `npm run dev`

Поднимает Vite dev server на `http://localhost:5173` и запускает Electron, который грузит страницу с dev-сервера. HMR работает для renderer. Изменения в main требуют перезапуска Electron (Ctrl+C, потом снова `npm run dev`).

### `npm run dev:renderer`

Только Vite. Откройте `http://localhost:5173` в браузере. Вне Electron IPC не работает, поэтому UI покажет заглушки. Полезно для отладки вёрстки.

### `npm run dev:electron`

Только Electron. Нужно, чтобы main был уже собран (`npm run build:main`).

## Сборка

### `npm run build`

Собирает:
- `dist/main/...` — main + preload (TypeScript → CommonJS).
- `dist/renderer/...` — renderer (Vite → статика).

### `npm run dist`

`npm run build` + `electron-builder` для текущей платформы.

### `npm run dist:win`

`npm run build` + `electron-builder --win`. Артефакты в `release/`:
- `MASROUTER Desktop Setup x.y.z.exe` (NSIS installer).
- `MASROUTER Desktop x.y.z portable.exe` (portable).
- `latest.yml`, `latest-blockmap.yml` (для автообновлений).

### `npm run dist:mac`

`electron-builder --mac`:
- `MASROUTER Desktop-x.y.z.dmg`.
- `MASROUTER Desktop-x.y.z-mac.zip`.

### `npm run dist:linux`

`electron-builder --linux`:
- `MASROUTER Desktop-x.y.z.AppImage`.
- `masrouter-desktop_x.y.z_amd64.deb`.

## Скрипты

- `scripts/build.bat` / `scripts/build.sh` — npm install + build + dist.
- `scripts/dev.bat` / `scripts/dev.sh` — запуск dev-режима.

## CI (GitHub Actions)

Файл `.github/workflows/build.yml`:

- **Push в main** — линт, typecheck, тесты, сборка renderer+main.
- **Тег v\*** — то же + сборка installer'ов + upload артефактов.
- **Matrix**: windows-latest, ubuntu-latest, macos-latest.

## Подводные камни

### `electron-store` импорт

`electron-store` v8 — CommonJS, импортируется через `require`. В нашем `tsconfig.main.json` `module: "CommonJS"`, всё работает. В renderer `electron-store` НЕ импортируется.

### SafeStorage

`safeStorage.encryptString` возвращает `Buffer`. Мы храним в виде base64. При decrypt — обратно. Если `safeStorage.isEncryptionAvailable()` возвращает `false` (например, в Linux без keyring), ключ НЕ сохраняется — выбрасываем ошибку.

### CSP

`Content-Security-Policy` разрешает:
- `default-src 'self'`
- `connect-src` для Ollama (http://127.0.0.1:11434), OpenAI, StepFun, Anthropic, Google.

Если добавляете нового провайдера — не забудьте обновить CSP в `src/main/index.ts`.

### Sandbox

`sandbox: true` в webPreferences. Preload при этом работает, но имеет ограниченный Node API. `ipcRenderer` доступен — этого достаточно для нашего моста.

### Vite + Electron

Vite dev сервер стартует на 5173. Electron берёт URL из `VITE_DEV_SERVER_URL` env. В production — грузит `dist/renderer/index.html`.
