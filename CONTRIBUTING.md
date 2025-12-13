# Contributing to Levante MCP Store

Thank you for your interest in contributing! This guide will help you add new MCPs to the catalog.

## Table of Contents

- [Adding a New MCP](#adding-a-new-mcp)
- [MCP File Structure](#mcp-file-structure)
- [Naming Conventions](#naming-conventions)
- [Transport Types](#transport-types)
- [Validation](#validation)
- [Testing](#testing)

## Adding a New MCP

### Quick Start (Interactive)

The easiest way to add a new MCP:

```bash
npm run add-mcp
```

This interactive script will guide you through creating a properly formatted MCP.

### Quick Start (Manual)

1. **Fork** the repository
2. **Create** or use an existing service folder: `src/data/mcps/[service]/`
3. **Create** your MCP file: `[name].json`
4. **Validate** locally: `npm run validate-mcps`
5. **Open** a Pull Request

### Step by Step

#### 1. Choose the Service Folder

MCPs are organized by service. Check if a folder already exists:

```
src/data/mcps/
├── documentation/
├── github/
├── playwright/
├── supabase/
└── [your-service]/    ← Create if needed
```

#### 2. Create Service Metadata (New Services Only)

If creating a new service folder, add `_meta.json`:

```json
{
  "service": "your-service",
  "displayName": "Your Service",
  "description": "MCPs for Your Service integration",
  "website": "https://yourservice.com",
  "icon": "icon-name",
  "category": "development"
}
```

Categories: `documentation`, `development`, `database`, `automation`, `ai`, `communication`, `productivity`, `other`

#### 3. Create Your MCP File

Create `[name].json` in the service folder:

- **Official MCPs**: `official.json` or `official-[variant].json`
- **Community MCPs**: `community-[name].json`

## MCP File Structure

```json
{
  "$schema": "../_schema.json",
  "id": "unique-mcp-id",
  "name": "Display Name",
  "description": "Brief description of what this MCP does",
  "category": "development",
  "icon": "icon-name",
  "logoUrl": "https://example.com/logo.png",
  "source": "official",
  "maintainer": {
    "name": "Maintainer Name",
    "url": "https://maintainer.com",
    "github": "github-username"
  },
  "status": "active",
  "version": "1.0.0",
  "transport": "stdio",
  "inputs": {},
  "configuration": {
    "template": {}
  },
  "metadata": {
    "homepage": "https://docs.example.com",
    "repository": "https://github.com/example/mcp",
    "addedAt": "2025-01-01",
    "lastUpdated": "2025-01-01"
  }
}
```

### Required Fields

| Field | Description |
|-------|-------------|
| `id` | Unique identifier (lowercase, alphanumeric with hyphens) |
| `name` | Display name |
| `description` | Brief description |
| `category` | One of the allowed categories |
| `source` | `official` or `community` |
| `transport` | `stdio`, `sse`, or `streamable-http` |
| `configuration` | Configuration template |

## Naming Conventions

| Type | File Pattern | ID Pattern |
|------|--------------|------------|
| Official | `official.json`, `official-[variant].json` | `[service]`, `[service]-[variant]` |
| Community | `community-[name].json` | `[service]-[name]-community` |

## Transport Types

### STDIO (Command-line)

For MCPs that run as local commands:

```json
{
  "transport": "stdio",
  "inputs": {
    "API_KEY": {
      "label": "API Key",
      "required": true,
      "type": "password",
      "description": "Your API key"
    }
  },
  "configuration": {
    "template": {
      "command": "npx",
      "args": ["-y", "@example/mcp"],
      "env": {
        "API_KEY": "${API_KEY}"
      }
    }
  }
}
```

### SSE (Server-Sent Events)

For MCPs using SSE transport:

```json
{
  "transport": "sse",
  "inputs": {
    "API_TOKEN": {
      "label": "API Token",
      "required": true,
      "type": "password"
    }
  },
  "configuration": {
    "template": {
      "type": "sse",
      "url": "https://api.example.com/mcp/sse",
      "headers": {
        "Authorization": "Bearer ${API_TOKEN}"
      }
    }
  }
}
```

### Streamable HTTP

For MCPs using HTTP streaming:

```json
{
  "transport": "streamable-http",
  "inputs": {
    "API_TOKEN": {
      "label": "API Token",
      "required": true,
      "type": "password"
    }
  },
  "configuration": {
    "template": {
      "type": "streamable-http",
      "url": "https://api.example.com/mcp",
      "headers": {
        "Authorization": "Bearer ${API_TOKEN}"
      }
    }
  }
}
```

## Validation

Before submitting, validate your MCP:

```bash
# Install dependencies
npm install

# Validate all MCPs
npm run validate-mcps

# List all MCPs
npm run list-mcps

# Filter by source
npm run list-mcps -- --source=community

# Output as JSON
npm run list-mcps -- --json
```

## Testing

### Using MCP Inspector

Test your MCP locally with the official MCP Inspector:

```bash
# STDIO MCPs
npx @modelcontextprotocol/inspector npx -y @your/mcp

# With environment variables
npx @modelcontextprotocol/inspector -e API_KEY=xxx npx -y @your/mcp

# SSE/HTTP MCPs
npx @modelcontextprotocol/inspector --transport sse --url https://api.example.com/sse
```

### Validation Checklist

- [ ] JSON is valid and passes schema validation
- [ ] MCP ID is unique
- [ ] All required fields are present
- [ ] URLs are accessible
- [ ] Logo URL works (if provided)
- [ ] No sensitive data (API keys, tokens) in the file

## Pull Request Process

1. Ensure all validation passes
2. Fill out the PR template completely
3. Wait for automated checks to pass
4. A maintainer will review your PR

## Questions?

- Open an [Issue](https://github.com/levante-hub/Levante-Store/issues)
- Check existing [MCPs](src/data/mcps/) for examples
