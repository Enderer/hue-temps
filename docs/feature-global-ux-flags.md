# Global UX Flags

## What

Define a small, consistent set of global CLI flags that work the same way across commands:

- `--verbose`
- `--quiet`
- `--no-color`
- `--timeout <ms>`
- `--zone <name>`

## Why

- Users should not relearn behavior per command.
- Scripts need predictable, stable flag semantics.
- Centralized handling avoids duplicated option logic.

## Requirements

### 1) Global registration

- All UX flags MUST be registered once at CLI startup.
- Flags MUST be available to all user-facing commands unless explicitly documented otherwise.
- Flag parsing behavior MUST be documented in help output.

### 2) Logging verbosity

- `--verbose` MUST increase log verbosity.
- `--quiet` MUST reduce non-essential output.
- If both are provided, precedence MUST be deterministic and documented (recommended: last one wins).

### 3) Color behavior

- `--no-color` MUST disable ANSI color output for command results.
- `--no-color` SHOULD also disable colored diagnostics for consistency.

### 4) Timeout behavior

- `--timeout <ms>` MUST set a command runtime/request timeout override.
- Timeout value MUST be validated as a positive integer.
- Invalid timeout input MUST return a clear usage/config error.

### 5) Zone behavior

- `--zone <name>` MUST override configured default zone for current invocation only.
- Zone override MUST be applied consistently to commands that operate on a zone context.

### 6) Dependency inversion and layering

- Flag parsing MUST remain in CLI composition/root setup.
- Commands/services MUST depend on resolved runtime options, not raw argv flags.
- Application logic MUST NOT branch on flag strings directly.

## Runtime behavior

1. CLI startup parses global UX flags.
2. Flags are merged with config defaults using existing precedence rules.
3. A resolved runtime options object is created once.
4. Commands receive resolved options through injected dependencies.
5. Command execution uses resolved options consistently.

## Implementation approach (lightweight)

- Add one small `RuntimeOptions` shape for resolved UX options.
- Resolve flags once in startup and pass options via dependency injection.
- Reuse existing logging/config modules where possible.
- Avoid per-command ad hoc option parsing and duplicate validation.

## Test coverage

- Unit: flag parsing and precedence (`--verbose`/`--quiet`, timeout validation, zone override).
- Unit: `--no-color` disables color formatting.
- Integration: representative commands observe the same flag behavior.
- Integration: invalid `--timeout` exits with stable code and clear error text.

## Acceptance criteria

- All listed UX flags are available globally and documented.
- Behavior is consistent across representative commands.
- Commands consume resolved runtime options (not raw flags).
- Validation and error behavior are clear and deterministic.
