import type { SkillDescriptor, SkillCategory } from '@/modules/skills/types'
import { parseFrontmatter } from '@/modules/skills/services/frontmatterParser'

// Import all SKILL.md files as raw strings via Vite glob
const skillFiles = import.meta.glob<string>(
  '../data/skills/**/*.md',
  { query: '?raw', import: 'default', eager: true }
)

function buildRegistry(): SkillDescriptor[] {
  const skills: SkillDescriptor[] = []

  for (const [filePath, rawContent] of Object.entries(skillFiles)) {
    // Only process SKILL.md files (ignore references/ etc.)
    const match = filePath.match(/\/skills\/([^/]+)\/([^/]+)\/SKILL\.md$/)
    if (!match) continue

    const [, category, name] = match

    try {
      const { data, content } = parseFrontmatter(rawContent)
      const description = data['description'] as string
      if (!description) continue

      const skill: SkillDescriptor = {
        id: `${category}/${name}`,
        name: (data['name'] as string) || name,
        description,
        category,
        content,
        ...(data['author'] ? { author: data['author'] as string } : {}),
        ...(data['version'] ? { version: data['version'] as string } : {}),
        ...(data['license'] ? { license: data['license'] as string } : {}),
        ...(data['tags'] ? { tags: data['tags'] as string[] } : {}),
        ...(data['allowed-tools'] ? { allowedTools: data['allowed-tools'] as string } : {}),
        ...(data['model'] ? { model: data['model'] as string } : {}),
        ...(data['user-invocable'] !== undefined ? { userInvocable: data['user-invocable'] as boolean } : {}),
        ...(data['dependencies'] ? { dependencies: data['dependencies'] as string[] } : {}),
        ...(data['source'] ? { source: data['source'] as string } : {}),
        ...(data['repo'] ? { repo: data['repo'] as string } : {}),
      }

      skills.push(skill)
    } catch (err) {
      console.warn(`Failed to parse skill at ${filePath}:`, err)
    }
  }

  return skills.sort((a, b) => a.id.localeCompare(b.id))
}

const registry = buildRegistry()

/**
 * SkillsAggregator - Aggregates and queries parsed SKILL.md files.
 * Mirrors the CatalogAggregator pattern from the mcps module.
 */
export class SkillsAggregator {
  aggregateAll(): SkillDescriptor[] {
    return registry
  }

  getById(id: string): SkillDescriptor | undefined {
    return registry.find(s => s.id === id)
  }

  getByCategory(category: string): SkillDescriptor[] {
    return registry.filter(s => s.category === category)
  }

  getCategoryNames(): string[] {
    return [...new Set(registry.map(s => s.category))].sort()
  }

  getCategories(): SkillCategory[] {
    return this.getCategoryNames().map(cat => ({
      category: cat,
      displayName: cat.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' '),
      count: this.getByCategory(cat).length,
    }))
  }

  getStats() {
    const cats = this.getCategoryNames()
    return {
      total: registry.length,
      categories: cats.length,
      categoryList: cats,
    }
  }
}

// Singleton instance — mirrors catalogAggregator pattern
export const skillsAggregator = new SkillsAggregator()
