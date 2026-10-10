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

export let rules: Record<string, Rule.RuleModule> = {
  'no-negated-conjunction': noNegatedConjunction,
  'no-negated-disjunction': noNegatedDisjunction,
}

/**
 * The flat config registers this very object, not a copy of its rules: ESLint
 * builds the cache key from the plugin's `meta`, and refuses two different
 * objects under one plugin name in a single configuration.
 */
let plugin = {
  meta: {
    version: packageVersion,
    name: packageName,
  },
  configs: {} as PluginConfig['configs'],
  rules,
}

function getRules(): Linter.RulesRecord {
  return Object.fromEntries(
    Object.keys(rules).map(ruleName => [`${pluginName}/${ruleName}`, 'error']),
  )
}

function createConfig(): Linter.Config {
  return {
    plugins: {
      [pluginName]: plugin,
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

export let configs: PluginConfig['configs'] = Object.assign(plugin.configs, {
  'recommended-legacy': createLegacyConfig(),
  recommended: createConfig(),
})

export default plugin as PluginConfig
