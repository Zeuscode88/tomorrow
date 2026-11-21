export type ProgressStage = 'Concept' | 'Prototype' | 'Alpha' | 'Beta' | 'Production';

export type VersionMode = 'external_url' | 'internal_ai' | 'html_bundle';

export interface BuildMember {
  userId: string;
  name: string;
  role: string;
  country: string;
  joinedAt: string;
}

export interface BuildVersion {
  id: string;
  versionTag: string;
  changelog: string;
  createdAt: string;
  authorName: string;
  mode: VersionMode;
  previewUrl?: string;
  htmlCode?: string;
  githubUrl?: string;
  screenshots?: string[];
  aiEngineLabel?: string;
  mcpToolsUsed?: string[];
}

export interface ProjectBuild {
  id: string;
  appId: string;
  appTitle: string;
  title: string;
  summary: string;
  progressStage: ProgressStage;
  progressPercent: number;
  isGroupProject: boolean;
  isPublic: boolean;
  ownerId: string;
  ownerName: string;
  members: BuildMember[];
  githubUrl?: string;
  activeVersionId: string;
  versions: BuildVersion[];
  createdAt: string;
  updatedAt: string;
}

export type ExternalAgentProvider =
  | 'openai'
  | 'anthropic'
  | 'mistral'
  | 'groq'
  | 'openrouter'
  | 'custom_openai';

export type AgentPipelineRole =
  | 'Architecte'
  | 'Développeur Full-Stack'
  | 'Designer UI/UX'
  | 'Réviseur Sécurité';

export interface ExternalAgentConfig {
  id: string;
  name: string;
  provider: ExternalAgentProvider;
  role: AgentPipelineRole;
  model: string;
  endpointUrl?: string;
  token: string;
  enabled: boolean;
}

export interface McpToolInfo {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}

export interface McpResourceInfo {
  uri: string;
  name?: string;
  description?: string;
}

export interface McpServerConfig {
  id: string;
  name: string;
  url: string;
  bearerToken?: string;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  tools: McpToolInfo[];
  resources: McpResourceInfo[];
  selectedToolNames: string[];
  errorMessage?: string;
}

export interface AgentExecutionLog {
  step: string;
  actor: string;
  status: 'ok' | 'warn' | 'error';
  detail: string;
  timestamp: string;
}
