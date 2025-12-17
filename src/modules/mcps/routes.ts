import { Hono } from 'hono';
import type { MCPStoreResponse, SourceType } from '@/modules/mcps/types';
import { catalogAggregator } from '@/modules/mcps/services/catalogAggregator';

const mcps = new Hono();

// GET /mcps.json → Full catalog with optional source filter
mcps.get('/mcps.json', (c) => {
  const sourceFilter = c.req.query('source') as SourceType | undefined;

  let servers = sourceFilter
    ? catalogAggregator.getBySource(sourceFilter)
    : catalogAggregator.aggregateAll();

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
  const servers = catalogAggregator.getByService(serviceName);
  const serviceMeta = catalogAggregator.getServiceMeta(serviceName);

  if (servers.length === 0) {
    return c.json({ error: 'Service not found', service: serviceName }, 404);
  }

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

  c.header('Cache-Control', 'public, max-age=3600');
  c.header('Content-Type', 'application/json');

  return c.json(server);
});

// GET /mcps → Redirect to /mcps.json
mcps.get('/mcps', (c) => {
  return c.redirect('/api/mcps.json');
});

export default mcps;
