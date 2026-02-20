export interface SkillDescriptor {
  id: string              // "development/react-patterns" (derivado del path)
  name: string            // del frontmatter
  description: string     // del frontmatter
  category: string        // primer segmento de la ruta
  author?: string
  version?: string
  license?: string
  tags?: string[]
  allowedTools?: string   // frontmatter: allowed-tools
  model?: string
  userInvocable?: boolean // frontmatter: user-invocable
  dependencies?: string[]
  source?: string
  repo?: string
  content: string         // cuerpo markdown (tras el frontmatter)
  metadata?: Record<string, unknown>
}

export interface SkillCategory {
  category: string
  displayName: string     // "development" → "Development"
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
