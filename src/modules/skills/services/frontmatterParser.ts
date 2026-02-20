export interface ParsedFrontmatter {
  data: Record<string, unknown>
  content: string
}

/**
 * Parses a raw SKILL.md string into structured frontmatter data and markdown body.
 * Handles the YAML subset used by the aitempl skill format:
 * scalars, quoted strings, bracket arrays [A, B], and booleans.
 */
export function parseFrontmatter(raw: string): ParsedFrontmatter {
  if (!raw.startsWith('---')) return { data: {}, content: raw }

  const afterOpen = raw.slice(3)
  const closeIndex = afterOpen.indexOf('\n---')
  if (closeIndex === -1) return { data: {}, content: raw }

  const yamlBlock = afterOpen.slice(0, closeIndex).trim()
  const content = afterOpen.slice(closeIndex + 4).trim()
  const data: Record<string, unknown> = {}

  for (const line of yamlBlock.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const colonIdx = trimmed.indexOf(':')
    if (colonIdx === -1) continue

    const key = trimmed.slice(0, colonIdx).trim()
    const val = trimmed.slice(colonIdx + 1).trim()
    data[key] = parseValue(val)
  }

  return { data, content }
}

function parseValue(raw: string): unknown {
  if (raw === '') return ''
  if (raw === 'true') return true
  if (raw === 'false') return false
  if (raw === 'null') return null

  // Quoted strings: "value" or 'value'
  if (
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'"))
  ) {
    return raw.slice(1, -1)
  }

  // Bracket arrays: [item1, item2, "item3"]
  if (raw.startsWith('[') && raw.endsWith(']')) {
    return raw
      .slice(1, -1)
      .split(',')
      .map(s => s.trim().replace(/^["']|["']$/g, ''))
      .filter(Boolean)
  }

  // Numbers
  if (!isNaN(Number(raw)) && raw !== '') return Number(raw)

  // Plain string
  return raw
}
