import { describe, it, expect } from 'vitest'
import app from '@/index'
import type {
  SkillsCatalogResponse,
  SkillDescriptor,
  SkillsCategoriesResponse,
  SkillsStatsResponse,
} from '@/modules/skills/types'

describe('Skills API Endpoints', () => {

  describe('GET /api/skills.json', () => {
    it('returns the full skills catalog', async () => {
      const res = await app.request('/api/skills.json')
      expect(res.status).toBe(200)

      const data = await res.json() as SkillsCatalogResponse
      expect(data).toHaveProperty('version')
      expect(data).toHaveProperty('total')
      expect(data).toHaveProperty('skills')
      expect(Array.isArray(data.skills)).toBe(true)
      expect(data.skills.length).toBeGreaterThan(0)
      expect(data.total).toBe(data.skills.length)
    })

    it('includes the react-patterns skill', async () => {
      const res = await app.request('/api/skills.json')
      const data = await res.json() as SkillsCatalogResponse

      const skill = data.skills.find(s => s.id === 'development/react-patterns')
      expect(skill).toBeDefined()
      expect(skill?.name).toBe('react-patterns')
      expect(skill?.category).toBe('development')
    })

    it('includes Cache-Control header', async () => {
      const res = await app.request('/api/skills.json')
      expect(res.headers.get('Cache-Control')).toBe('public, max-age=3600')
    })
  })

  describe('GET /api/skills/:category/:name', () => {
    it('returns a specific skill with all fields', async () => {
      const res = await app.request('/api/skills/development/react-patterns')
      expect(res.status).toBe(200)

      const data = await res.json() as SkillDescriptor
      expect(data.id).toBe('development/react-patterns')
      expect(data.name).toBe('react-patterns')
      expect(data.description).toBeDefined()
      expect(typeof data.content).toBe('string')
      expect(data.content.length).toBeGreaterThan(0)
      expect(data.category).toBe('development')
    })

    it('includes markdown content in the response', async () => {
      const res = await app.request('/api/skills/development/react-patterns')
      const data = await res.json() as SkillDescriptor
      // Content should be the markdown body (after frontmatter)
      expect(data.content).toContain('# React Patterns')
    })

    it('returns 404 for a non-existent skill', async () => {
      const res = await app.request('/api/skills/development/non-existent-skill')
      expect(res.status).toBe(404)
    })

    it('returns 404 for a non-existent category', async () => {
      const res = await app.request('/api/skills/non-existent/react-patterns')
      expect(res.status).toBe(404)
    })
  })

  describe('GET /api/skills/categories', () => {
    it('returns a list of categories with counts', async () => {
      const res = await app.request('/api/skills/categories')
      expect(res.status).toBe(200)

      const data = await res.json() as SkillsCategoriesResponse
      expect(data).toHaveProperty('categories')
      expect(Array.isArray(data.categories)).toBe(true)
      expect(data.categories.length).toBeGreaterThan(0)
    })

    it('each category has required shape', async () => {
      const res = await app.request('/api/skills/categories')
      const data = await res.json() as SkillsCategoriesResponse

      for (const cat of data.categories) {
        expect(cat).toHaveProperty('category')
        expect(cat).toHaveProperty('displayName')
        expect(cat).toHaveProperty('count')
        expect(cat.count).toBeGreaterThan(0)
      }
    })

    it('includes development category with title-cased displayName', async () => {
      const res = await app.request('/api/skills/categories')
      const data = await res.json() as SkillsCategoriesResponse

      const dev = data.categories.find(c => c.category === 'development')
      expect(dev).toBeDefined()
      expect(dev?.displayName).toBe('Development')
    })
  })

  describe('GET /api/skills/category/:cat', () => {
    it('returns skills for a valid category', async () => {
      const res = await app.request('/api/skills/category/development')
      expect(res.status).toBe(200)

      const data = await res.json() as { category: string; total: number; skills: SkillDescriptor[] }
      expect(data.category).toBe('development')
      expect(data.skills.length).toBeGreaterThan(0)
      expect(data.total).toBe(data.skills.length)

      for (const skill of data.skills) {
        expect(skill.category).toBe('development')
      }
    })

    it('returns 404 for a non-existent category', async () => {
      const res = await app.request('/api/skills/category/non-existent-category')
      expect(res.status).toBe(404)
    })
  })

  describe('GET /api/skills/stats', () => {
    it('returns catalog statistics', async () => {
      const res = await app.request('/api/skills/stats')
      expect(res.status).toBe(200)

      const data = await res.json() as SkillsStatsResponse
      expect(data).toHaveProperty('total')
      expect(data).toHaveProperty('categories')
      expect(data).toHaveProperty('categoryList')
      expect(data.total).toBeGreaterThan(0)
      expect(Array.isArray(data.categoryList)).toBe(true)
      expect(data.categories).toBe(data.categoryList.length)
    })
  })

  describe('Skill descriptor integrity', () => {
    it('all skills have required fields and valid id format', async () => {
      const res = await app.request('/api/skills.json')
      const data = await res.json() as SkillsCatalogResponse

      for (const skill of data.skills) {
        expect(typeof skill.id).toBe('string')
        expect(typeof skill.name).toBe('string')
        expect(typeof skill.description).toBe('string')
        expect(typeof skill.category).toBe('string')
        expect(typeof skill.content).toBe('string')
        // id must follow "category/name" format
        expect(skill.id).toMatch(/^[a-z0-9-]+\/[a-z0-9-]+$/)
      }
    })

    it('has no duplicate skill IDs', async () => {
      const res = await app.request('/api/skills.json')
      const data = await res.json() as SkillsCatalogResponse

      const ids = data.skills.map(s => s.id)
      const unique = new Set(ids)
      expect(ids.length).toBe(unique.size)
    })

    it('category in id matches category field', async () => {
      const res = await app.request('/api/skills.json')
      const data = await res.json() as SkillsCatalogResponse

      for (const skill of data.skills) {
        const [categoryFromId] = skill.id.split('/')
        expect(skill.category).toBe(categoryFromId)
      }
    })
  })
})
