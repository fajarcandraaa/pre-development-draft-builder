/**
 * Unit tests for templateRenderer.
 */

import { describe, it, expect } from 'vitest'
import { render, renderNested } from '../../../src/utils/templateRenderer.js'

describe('templateRenderer', () => {
  describe('render', () => {
    it('should replace single placeholder', () => {
      const template = 'Hello {{name}}'
      const result = render(template, { name: 'World' })
      expect(result).toBe('Hello World')
    })

    it('should replace multiple placeholders', () => {
      const template = 'Hello {{name}}, you are {{age}} years old'
      const result = render(template, { name: 'John', age: '30' })
      expect(result).toBe('Hello John, you are 30 years old')
    })

    it('should replace all occurrences of placeholder', () => {
      const template = '{{name}} loves {{name}}'
      const result = render(template, { name: 'cats' })
      expect(result).toBe('cats loves cats')
    })

    it('should handle missing placeholder gracefully', () => {
      const template = 'Hello {{name}}'
      const result = render(template, {})
      expect(result).toBe('Hello {{name}}')
    })

    it('should handle empty template', () => {
      const result = render('', { name: 'test' })
      expect(result).toBe('')
    })

    it('should handle empty variables', () => {
      const template = 'Hello {{name}}'
      const result = render(template, {})
      expect(result).toBe('Hello {{name}}')
    })
  })

  describe('renderNested', () => {
    it('should replace nested placeholder', () => {
      const template = 'Hello {{user.name}}'
      const result = renderNested(template, { user: { name: 'John' } })
      expect(result).toBe('Hello John')
    })

    it('should replace deeply nested placeholder', () => {
      const template = 'Value: {{data.nested.value}}'
      const result = renderNested(template, { data: { nested: { value: '42' } } })
      expect(result).toBe('Value: 42')
    })

    it('should handle missing nested path', () => {
      const template = 'Hello {{user.name}}'
      const result = renderNested(template, { user: {} })
      expect(result).toBe('Hello {{user.name}}')
    })

    it('should handle missing top-level key', () => {
      const template = 'Hello {{user.name}}'
      const result = renderNested(template, {})
      expect(result).toBe('Hello {{user.name}}')
    })

    it('should mix nested and simple placeholders', () => {
      const template = '{{user.name}} is {{age}} years old'
      const result = renderNested(template, { user: { name: 'John' }, age: '30' })
      expect(result).toBe('John is 30 years old')
    })
  })
})
