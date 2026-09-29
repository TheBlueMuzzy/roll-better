import { describe, expect, it } from 'vitest'
import { formatJson, isAllowedContentPath, keepHelp } from './devkitSave'

describe('isAllowedContentPath — the Dev Kit may only write JSON inside content/', () => {
  it('allows content JSON files', () => {
    expect(isAllowedContentPath('content/ui/style.json')).toBe(true)
    expect(isAllowedContentPath('content/ui/table.json')).toBe(true)
    expect(isAllowedContentPath('content/tuning/physics.json')).toBe(true)
  })
  it('refuses anything outside content/', () => {
    expect(isAllowedContentPath('src/App.tsx')).toBe(false)
    expect(isAllowedContentPath('package.json')).toBe(false)
    expect(isAllowedContentPath('/content/ui/style.json')).toBe(false)
    expect(isAllowedContentPath('C:/content/x.json')).toBe(false)
    expect(isAllowedContentPath('contentx/a.json')).toBe(false)
  })
  it('refuses sneaking out with .. or backslashes', () => {
    expect(isAllowedContentPath('content/../package.json')).toBe(false)
    expect(isAllowedContentPath('content/ui/../../vite.config.json')).toBe(false)
    expect(isAllowedContentPath('content\\..\\package.json')).toBe(false)
    expect(isAllowedContentPath('content//ui.json')).toBe(false)
    expect(isAllowedContentPath('content/./ui.json')).toBe(false)
  })
  it('refuses non-JSON files and non-strings', () => {
    expect(isAllowedContentPath('content/ui/style.ts')).toBe(false)
    expect(isAllowedContentPath('content/notes.md')).toBe(false)
    expect(isAllowedContentPath(undefined)).toBe(false)
    expect(isAllowedContentPath(42)).toBe(false)
  })
})

describe('keepHelp — a file\'s _help note survives a save', () => {
  it('puts the old _help back (first) when the tool left it out', () => {
    const out = keepHelp({ _help: 'read me', rows: '#000000' }, { rows: '#111111' })
    expect(out).toEqual({ _help: 'read me', rows: '#111111' })
    expect(Object.keys(out)[0]).toBe('_help')
  })
  it('uses the tool\'s own _help if it sent one', () => {
    expect(keepHelp({ _help: 'old' }, { _help: 'new', a: 1 })).toEqual({ _help: 'new', a: 1 })
  })
  it('does nothing for files without _help or new files', () => {
    expect(keepHelp({ preset: 'cartoon' }, { preset: 'clean' })).toEqual({ preset: 'clean' })
    expect(keepHelp(null, { a: 1 })).toEqual({ a: 1 })
  })
})

describe('formatJson', () => {
  it('is 2-space pretty JSON with a trailing newline', () => {
    expect(formatJson({ preset: 'cartoon', tweaks: {} })).toBe('{\n  "preset": "cartoon",\n  "tweaks": {}\n}\n')
  })
})
