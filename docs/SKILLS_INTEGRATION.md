# Skills API — Guía de Integración para Levante

Este documento describe cómo integrar la Skills API de Levante Store en la aplicación Levante para listar skills disponibles, filtrarlas por categoría y descargar su contenido completo.

---

## Índice

1. [Visión general](#1-visión-general)
2. [Base URL y cabeceras](#2-base-url-y-cabeceras)
3. [Referencia de endpoints](#3-referencia-de-endpoints)
4. [Tipos TypeScript](#4-tipos-typescript)
5. [Integración paso a paso](#5-integración-paso-a-paso)
6. [Caché y rendimiento](#6-caché-y-rendimiento)
7. [Manejo de errores](#7-manejo-de-errores)
8. [Ejemplos de uso](#8-ejemplos-de-uso)

---

## 1. Visión general

Las **skills** son instrucciones para agentes de IA, almacenadas como archivos `SKILL.md` con frontmatter YAML. La API expone esas skills como JSON, incluyendo el contenido markdown completo del archivo, listo para inyectarse en el contexto de un agente.

Cada skill tiene un **ID compuesto** con el formato `{categoría}/{nombre}` (p.ej. `development/react-patterns`). Las skills se cargan en tiempo de build desde `src/modules/skills/data/skills/{categoría}/{nombre}/SKILL.md`, de modo que la API no realiza I/O en tiempo de ejecución.

**Flujo de uso típico en Levante:**

```
Usuario abre Skills Store
       ↓
Fetch GET /api/skills.json   → lista completa con contenido
       ↓
Mostrar catálogo agrupado por categoría
       ↓
Usuario selecciona una skill
       ↓
Fetch GET /api/skills/{category}/{name}  → skill individual
       ↓
Instalar contenido en el agente / guardar localmente
```

---

## 2. Base URL y cabeceras

| Entorno     | Base URL                                 |
|-------------|------------------------------------------|
| Producción  | `https://services.levanteapp.com`        |
| Desarrollo  | `http://localhost:5180`                  |

Todas las respuestas devuelven:

```
Content-Type: application/json
Cache-Control: public, max-age=3600
```

No se requiere autenticación. La API es pública y de solo lectura.

---

## 3. Referencia de endpoints

### 3.1 `GET /api/skills.json` — Catálogo completo

Devuelve todas las skills disponibles, incluyendo su contenido markdown.

**Respuesta 200:**

```json
{
  "version": "1.0.0",
  "total": 3,
  "skills": [
    {
      "id": "database/sql-optimization",
      "name": "sql-optimization",
      "description": "Techniques for writing and optimizing SQL queries...",
      "category": "database",
      "author": "levante",
      "version": "1.0.0",
      "license": "MIT",
      "tags": ["SQL", "PostgreSQL", "Performance"],
      "allowedTools": "Read, Write, Edit",
      "model": "sonnet",
      "userInvocable": true,
      "content": "# SQL Optimization\n\n## When to Use\n..."
    },
    {
      "id": "development/react-patterns",
      "name": "react-patterns",
      "description": "Modern React patterns and principles...",
      "category": "development",
      "tags": ["React", "TypeScript", "Hooks"],
      "content": "# React Patterns\n\n..."
    }
  ]
}
```

---

### 3.2 `GET /api/skills/{category}/{name}` — Skill individual

Devuelve una skill específica por su ID compuesto.

**Ejemplo:** `GET /api/skills/development/react-patterns`

**Respuesta 200:**

```json
{
  "id": "development/react-patterns",
  "name": "react-patterns",
  "description": "Modern React patterns and principles...",
  "category": "development",
  "author": "levante",
  "version": "1.0.0",
  "license": "MIT",
  "tags": ["React", "TypeScript", "Hooks", "Patterns", "Performance", "Components"],
  "allowedTools": "Read, Write, Edit, Glob, Grep",
  "model": "sonnet",
  "userInvocable": true,
  "dependencies": ["react>=18.0.0", "typescript>=5.0.0"],
  "content": "# React Patterns\n\n## When to Use\n\n- When building new React components..."
}
```

**Respuesta 404:**

```json
{
  "error": "Skill not found",
  "id": "development/non-existent"
}
```

---

### 3.3 `GET /api/skills/categories` — Lista de categorías

Devuelve las categorías disponibles con nombre legible y recuento de skills.

**Respuesta 200:**

```json
{
  "categories": [
    { "category": "database",     "displayName": "Database",    "count": 1 },
    { "category": "development",  "displayName": "Development", "count": 1 },
    { "category": "writing",      "displayName": "Writing",     "count": 1 }
  ]
}
```

El campo `displayName` es el nombre legible generado automáticamente: cada segmento separado por `-` se capitaliza (p.ej. `ai-agents` → `Ai Agents`).

---

### 3.4 `GET /api/skills/category/{cat}` — Skills de una categoría

Devuelve todas las skills de una categoría específica.

**Ejemplo:** `GET /api/skills/category/development`

**Respuesta 200:**

```json
{
  "category": "development",
  "total": 1,
  "skills": [
    {
      "id": "development/react-patterns",
      "name": "react-patterns",
      ...
    }
  ]
}
```

**Respuesta 404** (categoría inexistente):

```json
{
  "error": "Category not found",
  "category": "non-existent"
}
```

---

### 3.5 `GET /api/skills/stats` — Estadísticas del catálogo

Devuelve métricas globales del catálogo.

**Respuesta 200:**

```json
{
  "total": 3,
  "categories": 3,
  "categoryList": ["database", "development", "writing"]
}
```

---

## 4. Tipos TypeScript

Copia estas interfaces en el proyecto Levante para tipar las respuestas de la API.

```typescript
// types/skills.ts

export interface SkillDescriptor {
  /** ID compuesto: "category/name" — p.ej. "development/react-patterns" */
  id: string
  /** Nombre de la skill, tal como aparece en el frontmatter */
  name: string
  /** Descripción breve de la skill */
  description: string
  /** Categoría (primer segmento del ID) */
  category: string

  // Campos opcionales del frontmatter
  author?: string
  version?: string
  license?: string
  tags?: string[]
  /** Herramientas permitidas, p.ej. "Read, Write, Edit" */
  allowedTools?: string
  /** Modelo recomendado, p.ej. "sonnet" */
  model?: string
  /** Si el usuario puede invocar la skill directamente */
  userInvocable?: boolean
  dependencies?: string[]
  source?: string
  repo?: string

  /** Cuerpo markdown de la skill (tras el frontmatter) */
  content: string
  metadata?: Record<string, unknown>
}

export interface SkillCategory {
  category: string
  /** Nombre legible: "development" → "Development" */
  displayName: string
  count: number
}

export interface SkillsCatalogResponse {
  version: string
  total: number
  skills: SkillDescriptor[]
}

export interface SkillsCategoriesResponse {
  categories: SkillCategory[]
}

export interface SkillsStatsResponse {
  total: number
  categories: number
  categoryList: string[]
}

export interface SkillsByCategoryResponse {
  category: string
  total: number
  skills: SkillDescriptor[]
}
```

---

## 5. Integración paso a paso

### 5.1 Servicio de Skills

Crea un servicio centralizado que encapsule todas las llamadas a la API.

```typescript
// services/SkillsService.ts

import type {
  SkillDescriptor,
  SkillsCatalogResponse,
  SkillsCategoriesResponse,
  SkillsStatsResponse,
  SkillsByCategoryResponse,
} from '../types/skills'

const BASE_URL =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:5180'
    : 'https://services.levanteapp.com'

async function apiFetch<T>(path: string): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000)

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Levante/1.0.0' },
    })

    if (!res.ok) {
      throw new Error(`Skills API error ${res.status}: ${path}`)
    }

    return res.json() as Promise<T>
  } finally {
    clearTimeout(timeout)
  }
}

export const SkillsService = {
  /** Obtiene el catálogo completo de skills */
  getCatalog(): Promise<SkillsCatalogResponse> {
    return apiFetch('/api/skills.json')
  },

  /** Obtiene las categorías disponibles con sus recuentos */
  getCategories(): Promise<SkillsCategoriesResponse> {
    return apiFetch('/api/skills/categories')
  },

  /** Obtiene las estadísticas del catálogo */
  getStats(): Promise<SkillsStatsResponse> {
    return apiFetch('/api/skills/stats')
  },

  /** Obtiene todas las skills de una categoría */
  getByCategory(category: string): Promise<SkillsByCategoryResponse> {
    return apiFetch(`/api/skills/category/${encodeURIComponent(category)}`)
  },

  /** Descarga una skill individual por su ID compuesto */
  getSkill(category: string, name: string): Promise<SkillDescriptor> {
    return apiFetch(
      `/api/skills/${encodeURIComponent(category)}/${encodeURIComponent(name)}`
    )
  },

  /** Descarga una skill directamente desde su ID compuesto "category/name" */
  getSkillById(id: string): Promise<SkillDescriptor> {
    const [category, name] = id.split('/')
    return SkillsService.getSkill(category, name)
  },
}
```

---

### 5.2 Listar skills en la UI

```typescript
// En el componente o página de Skills Store

import { SkillsService } from '../services/SkillsService'
import type { SkillDescriptor, SkillCategory } from '../types/skills'

async function loadSkillsStore() {
  // Cargar catálogo completo y categorías en paralelo
  const [catalog, { categories }] = await Promise.all([
    SkillsService.getCatalog(),
    SkillsService.getCategories(),
  ])

  console.log(`Total skills: ${catalog.total}`)
  console.log(`Categorías: ${categories.map(c => c.displayName).join(', ')}`)

  // Agrupar skills por categoría para la UI
  const grouped = new Map<string, SkillDescriptor[]>()
  for (const skill of catalog.skills) {
    const list = grouped.get(skill.category) ?? []
    list.push(skill)
    grouped.set(skill.category, list)
  }

  return { catalog, categories, grouped }
}
```

---

### 5.3 Descargar una skill

El campo `content` de `SkillDescriptor` contiene el cuerpo markdown completo de la skill (sin el frontmatter). Este contenido puede inyectarse directamente como instrucción de sistema en un agente.

```typescript
import { SkillsService } from '../services/SkillsService'

async function installSkill(skillId: string) {
  // skillId = "development/react-patterns"
  const skill = await SkillsService.getSkillById(skillId)

  // El contenido markdown está en skill.content
  console.log(skill.content)
  // → "# React Patterns\n\n## When to Use\n\n..."

  // Construir la instrucción de sistema para el agente
  const systemPrompt = buildSystemPrompt(skill)

  return systemPrompt
}

function buildSystemPrompt(skill: SkillDescriptor): string {
  const lines: string[] = []

  // Metadatos útiles como encabezado de contexto
  lines.push(`<!-- Skill: ${skill.id} | v${skill.version ?? 'latest'} -->`)
  if (skill.allowedTools) {
    lines.push(`<!-- Allowed tools: ${skill.allowedTools} -->`)
  }
  if (skill.model) {
    lines.push(`<!-- Recommended model: ${skill.model} -->`)
  }
  lines.push('')

  // Contenido principal de la skill
  lines.push(skill.content)

  return lines.join('\n')
}
```

---

### 5.4 Filtrar skills por categoría

Para mostrar skills de una sola categoría (p.ej. tab de "Development"):

```typescript
import { SkillsService } from '../services/SkillsService'

async function loadCategoryTab(category: string) {
  try {
    const { skills, total } = await SkillsService.getByCategory(category)
    return { skills, total, error: null }
  } catch (err) {
    // La API devuelve 404 si la categoría no existe
    return { skills: [], total: 0, error: `Categoría "${category}" no encontrada` }
  }
}
```

---

### 5.5 Filtrado y búsqueda local

Dado que el catálogo completo incluye todo el contenido, la búsqueda y el filtrado pueden hacerse localmente sin llamadas adicionales a la API:

```typescript
import type { SkillDescriptor } from '../types/skills'

function filterSkills(
  skills: SkillDescriptor[],
  query: string,
  category?: string
): SkillDescriptor[] {
  const q = query.toLowerCase().trim()

  return skills.filter(skill => {
    // Filtro por categoría
    if (category && skill.category !== category) return false

    // Filtro por búsqueda de texto
    if (!q) return true
    return (
      skill.name.toLowerCase().includes(q) ||
      skill.description.toLowerCase().includes(q) ||
      skill.tags?.some(t => t.toLowerCase().includes(q)) ||
      skill.content.toLowerCase().includes(q)
    )
  })
}

// Uso:
const results = filterSkills(catalog.skills, 'hooks', 'development')
```

---

## 6. Caché y rendimiento

La API devuelve `Cache-Control: public, max-age=3600` en todas las respuestas exitosas. Esto significa que el navegador (o el cliente HTTP del proceso main de Electron) cacheará cada respuesta durante **1 hora**.

### Recomendaciones

1. **Carga única al arrancar**: Llama a `/api/skills.json` una vez al abrir la Skills Store y guarda el resultado en memoria. No es necesario refetchear en cada navegación.

2. **Cache en disco (Electron)**: Para funcionar sin conexión, guarda el catálogo en disco al recibirlo.

```typescript
import { app } from 'electron'
import path from 'path'
import fs from 'fs/promises'
import type { SkillsCatalogResponse } from '../types/skills'

const CACHE_PATH = path.join(app.getPath('userData'), 'skills-cache.json')
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hora

interface CacheEntry {
  timestamp: number
  data: SkillsCatalogResponse
}

async function getCachedCatalog(): Promise<SkillsCatalogResponse> {
  // Intentar leer desde caché en disco
  try {
    const raw = await fs.readFile(CACHE_PATH, 'utf-8')
    const cached: CacheEntry = JSON.parse(raw)
    const isExpired = Date.now() - cached.timestamp > CACHE_TTL_MS

    if (!isExpired) {
      return cached.data
    }
  } catch {
    // Caché inexistente o corrupta — continuar con fetch
  }

  // Fetch desde la API
  const data = await SkillsService.getCatalog()

  // Guardar en disco para próximas sesiones
  const entry: CacheEntry = { timestamp: Date.now(), data }
  await fs.writeFile(CACHE_PATH, JSON.stringify(entry), 'utf-8').catch(() => {})

  return data
}
```

3. **Fallback offline**: Si el fetch falla y hay caché en disco (aunque expirada), úsala como fallback.

```typescript
async function getCatalogWithFallback(): Promise<SkillsCatalogResponse | null> {
  try {
    return await getCachedCatalog()
  } catch {
    // Sin conexión y sin caché — devolver null
    return null
  }
}
```

---

## 7. Manejo de errores

| HTTP | Situación | Cuerpo JSON |
|------|-----------|-------------|
| 200  | OK | Datos de la skill / catálogo |
| 404  | Skill o categoría no encontrada | `{ "error": "Skill not found", "id": "..." }` |
| 500  | Error interno del servidor | `{ "error": "Internal Server Error" }` |

La API **no** devuelve 401/403 (sin autenticación) ni 429 (sin rate limiting actualmente).

### Patrón recomendado con gestión de errores completa

```typescript
import { SkillsService } from '../services/SkillsService'
import type { SkillDescriptor } from '../types/skills'

async function safeGetSkill(id: string): Promise<SkillDescriptor | null> {
  try {
    return await SkillsService.getSkillById(id)
  } catch (err) {
    if (err instanceof Error) {
      // 404: skill no existe
      if (err.message.includes('404')) {
        console.warn(`Skill "${id}" no encontrada en el catálogo`)
        return null
      }
      // Timeout
      if (err.name === 'AbortError') {
        console.error(`Timeout al descargar skill "${id}"`)
        return null
      }
    }
    throw err // Re-lanzar errores inesperados
  }
}
```

---

## 8. Ejemplos de uso

### Listar todas las skills disponibles

```typescript
const { skills } = await SkillsService.getCatalog()

for (const skill of skills) {
  console.log(`[${skill.category}] ${skill.id} — ${skill.description}`)
}
// [database] database/sql-optimization — Techniques for writing...
// [development] development/react-patterns — Modern React patterns...
// [writing] writing/technical-docs — Structured approach to writing...
```

---

### Mostrar categorías en un sidebar

```typescript
const { categories } = await SkillsService.getCategories()

// categories = [
//   { category: "database",    displayName: "Database",    count: 1 },
//   { category: "development", displayName: "Development", count: 1 },
//   { category: "writing",     displayName: "Writing",     count: 1 },
// ]

for (const cat of categories) {
  console.log(`${cat.displayName} (${cat.count})`)
}
```

---

### Descargar el contenido de una skill para un agente

```typescript
const skill = await SkillsService.getSkill('development', 'react-patterns')

// El contenido markdown está disponible en skill.content
// Puede inyectarse directamente como instrucción de sistema:

const agentInstruction = skill.content
// → "# React Patterns\n\n## When to Use\n\n- When building new React..."
```

---

### Verificar si una skill está disponible antes de usarla

```typescript
async function isSkillAvailable(skillId: string): Promise<boolean> {
  const skill = await safeGetSkill(skillId)
  return skill !== null
}

const available = await isSkillAvailable('development/react-patterns')
console.log(available) // true
```

---

### Obtener stats para mostrar en el dashboard

```typescript
const stats = await SkillsService.getStats()

console.log(`Skills disponibles: ${stats.total}`)
console.log(`Categorías: ${stats.categories}`)
console.log(`Listado: ${stats.categoryList.join(', ')}`)
// Skills disponibles: 3
// Categorías: 3
// Listado: database, development, writing
```

---

## Referencia rápida de endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/skills.json` | Catálogo completo con contenido |
| GET | `/api/skills/categories` | Categorías disponibles con recuento |
| GET | `/api/skills/stats` | Estadísticas del catálogo |
| GET | `/api/skills/category/{cat}` | Skills de una categoría |
| GET | `/api/skills/{category}/{name}` | Skill individual por ID compuesto |

---

## Estructura de una SKILL.md

Las skills siguen el estándar [aitempl](https://github.com/aitempl). Cada archivo `SKILL.md` contiene un bloque de frontmatter YAML seguido del cuerpo markdown:

```markdown
---
name: react-patterns
description: Modern React patterns and principles for building scalable UIs.
author: levante
version: "1.0.0"
license: MIT
tags: [React, TypeScript, Hooks]
allowed-tools: Read, Write, Edit, Glob, Grep
model: sonnet
user-invocable: true
dependencies: [react>=18.0.0, typescript>=5.0.0]
---

# React Patterns

## When to Use

- When building new React components or refactoring existing ones
...
```

Los campos del frontmatter se mapean directamente a los campos de `SkillDescriptor`:

| Frontmatter YAML | Campo JSON | Tipo |
|---|---|---|
| `name` | `name` | `string` |
| `description` | `description` | `string` |
| `author` | `author` | `string?` |
| `version` | `version` | `string?` |
| `license` | `license` | `string?` |
| `tags` | `tags` | `string[]?` |
| `allowed-tools` | `allowedTools` | `string?` |
| `model` | `model` | `string?` |
| `user-invocable` | `userInvocable` | `boolean?` |
| `dependencies` | `dependencies` | `string[]?` |
| `source` | `source` | `string?` |
| `repo` | `repo` | `string?` |

El campo `id` se deriva automáticamente de la ruta del archivo: `{categoría}/{nombre}`.
El campo `content` contiene el cuerpo markdown completo (sin el frontmatter).

---

## Referencias

- [API Documentation](./API.md)
- [Levante MCP Integration](./LEVANTE_INTEGRATION.md)
- [Contributing MCPs](./contributing-mcps.md)
