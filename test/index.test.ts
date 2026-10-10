import { describe, expect, it } from 'vitest'
import { ESLint } from 'eslint'

import noNegatedConjunction from '../rules/no-negated-conjunction'
import noNegatedDisjunction from '../rules/no-negated-disjunction'
import plugin, { configs, rules } from '../index'
import { version, name } from '../package.json'

describe('plugin', () => {
  it('should provide both rules', () => {
    expect(plugin.rules).toStrictEqual({
      'no-negated-conjunction': noNegatedConjunction,
      'no-negated-disjunction': noNegatedDisjunction,
    })
  })

  it('should provide the same rules and configs as named exports', () => {
    expect(rules).toBe(plugin.rules)
    expect(configs).toBe(plugin.configs)
  })

  it('should report negated conjunctions and disjunctions as errors with the recommended config', async () => {
    let eslint = new ESLint({
      overrideConfig: [plugin.configs.recommended],
      overrideConfigFile: true,
    })

    let [result] = await eslint.lintText('!(a && b)\n!(a || b)\n', {
      filePath: 'file.js',
    })

    expect(
      result!.messages.map(({ severity, ruleId }) => ({ severity, ruleId })),
    ).toStrictEqual([
      { ruleId: 'de-morgan/no-negated-conjunction', severity: 2 },
      { ruleId: 'de-morgan/no-negated-disjunction', severity: 2 },
    ])
  })

  it('should enable both rules as errors in the legacy recommended config', () => {
    expect(plugin.configs['recommended-legacy']).toStrictEqual({
      rules: {
        'de-morgan/no-negated-conjunction': 'error',
        'de-morgan/no-negated-disjunction': 'error',
      },
      plugins: ['de-morgan'],
    })
  })

  it('should identify the plugin by name and version in the config that ESLint hashes for its cache', async () => {
    let eslint = new ESLint({
      overrideConfig: [plugin.configs.recommended],
      overrideConfigFile: true,
    })

    let config: unknown = await eslint.calculateConfigForFile('file.js')

    expect(JSON.stringify(config)).toContain(`"de-morgan:${name}@${version}"`)
  })

  it('should allow the recommended config together with a config that registers the plugin', async () => {
    let eslint = new ESLint({
      overrideConfig: [
        plugin.configs.recommended,
        { plugins: { 'de-morgan': plugin } },
      ],
      overrideConfigFile: true,
    })

    let [result] = await eslint.lintText('!(a && b)\n', { filePath: 'file.js' })

    expect(result!.messages.map(({ ruleId }) => ruleId)).toStrictEqual([
      'de-morgan/no-negated-conjunction',
    ])
  })
})
