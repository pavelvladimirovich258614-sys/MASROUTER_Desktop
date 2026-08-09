// safeCommandRunner — whitelist + stoplist + подтверждение пользователя.
// Shell-команды ВЫКЛЮЧЕНЫ по умолчанию.

import { spawn } from 'node:child_process';
import { SHELL_STOPLIST, SHELL_WHITELIST } from '../../../shared/constants';

export interface RunOptions {
  command: string;
  args: string[];
  cwd?: string;
  timeoutMs?: number;
  userConfirmed: boolean;
}

export interface RunResult {
  ok: boolean;
  code: number;
  stdout: string;
  stderr: string;
  blocked?: boolean;
  blockReason?: string;
}

/**
 * Проверяет команду по stoplist (без выполнения).
 */
export function isBlocked(command: string, args: string[]): { blocked: boolean; reason?: string } {
  const full = [command, ...args].join(' ');
  for (const stop of SHELL_STOPLIST) {
    if (full.includes(stop)) {
      return { blocked: true, reason: `Команда содержит запрещённый шаблон: "${stop}"` };
    }
  }
  return { blocked: false };
}

export function isWhitelisted(command: string): boolean {
  return SHELL_WHITELIST.some((w) => w.startsWith(command + ' ') || w === command);
}

/**
 * Запускает команду. По умолчанию — только whitelist.
 * Если userConfirmed=false и команда не из whitelist — отказ.
 */
export function runSafe(opts: RunOptions): Promise<RunResult> {
  return new Promise((resolve) => {
    const block = isBlocked(opts.command, opts.args);
    if (block.blocked) {
      resolve({ ok: false, code: -1, stdout: '', stderr: '', blocked: true, blockReason: block.reason });
      return;
    }
    if (!isWhitelisted(opts.command) && !opts.userConfirmed) {
      resolve({
        ok: false,
        code: -1,
        stdout: '',
        stderr: '',
        blocked: true,
        blockReason: 'Команда не в whitelist. Требуется подтверждение пользователя.'
      });
      return;
    }
    const proc = spawn(opts.command, opts.args, {
      cwd: opts.cwd,
      shell: false,
      windowsHide: true
    });
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (d) => (stdout += d.toString()));
    proc.stderr.on('data', (d) => (stderr += d.toString()));
    const timer = setTimeout(() => {
      proc.kill();
      resolve({ ok: false, code: -2, stdout, stderr: 'TIMEOUT' });
    }, opts.timeoutMs ?? 30_000);
    proc.on('close', (code) => {
      clearTimeout(timer);
      resolve({ ok: code === 0, code: code ?? -1, stdout, stderr });
    });
  });
}
