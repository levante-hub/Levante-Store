---
name: react-patterns
description: Modern React patterns and principles for building scalable UIs. Covers Hooks composition, state management, performance optimization, and TypeScript integration best practices.
author: levante
version: "1.0.0"
license: MIT
tags: [React, TypeScript, Hooks, Patterns, Performance, Components]
allowed-tools: Read, Write, Edit, Glob, Grep
model: sonnet
user-invocable: true
dependencies: [react>=18.0.0, typescript>=5.0.0]
---

# React Patterns

## When to Use

- When building new React components or refactoring existing ones
- When you need guidance on hooks composition or state management patterns
- When optimizing render performance with memoization techniques
- When applying TypeScript-safe component and hook patterns

## Quick Start

### Custom Hooks Pattern

Extract stateful logic into reusable hooks to keep components clean:

```typescript
function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })

  const setItem = (newValue: T) => {
    setValue(newValue)
    window.localStorage.setItem(key, JSON.stringify(newValue))
  }

  return [value, setItem] as const
}
```

### Compound Components Pattern

Group related components with shared context for flexible composition:

```typescript
const TabsContext = createContext<TabsContextValue | null>(null)

function Tabs({ children, defaultTab }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab)
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="tabs">{children}</div>
    </TabsContext.Provider>
  )
}

Tabs.Panel = TabPanel
Tabs.List = TabList
```

### Performance with useMemo / useCallback

```typescript
const expensiveValue = useMemo(
  () => computeExpensiveValue(data),
  [data]
)

const handleClick = useCallback(
  (id: string) => dispatch({ type: 'SELECT', payload: id }),
  [dispatch]
)
```

## Key Principles

1. **Composition over inheritance** — build complex UIs from small, focused components
2. **Co-locate state with consumers** — keep state as close as possible to where it's used
3. **Prefer derived state** — compute values from existing state instead of duplicating
4. **Single responsibility** — each hook/component does one thing well

## Best Practices

- Use `React.memo` only when profiling shows a bottleneck, not preemptively
- Prefer `useReducer` over `useState` for complex state with multiple sub-values
- Always type custom hook return values explicitly
- Avoid prop drilling beyond 2-3 levels — reach for Context or composition
