import type { LogicalExpression, UnaryExpression } from 'estree'

import { describe, expect, it } from 'vitest'

import { hasOperator } from '../../utils/has-operator'

describe('hasOperator', () => {
  describe('logical Operators', () => {
    it('should correctly identify AND operator', () => {
      expect.assertions(1)

      let isAnd = hasOperator('&&')
      let node: LogicalExpression = {
        right: { type: 'Identifier', name: 'b' },
        left: { type: 'Identifier', name: 'a' },
        type: 'LogicalExpression',
        operator: '&&',
      }

      expect(isAnd(node)).toBe(true)
    })

    it('should correctly identify OR operator', () => {
      expect.assertions(1)

      let isOr = hasOperator('||')
      let node: LogicalExpression = {
        right: { type: 'Identifier', name: 'b' },
        left: { type: 'Identifier', name: 'a' },
        type: 'LogicalExpression',
        operator: '||',
      }

      expect(isOr(node)).toBe(true)
    })

    it('should correctly identify nullish coalescing operator', () => {
      expect.assertions(1)

      let isNullish = hasOperator('??')
      let node: LogicalExpression = {
        right: { type: 'Identifier', name: 'b' },
        left: { type: 'Identifier', name: 'a' },
        type: 'LogicalExpression',
        operator: '??',
      }

      expect(isNullish(node)).toBe(true)
    })

    it('should return false for non-matching logical operator', () => {
      expect.assertions(1)

      let isAnd = hasOperator('&&')
      let node: LogicalExpression = {
        right: { type: 'Identifier', name: 'b' },
        left: { type: 'Identifier', name: 'a' },
        type: 'LogicalExpression',
        operator: '||',
      }

      expect(isAnd(node)).toBe(false)
    })
  })

  describe('unary Operators', () => {
    it('should correctly identify NOT operator', () => {
      expect.assertions(1)

      let isNot = hasOperator('!')
      let node: UnaryExpression = {
        argument: { type: 'Identifier', name: 'a' },
        type: 'UnaryExpression',
        operator: '!',
        prefix: true,
      }

      expect(isNot(node)).toBe(true)
    })

    it('should correctly identify typeof operator', () => {
      expect.assertions(1)

      let isTypeof = hasOperator('typeof')
      let node: UnaryExpression = {
        argument: { type: 'Identifier', name: 'a' },
        type: 'UnaryExpression',
        operator: 'typeof',
        prefix: true,
      }

      expect(isTypeof(node)).toBe(true)
    })

    it('should correctly identify void operator', () => {
      expect.assertions(1)

      let isVoid = hasOperator('void')
      let node: UnaryExpression = {
        argument: { type: 'Identifier', name: 'a' },
        type: 'UnaryExpression',
        operator: 'void',
        prefix: true,
      }

      expect(isVoid(node)).toBe(true)
    })

    it('should return false for non-matching unary operator', () => {
      expect.assertions(1)

      let isNot = hasOperator('!')
      let node: UnaryExpression = {
        argument: { type: 'Identifier', name: 'a' },
        type: 'UnaryExpression',
        operator: 'typeof',
        prefix: true,
      }

      expect(isNot(node)).toBe(false)
    })
  })

  describe('edge Cases', () => {
    it('should handle comparison between different operator types', () => {
      expect.assertions(1)

      let isAnd = hasOperator('&&')
      let node: UnaryExpression = {
        argument: { type: 'Identifier', name: 'a' },
        type: 'UnaryExpression',
        operator: '!',
        prefix: true,
      }

      expect(isAnd(node)).toBe(false)
    })
  })
})
