# Levante API Services

API services para el ecosistema [Levante](https://github.com/levante-hub/levante). Actualmente incluye el catálogo de servidores MCP (Model Context Protocol).

## Quick Start

```bash
# Install dependencies
npm install

# Development
npm run dev
# Open http://localhost:5180 for Swagger UI

# Build
npm run build

# Deploy
npm run deploy
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /` | Swagger UI documentation |
| `GET /openapi.json` | OpenAPI 3.0 specification |
| `GET /api/mcps.json` | Full MCP catalog |
| `GET /api/mcps.json?source=official` | Filter by source (official/community) |
| `GET /api/mcps/:id` | Get MCP by ID |
| `GET /api/mcps/services` | List all services |
| `GET /api/mcps/service/:service` | MCPs from a specific service |
| `GET /api/mcps/stats` | Catalog statistics |

## Project Structure

```
├── public/static/            # Static assets
├── scripts/                  # CLI tools
│   ├── validate-mcps.mjs
│   └── list-mcps.mjs
└── src/
    ├── index.tsx             # Main Hono app
    ├── shared/               # Shared code across modules
    │   └── middleware/
    ├── modules/              # Feature modules
    │   └── mcps/             # MCP catalog module
    │       ├── routes.ts
    │       ├── types.ts
    │       ├── services/
    │       │   ├── catalogAggregator.ts
    │       │   └── normalizers/
    │       └── data/
    │           ├── providers.json
    │           └── mcps/     # MCP JSON files
    └── tests/
```

## CLI Commands

```bash
# Validate all MCPs against schema
npm run validate-mcps

# List MCPs
npm run list-mcps

# Filter by source
npm run list-mcps -- --source=official

# Filter by service
npm run list-mcps -- --service=github

# Output as JSON
npm run list-mcps -- --json
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for general contribution guidelines

**Want to add a new MCP?** Follow the [MCP Contributing Guide](docs/contributing-mcps.md).

## Current Catalog

| Service | MCPs | Transport |
|---------|------|-----------|
| Documentation | Context7, Microsoft Docs | stdio, streamable-http |
| GitHub | GitHub Copilot MCP | streamable-http |
| Playwright | Playwright | stdio |
| Supabase | Supabase | streamable-http |

## Tech Stack

- **[Hono](https://hono.dev/)** - Fast web framework
- **[Vercel](https://vercel.com/)** - Edge hosting
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[Vite](https://vitejs.dev/)** - Build tool
- **[@hono/swagger-ui](https://github.com/honojs/middleware/tree/main/packages/swagger-ui)** - API documentation

## Integration with Levante

Add to `src/renderer/data/mcpProviders.json`:

```json
{
  "id": "levante-api-services",
  "name": "Levante API Services",
  "type": "api",
  "endpoint": "https://services.levanteapp.com/api/mcps.json",
  "enabled": true
}
```

## Documentation

- [CONTRIBUTING.md](./CONTRIBUTING.md) - General contribution guide
- [docs/contributing-mcps.md](./docs/contributing-mcps.md) - Add new MCPs to the catalog
- [docs/API.md](./docs/API.md) - API documentation
- [docs/PRD-catalog-reorganization.md](./docs/PRD-catalog-reorganization.md) - Architecture decisions

## License

MIT
