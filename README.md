# HueTemps

![HueTemps splash](https://raw.githubusercontent.com/Enderer/hue-temps/main/assets/readme-splash.svg)

Practical command-line control for your Philips Hue home.

## Table of contents

- [Install](#install)
- [Quick start](#quick-start)
- [Configuration](#configuration)

## Install

### From npm (global)

```bash
npm install -g huetemps
```

Then confirm installation:

```bash
huetemps
```

## Quick start

### 1) Set bridge credentials

Option A (recommended): store in OS keystore

```bash
huetemps connect set bridge <bridge-ip>
huetemps connect set user <hue-user-token>
```

Option B: set environment variables

```bash
export HUETEMPS_BRIDGE="192.168.1.123"
export HUETEMPS_USER="your-user-token"
```

### 2) Run commands

```bash
|> huetemps list
|> huetemps list lights
|> huetemps list groups
|> huetemps alert 123
|> huetemps alert "Living Room - Table"
```

## Configuration

View the current resolved configuration:

```bash
|> huetemps config

Configuration

Config file   C:\Users\Name\AppData\Local\HueTemps\config.yaml
Zone name     Hue Temps
Log level     info
Log file      C:\Users\Name\AppData\Local\HueTemps\logs\huetemps.log
Log max size  10m
Log max files 5
```

Generate a default config file at the platform-specific path:

```bash
|> huetemps config --init

✔ Config file created at C:\Users\Name\AppData\Local\HueTemps\config.yaml
```

This creates an empty `config.yaml` that can be edited:

```yaml
logging:
  level: info # debug | info | warn | error
  file: huetemps.log # absolute or relative to this config file
  maxSize: 10m # rotate after this size
  maxFiles: 5 # number of rotated files to keep
temps:
  zoneName: Hue Temps # all lights in this zone will be set to correct temp
```

Use the `--config` `-c` param to use a config file at a custom location:

```bash
huetemps -c /path/to/config.yaml list
```

### File locations

Config and log files are stored in the following platform-specific directories:

| Platform | Config                                               | Logs                                        |
| -------- | ---------------------------------------------------- | ------------------------------------------- |
| macOS    | `~/Library/Application Support/huetemps/config.yaml` | `~/Library/Logs/huetemps/huetemps.log`      |
| Linux    | `~/.config/huetemps/config.yaml`                     | `~/.local/state/huetemps/logs/huetemps.log` |
| Windows  | `%LOCALAPPDATA%\HueTemps\config.yaml`                | `%LOCALAPPDATA%\HueTemps\logs\huetemps.log` |

On Linux, `XDG_CONFIG_HOME` and `XDG_STATE_HOME` are respected if set.
