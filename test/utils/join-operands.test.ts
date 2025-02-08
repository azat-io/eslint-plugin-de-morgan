import type { LogicalOperator } from 'estree'

import { describe, expect, it } from 'vitest'

import { joinOperands } from '../../utils/join-operands'

describe('joinOperands', () => {
  it('should join operands using the specified operator without wrapping', () => {
    let operands = ['a', 'b', 'c']
    let operator: LogicalOperator = '||'
    let result = joinOperands(operands, false, operator)
    expect(result).toBe('a || b || c')
  })

  it('should join operands using the specified operator and wrap the result in parentheses', () => {
    let operands = ['a', 'b', 'c']
    let operator: LogicalOperator = '||'
    let result = joinOperands(operands, true, operator)
    expect(result).toBe('(a || b || c)')
  })

  it('should join operands with a different operator', () => {
    let operands = ['x', 'y']
    let operator: LogicalOperator = '&&'
    let result = joinOperands(operands, false, operator)
    expect(result).toBe('x && y')
  })

  it('should return an empty string when no operands are provided', () => {
    let operands: string[] = []
    let operator: LogicalOperator = '||'
    let result = joinOperands(operands, false, operator)
    expect(result).toBe('')
  })

  it('should return the single operand as is, regardless of wrap flag', () => {
    let operands = ['a']
    let operator: LogicalOperator = '||'
    let resultWithoutWrap = joinOperands(operands, false, operator)
    let resultWithWrap = joinOperands(operands, true, operator)
    expect(resultWithoutWrap).toBe('a')
    expect(resultWithWrap).toBe('(a)')
  })
})
