# 🔌 Integración con Levante - Migración de Proveedor Local a API

Este documento explica cómo **migrar el proveedor local de Levante a esta API**, sustituyendo el archivo `mcpRegistry.json` por un endpoint HTTP.

---

## 📋 Contexto

**Situación Actual en Levante**:
- Proveedor "Levante" con `type: "local"`
- Lee desde `src/renderer/data/mcpRegistry.json`
- No requiere normalización (formato nativo)

**Nueva Situación**:
- Proveedor "Levante" con `type: "api"`
- Consume desde `https://services.levanteapp.com/api/mcps.json`
- **Mantiene el mismo formato**, por lo que no requiere normalización compleja

---

## 🔧 Paso 1: Actualizar Proveedor en Levante

**Archivo**: `levante/src/renderer/data/mcpProviders.json`

### Antes (Local)
```json
{
  "id": "levante",
  "name": "Levante",
  "description": "Built-in curated MCP servers",
  "icon": "home",
  "type": "local",
  "endpoint": "mcpRegistry.json",
  "enabled": true,
  "homepage": "https://github.com/levante-hub/levante"
}
```

### Después (API)
```json
{
  "id": "levante",
  "name": "Levante",
  "description": "Official curated MCP servers",
  "icon": "home",
  "type": "api",
  "endpoint": "https://services.levanteapp.com/api/mcps.json",
  "enabled": true,
  "homepage": "https://services.levanteapp.com"
}
```

---

## 🔧 Paso 2: Adaptar Formato de API

Tu API actual devuelve:

```json
{
  "version": "1.0.0",
  "provider": {
    "id": "Levante-store",
    "name": "Levante MCP store",
    "homepage": "https://example.com"
  },
  "servers": [...]
}
```

Pero Levante espera el formato `MCPRegistry`:

```json
{
  "version": "2.0.0",
  "entries": [
    {
      "id": "context7",
      "name": "Context7",
      "description": "...",
      "category": "documentation",
      "icon": "book",
      "transport": {
        "type": "stdio",
        "autoDetect": false
      },
      "configuration": {
        "fields": [...],
        "defaults": {...},
        "template": {...}
      }
    }
  ]
}
```

### Solución: Transformar el Formato de API

**Crear un Normalizador Simple en Levante**

Si prefieres mantener tu formato actual, añade en `MCPProviderService.ts`:

```typescript
private normalizeLevante(data: any, source: string): MCPRegistryEntry[] {
  // Si ya está en formato MCPRegistry (con 'entries')
  if (data.entries) {
    return data.entries.map((entry: MCPRegistryEntry) => ({
      ...entry,
      source
    }));
  }

  // Si está en formato custom (con 'servers')
  if (data.servers) {
    return this.transformCustomFormat(data.servers, source);
  }

  throw new Error('Unknown Levante registry format');
}

private transformCustomFormat(servers: any[], source: string): MCPRegistryEntry[] {
  return servers.map(server => {
    // Generar fields desde env
    const fields: MCPConfigField[] = Object.entries(server.env || {}).map(
      ([key, config]: [string, any]) => ({
        key,
        label: config.label,
        type: config.type,
        required: config.required,
        description: config.description || `Environment variable: ${key}`,
        placeholder: config.default || '',
        default: config.default,
      })
    );

    // Extraer defaults de env
    const envDefaults: Record<string, string> = {};
    Object.entries(server.env || {}).forEach(([key, config]: [string, any]) => {
      if (config.default) {
        envDefaults[key] = config.default;
      }
    });

    return {
      id: server.id,
      name: server.name,
      description: server.description,
      category: server.category,
      icon: server.icon,
      logoUrl: server.logoUrl, // ✅ Ahora logoUrl es un campo directo
      source,
      transport: {
        type: server.transport,
        autoDetect: true,
      },
      configuration: {
        fields,
        defaults: {
          command: server.command,
          args: server.args.join(' '),
        },
        template: {
          type: server.transport,
          command: server.command,
          args: server.args,
          env: envDefaults,
        },
      },
      metadata: {
        ...server.metadata,
      },
    };
  });
}
```

---

## 🔧 Paso 3: Actualizar Routing en `syncProvider()`

**Archivo**: `levante/src/main/services/mcp/MCPProviderService.ts`

```typescript
async syncProvider(provider: MCPProvider): Promise<MCPRegistryEntry[]> {
  let entries: MCPRegistryEntry[];

  if (provider.type === 'local') {
    const rawData = await this.fetchFromLocal(provider.endpoint);
    entries = this.normalizeLevante(rawData, provider.id);
  }
  else if (provider.type === 'api') {
    const rawData = await this.fetchFromAPI(provider.endpoint);

    // Proveedor Levante (ahora desde API)
    if (provider.id === 'levante') {
      entries = this.normalizeLevante(rawData, provider.id);
    }
    // Otros proveedores externos
    else if (provider.id === 'aitempl') {
      entries = this.normalizeAitempl(rawData, provider.id);
    }
    else {
      throw new Error(`Unknown API provider: ${provider.id}`);
    }
  }
  else {
    throw new Error(`Unsupported provider type: ${provider.type}`);
  }

  // Cache resultados
  await mcpCacheService.setCache(provider.id, entries);
  return entries;
}
```

**Nota**: El método `normalizeLevante()` ahora funciona tanto para:
- Archivos locales (formato `MCPRegistry`)
- API remota (formato `MCPRegistry` o custom)

---

## 📝 Paso 4: Migrar Contenido del Registry

### 4.1. Copiar Contenido Existente

Copia el contenido actual de `levante/src/renderer/data/mcpRegistry.json` a tu API:

```bash
# Desde el directorio de Levante
cp src/renderer/data/mcpRegistry.json \
   /path/to/levante-store/src/data/levante-registry.json
```

### 4.2. Actualizar Ruta en API

**Archivo**: `src/routes/mcps.ts`

```typescript
import { Hono } from 'hono';
import type { MCPRegistryEntry } from '../types/mcps';

// Import del registry en formato Levante nativo
import levanteRegistry from '../data/levante-registry.json';

const mcps = new Hono();

// GET /mcps.json → listado completo en formato MCPRegistry
mcps.get('/mcps.json', (c) => {
  c.header('Cache-Control', 'public, max-age=3600');
  c.header('Content-Type', 'application/json');

  return c.json(levanteRegistry);
});

// GET /mcps/:id → servidor concreto
mcps.get('/mcps/:id', (c) => {
  const id = c.req.param('id');
  const data = levanteRegistry as { version: string; entries: MCPRegistryEntry[] };

  const entry = data.entries.find((e) => e.id === id);

  if (!entry) {
    return c.json({ error: 'MCP server not found', id }, 404);
  }

  c.header('Cache-Control', 'public, max-age=3600');
  c.header('Content-Type', 'application/json');

  return c.json(entry);
});

export default mcps;
```

### 4.3. Actualizar TypeScript Types

**Archivo**: `src/types/mcps.ts`

```typescript
export type TransportType = 'stdio' | 'http' | 'sse';

export interface MCPTransport {
  type: TransportType;
  autoDetect: boolean;
}

export interface MCPConfigField {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean';
  required: boolean;
  description?: string;
  placeholder?: string;
  default?: string;
}

export interface MCPConfiguration {
  fields: MCPConfigField[];
  defaults?: Record<string, any>;
  template?: {
    type: TransportType;
    command?: string;
    args?: string[];
    env?: Record<string, string>;
    baseUrl?: string;
    headers?: Record<string, string>;
  };
}

export interface MCPRegistryEntry {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  logoUrl?: string; // ✅ logoUrl ahora es campo directo (no en metadata)
  source?: string;
  transport: MCPTransport;
  configuration: MCPConfiguration;
  metadata?: {
    useCount?: number;
    homepage?: string;
    author?: string;
    repository?: string;
    path?: string;
  };
}

export interface MCPRegistry {
  version: string;
  entries: MCPRegistryEntry[];
}
```

---

## 🧪 Paso 5: Probar la Migración

### 5.1. Verificar Endpoint de API

```bash
# Iniciar servidor de desarrollo
npm run dev

# Probar endpoint
curl http://localhost:5173/api/mcps.json | jq '.version, (.entries | length)'
```

Deberías ver:
```
"2.0.0"
12
```

### 5.2. Probar en Levante (Dev)

1. **Actualiza `mcpProviders.json`** con `type: "api"` y `endpoint: "http://localhost:5173/api/mcps.json"`

2. **Reinicia Levante**:
```bash
cd levante
npm run dev
```

3. **Abre Store Page** y verifica que los servidores se cargan correctamente

4. **Inspecciona Cache**:
```bash
cat ~/.levante/mcp-cache/levante.json
```

### 5.3. Deploy a Producción

```bash
# En levante-store
npm run deploy
```

La URL de producción es: `https://services.levanteapp.com`

### 5.4. Actualizar Levante a Producción

**Archivo**: `levante/src/renderer/data/mcpProviders.json`

```json
{
  "id": "levante",
  "name": "Levante",
  "type": "api",
  "endpoint": "https://services.levanteapp.com/api/mcps.json",
  "enabled": true
}
```

---

## 📊 Ventajas de la Migración

### ✅ Antes (Local)
- ❌ Requiere rebuild de Levante para actualizar registry
- ❌ Tamaño del bundle aumenta con cada servidor
- ❌ No hay analytics de uso
- ❌ Sin versionado independiente

### ✅ Después (API)
- ✅ Actualizaciones instantáneas sin rebuild
- ✅ Bundle size optimizado (descarga bajo demanda)
- ✅ Posibilidad de analytics (Cloudflare Analytics)
- ✅ Versionado independiente del registry
- ✅ Cache con CDN global (edge caching)
- ✅ Posibilidad de A/B testing

---

## 🔍 Comparación de Flujo

### Antes (Local)
```
Usuario abre Store
    ↓
UI lee mcpRegistry.json (bundled)
    ↓
No requiere IPC ni normalización
    ↓
Muestra servidores directamente
```

### Después (API)
```
Usuario abre Store
    ↓
UI llama syncProvider('levante')
    ↓
IPC → Main Process
    ↓
fetchFromAPI('https://services.levanteapp.com/api/mcps.json')
    ↓
normalizeLevante() [opcional si formato coincide]
    ↓
Cache en ~/.levante/mcp-cache/levante.json
    ↓
Retorna a UI → Muestra servidores
```

---

## 🛡️ Consideraciones de Seguridad

### 1. HTTPS Obligatorio
- ✅ Cloudflare Pages proporciona HTTPS automático
- ✅ Levante debe rechazar endpoints HTTP en producción

### 2. Validación de Schema
Añade validación en `fetchFromAPI()`:

```typescript
private async fetchFromAPI(url: string): Promise<any> {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Levante/1.0.0' }
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  const data = await response.json();

  // Validar estructura básica
  if (!data.version || !data.entries) {
    throw new Error('Invalid MCPRegistry format');
  }

  return data;
}
```

### 3. Timeout y Retry
```typescript
private async fetchFromAPI(url: string, retries = 3): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000); // 5s

      const response = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Levante/1.0.0' }
      });

      clearTimeout(timeout);

      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

---

## 🔧 Fallback a Local (Opcional)

Si quieres mantener un fallback local en caso de que la API falle:

```typescript
async syncProvider(provider: MCPProvider): Promise<MCPRegistryEntry[]> {
  if (provider.id === 'levante' && provider.type === 'api') {
    try {
      const rawData = await this.fetchFromAPI(provider.endpoint);
      return this.normalizeLevante(rawData, provider.id);
    } catch (err) {
      console.warn('API fetch failed, falling back to local registry:', err);

      // Fallback a archivo local bundled
      const localData = await this.fetchFromLocal('mcpRegistry.json');
      return this.normalizeLevante(localData, provider.id);
    }
  }

  // ... resto del código
}
```

---

## 📚 Checklist de Migración

- [ ] Copiar `mcpRegistry.json` a `levante-store/src/data/levante-registry.json`
- [ ] Actualizar `src/routes/mcps.ts` para usar el nuevo formato
- [ ] Actualizar `src/types/mcps.ts` con interfaces de Levante
- [ ] Probar endpoints localmente (`npm run dev`)
- [ ] Deploy a Cloudflare Pages (`npm run deploy`)
- [ ] Actualizar `mcpProviders.json` en Levante con `type: "api"`
- [ ] Probar sincronización en Levante (dev)
- [ ] Verificar cache en `~/.levante/mcp-cache/levante.json`
- [ ] Probar instalación de servidores desde Store
- [ ] Deploy de Levante con nueva configuración
- [ ] (Opcional) Eliminar `mcpRegistry.json` local de Levante
- [ ] Actualizar documentación de Levante

---

## 🎉 Resultado Final

Después de la migración:

1. ✅ Levante consume su registry desde API HTTP
2. ✅ Actualizaciones de servidores sin rebuild
3. ✅ Compatible con otros proveedores (AITempl, etc.)
4. ✅ Cache local con TTL de 1 hora
5. ✅ Mismo UX para el usuario final
6. ✅ Base para futuras mejoras (analytics, A/B testing, etc.)

---

## 📖 Referencias

- [API Documentation](./API.md)
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)
- [Levante MCP Registry Architecture](./levante_mcp_registry.md)
