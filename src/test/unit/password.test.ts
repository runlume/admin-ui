import { describe, expect, it } from 'vitest'
import { passwordRules, passwordStrength } from '@/lib/password'

describe('密码强度', () => {
  it('空密码不参与评级', () => {
    expect(passwordStrength('')).toMatchObject({ score: 0, level: 'empty' })
    expect(passwordStrength('').matched).toEqual([])
    expect(passwordStrength('').missing).toHaveLength(passwordRules.length)
  })

  it('按命中规则数量分级', () => {
    expect(passwordStrength('abc').level).toBe('weak')
    expect(passwordStrength('abc12345').level).toBe('medium')
    expect(passwordStrength('Abc12345!').level).toBe('strong')
    expect(passwordStrength('Abc12345!').missing).toEqual([])
  })

  it('逐条规则可独立判断', () => {
    expect(passwordStrength('Abc12345!').matched).toEqual([
      'length',
      'upper',
      'lower',
      'digit',
      'symbol',
    ])
    expect(passwordStrength('abcdefgh').matched).toEqual(['length', 'lower'])
  })
})
