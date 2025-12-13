# huetemps CLI

Command-line tool for controlling Hue lights. Only the CLI scaffolding is implemented; API/configure/temps modules will be filled in next.

## Quick start

1. Install dependencies: `npm install`
2. Build: `npm run build`
3. Run the CLI: `node dist/src/cli/index.js`
4. Global install from the repo (builds via prepare): `npm install -g .`
	- Then run from anywhere: `huetemps list lights`
	- For local dev without global install: `npm link` (and `npm unlink` when done).
4. Debug: use the VS Code launch configs under `.vscode`.

## Commands

- `huetemps` — start an interactive REPL.
- `huetemps list [lights|groups|sensors|temps]` — list known resources (placeholder data for now).
- `huetemps refresh` — clear cached data and fetch latest (stub implementation).

## Development

- TypeScript, ESM, functional-leaning modules under `src/`.
- Logging level is controlled by `LOG_LEVEL` (debug, info, warn, error).
- Unit tests use the built-in Node test runner and live next to source files.
- Formatting: Prettier; Linting: ESLint with @typescript-eslint.
- Dev container: `.devcontainer/devcontainer.json` (Node 24 image).

## Release targets

- Build outputs to `dist/`; `bin` points to the compiled CLI entry.
- Ready for global installation via `npm install -g` once API wiring is added.
