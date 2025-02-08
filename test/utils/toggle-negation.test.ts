import type {
  LogicalExpression,
  BinaryExpression,
  UnaryExpression,
  SimpleLiteral,
  Expression,
  Node,
} from 'estree'
import type { Rule } from 'eslint'

import { describe, expect, it } from 'vitest'

import { toggleNegation } from '../../utils/toggle-negation'

interface FakeLogicalExpression extends LogicalExpression {
  type: 'LogicalExpression'
  operator: '&&' | '||'
  right: FakeIdentifier
  left: FakeIdentifier
  raw: string
}

interface FakeBinaryExpression extends BinaryExpression {
  right: FakeIdentifier
  left: FakeIdentifier
  raw: string
}

interface FakeLiteral extends SimpleLiteral {
  type: 'Literal'
  value: boolean
  raw: string
}

interface FakeIdentifier {
  type: 'Identifier'
  name: string
  raw: string
}

interface FakeUnaryExpression extends UnaryExpression {
  raw: string
}

let fakeContext: Rule.RuleContext = {
  sourceCode: {
    getText: (node: { raw: string } & Node) => node.raw,
  },
} as Rule.RuleContext

describe('toggleNegation', () => {
  it('should toggle binary expression operator from === to !==', () => {
    let node: FakeBinaryExpression = {
      right: { type: 'Identifier', name: 'b', raw: 'b' },
      left: { type: 'Identifier', name: 'a', raw: 'a' },
      type: 'BinaryExpression',
      operator: '===',
      raw: 'a === b',
    }
    let result = toggleNegation(node, fakeContext)
    expect(result).toBe('a !== b')
  })

  it('should toggle binary expression operator from !== to ===', () => {
    let node: FakeBinaryExpression = {
      right: { type: 'Identifier', name: 'b', raw: 'b' },
      left: { type: 'Identifier', name: 'a', raw: 'a' },
      type: 'BinaryExpression',
      operator: '!==',
      raw: 'a !== b',
    }
    let result = toggleNegation(node, fakeContext)
    expect(result).toBe('a === b')
  })

  it('should toggle binary expression operator from == to !=', () => {
    let node: FakeBinaryExpression = {
      right: { type: 'Identifier', name: 'b', raw: 'b' },
      left: { type: 'Identifier', name: 'a', raw: 'a' },
      type: 'BinaryExpression',
      operator: '==',
      raw: 'a == b',
    }
    let result = toggleNegation(node, fakeContext)
    expect(result).toBe('a != b')
  })

  it('should toggle binary expression operator from != to ==', () => {
    let node: FakeBinaryExpression = {
      right: { type: 'Identifier', name: 'b', raw: 'b' },
      left: { type: 'Identifier', name: 'a', raw: 'a' },
      type: 'BinaryExpression',
      operator: '!=',
      raw: 'a != b',
    }
    let result = toggleNegation(node, fakeContext)
    expect(result).toBe('a == b')
  })

  it('should toggle binary expression operator from > to <=', () => {
    let node: FakeBinaryExpression = {
      right: { type: 'Identifier', name: 'b', raw: 'b' },
      left: { type: 'Identifier', name: 'a', raw: 'a' },
      type: 'BinaryExpression',
      operator: '>',
      raw: 'a > b',
    }
    let result = toggleNegation(node, fakeContext)
    expect(result).toBe('a <= b')
  })

  it('should toggle binary expression operator from in to !in', () => {
    let node: FakeBinaryExpression = {
      right: { type: 'Identifier', name: 'b', raw: 'b' },
      left: { type: 'Identifier', name: 'a', raw: 'a' },
      type: 'BinaryExpression',
      operator: 'in',
      raw: 'a in b',
    }
    let result = toggleNegation(node, fakeContext)
    expect(result).toBe('!(a in b)')
  })

  it('should remove negation in unary expression if expression is already negated', () => {
    let node: FakeUnaryExpression = {
      argument: { type: 'Identifier', name: 'a' },
      type: 'UnaryExpression',
      operator: '!',
      prefix: true,
      raw: '!a',
    }
    let result = toggleNegation(node, fakeContext)
    expect(result).toBe('a')
  })

  it('should add negation in unary expression if expression is not negated', () => {
    let node: FakeUnaryExpression = {
      argument: { type: 'Identifier', name: 'a' },
      type: 'UnaryExpression',
      operator: '~',
      prefix: true,
      raw: '~a',
    }
    let result = toggleNegation(node, fakeContext)
    expect(result).toBe('!~a')
  })

  it('should add negation if expression is not negated', () => {
    let node = { type: 'Identifier', name: 'a', raw: 'a' } as Expression
    let result = toggleNegation(node, fakeContext)
    expect(result).toBe('!a')
  })

  it('should toggle boolean literal true to false', () => {
    let node: FakeLiteral = {
      type: 'Literal',
      value: true,
      raw: 'true',
    }
    let result = toggleNegation(node, fakeContext)
    expect(result).toBe('false')
  })

  it('should toggle boolean literal false to true', () => {
    let node: FakeLiteral = {
      type: 'Literal',
      value: false,
      raw: 'false',
    }
    let result = toggleNegation(node, fakeContext)
    expect(result).toBe('true')
  })

  it('should toggle logical expression with && by adding a leading "!"', () => {
    let node: FakeLogicalExpression = {
      right: { type: 'Identifier', name: 'b', raw: 'b' },
      left: { type: 'Identifier', name: 'a', raw: 'a' },
      type: 'LogicalExpression',
      operator: '&&',
      raw: 'a && b',
    }
    let result = toggleNegation(node, fakeContext)
    expect(result).toBe('!(a && b)')
  })

  it('should toggle logical expression with || by adding a leading "!"', () => {
    let node: FakeLogicalExpression = {
      right: { type: 'Identifier', name: 'b', raw: 'b' },
      left: { type: 'Identifier', name: 'a', raw: 'a' },
      type: 'LogicalExpression',
      operator: '||',
      raw: 'a || b',
    }
    let result = toggleNegation(node, fakeContext)
    expect(result).toBe('!(a || b)')
  })
})
