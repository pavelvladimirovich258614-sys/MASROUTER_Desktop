// src/main/index.ts — точка входа Electron main process.

import { app, BrowserWindow, shell, Menu } from 'electron';
import * as path from 'node:path';
import { initStorage } from './storage';
import { registerIpc, setMainWindow } from './ipc';

// Отключаем аппаратное ускорение на старых GPU, чтобы избежать крашей.
if (process.platform === 'win32') {
  app.disableHardwareAcceleration();
}

let mainWindow: BrowserWindow | null = null;

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1366,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#05080A',
    show: false,
    autoHideMenuBar: true,
    title: 'MASROUTER Desktop',
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true
    }
  });

  win.once('ready-to-show', () => {
    win.show();
  });

  // Внешние ссылки — в системном браузере.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // CSP.
  win.webContents.session.webRequest.onHeadersReceived((details, cb) => {
    cb({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' http://127.0.0.1:11434 https://api.openai.com https://api.stepfun.com https://*.anthropic.com https://generativelanguage.googleapis.com"
        ]
      }
    });
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    win.loadURL(devUrl);
  } else {
    // Структура после сборки:
    //   dist/main/src/main/index.js
    //   dist/main/src/preload/index.js
    //   dist/renderer/index.html
    const indexPath = path.join(__dirname, '..', '..', '..', 'renderer', 'index.html');
    win.loadFile(indexPath);
  }

  return win;
}

app.whenReady().then(() => {
  initStorage();
  registerIpc();
  Menu.setApplicationMenu(null);
  mainWindow = createWindow();
  setMainWindow(mainWindow);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow();
      setMainWindow(mainWindow);
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Защита от навигации на чужие URL.
app.on('web-contents-created', (_e, contents) => {
  contents.on('will-navigate', (e, url) => {
    const parsed = new URL(url);
    if (parsed.origin !== 'file://' && !url.startsWith('http://localhost:5173')) {
      e.preventDefault();
    }
  });
});
