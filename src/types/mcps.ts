export type TransportType = 'stdio' | 'http' | 'sse';

export interface EnvVarDefinition {
  label: string;
  required: boolean;
  type: 'string' | 'number' | 'boolean';
  default?: string;
  description?: string;
}

export interface MCPServerDescriptor {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  logoUrl?: string;
  provider: string; // ✅ NUEVO: Identifica el proveedor (ej: "levante", "aitempl")
  transport: TransportType;
  command: string;
  args: string[];
  env: Record<string, EnvVarDefinition>;
  metadata?: {
    homepage?: string;
    author?: string;
    repository?: string;
    useCount?: number;
  };
}

export interface MCPStoreResponse {
  version: string;
  provider: {
    id: string;
    name: string;
    homepage?: string;
  };
  servers: MCPServerDescriptor[];
}

// ========================================
// NUEVOS TIPOS PARA SISTEMA DE PROVEEDORES
// ========================================

/**
 * Configuración de un proveedor MCP
 */
export interface ProviderConfig {
  id: string;
  name: string;
  description: string;
  type: 'local' | 'api'; // local = archivo estático, api = endpoint externo
  endpoint: string;
  enabled: boolean;
  homepage?: string;
}

/**
 * Tipos para AITempl Provider
 */
export interface AitemplMcpServer {
  name: string;
  description: string;
  category: string;
  content: string; // ⚠️ JSON stringificado
  downloads: number;
  logoUrl?: string;
}

export interface AitemplResponse {
  mcps: AitemplMcpServer[];
}

/**
 * Estructura interna del campo 'content' de AITempl
 * (después de parsear el JSON string)
 */
export interface AitemplContentStructure {
  mcpServers: {
    [serverName: string]: {
      command: string;
      args: string[];
      env: Record<string, string>;
    };
  };
}
