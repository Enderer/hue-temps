# HueTemps

![HueTemps splash](./assets/readme-splash.svg)

Practical command-line control for your Philips Hue home.

## Table of contents

- [Install](#install)
- [Quick start](#quick-start)
- [Usage](#usage)
- [Configuration](#configuration)
- [Credentials and security](#credentials-and-security)

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
huetemps list
huetemps list lights
huetemps list groups
huetemps alert 123
huetemps alert "Living Room - Table"
```

## Usage

## Configuration

Config options can be set in `config.yaml`.

## Credentials and security
