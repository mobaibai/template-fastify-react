import baseConfig from '@repo/eslint-config'

export default [
  ...baseConfig,
  {
    rules: {
      'no-console': 'off',
    },
  },
]
