// Общие типы ядра MASROUTER Desktop.
// Источник: arXiv:2502.11133 (Yanwei Yue et al., 16.02.2025).

export type RiskLevel = 1 | 2 | 3;

export type CostMode = 'ECO' | 'BALANCED' | 'QUALITY';

export type ModelTier = 'cheap' | 'balanced' | 'strong' | 'local-light';

export type Topology =
  | 'Single'
  | 'CoT'
  | 'Chain'
  | 'Tree'
  | 'FullConnected'
  | 'Debate'
  | 'Reflection';

export type ProviderKind =
  | 'ollama'
  | 'openai'
  | 'openai-compatible'
  | 'minimax'
  | 'stepfun'
  | 'custom';

export type Complexity = 'Low' | 'Medium' | 'High';

export type TaskType =
  | 'code-edit'
  | 'bug-fix'
  | 'feature'
  | 'refactor'
  | 'database'
  | 'payment'
  | 'discount'
  | 'deploy'
  | 'server-edit'
  | 'security'
  | 'documentation'
  | 'test'
  | 'analysis'
  | 'config';

export interface RiskFlags {
  money: boolean;
  payment: boolean;
  discount: boolean;
  security: boolean;
  database: boolean;
  deploy: boolean;
  serverEdit: boolean;
}

export interface ModelConfig {
  id: string;
  name: string;
  provider: ProviderKind;
  tier: ModelTier;
  inputPricePerMTok: number; // USD per 1M tokens
  outputPricePerMTok: number;
  contextWindow: number;
  enabled: boolean;
  // Бенчмарки из Приложения E.1 статьи (используются для ранжирования).
  benchmarks?: {
    mmlu?: number;
    gpqa?: number;
    humaneval?: number;
    math?: number;
  };
  notes?: string;
}

export interface RoleConfig {
  id: string;
  name: string;
  description: string;
  outputFormat: string;
  allowedActions: string[];
  forbiddenActions: string[];
  // Какой риск покрывает роль (1..3). 0 = нейтральная.
  riskLevel: number;
  category: 'math' | 'code' | 'server' | 'analysis' | 'security' | 'meta';
  builtin: boolean;
}

export interface TopologyConfig {
  id: Topology;
  name: string;
  description: string;
  costImpact: 'low' | 'medium' | 'high';
  whenToUse: string;
  paperReference: string;
}

export interface RouterInput {
  taskDescription: string;
  taskType: TaskType;
  complexity: Complexity;
  riskFlags: RiskFlags;
  budgetMode: 'AUTO' | CostMode;
  availableModels: ModelConfig[];
  userOverrides?: {
    forcedModel?: string;
    forcedTopology?: Topology;
    forcedAgentCount?: number;
  };
}

export interface ChainStep {
  order: number;
  role: RoleConfig;
  model: ModelConfig;
  outputFormat: string;
  promptTemplateId: string;
}

export interface RouteDecision {
  riskScore: RiskLevel;
  costMode: CostMode;
  lambda: 5 | 15 | 25;
  topology: Topology;
  agentCount: number;
  reason: string;
  cascade: { stage: 'Fθt' | 'Fθr' | 'Fθm'; selected: string; rationale: string }[];
  chain: ChainStep[];
  stopConditions: string[];
  safetyChecklist: string[];
  finalPrompt: string;
  estimatedCost: { input: number; output: number; total: number; currency: 'USD' };
  warnings: string[];
  // Технические детали каскада
  delta: number; // δ(H) ∈ [0,1]
  gamma: number; // γ=6 из статьи
  topologicalMultiplier: number; // Γ(k+1)
}

export interface ProviderConfig {
  id: string;
  kind: ProviderKind;
  label: string;
  baseUrl: string;
  apiKeyMasked: string; // только маска вида "sk-...xxxx"
  defaultModelId?: string;
  headers?: Record<string, string>;
  enabled: boolean;
}

export interface CodexProfile {
  id: string;
  name: string;
  cliPath: string;
  commandTemplate: string;
  projectPath?: string;
  gitBranch?: string;
  defaultModelId?: string;
}

export interface ServerProfile {
  id: string;
  name: string;
  host: string;
  port: number;
  user: string;
  sshKeyPath: string;
  projectPath: string;
  gitBranch: string;
}

export interface CostLogEntry {
  id: string;
  taskId?: string;
  stepId?: string;
  modelId: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  currency: 'USD';
  timestamp: number;
}

export interface AppLogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'warning' | 'error' | 'security' | 'cost' | 'api';
  source: string;
  message: string;
  details?: Record<string, unknown>;
  taskId?: string;
  modelId?: string;
}

export interface CaseStudyTemplate {
  id: string;
  benchmark: 'MMLU' | 'GSM8K' | 'MATH' | 'HumanEval' | 'MBPP';
  title: string;
  description: string;
  question: string;
  chain: string[]; // ID ролей
  topology: Topology;
  notes: string;
}

export interface Settings {
  theme: 'dark' | 'light' | 'system';
  language: 'ru' | 'en';
  autoLaunch: boolean;
  shellEnabled: boolean; // shell-команды выключены по умолчанию
  onboardingDone: boolean;
  defaultProjectPath?: string;
  defaultGitBranch?: string;
  defaultServerHost?: string;
  safeStorageUnlocked: boolean;
}

export interface PromptHistoryEntry {
  id: string;
  timestamp: number;
  taskId?: string;
  taskDescription: string;
  costMode: CostMode;
  topology: Topology;
  agentCount: number;
  finalPrompt: string;
  reused: boolean;
  tags: string[];
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  inputTokens: number;
  outputTokens: number;
  modelId: string;
  finishReason?: string;
  raw?: unknown;
}

export interface LLMProvider {
  kind: ProviderKind;
  testConnection(): Promise<{ ok: boolean; message: string; latencyMs?: number }>;
  chat(messages: LLMMessage[], opts: { model: string; temperature?: number; maxTokens?: number }): Promise<LLMResponse>;
  listModels?(): Promise<{ id: string; ownedBy?: string }[]>;
}
