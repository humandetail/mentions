module.exports = {
  env: {
    browser: true,
    es2021: true
  },
  extends: 'standard-with-typescript',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },

  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      plugins: ['@typescript-eslint'],
      extends: [
        'plugin:@typescript-eslint/recommended'
      ],

      parserOptions: {
        project: ['./tsconfig.json']
      }
    }
  ],

  rules: {
    '@typescript-eslint/key-spacing': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off'
  }
}
