import type { Linter, Rule } from 'eslint'

import noNegatedConjunction from './rules/no-negated-conjunction'
import noNegatedDisjunction from './rules/no-negated-disjunction'

interface PluginConfig {
  rules: {
    'no-negated-conjunction': Rule.RuleModule
    'no-negated-disjunction': Rule.RuleModule
  }
  configs: {
    'recommended-legacy': Linter.LegacyConfig
    recommended: Linter.Config
  }
  name: string
}

let name = 'de-morgan'

let rules: Record<string, Rule.RuleModule> = {
  'no-negated-conjunction': noNegatedConjunction,
  'no-negated-disjunction': noNegatedDisjunction,
}

let getRules = (): Linter.RulesRecord =>
  Object.fromEntries(
    Object.keys(rules).map(ruleName => [`${name}/${ruleName}`, 'error']),
  )

let createConfig = (): Linter.Config => ({
  plugins: {
    [name]: {
      rules,
      name,
    },
  },
  rules: getRules(),
})

let createLegacyConfig = (): Linter.LegacyConfig => ({
  rules: getRules(),
  plugins: [name],
})

export default {
  configs: {
    'recommended-legacy': createLegacyConfig(),
    recommended: createConfig(),
  },
  rules,
} as PluginConfig
