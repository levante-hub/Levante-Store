// Transport types aligned with MCP protocol
export type TransportType = 'stdio' | 'sse' | 'streamable-http';

// Source types
export type SourceType = 'official' | 'community';

// Input definition for user-provided values
export interface InputDefinition {
  label: string;
  required: boolean;
  type: 'string' | 'password' | 'number' | 'boolean';
  default?: string;
  description?: string;
}

// Maintainer information
export interface Maintainer {
  name: string;
  url?: string;
  github?: string;
}

// Configuration template for stdio transport
export interface StdioTemplate {
  command: string;
  args: string[];
  env: Record<string, string>;
}

// Configuration template for http/sse transport
export interface HttpTemplate {
  type: 'sse' | 'streamable-http';
  url: string;
  headers?: Record<string, string>;
}

// Union type for templates
export type ConfigurationTemplate = StdioTemplate | HttpTemplate;

// MCP Server Descriptor (new format aligned with PRD)
export interface MCPServerDescriptor {
  $schema?: string;
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  logoUrl?: string;
  source: SourceType;
  maintainer?: Maintainer;
  status?: 'active' | 'deprecated' | 'experimental';
  version: string;
  transport: TransportType;
  inputs: Record<string, InputDefinition>;
  configuration: {
    template: ConfigurationTemplate;
  };
  metadata?: {
    homepage?: string;
    author?: string;
    repository?: string;
    addedAt?: string;
    lastUpdated?: string;
    useCount?: number;
  };
  // Legacy field for backwards compatibility during migration
  provider?: string;
}

// Service metadata (_meta.json)
export interface ServiceMeta {
  service: string;
  displayName: string;
  description: string;
  website: string | null;
  icon: string;
  category: string;
}

// API Response format
export interface MCPStoreResponse {
  version: string;
  provider: {
    id: string;
    name: string;
    homepage?: string;
  };
  servers: MCPServerDescriptor[];
}

// Services list response
export interface ServicesResponse {
  services: ServiceMeta[];
}

// ========================================
// PROVIDER TYPES (for external providers like AITempl)
// ========================================

export interface ProviderConfig {
  id: string;
  name: string;
  description: string;
  type: 'local' | 'api';
  endpoint: string;
  enabled: boolean;
  homepage?: string;
}

// AITempl provider types
export interface AitemplMcpServer {
  name: string;
  description: string;
  category: string;
  content: string;
  downloads: number;
  logoUrl?: string;
}

export interface AitemplResponse {
  mcps: AitemplMcpServer[];
}

export interface AitemplContentStructure {
  mcpServers: {
    [serverName: string]: {
      command: string;
      args: string[];
      env: Record<string, string>;
    };
  };
}
