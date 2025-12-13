import type { MCPServerDescriptor, ServiceMeta, SourceType } from '../types/mcps';

// Import all MCP files statically (Vite/Cloudflare compatible)
// Documentation MCPs
import context7 from '../data/mcps/documentation/context7.json';
import microsoftDocs from '../data/mcps/documentation/microsoft-docs.json';
import documentationMeta from '../data/mcps/documentation/_meta.json';

// GitHub MCPs
import githubCopilot from '../data/mcps/github/official-copilot.json';
import githubMeta from '../data/mcps/github/_meta.json';

// Playwright MCPs
import playwright from '../data/mcps/playwright/official.json';
import playwrightMeta from '../data/mcps/playwright/_meta.json';

// Supabase MCPs
import supabase from '../data/mcps/supabase/official.json';
import supabaseMeta from '../data/mcps/supabase/_meta.json';

// Type for service registry
interface ServiceRegistry {
  meta: ServiceMeta;
  mcps: MCPServerDescriptor[];
}

// Build registry of all services and their MCPs
const serviceRegistry: Record<string, ServiceRegistry> = {
  documentation: {
    meta: documentationMeta as ServiceMeta,
    mcps: [context7, microsoftDocs] as MCPServerDescriptor[],
  },
  github: {
    meta: githubMeta as ServiceMeta,
    mcps: [githubCopilot] as MCPServerDescriptor[],
  },
  playwright: {
    meta: playwrightMeta as ServiceMeta,
    mcps: [playwright] as MCPServerDescriptor[],
  },
  supabase: {
    meta: supabaseMeta as ServiceMeta,
    mcps: [supabase] as MCPServerDescriptor[],
  },
};

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
