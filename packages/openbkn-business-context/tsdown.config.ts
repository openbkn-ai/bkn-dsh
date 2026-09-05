import { defineConfig } from 'tsdown'
import { typertPlugin } from '@deepseek-ai/dsh-typert-generator/tsdown'

export default defineConfig(({ env }) => {
  const client = env?.DSH_BUILD_FACE === 'client'
  if (!client && env?.DSH_BUILD_FACE !== undefined && env.DSH_BUILD_FACE !== 'host') {
    throw new Error(`tsdown: DSH_BUILD_FACE must be host or client, received ${String(env.DSH_BUILD_FACE)}`)
  }
  return client ? {
    entry: { client: 'src/client/index.tsx' },
    outDir: 'lib',
    format: ['cjs'],
    platform: 'browser',
    dts: false,
    clean: false,
    // DSH's module table already supplies React. Bundling it would introduce
    // React's Node-only development branch (`process.env`) into the browser
    // factory, which runs without a Node global.
    deps: {
      neverBundle: ['react', 'react/jsx-runtime'],
      alwaysBundle: ['zod'],
    },
    // The generated Remote descriptor imports Zod at runtime. Third-party
    // client bundles do not receive transitive dependencies as DSH module
    // factories, so keep this small schema runtime inside this bundle.
    outputOptions: {
      entryFileNames: 'client.js',
      banner: "window.__ModuleLoader__.load({ id: '@openbkn/dsh-business-context', factory: (require) => {",
      footer: 'return module.exports; } });',
      intro: 'var module = { exports: {} }; var exports = module.exports;',
    },
  } : {
    entry: ['src/index.ts'],
    outDir: 'lib',
    format: ['esm'],
    platform: 'node',
    target: 'es2022',
    fixedExtension: false,
    dts: false,
    clean: false,
    plugins: [typertPlugin({ mode: 'package', faces: ['host'] })],
  }
})
