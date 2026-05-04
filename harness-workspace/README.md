# Roo Harness Extraction

This workspace is a reduced copy of Roo Code focused on the harness wiring:

- modes and prompt composition
- tool registration and mode filtering
- approval and ask handling
- provider selection and LLM client wiring
- the headless CLI path that drives the shared task engine

What was intentionally removed:

- webview-ui and other GUI-heavy surfaces
- web apps and evals
- nightly packaging
- e2e suites and containerized evaluation infrastructure
- translated docs and CLI documentation
- test-only directories

Start here:

- HARNESS.md
- apps/cli/src/agent/extension-host.ts
- src/core/task/Task.ts
- src/api/index.ts

Copied paths:

- AGENTS.md
- LICENSE
- tsconfig.json
- apps/cli
- packages/build
- packages/cloud
- packages/config-eslint
- packages/config-typescript
- packages/core
- packages/ipc
- packages/telemetry
- packages/types
- packages/vscode-shim
- schemas
- src/api
- src/core
- src/i18n
- src/integrations
- src/services/code-index
- src/services/mcp
- src/shared
- src/types
- src/utils
- src/workers
- src/package.json
- src/esbuild.mjs
- src/eslint.config.mjs
- src/tsconfig.json
- src/turbo.json
- src/vitest.config.ts
- src/vitest.setup.ts
- src/package.nls.json
- src/package.nls.ca.json
- src/package.nls.de.json
- src/package.nls.es.json
- src/package.nls.fr.json
- src/package.nls.hi.json
- src/package.nls.id.json
- src/package.nls.it.json
- src/package.nls.ja.json
- src/package.nls.ko.json
- src/package.nls.nl.json
- src/package.nls.pl.json
- src/package.nls.pt-BR.json
- src/package.nls.ru.json
- src/package.nls.tr.json
- src/package.nls.vi.json
- src/package.nls.zh-CN.json
- src/package.nls.zh-TW.json
