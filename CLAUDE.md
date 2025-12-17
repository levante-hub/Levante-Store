# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Levante API Services is a RESTful API backend for the Levante ecosystem. Currently provides a catalog of MCP (Model Context Protocol) servers. Built with TypeScript and Hono framework, deployed on Vercel.

## Commands

```bash
npm run dev       # Local dev server at http://localhost:5180
npm run build     # Build for Vercel
npm run deploy    # Deploy to Vercel
npm run test      # Run tests once
npm run test:watch # Run tests in watch mode
npm run test:ui   # Run tests with Vitest UI
```

## Architecture

### Modular Structure

The project uses a modular architecture to support multiple API domains:

```
src/
├── index.tsx                 # Main Hono app (mounts modules)
├── openapi.ts                # OpenAPI specification
├── shared/                   # Shared code across modules
│   └── middleware/
│       └── errorHandler.ts
├── modules/                  # Feature modules
│   └── mcps/                 # MCP catalog module
│       ├── routes.ts         # API routes
│       ├── types.ts          # TypeScript interfaces
│       ├── services/
│       │   ├── catalogAggregator.ts
│       │   ├── providers.ts
│       │   └── normalizers/
│       └── data/
│           ├── providers.json
│           └── mcps/         # MCP JSON files
└── tests/
```

### Adding a New Module

1. Create folder in `src/modules/{module-name}/`
2. Add `routes.ts`, `types.ts`, and `services/` as needed
3. Mount in `src/index.tsx`: `app.route('/api/{module}', moduleRoutes)`

### MCPs Module

The MCPs module aggregates MCP servers from multiple sources via a provider architecture:

- **Providers** defined in `src/modules/mcps/data/providers.json`
- **Normalizers** in `src/modules/mcps/services/normalizers/` transform external formats
- **CatalogAggregator** loads local MCP definitions from `data/mcps/`

### Key Data Flow
1. API request hits `src/modules/mcps/routes.ts`
2. Routes call `catalogAggregator` for local data
3. Results returned with 1-hour cache headers

### API Endpoints (MCPs)
- `GET /api/mcps.json` - Full catalog
- `GET /api/mcps/:id` - Single server by ID
- `GET /api/mcps/services` - List of services
- `GET /api/mcps/service/:service` - Servers from specific service
- `GET /api/mcps/stats` - Catalog statistics

## Key Types

`MCPServerDescriptor` is the core type representing an MCP server with:
- `id`, `name`, `description` - Basic info
- `transport` - "stdio" | "sse" | "streamable-http"
- `inputs` - Environment variables as `Record<string, InputDefinition>`
- `configuration.template` - Execution details (command, args, env)

## Adding a New MCP Provider

1. Add provider config to `src/modules/mcps/data/providers.json`
2. Create normalizer in `src/modules/mcps/services/normalizers/`
3. Register normalizer in `MCPProviderService`
