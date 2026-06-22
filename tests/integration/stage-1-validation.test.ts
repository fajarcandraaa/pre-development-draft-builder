/**
 * Validation tests for Stage 1 brief fixtures.
 * These tests validate that brief fixtures are properly formatted and contain
 * the necessary information for Stage 1 pipeline execution.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

describe('Stage 1 Brief Fixtures Validation', () => {
  const fixturesPath = join(__dirname, '..', 'fixtures', 'briefs')
  const briefFiles = ['e-commerce-brief.md', 'mobile-app-brief.md', 'saas-brief.md']

  describe('Brief Fixture Quality', () => {
    it('should have all required brief fixtures', () => {
      for (const briefFile of briefFiles) {
        const briefPath = join(fixturesPath, briefFile)
        expect(existsSync(briefPath)).toBe(true)
      }
    })

    it('should have properly formatted briefs', () => {
      for (const briefFile of briefFiles) {
        const briefPath = join(fixturesPath, briefFile)
        const content = readFileSync(briefPath, 'utf-8')

        // Check for required sections
        expect(content).toMatch(/## Project Overview/i)
        expect(content).toMatch(/## Business Context/i)
        expect(content).toMatch(/## Problem Statement/i)
        expect(content).toMatch(/## Goals/i)
        expect(content).toMatch(/## Key Features Required/i)
        expect(content).toMatch(/## Technical Considerations/i)
        expect(content).toMatch(/## Constraints/i)
        expect(content).toMatch(/## Success Metrics/i)
        expect(content).toMatch(/## Risks/i)
      }
    })

    it('should have realistic content', () => {
      for (const briefFile of briefFiles) {
        const briefPath = join(fixturesPath, briefFile)
        const content = readFileSync(briefPath, 'utf-8')

        // Check for realistic project details
        expect(content.length).toBeGreaterThan(500) // Minimum length
        expect(content).toMatch(/\$\d+/) // Budget/timeline with numbers
        expect(content).toMatch(/\d+\s*(months|weeks|days)/i) // Timeline
      }
    })
  })

  describe('Brief Variety', () => {
    it('should cover different project types', () => {
      const eCommerceContent = readFileSync(join(fixturesPath, 'e-commerce-brief.md'), 'utf-8')
      const mobileAppContent = readFileSync(join(fixturesPath, 'mobile-app-brief.md'), 'utf-8')
      const saasContent = readFileSync(join(fixturesPath, 'saas-brief.md'), 'utf-8')

      // E-commerce brief should mention e-commerce specifics
      expect(eCommerceContent.toLowerCase()).toMatch(/ecommerce|retail|store/i)

      // Mobile app brief should mention mobile specifics
      expect(mobileAppContent.toLowerCase()).toMatch(/mobile|app|ios|android/i)

      // SaaS brief should mention SaaS specifics
      expect(saasContent.toLowerCase()).toMatch(/saas|subscription|software/i)
    })
  })
})
