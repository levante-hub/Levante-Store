# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Levante Store is a RESTful API backend that exposes a catalog of MCP (Model Context Protocol) servers. Built with TypeScript and Hono framework, deployed on Cloudflare Pages.

## Commands

```bash
npm run dev       # Local dev server at http://localhost:5173
npm run build     # Build for Cloudflare Pages
npm run preview   # Build and local preview with Wrangler
npm run deploy    # Build and deploy to Cloudflare Pages
npm run cf-typegen # Generate Cloudflare Worker types
```

Testing: `./test-api.sh` runs API endpoint tests.

## Architecture

### Multi-Provider System
The API aggregates MCP servers from multiple sources via a provider architecture:

- **Providers** defined in `src/data/providers.json` - can be `local` (file-based) or `api` (external endpoints)
- **Normalizers** in `src/services/normalizers/` transform each provider's format to standard `MCPServerDescriptor`
- **MCPProviderService** (`src/services/providers.ts`) orchestrates syncing across all enabled providers with error resilience (continues if one provider fails)

### Key Data Flow
1. API request hits `src/routes/mcps.ts`
2. Routes call `mcpProviderService.syncAllProviders()`
3. Service fetches from each enabled provider
4. Each provider's response passes through its normalizer
5. Aggregated results returned with 1-hour cache headers

### Entry Points
- `src/index.tsx` - Main Hono app with CORS, logging, and error middleware
- `src/routes/mcps.ts` - All API routes under `/api`
- `src/types/mcps.ts` - Core TypeScript interfaces

### API Endpoints
- `GET /api/mcps.json` - Full catalog
- `GET /api/mcps/:id` - Single server by ID
- `GET /api/mcps/provider/:providerId` - Servers from specific provider
- `GET /api/mcps/providers` - List of configured providers

## Key Types

`MCPServerDescriptor` is the core type representing an MCP server with:
- `command`, `args` - Execution details
- `env` - Environment variables as `Record<string, EnvVarDefinition>`
- `provider` - Source identifier (e.g., "levante", "aitempl")
- `transport` - "stdio" | "http" | "sse"

## Adding a New Provider

1. Add provider config to `src/data/providers.json`
2. Create normalizer in `src/services/normalizers/`
3. Register normalizer in `MCPProviderService.normalizers` map
