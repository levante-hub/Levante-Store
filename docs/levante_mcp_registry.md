# Levante MCP Registry: Arquitectura de Proveedores Externos

## Visión General

Levante implementa un sistema de **MCP Registry** que permite descubrir e instalar servidores MCP desde múltiples fuentes externas. Este documento describe cómo funcionan los proveedores de MCPs y cómo se transforma la información externa al formato interno de Levante.

Nota: el catálogo admite la categoría temática `christmas` para MCPs navideños temporales además de las categorías estándar.

## Arquitectura de Proveedores

### 1. Definición de Proveedores

Los proveedores se definen en `src/renderer/data/mcpProviders.json`:

```json
{
  "version": "1.0.0",
  "lastUpdated": "2025-01-14",
  "providers": [
    {
      "id": "levante",
      "name": "Levante",
      "description": "Built-in curated MCP servers",
      "icon": "home",
      "type": "local",
      "endpoint": "mcpRegistry.json",
      "enabled": true,
      "homepage": "https://github.com/levante-hub/levante"
    },
    {
      "id": "aitempl",
      "name": "AITempl",
      "description": "MCP server templates from aitmpl.com",
      "icon": "star",
      "type": "api",
      "endpoint": "https://www.aitmpl.com/components.json",
      "enabled": true,
      "homepage": "https://www.aitmpl.com"
    }
  ]
}
```

### 2. Tipos de Proveedores

| Tipo | Descripción | Estado |
|------|-------------|--------|
| `local` | Lee archivos JSON locales del proyecto | ✅ Implementado |
| `api` | Consume APIs REST externas | ✅ Implementado |
| `github` | Lee registros desde repositorios GitHub | 🔄 Planificado |

### 3. Interfaz MCPProvider

```typescript
interface MCPProvider {
  id: string;              // Identificador único
  name: string;            // Nombre visible
  description: string;     // Descripción del proveedor
  icon: string;            // Icono para UI
  type: 'local' | 'github' | 'api';
  endpoint: string;        // URL o path al recurso
  enabled: boolean;        // Si está habilitado
  homepage?: string;       // URL de documentación
  lastSynced?: string;     // Última sincronización
  serverCount?: number;    // Cantidad de servidores
  config?: {
    branch?: string;       // Para GitHub
    path?: string;         // Path al archivo
    authRequired?: boolean;
    authToken?: string;
  };
}
```

## Flujo de Sincronización

### 1. Ciclo de Vida

```
Usuario abre Store Page
    ↓
UI carga proveedores (mcpStore.syncAllProviders)
    ↓
IPC: levante/mcp/providers/sync
    ↓
MCPProviderService.syncProvider(provider)
    ↓
┌─────────────────┬──────────────────┐
│  type: 'local'  │   type: 'api'   │
│  fetchFromLocal │   fetchFromAPI  │
└─────────────────┴──────────────────┘
    ↓
Normalización (normalizeLevante / normalizeAitempl)
    ↓
MCPCacheService.setCache(providerId, entries)
    ↓
Retorno a UI con MCPRegistryEntry[]
```

### 2. Código del Servicio Principal

**Archivo**: `src/main/services/mcp/MCPProviderService.ts`

```typescript
export class MCPProviderService {
  async syncProvider(provider: MCPProvider): Promise<MCPRegistryEntry[]> {
    let entries: MCPRegistryEntry[];

    if (provider.type === 'local') {
      const rawData = await this.fetchFromLocal(provider.endpoint);
      entries = this.normalizeLevante(rawData, provider.id);
    }
    else if (provider.type === 'api') {
      const rawData = await this.fetchFromAPI(provider.endpoint);

      if (provider.id === 'aitempl') {
        entries = this.normalizeAitempl(rawData, provider.id);
      }
    }

    // Cache resultados
    await mcpCacheService.setCache(provider.id, entries);
    return entries;
  }
}
```

## Formato Externo vs Formato Interno

### Proveedor: Levante (local)

**Fuente**: `src/renderer/data/mcpRegistry.json`

**Formato**: Ya está en formato `MCPRegistryEntry`, no requiere transformación.

```json
{
  "version": "2.0.0",
  "entries": [
    {
      "id": "context7",
      "name": "Context7",
      "description": "Access up-to-date documentation",
      "category": "documentation",
      "icon": "book",
      "transport": {
        "type": "stdio",
        "autoDetect": false
      },
      "configuration": {
        "fields": [...],
        "defaults": {
          "command": "npx",
          "args": "-y @upstash/context7-mcp@latest"
        },
        "template": {
          "type": "stdio",
          "command": "npx",
          "args": ["-y", "@upstash/context7-mcp@latest"],
          "env": {}
        }
      }
    }
  ]
}
```

### Proveedor: AITempl (api)

**Endpoint**: `https://www.aitmpl.com/components.json`

**Formato Externo**:
```json
{
  "mcps": [
    {
      "name": "filesystem",
      "description": "Access local file system",
      "category": "development",
      "downloads": 1523,
      "content": "{\"mcpServers\":{\"filesystem\":{\"command\":\"npx\",\"args\":[\"-y\",\"@modelcontextprotocol/server-filesystem\",\"/path\"],\"env\":{\"FILESYSTEM_ROOT\":\"/path\"}}}}"
    }
  ]
}
```

**Proceso de Normalización** (`normalizeAitempl`):

1. **Parsear el campo `content`** que contiene JSON stringificado
2. **Extraer configuración** del objeto `mcpServers`
3. **Transformar a MCPRegistryEntry**:
   - `id`: `${source}-${server.name}` → `"aitempl-filesystem"`
   - `name`: Directamente de `server.name`
   - `category`: De `server.category`
   - `transport`: Siempre `{ type: 'stdio', autoDetect: true }`
   - `configuration.fields`: Generados desde las keys de `env`
   - `configuration.template`: Extraído de `command`, `args`, `env`
   - `metadata.useCount`: Mapeo de `downloads`

**Resultado Normalizado**:
```typescript
{
  id: "aitempl-filesystem",
  name: "filesystem",
  description: "Access local file system",
  category: "development",
  icon: "server",
  source: "aitempl",
  transport: { type: "stdio", autoDetect: true },
  configuration: {
    fields: [
      {
        key: "FILESYSTEM_ROOT",
        label: "FILESYSTEM_ROOT",
        type: "string",
        required: true,
        description: "Environment variable: FILESYSTEM_ROOT",
        placeholder: "/path"
      }
    ],
    defaults: {
      command: "npx",
      args: "-y @modelcontextprotocol/server-filesystem /path"
    },
    template: {
      type: "stdio",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem", "/path"],
      env: {
        FILESYSTEM_ROOT: "/path"
      }
    }
  },
  metadata: {
    useCount: 1523
  }
}
```

## Formato Interno: MCPRegistryEntry

Este es el formato unificado que Levante usa internamente:

```typescript
interface MCPRegistryEntry {
  // Identificación
  id: string;                    // ID único del servidor
  name: string;                  // Nombre visible
  description: string;           // Descripción
  category: string;              // Categoría (documentation, development, etc.)
  icon: string;                  // Icono para UI

  // Proveedor
  source?: string;               // 'levante' | 'aitempl' | etc.

  // Transporte
  transport: {
    type: 'stdio' | 'http' | 'sse';
    autoDetect: boolean;
  };

  // Configuración
  configuration: {
    fields: MCPConfigField[];    // Campos de configuración UI
    defaults?: Record<string, any>;
    template?: {
      type: 'stdio' | 'http' | 'sse';
      // Para stdio:
      command?: string;
      args?: string[];
      env?: Record<string, string>;
      // Para http/sse:
      baseUrl?: string;
      headers?: Record<string, string>;
    };
  };

  // Metadata adicional
  metadata?: {
    useCount?: number;           // Cantidad de descargas
    homepage?: string;
    author?: string;
    repository?: string;
    path?: string;
  };
}
```

## Sistema de Caché

**Archivo**: `src/main/services/mcp/MCPCacheService.ts`

### Estructura de Cache

```typescript
interface CacheEntry<T> {
  data: T;              // MCPRegistryEntry[]
  timestamp: number;    // Timestamp de última actualización
  version: string;      // Versión del schema
}
```

### Ubicación del Cache

- **Directorio**: `~/levante/mcp-cache/`
- **Archivos**: `{providerId}.json` (ej: `aitempl.json`, `levante.json`)
- **Memoria**: Cache en memoria para acceso rápido

### Políticas de Cache

- **Max Age**: 1 hora por defecto (`defaultCacheMaxAge = 60 * 60 * 1000`)
- **Validación**: Se comprueba timestamp antes de usar cache
- **Sync**: Si cache no existe o está expirado, se sincroniza automáticamente

## IPC Communication

### Handlers Registrados

**Archivo**: `src/main/ipc/mcpHandlers/providers.ts`

| Canal IPC | Función | Retorno |
|-----------|---------|---------|
| `levante/mcp/providers/list` | Lista todos los proveedores | `MCPProvider[]` con info de cache |
| `levante/mcp/providers/sync` | Sincroniza un proveedor específico | `{ providerId, entries, syncedAt }` |
| `levante/mcp/providers/sync-all` | Sincroniza todos los habilitados | Resultados por proveedor |
| `levante/mcp/providers/get-entries` | Obtiene entries de cache (o sincroniza) | `MCPRegistryEntry[]` |
| `levante/mcp/providers/get-all-entries` | Obtiene todos los entries | Todos los `MCPRegistryEntry[]` |

### API Expuesta al Renderer

**Archivo**: `src/preload/api/mcp.ts`

```typescript
window.levante.mcp.providers = {
  list: () => ipcRenderer.invoke('levante/mcp/providers/list'),
  sync: (providerId) => ipcRenderer.invoke('levante/mcp/providers/sync', providerId),
  syncAll: () => ipcRenderer.invoke('levante/mcp/providers/sync-all'),
  getEntries: (providerId) => ipcRenderer.invoke('levante/mcp/providers/get-entries', providerId),
  getAllEntries: () => ipcRenderer.invoke('levante/mcp/providers/get-all-entries')
}
```

## Estado en el Frontend

**Archivo**: `src/renderer/stores/mcpStore.ts` (Zustand)

```typescript
interface MCPStore {
  // Provider state
  providers: MCPProvider[];                    // Lista de proveedores
  selectedProvider: string | 'all';            // Filtro actual
  loadingProviders: Record<string, boolean>;   // Estado de carga
  providerEntries: Record<string, MCPRegistryEntry[]>; // Entries por proveedor

  // Actions
  loadProviders: () => Promise<void>;
  syncProvider: (providerId: string) => Promise<void>;
  syncAllProviders: () => Promise<void>;
  setSelectedProvider: (providerId: string | 'all') => void;
  getFilteredEntries: () => MCPRegistryEntry[];
}
```

## UI: Store Page

**Archivo**: `src/renderer/components/mcp/store-page/store-layout.tsx`

### Ciclo de Vida de UI

1. **Mount**:
   - Carga registry local (`mcpRegistry.json`)
   - Sincroniza proveedores externos una vez por sesión

2. **Filtrado**:
   - Por proveedor: `selectedProvider` ('all', 'levante', 'aitempl')
   - Por búsqueda: Texto libre en nombre/descripción/categoría

3. **Visualización**:
   - `IntegrationCard` muestra cada servidor disponible
   - Badge indica el proveedor (`source` field)
   - Botón "Install" agrega a `.mcp.json`

### Provider Filter Component

Permite filtrar por proveedor específico:
- **All**: Muestra todos los servidores de todos los proveedores
- **Levante**: Solo servidores del registry local
- **AITempl**: Solo servidores de aitmpl.com

## Agregar un Nuevo Proveedor

### Opción 1: Proveedor API

1. **Agregar a `mcpProviders.json`**:
```json
{
  "id": "nuevo-proveedor",
  "name": "Nuevo Proveedor",
  "type": "api",
  "endpoint": "https://api.ejemplo.com/mcps.json",
  "enabled": true
}
```

2. **Crear normalizador en `MCPProviderService.ts`**:
```typescript
private normalizeNuevoProveedor(data: ApiResponse, source: string): MCPRegistryEntry[] {
  return data.servers.map(server => ({
    id: `${source}-${server.id}`,
    name: server.name,
    // ... transformación al formato MCPRegistryEntry
  }));
}
```

3. **Agregar routing en `syncProvider`**:
```typescript
if (provider.id === 'nuevo-proveedor') {
  entries = this.normalizeNuevoProveedor(rawData, provider.id);
}
```

### Opción 2: Proveedor Local

1. **Crear archivo JSON** en `src/renderer/data/`
2. **Agregar a `mcpProviders.json`** con `type: 'local'`
3. El archivo debe seguir el formato `MCPRegistry` (no requiere normalización)

## Resumen del Flujo Completo

```
┌──────────────────┐
│ mcpProviders.json│  → Define proveedores (Levante, AITempl)
└────────┬─────────┘
         ↓
┌────────────────────────────────────────────────┐
│ UI: Store Page (store-layout.tsx)             │
│ - useEffect → syncAllProviders()               │
└────────┬───────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────┐
│ Zustand Store (mcpStore.ts)                    │
│ - window.levante.mcp.providers.sync(id)        │
└────────┬───────────────────────────────────────┘
         ↓ IPC
┌────────────────────────────────────────────────┐
│ Main Process: providers.ts (IPC Handler)       │
│ - ipcMain.handle('levante/mcp/providers/sync') │
└────────┬───────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────┐
│ MCPProviderService.syncProvider(provider)      │
│ - fetchFromAPI() o fetchFromLocal()            │
│ - normalizeAitempl() o normalizeLevante()      │
└────────┬───────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────┐
│ MCPCacheService.setCache(id, entries)          │
│ - Memoria + Archivo (~/.levante/mcp-cache/)    │
└────────┬───────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────┐
│ Retorno a UI: MCPRegistryEntry[]               │
│ - Formato unificado interno de Levante         │
│ - Renderizado en IntegrationCard               │
└────────────────────────────────────────────────┘
```

## Archivos Clave

| Archivo | Propósito |
|---------|-----------|
| `src/renderer/data/mcpProviders.json` | Definición de proveedores |
| `src/renderer/data/mcpRegistry.json` | Registry local de Levante |
| `src/main/services/mcp/MCPProviderService.ts` | Lógica de sincronización y normalización |
| `src/main/services/mcp/MCPCacheService.ts` | Sistema de caché |
| `src/main/ipc/mcpHandlers/providers.ts` | Handlers IPC |
| `src/preload/api/mcp.ts` | API expuesta al renderer |
| `src/renderer/stores/mcpStore.ts` | Estado global (Zustand) |
| `src/renderer/components/mcp/store-page/store-layout.tsx` | UI principal |
| `src/renderer/types/mcp.ts` | Interfaces TypeScript |

## Consideraciones Importantes

### 1. Normalización es Crítica

Cada proveedor externo puede tener su propio formato de API. El normalizador debe:
- Extraer toda la información necesaria
- Mapear correctamente transport type (stdio/http/sse)
- Generar `configuration.fields` para UI
- Crear `configuration.template` para instalación
- Asignar el `source` para tracking

### 2. Cache Híbrido

- **Memoria**: Rápido, pero se pierde al reiniciar
- **Archivo**: Persistente, sobrevive reinicios
- **TTL**: 1 hora por defecto, ajustable

### 3. Seguridad

- APIs externas se consumen con `User-Agent` identificativo
- No se ejecuta código de proveedores externos
- Solo se procesan metadatos y configuraciones

### 4. Extensibilidad

El sistema está diseñado para escalar:
- Agregar nuevos proveedores es simple
- Cada proveedor es independiente
- El formato interno (`MCPRegistryEntry`) es estable
