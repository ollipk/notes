/** Module boundary rules. See .github/copilot-instructions.md, README.md and docs/adr/0011. */
const FRAMEWORKS =
  '(^|/)node_modules/(react|react-dom|react-router|i18next|react-i18next|i18next-browser-languagedetector|abcjs)/';

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

    // packages/domain (@notes/domain): pure, portable logic with no runtime dependencies.
    {
      name: 'domain-not-to-apps',
      severity: 'error',
      comment: 'packages/domain is shared by every app and must not depend on any of them.',
      from: { path: '^packages/domain/' },
      to: { path: '^apps/' },
    },
    {
      name: 'domain-no-frameworks',
      severity: 'error',
      comment:
        'packages/domain must not import React, the router, i18n or abcjs, so it stays portable and testable.',
      from: { path: '^packages/domain/' },
      to: { path: FRAMEWORKS },
    },
    {
      name: 'domain-no-node-builtins',
      severity: 'error',
      comment:
        'packages/domain runs in the browser and on the server, so it must not use Node built-ins.',
      from: { path: '^packages/domain/' },
      to: { dependencyTypes: ['core'] },
    },
    {
      name: 'domain-no-packages',
      severity: 'error',
      comment:
        'packages/domain has no runtime dependencies: its source imports only its own files (ADR 11).',
      from: { path: '^packages/domain/', pathNot: '\\.test\\.ts$' },
      to: { pathNot: '^packages/domain/src/' },
    },
    {
      name: 'domain-tests-only-vitest',
      severity: 'error',
      comment: 'Domain tests import the domain and vitest only.',
      from: { path: '^packages/domain/.+\\.test\\.ts$' },
      to: { pathNot: '^(packages/domain/src/|node_modules/(vitest|@vitest)/)' },
    },

    // apps/web: uses the domain only through the @notes/domain package entry point.
    {
      name: 'web-domain-only-via-package',
      severity: 'error',
      comment:
        "Import the domain as '@notes/domain', never through a relative path into packages/ or a file other than its index.",
      from: { path: '^apps/' },
      to: { path: '^packages/', pathNot: '^packages/domain/src/index\\.ts$' },
    },
    {
      name: 'web-domain-not-relative',
      severity: 'error',
      comment:
        "Import the domain as '@notes/domain', never through a relative path into packages/.",
      from: { path: '^apps/' },
      to: { path: '^packages/', dependencyTypes: ['local'] },
    },
    {
      name: 'ui-not-to-app',
      severity: 'error',
      comment:
        'apps/web/src/ui components are composed by apps/web/src/app, never the other way round.',
      from: { path: '^apps/web/src/ui/' },
      to: { path: '^apps/web/src/app/' },
    },
    {
      name: 'abcjs-only-in-adapter',
      severity: 'error',
      comment:
        'abcjs is used only through the adapter in apps/web/src/ui/abc/, so components depend on a small interface and tests can replace it (ADR 8).',
      from: { path: '^apps/web/src/', pathNot: '^apps/web/src/ui/abc/' },
      to: { path: '(^|/)node_modules/abcjs/' },
    },
    {
      name: 'abcjs-adapter-lazy',
      severity: 'error',
      comment:
        'Load the abcjs adapter with loadAbc() (a dynamic import), so abcjs stays out of the home page bundle (ADR 8).',
      from: { path: '^apps/web/src/', pathNot: '^apps/web/src/ui/abc/' },
      to: { path: '^apps/web/src/ui/abc/abcjsAdapter', dynamic: false },
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
    exclude: { path: '(^|/)dist/' },
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
      mainFields: ['module', 'main', 'types', 'typings'],
    },
  },
};
