import type { SourceCode, Rule } from 'eslint'

import { describe, expect, it, vi } from 'vitest'

import { getSourceCode } from '../../utils/get-source-code'

describe('getSourceCode', () => {
  it('returns context.sourceCode if available', () => {
    expect.assertions(1)

    let fakeSourceCode = { content: 'test code' } as unknown as SourceCode

    let context = {
      getSourceCode: vi.fn(() => {}),
      sourceCode: fakeSourceCode,
    } as unknown as Rule.RuleContext

    expect(getSourceCode(context)).toBe(fakeSourceCode)
  })

  it('returns result of context.getSourceCode() if sourceCode is undefined', () => {
    expect.assertions(1)

    let fakeSourceCode = { content: 'test code' } as unknown as SourceCode

    let context = {
      getSourceCode: () => fakeSourceCode,
    } as unknown as Rule.RuleContext

    expect(getSourceCode(context)).toBe(fakeSourceCode)
  })
})
