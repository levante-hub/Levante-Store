---
name: technical-docs
description: Guidelines for writing clear, structured technical documentation including API references, developer guides, and READMEs. Helps produce docs that developers actually read.
author: levante
version: "1.0.0"
license: MIT
tags: [Writing, Documentation, Markdown, API, README, Guides]
allowed-tools: Read, Write, Edit
model: sonnet
user-invocable: true
---

# Technical Documentation

## When to Use

- When writing API documentation, README files, or developer guides
- When structuring complex technical content for different audiences
- When creating onboarding documentation for a new codebase
- When reviewing existing docs for clarity and completeness

## Quick Start

### README Structure

A good README answers: what is this, how do I install it, how do I use it.

```markdown
# Project Name

One-line description of what this does.

## Installation

```bash
npm install my-package
```

## Usage

```typescript
import { doThing } from 'my-package'
doThing({ option: 'value' })
```

## API Reference

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `doThing` | `options: Options` | `Result` | Does the thing |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).
```

### API Endpoint Documentation

```markdown
## POST /api/users

Creates a new user account.

**Request body:**
```json
{
  "email": "user@example.com",
  "name": "Jane Doe"
}
```

**Response (201):**
```json
{
  "id": "usr_123",
  "email": "user@example.com",
  "createdAt": "2025-01-01T00:00:00Z"
}
```

**Errors:**
- `400` — Missing required field
- `409` — Email already in use
```

## Key Principles

1. **Show before explain** — code examples before prose descriptions
2. **Write for the reader, not the writer** — assume no context
3. **Scannable structure** — headers, lists, and tables over long paragraphs
4. **Keep it current** — outdated docs are worse than no docs

## Best Practices

- Use second person ("you") to address the reader directly
- Document the why, not just the what — explain design decisions
- Include error cases and edge cases, not just the happy path
- Add a "quick start" that works in under 5 minutes
- Link to runnable examples when possible
