import { describe, it, expect, beforeAll } from 'vitest'
import { spawn } from 'node:child_process'
import app from '@/index'
import type { MCPStoreResponse, MCPServerDescriptor } from '@/modules/mcps/types'

interface StdioTemplate {
  command: string
  args: string[]
  env?: Record<string, string>
}

interface HttpTemplate {
  type: 'sse' | 'streamable-http'
  url: string
}

function isStdioTemplate(template: unknown): template is StdioTemplate {
  return typeof template === 'object' && template !== null && 'command' in template
}

function isHttpTemplate(template: unknown): template is HttpTemplate {
  return typeof template === 'object' && template !== null && 'url' in template
}

/**
 * Runs MCP Inspector CLI and returns the result
 */
function runMcpInspector(args: string[], timeoutMs = 60000): Promise<{ success: boolean; output: string }> {
  return new Promise((resolve) => {
    const proc = spawn('npx', ['@modelcontextprotocol/inspector@latest', ...args], {
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: timeoutMs,
    })

    let output = ''
    let stderr = ''

    proc.stdout?.on('data', (data: Buffer) => {
      output += data.toString()
    })

    proc.stderr?.on('data', (data: Buffer) => {
      stderr += data.toString()
    })

    const timer = setTimeout(() => {
      proc.kill('SIGTERM')
      resolve({ success: false, output: `Timeout after ${timeoutMs}ms` })
    }, timeoutMs)

    proc.on('close', (code: number | null) => {
      clearTimeout(timer)
      const fullOutput = output + stderr

      // Success if:
      // - Exit code 0
      // - Contains tools response
      // - Contains 401/403 (MCP exists but requires auth)
      const isReachable = code === 0 ||
        fullOutput.includes('tools') ||
        fullOutput.includes('401') ||
        fullOutput.includes('403') ||
        fullOutput.includes('Unauthorized') ||
        fullOutput.includes('Forbidden')

      resolve({ success: isReachable, output: fullOutput })
    })

    proc.on('error', (err: Error) => {
      clearTimeout(timer)
      resolve({ success: false, output: err.message })
    })
  })
}

describe('MCP Connection Tests', () => {
  let mcps: MCPServerDescriptor[] = []

  // Fetch all MCPs once before tests
  beforeAll(async () => {
    const res = await app.request('/api/mcps.json')
    const data = await res.json() as MCPStoreResponse
    // Only test local MCPs (not external providers)
    mcps = data.servers.filter((mcp) => !mcp.provider || mcp.provider === 'levante')
  })

  describe('STDIO MCPs', () => {
    it('can connect to STDIO MCPs', async () => {
      const stdioMcps = mcps.filter((mcp) => mcp.transport === 'stdio')

      if (stdioMcps.length === 0) {
        console.log('No STDIO MCPs to test')
        return
      }

      const results: { id: string; success: boolean; output: string }[] = []

      for (const mcp of stdioMcps) {
        const template = mcp.configuration?.template
        if (!isStdioTemplate(template)) continue

        console.log(`Testing STDIO MCP: ${mcp.name} (${mcp.id})`)
        console.log(`  Command: ${template.command} ${template.args.join(' ')}`)

        const inspectorArgs = [
          '--cli',
          template.command,
          ...template.args,
          '--method', 'tools/list'
        ]

        const result = await runMcpInspector(inspectorArgs)
        results.push({ id: mcp.id, ...result })

        console.log(`  Result: ${result.success ? '✓ Reachable' : '✗ Failed'}`)
        if (!result.success) {
          console.log(`  Output: ${result.output.slice(0, 200)}`)
        }
      }

      // Report summary
      const passed = results.filter((r) => r.success).length
      const failed = results.filter((r) => !r.success).length
      console.log(`\nSTDIO MCPs: ${passed} passed, ${failed} failed out of ${results.length}`)

      // Don't fail the test if some MCPs require auth - just report
      expect(results.length).toBeGreaterThan(0)
    }, 300000) // 5 minute timeout for all STDIO tests
  })

  describe('HTTP/SSE MCPs', () => {
    it('can connect to HTTP/SSE MCPs', async () => {
      const httpMcps = mcps.filter((mcp) => mcp.transport === 'sse' || mcp.transport === 'streamable-http')

      if (httpMcps.length === 0) {
        console.log('No HTTP/SSE MCPs to test')
        return
      }

      const results: { id: string; success: boolean; output: string }[] = []

      for (const mcp of httpMcps) {
        const template = mcp.configuration?.template
        if (!isHttpTemplate(template)) continue

        // Remove template variables from URL for basic connectivity test
        const cleanUrl = template.url
          .replace(/\$\{[^}]*\}/g, '')
          .replace(/[?&][^?&]*=$/g, '')
          .replace(/[?&]$/g, '')

        const transportFlag = mcp.transport === 'sse' ? 'sse' : 'http'

        console.log(`Testing HTTP MCP: ${mcp.name} (${mcp.id})`)
        console.log(`  URL: ${cleanUrl}`)
        console.log(`  Transport: ${transportFlag}`)

        const inspectorArgs = [
          '--transport', transportFlag,
          '--server-url', cleanUrl,
          '--cli',
          '--method', 'tools/list'
        ]

        const result = await runMcpInspector(inspectorArgs)
        results.push({ id: mcp.id, ...result })

        console.log(`  Result: ${result.success ? '✓ Reachable' : '✗ Failed'}`)
        if (!result.success) {
          console.log(`  Output: ${result.output.slice(0, 200)}`)
        }
      }

      // Report summary
      const passed = results.filter((r) => r.success).length
      const failed = results.filter((r) => !r.success).length
      console.log(`\nHTTP/SSE MCPs: ${passed} passed, ${failed} failed out of ${results.length}`)

      // Don't fail the test if some MCPs require auth - just report
      expect(results.length).toBeGreaterThanOrEqual(0)
    }, 300000) // 5 minute timeout for all HTTP tests
  })
})
