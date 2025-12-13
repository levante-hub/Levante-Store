# PRD: Reorganización del Catálogo de MCPs

## Resumen Ejecutivo

Reorganizar el sistema de almacenamiento de MCPs desde un único archivo JSON monolítico (`src/data/mcps.json`) hacia una estructura basada en carpetas por servicio, donde cada MCP es un archivo JSON independiente. Esto facilitará las contribuciones de la comunidad y el mantenimiento del catálogo.

---

## Problema Actual

1. **Archivo monolítico**: Todos los MCPs están en `src/data/mcps.json` - difícil de mantener y genera conflictos en PRs
2. **Barrera de entrada alta**: Contribuir requiere entender toda la estructura del archivo
3. **Sin distinción oficial/comunidad**: No hay forma de identificar MCPs oficiales vs creados por la comunidad
4. **Revisión compleja**: PRs que modifican el archivo completo son difíciles de revisar

---

## Solución Propuesta

### Nueva Estructura de Carpetas

```
src/data/
├── mcps/
│   ├── _schema.json              # JSON Schema for validation
│   │
│   ├── supabase/
│   │   ├── _meta.json            # Service metadata
│   │   ├── official.json         # Official Supabase MCP
│   │   └── community-postgres-extra.json
│   │
│   ├── github/
│   │   ├── _meta.json
│   │   ├── official-copilot.json
│   │   └── community-actions.json
│   │
│   ├── playwright/
│   │   ├── _meta.json
│   │   └── official.json
│   │
│   ├── documentation/
│   │   ├── _meta.json
│   │   ├── context7.json
│   │   └── microsoft-docs.json
│   │
│   └── [new-service]/
│       ├── _meta.json
│       └── [mcp-name].json
│
└── providers.json                # No changes
```

### Formato de Archivo Individual MCP

Cada archivo `[nombre].json` contendrá UN solo MCP:

```json
{
  "$schema": "../_schema.json",
  "id": "supabase-official",
  "name": "Supabase",
  "description": "Access Supabase database and API through MCP",
  "category": "database",
  "icon": "database",
  "logoUrl": "https://supabase.com/brand-assets/supabase-logo-icon.png",
  "source": "official",
  "maintainer": {
    "name": "Supabase",
    "url": "https://supabase.com",
    "github": "supabase"
  },
  "status": "active",
  "version": "1.0.0",
  "transport": "streamable-http",
  "inputs": {
    "SUPABASE_PROJECT_REF": {
      "label": "Supabase Project Reference",
      "required": true,
      "type": "string",
      "description": "Your Supabase project reference ID"
    },
    "SUPABASE_ACCESS_TOKEN": {
      "label": "Supabase Access Token",
      "required": true,
      "type": "password",
      "description": "Your Supabase access token"
    }
  },
  "configuration": {
    "template": {
      "type": "streamable-http",
      "url": "https://mcp.supabase.com/mcp?project_ref=${SUPABASE_PROJECT_REF}",
      "headers": {
        "Authorization": "Bearer ${SUPABASE_ACCESS_TOKEN}"
      }
    }
  },
  "metadata": {
    "homepage": "https://supabase.com/docs/guides/ai/mcp",
    "repository": "https://github.com/supabase/mcp",
    "addedAt": "2025-01-15",
    "lastUpdated": "2025-01-15"
  }
}
```

### Campos Nuevos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `source` | `"official"` \| `"community"` | Origen del MCP (official = desarrollo oficial, community = desarrollo no oficial) |
| `inputs` | object | Variables que el usuario debe proporcionar (agnóstico del transport) |
| `maintainer` | object | Información del mantenedor |
| `maintainer.github` | string | Usuario/org de GitHub para menciones |
| `metadata.addedAt` | string (date) | Fecha de adición al catálogo |
| `metadata.lastUpdated` | string (date) | Última actualización |

### Uso de `inputs` según Transport

Los `inputs` definen qué valores necesita el usuario. El `configuration.template` sigue el formato oficial del protocolo MCP:

**STDIO** → variables de entorno al proceso:
```json
{
  "transport": "stdio",
  "inputs": { "NOTION_API_KEY": { "type": "password", ... } },
  "configuration": {
    "template": {
      "command": "npx",
      "args": ["-y", "@notion/mcp"],
      "env": { "NOTION_API_KEY": "${NOTION_API_KEY}" }
    }
  }
}
```

**SSE** → Server-Sent Events:
```json
{
  "transport": "sse",
  "inputs": { "API_TOKEN": { "type": "password", ... } },
  "configuration": {
    "template": {
      "type": "sse",
      "url": "https://api.example.com/mcp/sse",
      "headers": { "Authorization": "Bearer ${API_TOKEN}" }
    }
  }
}
```

**Streamable HTTP** → HTTP bidireccional:
```json
{
  "transport": "streamable-http",
  "inputs": { "API_TOKEN": { "type": "password", ... } },
  "configuration": {
    "template": {
      "type": "streamable-http",
      "url": "https://api.example.com/mcp",
      "headers": { "Authorization": "Bearer ${API_TOKEN}" }
    }
  }
}
```

### Archivo _meta.json por Servicio

```json
{
  "service": "supabase",
  "displayName": "Supabase",
  "description": "Backend as a Service con PostgreSQL",
  "website": "https://supabase.com",
  "icon": "database",
  "category": "database"
}
```

---

## Implementación Técnica

### 1. Servicio de Agregación

Nuevo archivo `src/services/catalogAggregator.ts`:

```typescript
export class CatalogAggregator {
  private mcpsDir = './src/data/mcps';

  async aggregateAll(): Promise<MCPServerDescriptor[]> {
    const services = await this.getServiceFolders();
    const allMcps: MCPServerDescriptor[] = [];

    for (const service of services) {
      const mcps = await this.loadServiceMcps(service);
      allMcps.push(...mcps);
    }

    return allMcps;
  }

  async getByService(service: string): Promise<MCPServerDescriptor[]>;
  async getBySource(source: 'official' | 'community'): Promise<MCPServerDescriptor[]>;  // official = desarrollo oficial, community = no oficial
  async getServices(): Promise<ServiceMeta[]>;
}
```

### 2. Nuevos Endpoints API

| Endpoint | Descripción |
|----------|-------------|
| `GET /api/mcps/services` | Lista de servicios disponibles |
| `GET /api/mcps/service/:service` | MCPs de un servicio específico |
| `GET /api/mcps?source=official` | Filtrar por origen |
| `GET /api/mcps?source=community` | Solo MCPs de comunidad |

### 3. Cache en Build Time

Para Cloudflare Pages, pre-agregar los JSONs durante el build:

```typescript
// vite.config.ts - custom plugin
{
  name: 'aggregate-mcps',
  buildStart() {
    // Read all JSON files from src/data/mcps/**/*.json
    // Generate src/data/mcps-aggregated.json
  }
}
```

### 4. Validación con JSON Schema

`src/data/mcps/_schema.json` para validación automática:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["id", "name", "description", "source", "transport"],
  "properties": {
    "id": { "type": "string", "pattern": "^[a-z0-9-]+$" },
    "source": { "enum": ["official", "community"] },
    ...
  }
}
```

---

## Flujo de Contribución

### Para Añadir un MCP Nuevo

1. **Fork del repositorio**
2. **Crear/usar carpeta del servicio**: `src/data/mcps/[servicio]/`
3. **Crear archivo JSON**: `community-[nombre].json`
4. **Validar localmente**: `npm run validate-mcp`
5. **Abrir PR** con plantilla predefinida

### Issue Template: New MCP Request

```markdown
## New MCP Request

**Service**: [e.g., Notion, Slack, Discord]
**MCP Name**:
**Repository/NPM**:
**Type**: [ ] Official [ ] Community

### Configuration
- Transport: [ ] stdio [ ] sse [ ] streamable-http
- Command (stdio only):
- URL (sse/http only):
- Required inputs:

### Additional information
```

### PR Template

```markdown
## New MCP: [name]

- [ ] Valid JSON according to schema
- [ ] Tested locally
- [ ] Complete inputs documentation
- [ ] Logo/icon provided

**Service**:
**Type**: official/community
**Maintainer checklist**:
- [ ] Unique ID verified
- [ ] Valid URLs
- [ ] No sensitive information
```

---

## Herramientas de CLI

### Comandos Nuevos

```bash
# Validate all MCPs
npm run validate-mcps

# Validate a specific MCP
npm run validate-mcp -- src/data/mcps/supabase/official.json

# Add new MCP interactively
npm run add-mcp

# List MCPs by service
npm run list-mcps

# Generate aggregated catalog
npm run aggregate-mcps
```

### Interactive Script `add-mcp`

```
$ npm run add-mcp

? Service name: notion
? Does the service already exist? No
? Create folder notion? Yes
? MCP name: notion-official
? Is it official or community? official
? Transport (stdio/sse/streamable-http): stdio
? Command: npx
? Arguments: -y @notionhq/mcp
? Required inputs? Yes
  ? Name: NOTION_API_KEY
  ? Label: Notion API Key
  ? Required: Yes
  ? Type: password

Created: src/data/mcps/notion/official.json
```

---

## Mejoras Adicionales

### 1. GitHub Actions para Validación

```yaml
# .github/workflows/validate-mcps.yml
name: Validate MCPs
on: [pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run validate-mcps
      - name: Check for duplicates
        run: npm run check-duplicates
```

### 2. Auto-labeling de PRs

```yaml
# .github/labeler.yml
mcp-official:
  - src/data/mcps/**/official*.json
mcp-community:
  - src/data/mcps/**/community*.json
service-supabase:
  - src/data/mcps/supabase/**
```

### 3. Catálogo Web Auto-generado

Página estática generada en build con:
- Lista de todos los MCPs
- Filtros por servicio/source
- Badges de estado
- Links a PRs/Issues relacionados

### 4. Testing Automático de MCPs

Utilizamos [MCP Inspector](https://github.com/modelcontextprotocol/inspector), la herramienta oficial de testing del protocolo MCP.

#### Niveles de Validación

| Nivel | Descripción | Automatizable |
|-------|-------------|---------------|
| 1. Schema | JSON válido según `_schema.json` | ✅ Siempre |
| 2. Package | Comando/paquete npm existe | ✅ Siempre |
| 3. Connection | MCP responde correctamente | ⚠️ Solo sin auth |

#### GitHub Action

```yaml
# .github/workflows/validate-mcps.yml
name: Validate MCPs
on: [pull_request]

jobs:
  validate-schema:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run validate-mcps

  test-connection:
    runs-on: ubuntu-latest
    needs: validate-schema
    strategy:
      matrix:
        mcp: ${{ fromJson(needs.validate-schema.outputs.testable-mcps) }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Test MCP with Inspector
        run: |
          npx @modelcontextprotocol/inspector \
            --cli ${{ matrix.mcp.command }} ${{ matrix.mcp.args }} \
            --method tools/list \
            --timeout 30000
```

#### Validación Local

```bash
# Test interactivo (abre UI en http://localhost:6274)
npx @modelcontextprotocol/inspector npx -y @playwright/mcp@latest

# Test CLI (para scripts)
npx @modelcontextprotocol/inspector --cli npx -y @playwright/mcp@latest --method tools/list

# Con variables de entorno
npx @modelcontextprotocol/inspector -e API_KEY=xxx npx -y @some/mcp
```

#### Soporte por Transport

| Transport | Comando |
|-----------|---------|
| **stdio** | `npx @modelcontextprotocol/inspector npx -y @playwright/mcp` |
| **sse** | `npx @modelcontextprotocol/inspector --transport sse --url http://example.com/sse` |
| **streamable-http** | `npx @modelcontextprotocol/inspector --transport http --url http://example.com/mcp` |

#### Criterios de Validación

| Tipo MCP | Test en CI | Criterio de éxito |
|----------|------------|-------------------|
| stdio sin inputs | ✅ Completo | `tools/list` responde |
| stdio con inputs | ⚠️ Requiere secrets | `tools/list` responde |
| sse/streamable-http público | ✅ Completo | `tools/list` responde |
| sse/streamable-http con auth | ✅ Parcial | Responde `401`/`403` = MCP válido |

> **Nota**: Una respuesta `401 Unauthorized` o `403 Forbidden` confirma que el MCP existe y está operativo. La falta de credenciales no invalida el MCP.

### 5. Estadísticas y Métricas

- Tracking de instalaciones (opt-in)
- MCPs más populares
- Contribuidores destacados

---

## Plan de Migración

### Fase 1: Preparación
1. Crear estructura de carpetas
2. Implementar JSON Schema
3. Crear script de migración

### Fase 2: Migración
1. Ejecutar script que divide `mcps.json` en archivos individuales
2. Implementar `CatalogAggregator`
3. Actualizar rutas API

### Fase 3: Herramientas
1. CLI interactivo
2. GitHub Actions
3. Templates de Issue/PR

### Fase 4: Documentación
1. Guía de contribución
2. Actualizar README
3. Ejemplos de PRs

---

## Métricas de Éxito

- Reducción del tiempo promedio de merge de PRs de MCPs
- Aumento de contribuciones de la comunidad
- Reducción de conflictos en PRs
- Tasa de validación exitosa en primer intento

---

## Anexo: Convención de Nombres

| Tipo | Patrón | Ejemplo |
|------|--------|---------|
| Oficial | `official.json` o `official-[variante].json` | `official.json`, `official-copilot.json` |
| Comunidad | `community-[nombre].json` | `community-postgres-extra.json` |
| ID del MCP | `[servicio]-[variante]` | `supabase-official`, `github-actions-community` |

---

## Mejoras Futuras

### CODEOWNERS

Cuando el proyecto escale y haya múltiples mantenedores, implementar auto-asignación de reviewers:

```
# .github/CODEOWNERS
src/data/mcps/supabase/    @supabase-maintainer
src/data/mcps/github/      @github-maintainer
src/data/mcps/**/community-*  @levante-maintainers
```

Beneficios:
- Auto-asignación de reviewers en PRs según archivos modificados
- Protección: requiere aprobación del owner antes de merge
- Escalabilidad: cada servicio puede tener su propio mantenedor
