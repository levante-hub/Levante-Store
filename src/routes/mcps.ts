import { Hono } from 'hono';
import type { MCPStoreResponse } from '../types/mcps';
import { mcpProviderService } from '../services/providers';

const mcps = new Hono();

// GET /mcps.json → listado completo de todos los proveedores
mcps.get('/mcps.json', async (c) => {
  try {
    // Obtener MCPs de todos los proveedores
    const servers = await mcpProviderService.syncAllProviders();

    const response: MCPStoreResponse = {
      version: '1.0.0',
      provider: {
        id: 'levante-store',
        name: 'Levante MCP Store (Multi-Provider)',
        homepage: 'https://example.com',
      },
      servers,
    };

    // Headers de cache (1 hora)
    c.header('Cache-Control', 'public, max-age=3600');
    c.header('Content-Type', 'application/json');

    return c.json(response);
  } catch (error) {
    console.error('Error fetching MCPs:', error);
    return c.json(
      {
        error: 'Failed to fetch MCP servers',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// GET /mcps/:id → servidor concreto (busca en todos los proveedores)
mcps.get('/mcps/:id', async (c) => {
  const id = c.req.param('id');

  try {
    const server = await mcpProviderService.getServerById(id);

    if (!server) {
      return c.json({ error: 'MCP server not found', id }, 404);
    }

    // Headers de cache (1 hora)
    c.header('Cache-Control', 'public, max-age=3600');
    c.header('Content-Type', 'application/json');

    return c.json(server);
  } catch (error) {
    console.error(`Error fetching MCP ${id}:`, error);
    return c.json(
      {
        error: 'Failed to fetch MCP server',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// GET /mcps/provider/:providerId → MCPs de un proveedor específico
mcps.get('/mcps/provider/:providerId', async (c) => {
  const providerId = c.req.param('providerId');

  try {
    const servers = await mcpProviderService.syncProvider(providerId);

    const response: MCPStoreResponse = {
      version: '1.0.0',
      provider: {
        id: providerId,
        name: providerId,
      },
      servers,
    };

    c.header('Cache-Control', 'public, max-age=3600');
    c.header('Content-Type', 'application/json');

    return c.json(response);
  } catch (error) {
    console.error(`Error fetching provider ${providerId}:`, error);
    return c.json(
      {
        error: 'Failed to fetch provider',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      404
    );
  }
});

// GET /mcps/providers → lista de proveedores configurados
mcps.get('/mcps/providers', (c) => {
  const providers = mcpProviderService.getProviders();

  c.header('Cache-Control', 'public, max-age=3600');
  c.header('Content-Type', 'application/json');

  return c.json({ providers });
});

// GET /mcps → alias para /mcps.json
mcps.get('/mcps', (c) => {
  return c.redirect('/api/mcps.json');
});

export default mcps;
