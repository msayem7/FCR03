module.exports = {
    root: true,
    env: {
      node: true,
      browser: true,
      es2021: true,
    },
    extends: [
      'plugin:vue/vue3-recommended',
      'eslint:recommended'
    ],
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: '@babel/eslint-parser'
    },
    rules: {
      'vue/script-setup-uses-vars': 'error',
      'no-unused-vars': 'warn',
      'vue/multi-word-component-names': 'off'
    }
  }