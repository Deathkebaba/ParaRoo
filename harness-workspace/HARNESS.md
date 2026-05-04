# Harness Map

This stripped workspace keeps the runtime wiring and removes the product shells around it.

## Entry path

- apps/cli/src/agent/extension-host.ts loads the extension in headless mode through the vscode shim.
- The constructor seeds the initial RooCodeSettings, including mode, provider settings, and auto-approval flags.
- src/extension.ts is still present because the CLI path boots the same extension runtime and creates the same provider object.

## Modes and instructions

- roomodes.json defines the shipped mode catalog.
- schemas/roomodes.json describes the shipped mode schema, and built-in defaults come from @roo-code/types.
- src/shared/modes.ts resolves built-in and custom modes and merges mode prompt overrides.
- src/core/prompts/system.ts assembles the system prompt.
- src/core/prompts/sections/custom-instructions.ts and addCustomInstructions() append global, mode-specific, and workspace instructions.
- src/core/task/Task.ts calls SYSTEM_PROMPT(...) immediately before provider requests.

## Tools

- src/core/prompts/tools/native-tools contains the native tool definitions exposed to models.
- src/core/prompts/tools/filter-tools-for-mode.ts applies mode restrictions.
- src/core/task/build-tools.ts combines native tools, MCP tools, and custom tools into the tool array handed to providers.
- packages/core/src/custom-tools/custom-tool-registry.ts handles dynamic custom tool loading.

## Approval flow

- apps/cli/src/agent/extension-host.ts toggles broad auto-approval defaults for non-interactive runs.
- src/core/task/Task.ts routes asks, tool gating, and approval checks.
- src/core/auto-approval contains approval policy and quota logic used by Task.
- checkAutoApproval(...) is the first pass and AutoApprovalHandler enforces accumulated limits.

## Providers and model wiring

- apps/cli/src/lib/utils/provider.ts maps CLI provider flags into RooCodeSettings.
- src/core/task/Task.ts constructs the active ApiHandler with buildApiHandler(...).
- src/api/index.ts is the provider factory.
- src/api/providers contains the concrete provider clients and protocol adapters.
- Provider-specific tool metadata is passed through ApiHandlerCreateMessageMetadata, including tools, tool choice, parallel tool calls, and mode/task metadata.

## What is deliberately absent

- webview-ui
- apps/web-evals
- apps/vscode-e2e
- apps/vscode-nightly
- web-roo-code
- locales
- docs and __tests__ directories inside copied trees

If you need to keep trimming, start from apps/cli/src/agent plus src/core/task and remove secondary integrations one dependency edge at a time.
