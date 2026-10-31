import { describe, expect, it } from 'vitest'
import { applicationModules } from './appModules'

describe('applicationModules', () => {
  it('keeps all dashboard modules visible from the shared registry', () => {
    expect(applicationModules.map((module) => module.id)).toEqual([
      'inventory',
      'reports',
      'settings',
    ])
  })
})
