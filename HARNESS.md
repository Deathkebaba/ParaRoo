# Harness Map

This repository contains a lot of product surface, but the harness itself is concentrated in a smaller path.

## Primary control path

- apps/cli/src/agent/extension-host.ts boots the extension headlessly through the vscode shim and seeds the initial mode, provider, and approval settings.
- src/extension.ts activates the shared extension runtime and creates ClineProvider.
- src/core/webview/ClineProvider.ts owns task creation and bridges state, storage, and the task engine.
- src/core/task/Task.ts is the agent loop. This is where prompt assembly, tool exposure, approval checks, and provider requests meet.

## Modes and prompt assembly

- schemas/roomodes.json holds the mode schema, while the shipped built-in defaults are sourced through @roo-code/types.
- src/shared/modes.ts resolves built-in versus custom modes and merges prompt overrides.
- src/core/prompts/system.ts builds the system prompt by combining:
  - role definition for the current mode
  - shared rules and tool-use instructions
  - global custom instructions
  - mode-specific custom instructions
  - workspace instruction files discovered by addCustomInstructions()
- Task.ts calls SYSTEM_PROMPT(...) right before sending a model request.

## Tool wiring

- src/core/prompts/tools/native-tools contains the built-in tool definitions given to models.
- src/core/prompts/tools/filter-tools-for-mode.ts filters tools according to the active mode.
- src/core/task/build-tools.ts merges:
  - native tools
  - MCP tools
  - custom tools from packages/core/src/custom-tools/custom-tool-registry.ts
- The result is passed into provider requests through ApiHandlerCreateMessageMetadata.tools.

## Approval model

- apps/cli/src/agent/extension-host.ts sets permissive auto-approval defaults for non-interactive runs.
- src/core/task/Task.ts routes all asks and tool approvals.
- src/core/auto-approval checks whether an operation can be auto-approved from settings like alwaysAllowReadOnly, alwaysAllowWrite, alwaysAllowExecute, alwaysAllowMcp, and alwaysAllowModeSwitch.
- AutoApprovalHandler in the same area enforces rolling limits so approval is not only boolean, but budgeted.

## Provider wiring

- apps/cli/src/lib/utils/provider.ts maps CLI flags into RooCodeSettings.
- src/core/task/Task.ts instantiates the active provider via buildApiHandler(this.apiConfiguration).
- src/api/index.ts is the provider factory.
- src/api/providers contains the concrete LLM provider clients and protocol adapters.
- Providers receive the system prompt, message history, tool definitions, tool choice, allowed function names, and task metadata.

## Best files to read first

- apps/cli/src/agent/extension-host.ts
- src/core/task/Task.ts
- src/core/task/build-tools.ts
- src/core/prompts/system.ts
- src/shared/modes.ts
- src/api/index.ts

## Practical extraction boundary

If your goal is to reuse the harness without the GUI, the most stable boundary is:

- apps/cli
- src/core/task
- src/core/prompts
- src/api
- src/shared/modes.ts and shared tool metadata
- packages/types
- packages/core custom-tools support
- packages/vscode-shim for headless extension bootstrapping

Everything else is either product shell, delivery packaging, or optional integration surface.