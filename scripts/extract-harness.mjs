import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, "..")
const destinationArg = process.argv[2]
const destinationRoot = path.resolve(repoRoot, destinationArg || "harness-workspace")

const TOP_LEVEL_FILES = [
	"AGENTS.md",
	"LICENSE",
	"tsconfig.json",
]

const DIRECTORIES_TO_COPY = [
	"apps/cli",
	"packages/build",
	"packages/cloud",
	"packages/config-eslint",
	"packages/config-typescript",
	"packages/core",
	"packages/ipc",
	"packages/telemetry",
	"packages/types",
	"packages/vscode-shim",
	"schemas",
	"src/api",
	"src/core",
	"src/i18n",
	"src/integrations",
	"src/services/code-index",
	"src/services/mcp",
	"src/shared",
	"src/types",
	"src/utils",
	"src/workers",
]

const SRC_PACKAGE_FILES = [
	"src/package.json",
	"src/esbuild.mjs",
	"src/eslint.config.mjs",
	"src/tsconfig.json",
	"src/turbo.json",
	"src/vitest.config.ts",
	"src/vitest.setup.ts",
	"src/package.nls.json",
	"src/package.nls.ca.json",
	"src/package.nls.de.json",
	"src/package.nls.es.json",
	"src/package.nls.fr.json",
	"src/package.nls.hi.json",
	"src/package.nls.id.json",
	"src/package.nls.it.json",
	"src/package.nls.ja.json",
	"src/package.nls.ko.json",
	"src/package.nls.nl.json",
	"src/package.nls.pl.json",
	"src/package.nls.pt-BR.json",
	"src/package.nls.ru.json",
	"src/package.nls.tr.json",
	"src/package.nls.vi.json",
	"src/package.nls.zh-CN.json",
	"src/package.nls.zh-TW.json",
]

const SKIP_DIRECTORY_NAMES = new Set([
	"node_modules",
	"dist",
	"build",
	"out",
	"coverage",
	".turbo",
	".next",
	"docs",
	"__tests__",
	"__mocks__",
	"mock",
	"logs",
])

const SKIP_FILE_SUFFIXES = [".tsbuildinfo"]

function toPosixPath(value) {
	return value.split(path.sep).join("/")
}

function shouldSkipFile(name) {
	return SKIP_FILE_SUFFIXES.some((suffix) => name.endsWith(suffix))
}

async function pathExists(targetPath) {
	try {
		await fs.access(targetPath)
		return true
	} catch {
		return false
	}
}

async function ensureParentDir(targetPath) {
	await fs.mkdir(path.dirname(targetPath), { recursive: true })
}

async function copyFileRelative(relativePath) {
	const sourcePath = path.join(repoRoot, relativePath)
	const targetPath = path.join(destinationRoot, relativePath)
	if (!(await pathExists(sourcePath))) {
		throw new Error(`Missing required file: ${relativePath}`)
	}
	await ensureParentDir(targetPath)
	await fs.copyFile(sourcePath, targetPath)
}

async function copyDirectoryRelative(relativePath) {
	const sourcePath = path.join(repoRoot, relativePath)
	const targetPath = path.join(destinationRoot, relativePath)
	if (!(await pathExists(sourcePath))) {
		throw new Error(`Missing required directory: ${relativePath}`)
	}
	await copyDirectory(sourcePath, targetPath)
}

async function copyDirectory(sourcePath, targetPath) {
	await fs.mkdir(targetPath, { recursive: true })
	const entries = await fs.readdir(sourcePath, { withFileTypes: true })

	for (const entry of entries) {
		if (entry.isDirectory() && SKIP_DIRECTORY_NAMES.has(entry.name)) {
			continue
		}
		if (entry.isFile() && shouldSkipFile(entry.name)) {
			continue
		}

		const entrySourcePath = path.join(sourcePath, entry.name)
		const entryTargetPath = path.join(targetPath, entry.name)

		if (entry.isDirectory()) {
			await copyDirectory(entrySourcePath, entryTargetPath)
			continue
		}

		if (entry.isFile()) {
			await ensureParentDir(entryTargetPath)
			await fs.copyFile(entrySourcePath, entryTargetPath)
		}
	}
}

async function patchCopiedCliTsconfig() {
	const cliTsconfigPath = path.join(destinationRoot, "apps/cli/tsconfig.json")
	if (!(await pathExists(cliTsconfigPath))) {
		return
	}

	const rawTsconfig = await fs.readFile(cliTsconfigPath, "utf8")
	if (rawTsconfig.includes('"ignoreDeprecations"')) {
		return
	}

	const patchedTsconfig = rawTsconfig.replace(
		'\t\t"paths": {',
		'\t\t"ignoreDeprecations": "6.0",\n\t\t"paths": {',
	)

	await fs.writeFile(cliTsconfigPath, patchedTsconfig)
}

function buildRootPackageJson() {
	return {
		name: "roo-harness-workspace",
		private: true,
		packageManager: "pnpm@10.8.1",
		engines: {
			node: "20.19.2",
		},
		workspaces: ["src", "apps/*", "packages/*"],
		scripts: {
			"check-types": "pnpm --filter @roo-code/cli check-types",
			"build:cli": "pnpm --filter @roo-code/cli build",
		},
	}
}

function buildHarnessReadme() {
	const copiedPaths = [
		...TOP_LEVEL_FILES,
		...DIRECTORIES_TO_COPY,
		...SRC_PACKAGE_FILES,
	].map((item) => `- ${item}`)

	return `# Roo Harness Extraction

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

${copiedPaths.join("\n")}
`
}

function buildHarnessGuide() {
	return `# Harness Map

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
`
}

async function writeGeneratedFiles() {
	const packageJsonPath = path.join(destinationRoot, "package.json")
	await ensureParentDir(packageJsonPath)
	await fs.writeFile(packageJsonPath, `${JSON.stringify(buildRootPackageJson(), null, 2)}\n`)

	const workspaceYamlPath = path.join(destinationRoot, "pnpm-workspace.yaml")
	await fs.writeFile(workspaceYamlPath, 'packages:\n  - "src"\n  - "apps/*"\n  - "packages/*"\n')

	const readmePath = path.join(destinationRoot, "README.md")
	await fs.writeFile(readmePath, buildHarnessReadme())

	const harnessGuidePath = path.join(destinationRoot, "HARNESS.md")
	await fs.writeFile(harnessGuidePath, buildHarnessGuide())
}

async function main() {
	await fs.rm(destinationRoot, { recursive: true, force: true })
	await fs.mkdir(destinationRoot, { recursive: true })

	for (const relativePath of TOP_LEVEL_FILES) {
		await copyFileRelative(relativePath)
	}

	for (const relativePath of SRC_PACKAGE_FILES) {
		await copyFileRelative(relativePath)
	}

	for (const relativePath of DIRECTORIES_TO_COPY) {
		await copyDirectoryRelative(relativePath)
	}

	await patchCopiedCliTsconfig()

	await writeGeneratedFiles()

	const copiedSummary = [
		...TOP_LEVEL_FILES,
		...SRC_PACKAGE_FILES,
		...DIRECTORIES_TO_COPY,
	].map((item) => `  - ${toPosixPath(item)}`)

	console.log(`Created harness workspace at ${destinationRoot}`)
	console.log("Included paths:")
	console.log(copiedSummary.join("\n"))
	console.log("Read HARNESS.md in the extracted workspace for the wiring map.")
}

main().catch((error) => {
	console.error(error)
	process.exitCode = 1
})