// scripts/dev.mjs — параллельный запуск vite dev server + electron.
// Нужен concurrently? Нет, используем простой подход с child_process.

import { spawn } from 'node:child_process';
import { setTimeout as wait } from 'node:timers/promises';

const VITE_PORT = 5173;

function startVite() {
  const p = spawn('npx', ['vite', '--port', String(VITE_PORT), '--strictPort'], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, BROWSER: 'none' }
  });
  return p;
}

function startElectron() {
  const p = spawn('npx', ['electron', '.'], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, VITE_DEV_SERVER_URL: `http://localhost:${VITE_PORT}` }
  });
  return p;
}

async function waitForVite() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://localhost:${VITE_PORT}`);
      if (r.ok || r.status < 500) return true;
    } catch {
      // ignore
    }
    await wait(500);
  }
  return false;
}

const vite = startVite();
const ready = await waitForVite();
if (!ready) {
  console.error('[dev] Vite did not start in 30s');
  vite.kill();
  process.exit(1);
}
console.log(`[dev] Vite up on http://localhost:${VITE_PORT}`);

const electron = startElectron();

electron.on('close', () => {
  vite.kill();
  process.exit(0);
});

process.on('SIGINT', () => {
  electron.kill();
  vite.kill();
  process.exit(0);
});
