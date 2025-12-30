import { Hono } from 'hono';
import type {
  MCPServerDescriptor,
  MCPStoreResponse,
  SourceType,
} from '@/modules/mcps/types';
import { catalogAggregator } from '@/modules/mcps/services/catalogAggregator';
import { normalizeName } from '@/shared/utils/nameNormalizer';

/**
 * Normalizes server names to be compatible with function name requirements.
 * Some MCP clients (like Google/Gemini) require function names to follow strict rules.
 * Preserves the original name in displayName for UI purposes.
 */
function normalizeServerNames(
  servers: MCPServerDescriptor[]
): MCPServerDescriptor[] {
  return servers.map((server) => ({
    ...server,
    displayName: server.displayName || server.name,
    name: normalizeName(server.name),
  }));
}

const mcps = new Hono();

// GET /mcps.json → Full catalog with optional source filter
mcps.get('/mcps.json', (c) => {
  const sourceFilter = c.req.query('source') as SourceType | undefined;

  let servers = sourceFilter
    ? catalogAggregator.getBySource(sourceFilter)
    : catalogAggregator.aggregateAll();

  // Normalize names for compatibility with strict function name requirements
  servers = normalizeServerNames(servers);

  const response: MCPStoreResponse = {
    version: '1.0.0',
    provider: {
      id: 'levante-api-services',
      name: 'Levante API Services',
      homepage: 'https://github.com/levante-hub/Levante-Store',
    },
    servers,
  };

  c.header('Cache-Control', 'public, max-age=3600');
  c.header('Content-Type', 'application/json');

  return c.json(response);
});

// GET /mcps/services → List all available services
mcps.get('/mcps/services', (c) => {
  const services = catalogAggregator.getServices();

  c.header('Cache-Control', 'public, max-age=3600');
  c.header('Content-Type', 'application/json');

  return c.json({ services });
});

// GET /mcps/stats → Catalog statistics
mcps.get('/mcps/stats', (c) => {
  const counts = catalogAggregator.getCountBySource();
  const services = catalogAggregator.getServiceNames();

  c.header('Cache-Control', 'public, max-age=3600');
  c.header('Content-Type', 'application/json');

  return c.json({
    total: counts.official + counts.community,
    official: counts.official,
    community: counts.community,
    services: services.length,
    serviceList: services,
  });
});

// GET /mcps/service/:service → MCPs from a specific service
mcps.get('/mcps/service/:service', (c) => {
  const serviceName = c.req.param('service');
  let servers = catalogAggregator.getByService(serviceName);
  const serviceMeta = catalogAggregator.getServiceMeta(serviceName);

  if (servers.length === 0) {
    return c.json({ error: 'Service not found', service: serviceName }, 404);
  }

  // Normalize names for compatibility with strict function name requirements
  servers = normalizeServerNames(servers);

  const response: MCPStoreResponse = {
    version: '1.0.0',
    provider: {
      id: serviceName,
      name: serviceMeta?.displayName || serviceName,
      homepage: serviceMeta?.website || undefined,
    },
    servers,
  };

  c.header('Cache-Control', 'public, max-age=3600');
  c.header('Content-Type', 'application/json');

  return c.json(response);
});

// GET /mcps/:id → Get specific MCP by ID (must be after other /mcps/* routes)
mcps.get('/mcps/:id', (c) => {
  const id = c.req.param('id');
  const server = catalogAggregator.getById(id);

  if (!server) {
    return c.json({ error: 'MCP server not found', id }, 404);
  }

  // Normalize name for compatibility with strict function name requirements
  // Preserve original name in displayName for UI purposes
  const normalizedServer = {
    ...server,
    displayName: server.displayName || server.name,
    name: normalizeName(server.name),
  };

  c.header('Cache-Control', 'public, max-age=3600');
  c.header('Content-Type', 'application/json');

  return c.json(normalizedServer);
});

// GET /mcps → Redirect to /mcps.json
mcps.get('/mcps', (c) => {
  return c.redirect('/api/mcps.json');
});

export default mcps;
