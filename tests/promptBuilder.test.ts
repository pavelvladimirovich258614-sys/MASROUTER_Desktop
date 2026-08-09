import { describe, it, expect } from 'vitest';
import { buildFinalPrompt, buildStopConditions, buildSafetyChecklist } from '../src/main/promptBuilder';
import { BUILTIN_MODELS, BUILTIN_ROLES } from '../shared/masrouterData';
import type { ChainStep, RouterInput } from '../shared/types';

const NO_RISK = {
  money: false,
  payment: false,
  discount: false,
  security: false,
  database: false,
  deploy: false,
  serverEdit: false
};

function mkSteps(roleIds: string[]): ChainStep[] {
  return roleIds.map((id, i) => {
    const role = BUILTIN_ROLES.find((r) => r.id === id)!;
    return {
      order: i + 1,
      role,
      model: BUILTIN_MODELS[0],
      outputFormat: role.outputFormat,
      promptTemplateId: role.id
    };
  });
}

describe('buildFinalPrompt', () => {
  it('содержит ROLE / FORBIDDEN / STOP CONDITIONS', () => {
    const steps = mkSteps(['Implementer']);
    const input: RouterInput = {
      taskDescription: 'Поменять кнопку',
      taskType: 'code-edit',
      complexity: 'Low',
      riskFlags: NO_RISK,
      budgetMode: 'AUTO',
      availableModels: []
    };
    const p = buildFinalPrompt({
      input,
      steps,
      costMode: 'ECO',
      topology: 'Single',
      riskScore: 1,
      stopConditions: ['test stop'],
      safetyChecklist: []
    });
    expect(p).toContain('ROLE:');
    expect(p).toContain('FORBIDDEN');
    expect(p).toContain('STOP CONDITIONS');
    expect(p).toContain('test stop');
  });

  it('QUALITY добавляет SecurityReviewer в шаги', () => {
    const steps = mkSteps(['Analyst', 'Implementer', 'Reviewer', 'SecurityReviewer']);
    const p = buildFinalPrompt({
      input: {
        taskDescription: 'Скидка',
        taskType: 'bug-fix',
        complexity: 'High',
        riskFlags: { ...NO_RISK, discount: true },
        budgetMode: 'AUTO',
        availableModels: []
      },
      steps,
      costMode: 'QUALITY',
      topology: 'Chain',
      riskScore: 3,
      stopConditions: [],
      safetyChecklist: []
    });
    expect(p).toContain('SecurityReviewer');
    expect(p).toContain('POLICY: QUALITY');
  });

  it('serverEdit добавляет SERVER SAFETY CHECKLIST', () => {
    const steps = mkSteps(['Analyst', 'Implementer']);
    const p = buildFinalPrompt({
      input: {
        taskDescription: 'Сервер',
        taskType: 'server-edit',
        complexity: 'Medium',
        riskFlags: { ...NO_RISK, serverEdit: true },
        budgetMode: 'AUTO',
        availableModels: []
      },
      steps,
      costMode: 'BALANCED',
      topology: 'Chain',
      riskScore: 2,
      stopConditions: [],
      safetyChecklist: ['backup', 'branch', 'rollback']
    });
    expect(p).toContain('SERVER SAFETY CHECKLIST');
    expect(p).toContain('backup');
  });
});

describe('buildStopConditions', () => {
  it('содержит деплой для serverEdit', () => {
    const sc = buildStopConditions({
      taskDescription: 'x',
      taskType: 'server-edit',
      complexity: 'Low',
      riskFlags: { ...NO_RISK, serverEdit: true },
      budgetMode: 'AUTO',
      availableModels: []
    });
    expect(sc.some((s) => /сервис|сервер/i.test(s))).toBe(true);
  });
});

describe('buildSafetyChecklist', () => {
  it('пустой для не-serverEdit', () => {
    const c = buildSafetyChecklist({
      taskDescription: 'x',
      taskType: 'code-edit',
      complexity: 'Low',
      riskFlags: NO_RISK,
      budgetMode: 'AUTO',
      availableModels: []
    });
    expect(c).toEqual([]);
  });
  it('содержит backup для serverEdit', () => {
    const c = buildSafetyChecklist({
      taskDescription: 'x',
      taskType: 'server-edit',
      complexity: 'Low',
      riskFlags: { ...NO_RISK, serverEdit: true },
      budgetMode: 'AUTO',
      availableModels: []
    });
    expect(c.some((s) => /backup/i.test(s))).toBe(true);
  });
});
