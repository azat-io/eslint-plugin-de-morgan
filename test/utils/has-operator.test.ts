import type { LogicalExpression, UnaryExpression } from 'estree'

import { describe, expect, it } from 'vitest'

import { hasOperator } from '../../utils/has-operator'

describe('hasOperator', () => {
  describe('logical Operators', () => {
    it('should correctly identify AND operator', () => {
      let isAnd = hasOperator('&&')
      let node: LogicalExpression = {
        right: { type: 'Identifier', name: 'b' },
        left: { type: 'Identifier', name: 'a' },
        type: 'LogicalExpression',
        operator: '&&',
      }

      expect(isAnd(node)).toBeTruthy()
    })

    it('should correctly identify OR operator', () => {
      let isOr = hasOperator('||')
      let node: LogicalExpression = {
        right: { type: 'Identifier', name: 'b' },
        left: { type: 'Identifier', name: 'a' },
        type: 'LogicalExpression',
        operator: '||',
      }

      expect(isOr(node)).toBeTruthy()
    })

    it('should correctly identify nullish coalescing operator', () => {
      let isNullish = hasOperator('??')
      let node: LogicalExpression = {
        right: { type: 'Identifier', name: 'b' },
        left: { type: 'Identifier', name: 'a' },
        type: 'LogicalExpression',
        operator: '??',
      }

      expect(isNullish(node)).toBeTruthy()
    })

    it('should return false for non-matching logical operator', () => {
      let isAnd = hasOperator('&&')
      let node: LogicalExpression = {
        right: { type: 'Identifier', name: 'b' },
        left: { type: 'Identifier', name: 'a' },
        type: 'LogicalExpression',
        operator: '||',
      }

      expect(isAnd(node)).toBeFalsy()
    })
  })

  describe('unary Operators', () => {
    it('should correctly identify NOT operator', () => {
      let isNot = hasOperator('!')
      let node: UnaryExpression = {
        argument: { type: 'Identifier', name: 'a' },
        type: 'UnaryExpression',
        operator: '!',
        prefix: true,
      }

      expect(isNot(node)).toBeTruthy()
    })

    it('should correctly identify typeof operator', () => {
      let isTypeof = hasOperator('typeof')
      let node: UnaryExpression = {
        argument: { type: 'Identifier', name: 'a' },
        type: 'UnaryExpression',
        operator: 'typeof',
        prefix: true,
      }

      expect(isTypeof(node)).toBeTruthy()
    })

    it('should correctly identify void operator', () => {
      let isVoid = hasOperator('void')
      let node: UnaryExpression = {
        argument: { type: 'Identifier', name: 'a' },
        type: 'UnaryExpression',
        operator: 'void',
        prefix: true,
      }

      expect(isVoid(node)).toBeTruthy()
    })

    it('should return false for non-matching unary operator', () => {
      let isNot = hasOperator('!')
      let node: UnaryExpression = {
        argument: { type: 'Identifier', name: 'a' },
        type: 'UnaryExpression',
        operator: 'typeof',
        prefix: true,
      }

      expect(isNot(node)).toBeFalsy()
    })
  })

  describe('edge Cases', () => {
    it('should handle comparison between different operator types', () => {
      let isAnd = hasOperator('&&')
      let node: UnaryExpression = {
        argument: { type: 'Identifier', name: 'a' },
        type: 'UnaryExpression',
        operator: '!',
        prefix: true,
      }

      expect(isAnd(node)).toBeFalsy()
    })
  })
})
