# Features

- Logging
  - Configurable level (`debug` | `info` | `warn` | `error`) from `config.yaml`
  - Cross-platform log file path (defaults to OS cache/logs) with rotation (`maxSize`, `maxFiles`)
  - Per-module loggers via `getLogger('module.name')` without passing through call chains
  - Console transport auto-disabled for interactive sessions; user prompts stay clean while system logs go to file
- Bin install
