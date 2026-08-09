import { z } from 'zod';

// Zod-схемы — используются в main для валидации входящих IPC и в renderer для форм.
// Источник истины для типов — shared/types.ts. Схемы должны оставаться совместимыми.

export const riskFlagsSchema = z.object({
  money: z.boolean(),
  payment: z.boolean(),
  discount: z.boolean(),
  security: z.boolean(),
  database: z.boolean(),
  deploy: z.boolean(),
  serverEdit: z.boolean()
});

export const complexitySchema = z.enum(['Low', 'Medium', 'High']);
export const costModeSchema = z.enum(['ECO', 'BALANCED', 'QUALITY']);
export const topologySchema = z.enum([
  'Single',
  'CoT',
  'Chain',
  'Tree',
  'FullConnected',
  'Debate',
  'Reflection'
]);
export const taskTypeSchema = z.enum([
  'code-edit',
  'bug-fix',
  'feature',
  'refactor',
  'database',
  'payment',
  'discount',
  'deploy',
  'server-edit',
  'security',
  'documentation',
  'test',
  'analysis',
  'config'
]);
export const providerKindSchema = z.enum([
  'ollama',
  'openai',
  'openai-compatible',
  'minimax',
  'stepfun',
  'custom'
]);

export const modelConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  provider: providerKindSchema,
  tier: z.enum(['cheap', 'balanced', 'strong', 'local-light']),
  inputPricePerMTok: z.number().min(0),
  outputPricePerMTok: z.number().min(0),
  contextWindow: z.number().int().min(0),
  enabled: z.boolean(),
  benchmarks: z
    .object({
      mmlu: z.number().optional(),
      gpqa: z.number().optional(),
      humaneval: z.number().optional(),
      math: z.number().optional()
    })
    .optional(),
  notes: z.string().optional()
});

export const routerInputSchema = z.object({
  taskDescription: z.string().min(1, 'Опишите задачу'),
  taskType: taskTypeSchema,
  complexity: complexitySchema,
  riskFlags: riskFlagsSchema,
  budgetMode: z.union([z.literal('AUTO'), costModeSchema]),
  availableModels: z.array(modelConfigSchema),
  userOverrides: z
    .object({
      forcedModel: z.string().optional(),
      forcedTopology: topologySchema.optional(),
      forcedAgentCount: z.number().int().min(1).max(6).optional()
    })
    .optional()
});

export const providerConfigSchema = z.object({
  id: z.string().min(1),
  kind: providerKindSchema,
  label: z.string().min(1),
  baseUrl: z.string().min(1),
  apiKeyMasked: z.string(),
  defaultModelId: z.string().optional(),
  headers: z.record(z.string()).optional(),
  enabled: z.boolean()
});

export const codexProfileSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  cliPath: z.string().min(1),
  commandTemplate: z.string().min(1),
  projectPath: z.string().optional(),
  gitBranch: z.string().optional(),
  defaultModelId: z.string().optional()
});

export const serverProfileSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  host: z.string().min(1),
  port: z.number().int().min(1).max(65535),
  user: z.string().min(1),
  sshKeyPath: z.string().min(1),
  projectPath: z.string().min(1),
  gitBranch: z.string().min(1)
});

export const settingsSchema = z.object({
  theme: z.enum(['dark', 'light', 'system']),
  language: z.enum(['ru', 'en']),
  autoLaunch: z.boolean(),
  shellEnabled: z.boolean(),
  onboardingDone: z.boolean(),
  defaultProjectPath: z.string().optional(),
  defaultGitBranch: z.string().optional(),
  defaultServerHost: z.string().optional(),
  safeStorageUnlocked: z.boolean()
});

export type RouterInputZ = z.infer<typeof routerInputSchema>;
export type ModelConfigZ = z.infer<typeof modelConfigSchema>;
export type ProviderConfigZ = z.infer<typeof providerConfigSchema>;
