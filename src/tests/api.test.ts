import { describe, it, expect } from 'vitest'
import app from '@/index'
import type { MCPStoreResponse, MCPServerDescriptor, ServicesResponse } from '@/modules/mcps/types'

interface StatsResponse {
  total: number
  official: number
  community: number
  services: number
  serviceList: string[]
}

interface OpenAPISpec {
  openapi: string
  info: object
  paths: object
}

describe('API Endpoints', () => {
  describe('GET /api/mcps.json', () => {
    it('returns list of MCPs', async () => {
      const res = await app.request('/api/mcps.json')
      expect(res.status).toBe(200)

      const data = await res.json() as MCPStoreResponse
      expect(data).toHaveProperty('version')
      expect(data).toHaveProperty('provider')
      expect(data).toHaveProperty('servers')
      expect(Array.isArray(data.servers)).toBe(true)
      expect(data.servers.length).toBeGreaterThan(0)
    })

    it('includes docling MCP', async () => {
      const res = await app.request('/api/mcps.json')
      const data = await res.json() as MCPStoreResponse

      const docling = data.servers.find((s) => s.id === 'docling')
      expect(docling).toBeDefined()
      expect(docling?.name).toBe('Docling')
    })
  })

  describe('GET /api/mcps/:id', () => {
    it('returns specific MCP by ID', async () => {
      const res = await app.request('/api/mcps/docling')
      expect(res.status).toBe(200)

      const data = await res.json() as MCPServerDescriptor
      expect(data.id).toBe('docling')
      expect(data.name).toBe('Docling')
    })

    it('returns 404 for non-existent MCP', async () => {
      const res = await app.request('/api/mcps/non-existent-mcp')
      expect(res.status).toBe(404)
    })
  })

  describe('GET /api/mcps/services', () => {
    it('returns list of services', async () => {
      const res = await app.request('/api/mcps/services')
      expect(res.status).toBe(200)

      const data = await res.json() as ServicesResponse
      expect(data).toHaveProperty('services')
      expect(Array.isArray(data.services)).toBe(true)
      expect(data.services.length).toBeGreaterThan(0)
    })
  })

  describe('GET /api/mcps/stats', () => {
    it('returns catalog statistics', async () => {
      const res = await app.request('/api/mcps/stats')
      expect(res.status).toBe(200)

      const data = await res.json() as StatsResponse
      expect(data).toHaveProperty('total')
      expect(data).toHaveProperty('official')
      expect(data).toHaveProperty('community')
      expect(data).toHaveProperty('services')
      expect(data.total).toBeGreaterThan(0)
    })
  })

  describe('GET /api/mcps/service/:service', () => {
    it('returns MCPs from specific service', async () => {
      const res = await app.request('/api/mcps/service/docling')
      expect(res.status).toBe(200)

      const data = await res.json() as MCPStoreResponse
      expect(data).toHaveProperty('servers')
      expect(data.servers.length).toBeGreaterThan(0)
    })

    it('returns 404 for non-existent service', async () => {
      const res = await app.request('/api/mcps/service/non-existent')
      expect(res.status).toBe(404)
    })
  })

  describe('GET /openapi.json', () => {
    it('returns OpenAPI specification', async () => {
      const res = await app.request('/openapi.json')
      expect(res.status).toBe(200)

      const data = await res.json() as OpenAPISpec
      expect(data).toHaveProperty('openapi')
      expect(data).toHaveProperty('info')
      expect(data).toHaveProperty('paths')
    })
  })
})
