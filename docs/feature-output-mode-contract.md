# Output Mode Contract

## What

Define a single, stable output contract for all CLI commands with two explicit modes:

- Human mode (default): readable for interactive terminal use.
- JSON mode (`--json`): machine-readable for scripting and automation.

## Why

- Scripts need deterministic output that is safe to parse.
- Humans need concise, readable output by default.
- A shared contract prevents command-by-command drift.
- Stable output lowers breaking-change risk for downstream users.

## Requirements

### 1) Scope (v1)

Keep v1 intentionally small:

- Add `--json` support for read/list style commands first (`list`, `connect list`).
- Side-effect commands (`alert`, `connect set`, `connect clear`) do not need rich JSON payloads in v1.
- Keep existing human output as default.

### 2) Global mode flag

- The CLI MUST support a global `--json` flag.
- `--json` MUST work in documented positions for supported commands.
- Output mode MUST be resolved once during CLI startup/composition.

### 3) Human mode (default)

- Without `--json`, commands MUST keep current human-readable behavior.
- Human output can continue to use tables/colors where already implemented.
- Command/application logic MUST remain unaware of CLI flag parsing details.

### 4) JSON mode (minimal contract)

- With `--json`, stdout MUST contain valid JSON only.
- Emit plain JSON payloads directly (array or object); do not add a required envelope in v1.
- Empty collections MUST emit `[]`.

Example (`list lights --json`):

```json
[
  {
    "id": "1",
    "name": "Desk Lamp",
    "productName": "Hue color lamp"
  }
]
```

### 5) Stream and logging rules

- In JSON mode, logs/diagnostics MUST NOT be written to stdout.
- In JSON mode, logs/diagnostics SHOULD go to stderr.

### 6) Error behavior

- Exit codes MUST continue to follow the structured error model.
- In JSON mode, do not introduce a new JSON error envelope in v1.
- On error, keep stdout empty and print user-safe error text to stderr.

### 7) Backward compatibility

- JSON field names for supported commands SHOULD remain stable.
- If a breaking JSON shape change is needed, document it in release notes.

## Non-goals (v1)

- No command-specific `kind`/`meta` envelope requirement.
- No new global output type system.
- No large formatter abstraction layer.
- No command-level branching on `--json` in business/action logic.

## Implementation plan (lightweight)

- Add one global `--json` option in CLI setup.
- Add a minimal output port/interface (for example `Output`) with small methods (for example `printData`, `printText`).
- Initialize one output implementation up front at startup based on resolved mode (`human` or `json`).
- Inject the output dependency into commands (dependency inversion).
- Commands call the output dependency and do not branch on mode/flags.
- Keep data-fetching logic unchanged.
- Ensure logger configuration does not pollute stdout in JSON mode.

## Test coverage (minimal, high-value)

- Integration: `list --json` and `connect list --json` produce parseable JSON on stdout.
- Integration: same commands without `--json` keep human-readable output.
- Integration: JSON mode errors preserve exit code and write message to stderr.

## Acceptance criteria

- `--json` works for `list` and `connect list`.
- JSON mode stdout is parseable with `JSON.parse` and contains no log noise.
- Human mode remains default.
- No command-level `--json` branching is required in command logic.
- Output mode selection occurs once at startup and is injected via an output dependency.
