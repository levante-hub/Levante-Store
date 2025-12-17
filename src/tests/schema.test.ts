import { describe, it, expect } from 'vitest'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import app from '@/index'
import type { MCPStoreResponse } from '@/modules/mcps/types'
import schema from '@/modules/mcps/data/mcps/_schema.json'

describe('MCP Schema Validation', () => {
  const ajv = new Ajv({ allErrors: true, strict: false })
  addFormats(ajv)
  const validate = ajv.compile(schema)

  it('all MCPs conform to schema', async () => {
    const res = await app.request('/api/mcps.json')
    const data = await res.json() as MCPStoreResponse

    const invalidMcps: { id: string; errors: string[] }[] = []

    for (const mcp of data.servers) {
      // Skip external provider MCPs (they have different format)
      if (mcp.provider && mcp.provider !== 'levante') continue

      const valid = validate(mcp)
      if (!valid && validate.errors) {
        invalidMcps.push({
          id: mcp.id,
          errors: validate.errors.map((e) => `${e.instancePath} ${e.message}`),
        })
      }
    }

    if (invalidMcps.length > 0) {
      const errorMsg = invalidMcps
        .map((m) => `${m.id}:\n  - ${m.errors.join('\n  - ')}`)
        .join('\n')
      expect.fail(`Invalid MCPs found:\n${errorMsg}`)
    }
  })

  it('each MCP has required fields', async () => {
    const res = await app.request('/api/mcps.json')
    const data = await res.json() as MCPStoreResponse

    for (const mcp of data.servers) {
      expect(mcp.id).toBeDefined()
      expect(mcp.name).toBeDefined()
      expect(mcp.description).toBeDefined()
      expect(mcp.transport).toBeDefined()
      expect(mcp.configuration).toBeDefined()
    }
  })

  it('no duplicate MCP IDs', async () => {
    const res = await app.request('/api/mcps.json')
    const data = await res.json() as MCPStoreResponse

    const ids = data.servers.map((mcp) => mcp.id)
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index)

    if (duplicates.length > 0) {
      expect.fail(`Duplicate MCP IDs found: ${[...new Set(duplicates)].join(', ')}`)
    }
  })
})
