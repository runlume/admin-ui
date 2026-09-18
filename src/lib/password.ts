/** 密码强度规则与评分。 */
export type PasswordRule = { key: string; test: (value: string) => boolean }

export const passwordRules: PasswordRule[] = [
  { key: 'length', test: (value) => value.length >= 8 },
  { key: 'upper', test: (value) => /[A-Z]/.test(value) },
  { key: 'lower', test: (value) => /[a-z]/.test(value) },
  { key: 'digit', test: (value) => /\d/.test(value) },
  { key: 'symbol', test: (value) => /[^\dA-Za-z]/.test(value) },
]

export type PasswordStrength = {
  matched: string[]
  missing: string[]
  score: number
  level: 'empty' | 'weak' | 'medium' | 'strong'
}

export function passwordStrength(
  value: string,
  rules: PasswordRule[] = passwordRules,
): PasswordStrength {
  const matched = rules.filter((rule) => rule.test(value)).map((rule) => rule.key)
  const missing = rules.filter((rule) => !rule.test(value)).map((rule) => rule.key)
  const score = matched.length
  const level: PasswordStrength['level'] =
    value === '' ? 'empty' : score >= 5 ? 'strong' : score >= 3 ? 'medium' : 'weak'
  return { matched, missing, score, level }
}
