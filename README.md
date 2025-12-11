# 🏪 Levante MCP Store

API RESTful para exponer un catálogo de servidores MCP (Model Context Protocol) consumible por [Levante](https://github.com/levante-hub/levante).

## 🚀 Inicio Rápido

```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev
# ➜ http://localhost:5173/api/mcps.json

# Build
npm run build

# Preview local (Cloudflare Pages)
npm run preview

# Deploy a Cloudflare Pages
npm run deploy
```

## 📡 Endpoints

- `GET /api/mcps.json` - Catálogo completo de servidores MCP
- `GET /api/mcps/:id` - Servidor específico por ID
- `GET /api/mcps` - Alias que redirige a `/mcps.json`

## 🧪 Testing

```bash
# Probar todos los endpoints
./test-api.sh

# Probar contra producción
./test-api.sh https://tu-dominio.pages.dev
```

## 📚 Documentación

- **[API.md](./API.md)** - Documentación completa de la API
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Resumen de implementación
- **[levante_mcp_registry.md](./levante_mcp_registry.md)** - Arquitectura de referencia

## 🏗️ Stack Tecnológico

- **[Hono](https://hono.dev/)** - Framework web ultrarrápido
- **[Cloudflare Pages](https://pages.cloudflare.com/)** - Hosting y edge computing
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[Vite](https://vitejs.dev/)** - Build tool

## 🔌 Integración con Levante

Para consumir esta API desde Levante, añade en `src/renderer/data/mcpProviders.json`:

```json
{
  "id": "saul-store",
  "name": "Saúl MCP Store",
  "type": "api",
  "endpoint": "https://tu-dominio.pages.dev/api/mcps.json",
  "enabled": true
}
```

## 📝 Agregar Nuevos Servidores

Edita `src/data/mcps.json` y añade un nuevo servidor:

```json
{
  "id": "nuevo-server",
  "name": "Nuevo Server",
  "description": "Descripción",
  "category": "development",
  "icon": "server",
  "logoUrl": "https://...",
  "transport": "stdio",
  "command": "npx",
  "args": ["-y", "@namespace/mcp-server"],
  "env": {
    "API_KEY": {
      "label": "API Key",
      "required": true,
      "type": "string"
    }
  }
}
```

## 🔧 Configuración Cloudflare

```bash
# Generar/sincronizar types de Worker
npm run cf-typegen
```

Para usar bindings de Cloudflare, pasa `CloudflareBindings` como genérico:

```ts
const app = new Hono<{ Bindings: CloudflareBindings }>()
```

## 📦 Catálogo Actual

- 📚 **Context7** - Documentación y ejemplos de librerías
- 🐙 **GitHub Copilot MCP** - Acceso a repos GitHub vía API MCP
- 🌐 **Playwright** - Automatización de navegador y testing
- 📘 **Microsoft Docs** - Documentación técnica de Microsoft Learn
- 🟩 **Supabase** - Acceso a proyectos y APIs de Supabase

## 📄 Licencia

MIT
