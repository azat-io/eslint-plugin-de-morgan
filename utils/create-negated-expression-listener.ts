import type { LogicalOperator, UnaryExpression, Node } from 'estree'
import type { Rule } from 'eslint'

import { createTestWithParameters } from './create-test-with-parameters'
import { hasNegationInsideParens } from './has-negation-inside-parens'
import { isInTruthinessContext } from './is-in-truthiness-context'
import { getStatementSafeFix } from './get-statement-safe-fix'
import { needsParentParens } from './needs-parent-parens'
import { hasBooleanContext } from './has-boolean-context'
import { applyToProperty } from './apply-to-property'
import { isDisjunction } from './is-disjunction'
import { isConjunction } from './is-conjunction'
import { sanitizeCode } from './sanitize-code'
import { isNegated } from './is-negated'
import { transform } from './transform'
import { not } from './not'
import { or } from './or'

interface CreateNegatedExpressionListenerOptions {
  /**
   * An extra condition checked after the operand kind has matched. It is
   * evaluated only for nodes that are already known to be reportable, so a rule
   * can withhold the report without changing the checks made before it.
   */
  isApplicable?(node: ParentedExpression): boolean

  /**
   * The kind of logical expression the rule looks for inside the negation.
   */
  expressionType: ExpressionType

  /**
   * The ESLint rule context.
   */
  context: Rule.RuleContext

  /**
   * The `meta.messages` key the rule reports with.
   */
  messageId: string
}

interface ExpressionSettings {
  /**
   * The logical operator produced by the fix.
   */
  targetOperator: LogicalOperator

  /**
   * Checks whether the operand of the negation is of the expected kind.
   */
  isOperand(node: Node): boolean
}

type ParentedExpression = Rule.NodeParentExtension & UnaryExpression

type NegatedExpressionListener = (node: ParentedExpression) => void

type ExpressionType = 'conjunction' | 'disjunction'

const EXPRESSION_SETTINGS: Record<ExpressionType, ExpressionSettings> = {
  conjunction: {
    isOperand: isConjunction,
    targetOperator: '||',
  },
  disjunction: {
    isOperand: isDisjunction,
    targetOperator: '&&',
  },
}

/**
 * Creates the `UnaryExpression` listener shared by the rules of this plugin.
 * The listener detects a negated conjunction or disjunction, rewrites it
 * according to De Morgan's law, and reports the given message with the original
 * and the fixed code as placeholders. The kind of operand to look for and the
 * logical operator produced by the fix are both derived from `expressionType`,
 * so a rule cannot pair them inconsistently.
 *
 * @example
 *
 * ```ts
 * create: context => ({
 *   UnaryExpression: createNegatedExpressionListener({
 *     messageId: 'convertNegatedConjunction',
 *     expressionType: 'conjunction',
 *     context,
 *   }),
 * })
 * ```
 *
 * @param options - The detection and reporting options.
 * @returns The `UnaryExpression` listener to put into the rule visitor.
 */
export function createNegatedExpressionListener({
  expressionType,
  isApplicable,
  messageId,
  context,
}: CreateNegatedExpressionListenerOptions): NegatedExpressionListener {
  let { targetOperator, isOperand } = EXPRESSION_SETTINGS[expressionType]

  return node => {
    let test = createTestWithParameters(node, context)
    if (
      test(
        isNegated,
        applyToProperty('argument', isOperand),
        or(hasBooleanContext, not(hasNegationInsideParens)),
      ) &&
      (isApplicable?.(node) ?? true)
    ) {
      let shouldWrapInParens = needsParentParens(node, targetOperator)
      let canStripNegation = isInTruthinessContext(node)

      let fixedExpression = transform({
        shouldWrapInParens,
        canStripNegation,
        expressionType,
        context,
        node,
      })

      if (fixedExpression) {
        let safeFix = getStatementSafeFix({
          fix: fixedExpression,
          context,
          node,
        })
        let originalExpression = context.sourceCode.getText(node)

        context.report({
          data: {
            fixed: sanitizeCode(safeFix ?? fixedExpression),
            original: sanitizeCode(originalExpression),
          },
          fix: fixer =>
            safeFix === null ? null : fixer.replaceText(node, safeFix),
          messageId,
          node,
        })
      }
    }
  }
}
