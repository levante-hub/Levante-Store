# Contributing to Levante API Services

Thanks for your interest in contributing to Levante API Services!

## Development Setup

```bash
# Clone the repository
git clone https://github.com/levante-hub/Levante-Store.git levante-api-services
cd levante-api-services

# Install dependencies
npm install

# Start development server
npm run dev
# Open http://localhost:5180 for Swagger UI
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm test` | Run tests |
| `npm run typecheck` | TypeScript type checking |
| `npm run validate-mcps` | Validate MCP catalog |
| `npm run list-mcps` | List all MCPs |

## Project Structure

```
src/
├── index.tsx                 # Main Hono app
├── openapi.ts                # OpenAPI specification
├── shared/                   # Shared code across modules
│   └── middleware/
└── modules/                  # Feature modules
    └── mcps/                 # MCP catalog module
        ├── routes.ts
        ├── types.ts
        ├── services/
        └── data/
```

## Code Style

- Use TypeScript for all new code
- Use the `@/` alias for imports (e.g., `import x from '@/modules/mcps/types'`)
- Run `npm run typecheck` before committing
- Follow existing patterns in the codebase

## Pull Request Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit with conventional commits: `feat:`, `fix:`, `docs:`, etc.
6. Push and open a Pull Request

## Module-Specific Guides

Each module has its own contributing guide with specific instructions:

| Module | Guide | Description |
|--------|-------|-------------|
| MCPs | [docs/contributing-mcps.md](docs/contributing-mcps.md) | Add new MCP servers to the catalog |

## Reporting Issues

- Use GitHub Issues for bugs and feature requests
- Include reproduction steps for bugs
- Check existing issues before creating new ones

## Questions?

Open a discussion on GitHub or reach out in the issues.
