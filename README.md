# huetemps

Practical command-line control for your Philips Hue home.

---

## Table of contents

- [Install](#install)
- [Quick start](#quick-start)
- [Usage](#usage)
- [Configuration](#configuration)
- [Credentials and security](#credentials-and-security)
- [Troubleshooting](#troubleshooting)
- [Developer guide](#developer-guide)

## Install

### From npm (global)

```bash
npm install -g huetemps
```

Then confirm installation:

```bash
huetemps --help
```

### From local source (global)

If you are testing this repository directly:

```bash
npm install -g .
```

This triggers the package `prepare` script and installs the compiled CLI.

## Quick start

### 1) Create config.yaml

`huetemps` reads `config.yaml` from your current working directory.

Use this minimal file:

```yaml
zoneName: Hue Temps

logging:
	level: info        # debug | info | warn | error
	# file: ./huetemps.log
	# maxSize: 10m
	# maxFiles: 5
```

### 2) Set bridge credentials

Option A (recommended): store in OS keystore

```bash
huetemps connect set bridge <bridge-ipv4>
huetemps connect set user <hue-user-token>
huetemps connect list
```

Option B: set environment variables

```bash
# PowerShell
$env:HUETEMPS_BRIDGE="192.168.1.50"
$env:HUETEMPS_USER="your-user-token"
```

### 3) Run commands

```bash
huetemps list
huetemps list lights
huetemps list groups
huetemps alert "Living Room - Table 1"
```

## Usage

### Main commands

- `huetemps list [target]`
  - `target`: `lights | groups | sensors | temps | all`
  - default target: `all`
- `huetemps alert <light>`
  - `light` can be a light id or name
- `huetemps connect list`
- `huetemps connect set bridge <ipOrHost>`
- `huetemps connect set user <token>`
- `huetemps connect clear`
- `huetemps refresh`
  - currently a stub command

### Typical workflows

Inspect your setup:

```bash
huetemps connect list
huetemps list lights
huetemps list sensors
```

Find and identify a fixture quickly:

```bash
huetemps list lights
huetemps alert 14
```

## Configuration

`config.yaml` supports:

- `zoneName` (string, optional)
  - Used by `huetemps list temps`
  - Defaults to `Hue Temps` when omitted
- `logging` (object, optional)
  - `level`: `debug | info | warn | error`
  - `file`: absolute path or path relative to `config.yaml`
  - `maxSize`: log rotation size, e.g. `10m`
  - `maxFiles`: retained rotated files, e.g. `5`

If `logging.file` is omitted, default log location is OS-specific:

- Windows: `%USERPROFILE%\\AppData\\Local\\huetemps\\logs\\huetemps.log`
- macOS: `~/Library/Logs/huetemps/huetemps.log`
- Linux: `~/.cache/huetemps/huetemps.log`

## Credentials and security

- Environment variables (`HUETEMPS_BRIDGE`, `HUETEMPS_USER`) take precedence when set.
- Otherwise credentials are read from OS keystore.
- Clear stored credentials anytime:

```bash
huetemps connect clear
```

## Troubleshooting

### No output when running `huetemps ...`

- Ensure you are on a recent Node version matching this repo (`>=24 <25`).
- Reinstall globally if needed:

```bash
npm install -g huetemps
```

For local source installs:

```bash
npm run build
npm install -g .
```

### Config not found

You must run the command from a directory containing `config.yaml`, or provide that file in your current working folder.

### Connection errors

- Verify bridge IPv4 format (example `192.168.1.50`)
- Verify user token is valid
- Use `huetemps connect list` to inspect active connection source

---

## Developer guide

This section is for contributors and local customization.

### Prerequisites

- Node.js `>=24 <25`
- npm

### Run locally from source

```bash
npm install
npm run build
node dist/src/cli/index.js --help
```

### Link in development mode (recommended)

Link your local checkout so `huetemps` resolves to your dev build:

```bash
npm install
npm run build
npm link
huetemps --help
```

After code changes:

```bash
npm run build
huetemps list lights
```

Unlink when done:

```bash
npm unlink -g huetemps
npm unlink
```

### Project scripts

- `npm run build` — clean + TypeScript build
- `npm run test` — build for tests + Node test runner + coverage
- `npm run lint` — ESLint
- `npm run format` — Prettier

### Code layout

- `src/cli` — command registration and handlers
- `src/api` — Hue API client + fetch/store helpers
- `src/shared` — config, logging, connection/keystore
