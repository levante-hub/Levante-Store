import type { MCPServerDescriptor, ServiceMeta, SourceType } from '@/modules/mcps/types';

// Cargar dinámicamente todos los archivos JSON de MCPs
const mcpModules = import.meta.glob<{ default: MCPServerDescriptor }>(
  '../data/mcps/*/*.json',
  { eager: true }
);

// Cargar dinámicamente todos los archivos _meta.json
const metaModules = import.meta.glob<{ default: ServiceMeta }>(
  '../data/mcps/*/_meta.json',
  { eager: true }
);

// Type for service registry
interface ServiceRegistry {
  meta: ServiceMeta;
  mcps: MCPServerDescriptor[];
}

// Construir el registry dinámicamente
function buildServiceRegistry(): Record<string, ServiceRegistry> {
  const registry: Record<string, ServiceRegistry> = {};

  // Primero, cargar todos los _meta.json para crear los servicios
  for (const [path, module] of Object.entries(metaModules)) {
    // Extraer nombre del servicio del path: ../data/mcps/[service]/_meta.json
    const match = path.match(/\/mcps\/([^/]+)\/_meta\.json$/);
    if (match) {
      const serviceName = match[1];
      registry[serviceName] = {
        meta: module.default,
        mcps: [],
      };
    }
  }

  // Luego, cargar todos los MCPs y asignarlos a sus servicios
  for (const [path, module] of Object.entries(mcpModules)) {
    // Saltar archivos _meta.json y _schema.json
    if (path.includes('_meta.json') || path.includes('_schema.json')) {
      continue;
    }

    // Extraer nombre del servicio del path: ../data/mcps/[service]/[file].json
    const match = path.match(/\/mcps\/([^/]+)\/[^/]+\.json$/);
    if (match) {
      const serviceName = match[1];
      if (registry[serviceName]) {
        registry[serviceName].mcps.push(module.default);
      }
    }
  }

  return registry;
}

const serviceRegistry = buildServiceRegistry();

/**
 * CatalogAggregator - Aggregates MCP files from the folder-based structure
 */
export class CatalogAggregator {
  /**
   * Get all MCPs from all services
   */
  aggregateAll(): MCPServerDescriptor[] {
    const allMcps: MCPServerDescriptor[] = [];

    for (const service of Object.values(serviceRegistry)) {
      allMcps.push(...service.mcps);
    }

    return allMcps;
  }

  /**
   * Get MCPs from a specific service
   */
  getByService(serviceName: string): MCPServerDescriptor[] {
    const service = serviceRegistry[serviceName];
    return service ? service.mcps : [];
  }

  /**
   * Get MCPs filtered by source (official/community)
   */
  getBySource(source: SourceType): MCPServerDescriptor[] {
    return this.aggregateAll().filter((mcp) => mcp.source === source);
  }

  /**
   * Get a specific MCP by ID
   */
  getById(id: string): MCPServerDescriptor | undefined {
    return this.aggregateAll().find((mcp) => mcp.id === id);
  }

  /**
   * Get all service metadata
   */
  getServices(): ServiceMeta[] {
    return Object.values(serviceRegistry).map((service) => service.meta);
  }

  /**
   * Get service metadata by service name
   */
  getServiceMeta(serviceName: string): ServiceMeta | undefined {
    return serviceRegistry[serviceName]?.meta;
  }

  /**
   * Get list of available service names
   */
  getServiceNames(): string[] {
    return Object.keys(serviceRegistry);
  }

  /**
   * Get count of MCPs by source
   */
  getCountBySource(): { official: number; community: number } {
    const all = this.aggregateAll();
    return {
      official: all.filter((m) => m.source === 'official').length,
      community: all.filter((m) => m.source === 'community').length,
    };
  }
}

// Singleton instance
export const catalogAggregator = new CatalogAggregator();
