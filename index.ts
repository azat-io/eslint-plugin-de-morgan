import type { Linter, Rule } from 'eslint'

import { version as packageVersion, name as packageName } from './package.json'
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
  meta: {
    version: string
    name: string
  }
}

let pluginName = 'de-morgan'

let rules: Record<string, Rule.RuleModule> = {
  'no-negated-conjunction': noNegatedConjunction,
  'no-negated-disjunction': noNegatedDisjunction,
}

function getRules(): Linter.RulesRecord {
  return Object.fromEntries(
    Object.keys(rules).map(ruleName => [`${pluginName}/${ruleName}`, 'error']),
  )
}

function createConfig(): Linter.Config {
  return {
    plugins: {
      [pluginName]: {
        rules,
      },
    },
    rules: getRules(),
  }
}

function createLegacyConfig(): Linter.LegacyConfig {
  return {
    plugins: [pluginName],
    rules: getRules(),
  }
}

export default {
  configs: {
    'recommended-legacy': createLegacyConfig(),
    recommended: createConfig(),
  },
  meta: {
    version: packageVersion,
    name: packageName,
  },
  rules,
} as PluginConfig
