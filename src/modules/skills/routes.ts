import { Hono } from 'hono'
import { skillsAggregator } from '@/modules/skills/services/skillsAggregator'
import type {
  SkillsCatalogResponse,
  SkillsCategoriesResponse,
  SkillsStatsResponse,
} from '@/modules/skills/types'

const skillsModule = new Hono()

const CACHE_1H = 'public, max-age=3600'

// GET /skills.json → Full catalog
skillsModule.get('/skills.json', (c) => {
  const skills = skillsAggregator.aggregateAll()
  const response: SkillsCatalogResponse = {
    version: '1.0.0',
    total: skills.length,
    skills,
  }
  return c.json(response, 200, { 'Cache-Control': CACHE_1H })
})

// Static routes must come before parameterized ones to avoid Hono matching
// "categories" or "stats" as a :category param.

// GET /skills/categories → Categories with counts
skillsModule.get('/skills/categories', (c) => {
  const response: SkillsCategoriesResponse = {
    categories: skillsAggregator.getCategories(),
  }
  return c.json(response, 200, { 'Cache-Control': CACHE_1H })
})

// GET /skills/stats → Statistics
skillsModule.get('/skills/stats', (c) => {
  const response: SkillsStatsResponse = skillsAggregator.getStats()
  return c.json(response, 200, { 'Cache-Control': CACHE_1H })
})

// GET /skills/category/:cat → Skills in a category
skillsModule.get('/skills/category/:cat', (c) => {
  const category = c.req.param('cat')
  const skills = skillsAggregator.getByCategory(category)
  if (skills.length === 0) {
    return c.json({ error: 'Category not found', category }, 404)
  }
  return c.json({ category, total: skills.length, skills }, 200, { 'Cache-Control': CACHE_1H })
})

// GET /skills/:category/:name → Single skill by compound ID
skillsModule.get('/skills/:category/:name', (c) => {
  const category = c.req.param('category')
  const name = c.req.param('name')
  const id = `${category}/${name}`
  const skill = skillsAggregator.getById(id)
  if (!skill) {
    return c.json({ error: 'Skill not found', id }, 404)
  }
  return c.json(skill, 200, { 'Cache-Control': CACHE_1H })
})

// GET /skills → Redirect to /api/skills.json
skillsModule.get('/skills', (c) => c.redirect('/api/skills.json'))

export default skillsModule
