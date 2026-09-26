/** Module boundary rules. See .github/copilot-instructions.md and README.md. */
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Circular dependencies make modules hard to reason about and test.',
      from: {},
      to: { circular: true },
    },
    {
      name: 'domain-not-to-ui-or-app',
      severity: 'error',
      comment: 'src/domain is pure logic and must not depend on the UI or app layers.',
      from: { path: '^src/domain/' },
      to: { path: '^src/(ui|app)/' },
    },
    {
      name: 'domain-no-frameworks',
      severity: 'error',
      comment:
        'src/domain must not import React, the router or i18n, so it stays portable and testable.',
      from: { path: '^src/domain/' },
      to: {
        path: '(^|/)node_modules/(react|react-dom|react-router|i18next|react-i18next|i18next-browser-languagedetector)/',
      },
    },
    {
      name: 'domain-no-locales',
      severity: 'error',
      comment: 'src/domain must not depend on UI text.',
      from: { path: '^src/domain/' },
      to: { path: '^src/locales/' },
    },
    {
      name: 'ui-not-to-app',
      severity: 'error',
      comment: 'src/ui components are composed by src/app, never the other way round.',
      from: { path: '^src/ui/' },
      to: { path: '^src/app/' },
    },
    {
      name: 'not-to-unresolvable',
      severity: 'error',
      comment: 'Every import must resolve.',
      from: {},
      to: { couldNotResolve: true },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.app.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
      mainFields: ['module', 'main', 'types', 'typings'],
    },
  },
};
