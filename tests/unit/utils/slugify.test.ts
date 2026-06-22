import { describe, expect, it } from 'vitest'
import { slugify } from '../../../src/utils/slugify'

describe('slugify', () => {
  it('lowercases and dashes spaces', () => {
    expect(slugify('My Project')).toBe('my-project')
  })

  it('collapses repeated separators and trims dashes', () => {
    expect(slugify('  Hello --- World!!  ')).toBe('hello-world')
  })

  it('strips accents', () => {
    expect(slugify('Café Déjà')).toBe('cafe-deja')
  })

  it('removes leading/trailing non-alphanumerics', () => {
    expect(slugify('***EOffice 2.0***')).toBe('eoffice-2-0')
  })
})
