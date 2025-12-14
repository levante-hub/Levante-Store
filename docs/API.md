# Saúl MCP Store API

API RESTful para exponer un catálogo de servidores MCP (Model Context Protocol) consumible por Levante.

## 🚀 Inicio Rápido

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Preview (Cloudflare Pages)
npm run preview

# Deploy
npm run deploy
```

## 📡 Endpoints

### Base URL
- **Desarrollo**: `http://localhost:5173/api`
- **Producción**: `https://services.levanteapp.com/api`

---

### `GET /api/mcps.json`

Retorna el catálogo completo de servidores MCP disponibles.

**Response:**
```json
{
  "version": "1.0.0",
  "provider": {
    "id": "saul-store",
    "name": "Saúl MCP Store",
    "homepage": "https://example.com"
  },
  "servers": [
    {
      "id": "filesystem",
      "name": "Filesystem",
      "description": "Access local file system with secure path management",
      "category": "development",
      "icon": "server",
      "logoUrl": "https://...",
      "transport": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem"],
      "env": {
        "FILESYSTEM_ROOT": {
          "label": "Root directory",
          "required": true,
          "type": "string",
          "default": "/path",
          "description": "Base path accessible by the server"
        }
      },
      "metadata": {
        "homepage": "https://github.com/...",
        "author": "MCP Community",
        "repository": "https://github.com/...",
        "useCount": 1234
      }
    }
  ]
}
```

**Headers:**
- `Cache-Control: public, max-age=3600`
- `Content-Type: application/json`
- `Access-Control-Allow-Origin: *`

---

### `GET /api/mcps/:id`

Retorna información detallada de un servidor MCP específico.

**Parámetros:**
- `id` (path): ID del servidor MCP

**Ejemplo:**
```bash
curl http://localhost:5173/api/mcps/filesystem
```

**Response (200):**
```json
{
  "id": "filesystem",
  "name": "Filesystem",
  "description": "Access local file system with secure path management",
  "category": "development",
  "icon": "server",
  "logoUrl": "https://...",
  "transport": "stdio",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-filesystem"],
  "env": {
    "FILESYSTEM_ROOT": {
      "label": "Root directory",
      "required": true,
      "type": "string",
      "default": "/path",
      "description": "Base path accessible by the server"
    }
  },
  "metadata": {
    "homepage": "https://github.com/...",
    "author": "MCP Community",
    "repository": "https://github.com/...",
    "useCount": 1234
  }
}
```

**Response (404):**
```json
{
  "error": "MCP server not found",
  "id": "nonexistent"
}
```

---

### `GET /api/mcps`

Alias que redirige a `/api/mcps.json` (por conveniencia).

---

## 🗂️ Estructura del Proyecto

```
src/
├── index.tsx              # Aplicación principal Hono
├── renderer.tsx           # JSX renderer (UI)
├── routes/
│   └── mcps.ts           # Rutas de la API MCP
├── types/
│   └── mcps.ts           # Interfaces TypeScript
├── data/
│   └── mcps.json         # Catálogo estático de MCPs
└── middleware/
    └── errorHandler.ts   # Manejo global de errores
```

---

## 🔧 Formato del Catálogo

El archivo `src/data/mcps.json` sigue este esquema:

### `MCPStoreResponse`

```typescript
interface MCPStoreResponse {
  version: string;
  provider: {
    id: string;
    name: string;
    homepage?: string;
  };
  servers: MCPServerDescriptor[];
}
```

### `MCPServerDescriptor`

```typescript
interface MCPServerDescriptor {
  id: string;                           // ID único del servidor
  name: string;                         // Nombre visible
  description: string;                  // Descripción corta
  category: string;                     // development | database | search | etc.
  icon: string;                         // Icono genérico (lucide)
  logoUrl?: string;                     // URL del logo específico (PNG/SVG)
  transport: 'stdio' | 'http' | 'sse'; // Tipo de transporte
  command: string;                      // Comando para ejecutar (ej: "npx")
  args: string[];                       // Argumentos del comando
  env: Record<string, EnvVarDefinition>; // Variables de entorno configurables
  metadata?: {
    homepage?: string;
    author?: string;
    repository?: string;
    useCount?: number;                  // Contador de instalaciones
  };
}
```

### `EnvVarDefinition`

```typescript
interface EnvVarDefinition {
  label: string;        // Etiqueta para UI
  required: boolean;    // Si es obligatorio
  type: 'string' | 'number' | 'boolean';
  default?: string;     // Valor por defecto
  description?: string; // Ayuda contextual
}
```

---

## 🔌 Integración con Levante

Para agregar esta API como proveedor en Levante, añade en `src/renderer/data/mcpProviders.json`:

```json
{
  "id": "saul-store",
  "name": "Saúl MCP Store",
  "description": "Custom MCP servers from Saúl's store",
  "icon": "star",
  "type": "api",
  "endpoint": "https://services.levanteapp.com/api/mcps.json",
  "enabled": true,
  "homepage": "https://services.levanteapp.com"
}
```

Levante consumirá automáticamente el endpoint `/api/mcps.json` y normalizará los servidores a su formato interno `MCPRegistryEntry`.

---

## 🛡️ Características de Seguridad

- **CORS**: Configurado para permitir acceso desde cualquier origen (`*`)
- **Error Handling**: Middleware global que captura excepciones
- **404 Handler**: Respuestas JSON estructuradas para rutas no encontradas
- **Logging**: Registro de todas las peticiones HTTP con tiempo de respuesta
- **Cache Headers**: 1 hora de cache (`max-age=3600`)

---

## 📝 Notas de Desarrollo

### Agregar un Nuevo Servidor MCP

1. Edita `src/data/mcps.json`
2. Añade un nuevo objeto en el array `servers`:

```json
{
  "id": "nuevo-server",
  "name": "Nuevo Server",
  "description": "Descripción del servidor",
  "category": "development",
  "icon": "server",
  "logoUrl": "https://example.com/logo.png",
  "transport": "stdio",
  "command": "npx",
  "args": ["-y", "@namespace/mcp-server"],
  "env": {
    "API_KEY": {
      "label": "API Key",
      "required": true,
      "type": "string",
      "description": "Your API key"
    }
  },
  "metadata": {
    "homepage": "https://github.com/...",
    "author": "Author Name",
    "repository": "https://github.com/...",
    "useCount": 0
  }
}
```

3. Reinicia el servidor de desarrollo

### Cambiar el Max-Age del Cache

Edita los headers en `src/routes/mcps.ts`:

```typescript
c.header('Cache-Control', 'public, max-age=7200'); // 2 horas
```

### Restringir CORS a un Dominio Específico

En `src/index.tsx`:

```typescript
app.use(
  '*',
  cors({
    origin: 'https://tu-dominio.com',
    allowMethods: ['GET', 'OPTIONS'],
  })
);
```

---

## 🚀 Deploy a Cloudflare Pages

```bash
# Build + deploy
npm run deploy

# Solo preview local
npm run preview
```

La configuración de Cloudflare se encuentra en `wrangler.jsonc`.

---

## 🔗 Referencias

- [Hono Documentation](https://hono.dev/)
- [Cloudflare Pages](https://pages.cloudflare.com/)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)
- [Levante MCP Registry Architecture](./levante_mcp_registry.md)
