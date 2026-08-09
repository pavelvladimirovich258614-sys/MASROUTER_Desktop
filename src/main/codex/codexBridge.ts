// codexBridge — генератор task.md и команды Codex CLI.

import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { DEFAULT_CODEX_TEMPLATE } from '../../../shared/constants';
import type { CodexProfile, RouteDecision, ServerProfile } from '../../../shared/types';

export interface CreateTaskInput {
  decision: RouteDecision;
  profile: CodexProfile;
  serverProfile?: ServerProfile;
  projectPath: string;
  gitBranch: string;
}

/**
 * Создаёт task.md в указанной папке и возвращает полный путь.
 */
export async function createTaskFile(input: CreateTaskInput): Promise<string> {
  const dir = input.projectPath || process.cwd();
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, 'task.md');
  const content = renderTaskMd(input);
  await fs.writeFile(filePath, content, 'utf8');
  return filePath;
}

export function renderTaskMd(input: CreateTaskInput): string {
  const d = input.decision;
  const sp = input.serverProfile;
  const lines: string[] = [];
  lines.push(`# Task`);
  lines.push(``);
  lines.push(`## Router Decision`);
  lines.push(`- **Risk Score**: ${d.riskScore}/3`);
  lines.push(`- **Cost Mode**: ${d.costMode} (λ=${d.lambda})`);
  lines.push(`- **Topology**: ${d.topology}`);
  lines.push(`- **Agent Count**: ${d.agentCount}`);
  lines.push(`- **Topological Multiplier Γ(k+1)**: ${d.topologicalMultiplier.toFixed(4)}`);
  lines.push(``);
  lines.push(`### Cascade`);
  d.cascade.forEach((c) => lines.push(`- **${c.stage}** → \`${c.selected}\` — ${c.rationale}`));
  lines.push(``);
  lines.push(`### Chain Plan`);
  d.chain.forEach((s) => {
    lines.push(`${s.order}. **${s.role.name}** → \`${s.model.name}\` (${s.model.tier})`);
  });
  lines.push(``);
  if (d.stopConditions.length) {
    lines.push(`### Stop Conditions`);
    d.stopConditions.forEach((s) => lines.push(`- ${s}`));
    lines.push(``);
  }
  if (d.safetyChecklist.length) {
    lines.push(`### Server Safety Checklist`);
    d.safetyChecklist.forEach((s) => lines.push(`- [ ] ${s}`));
    lines.push(``);
  }
  if (sp) {
    lines.push(`### Server Context`);
    lines.push(`- host: ${sp.host}:${sp.port}`);
    lines.push(`- user: ${sp.user}`);
    lines.push(`- project: ${sp.projectPath}`);
    lines.push(`- branch: ${sp.gitBranch}`);
    lines.push(``);
  }
  lines.push(`## Final Prompt`);
  lines.push(``);
  lines.push('```');
  lines.push(d.finalPrompt);
  lines.push('```');
  lines.push(``);
  return lines.join('\n');
}

/**
 * Сборка команды Codex CLI с подстановкой переменных.
 */
export function buildCodexCommand(
  template: string,
  vars: { task_file: string; prompt: string; model: string; project_path: string; git_branch: string; server_host?: string; ssh_user?: string; ssh_key?: string }
): string {
  let cmd = template || DEFAULT_CODEX_TEMPLATE;
  cmd = cmd.replace(/\{task_file\}/g, vars.task_file);
  cmd = cmd.replace(/\{prompt\}/g, JSON.stringify(vars.prompt));
  cmd = cmd.replace(/\{model\}/g, vars.model);
  cmd = cmd.replace(/\{project_path\}/g, vars.project_path);
  cmd = cmd.replace(/\{git_branch\}/g, vars.git_branch);
  cmd = cmd.replace(/\{server_host\}/g, vars.server_host || '');
  cmd = cmd.replace(/\{ssh_user\}/g, vars.ssh_user || '');
  cmd = cmd.replace(/\{ssh_key\}/g, vars.ssh_key || '');
  return cmd;
}

/**
 * Сборка SSH-команды (whitelist из constants).
 */
export function buildSshCommand(sp: ServerProfile, action: 'status' | 'logs' = 'status', logFile?: string): string {
  const port = sp.port;
  const key = sp.sshKeyPath;
  const user = sp.user;
  const host = sp.host;
  const path_ = sp.projectPath;
  if (action === 'status') {
    return `ssh -p ${port} -i ${key} ${user}@${host} "cd ${path_} && git status --short && git branch --show-current"`;
  }
  return `ssh -p ${port} -i ${key} ${user}@${host} "cd ${path_} && tail -n 200 ${logFile || 'app.log'}"`;
}
