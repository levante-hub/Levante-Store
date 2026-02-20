import { describe, it, expect } from 'vitest'
import { parseFrontmatter } from '@/modules/skills/services/frontmatterParser'

describe('parseFrontmatter', () => {
  it('parses a complete frontmatter block', () => {
    const raw = `---
name: react-patterns
description: Modern React patterns
author: levante
version: "1.0.0"
tags: [React, TypeScript, Hooks]
user-invocable: true
---

# React Patterns
Content here.`

    const { data, content } = parseFrontmatter(raw)
    expect(data['name']).toBe('react-patterns')
    expect(data['description']).toBe('Modern React patterns')
    expect(data['author']).toBe('levante')
    expect(data['version']).toBe('1.0.0')
    expect(data['tags']).toEqual(['React', 'TypeScript', 'Hooks'])
    expect(data['user-invocable']).toBe(true)
    expect(content).toContain('# React Patterns')
    expect(content).toContain('Content here.')
  })

  it('returns empty data and raw content when no frontmatter is present', () => {
    const raw = '# Just markdown\n\nNo frontmatter here.'
    const { data, content } = parseFrontmatter(raw)
    expect(data).toEqual({})
    expect(content).toBe(raw)
  })

  it('returns empty data when closing fence is missing', () => {
    const raw = '---\nname: broken\n# No closing fence'
    const { data, content } = parseFrontmatter(raw)
    expect(data).toEqual({})
    expect(content).toBe(raw)
  })

  it('parses bracket arrays with quoted items', () => {
    const raw = '---\ntags: [A, B, "C with space"]\n---\nContent'
    const { data } = parseFrontmatter(raw)
    expect(data['tags']).toEqual(['A', 'B', 'C with space'])
  })

  it('parses boolean false', () => {
    const raw = '---\nuser-invocable: false\n---\n'
    const { data } = parseFrontmatter(raw)
    expect(data['user-invocable']).toBe(false)
  })

  it('parses boolean true', () => {
    const raw = '---\nuser-invocable: true\n---\n'
    const { data } = parseFrontmatter(raw)
    expect(data['user-invocable']).toBe(true)
  })

  it('parses quoted strings (strips quotes)', () => {
    const raw = '---\nversion: "1.0.0"\n---\n'
    const { data } = parseFrontmatter(raw)
    expect(data['version']).toBe('1.0.0')
  })

  it('parses hyphenated keys (allowed-tools)', () => {
    const raw = '---\nallowed-tools: Read, Write, Edit\n---\nContent'
    const { data } = parseFrontmatter(raw)
    expect(data['allowed-tools']).toBe('Read, Write, Edit')
  })

  it('strips frontmatter from content', () => {
    const raw = '---\nname: test\n---\n\n# Title\n\nBody text.'
    const { content } = parseFrontmatter(raw)
    expect(content).not.toContain('name:')
    expect(content).not.toContain('---')
    expect(content).toContain('# Title')
    expect(content).toContain('Body text.')
  })

  it('ignores comment lines in frontmatter', () => {
    const raw = '---\n# This is a comment\nname: my-skill\n---\nContent'
    const { data } = parseFrontmatter(raw)
    expect(data['name']).toBe('my-skill')
    expect(Object.keys(data)).not.toContain('# This is a comment')
  })
})
