# Structured Error Model

## What

Use typed application errors instead of generic `Error` strings.

## Why

- Consistent user-facing messages
- Stable exit codes for scripts/CI
- Cleaner separation between user errors and internal failures

## Error types

- `ConfigError` → invalid/missing configuration
- `UsageError` → invalid CLI arguments or command usage
- `AuthError` → invalid/expired bridge credentials
- `NetworkError` → bridge unreachable, timeout, transport failure
- `NotFoundError` → requested light/group/sensor not found
- `UnhandledError` → unexpected uncategorized failure

## Exit code mapping

- `0` success
- `2` usage error
- `3` config error
- `4` handled runtime error (auth, network, not found, and other handled app errors)
- `1` unhandled error

## Classification rules

- `UsageError`: invalid/unknown command, bad args, ambiguous user input
- `ConfigError`: missing/invalid local config or env values
- `AuthError`: bridge rejects credentials
- `NetworkError`: timeout, DNS, offline bridge, transport failures
- `NotFoundError`: well-formed request but target resource does not exist
- Any handled, domain/runtime app error maps to exit code `4`
- Unknown exceptions normalize to `UnhandledError`

## Planned approach

1. Add a shared `AppError` hierarchy (`UsageError`, `ConfigError`, runtime/domain errors, `UnhandledError`).
2. Centralize mapping in one CLI error handler (`normalizeError`, `formatError`, `getExitCode`).
3. Keep command and service code focused on throwing typed errors with stable `code` values.
4. Use coarse process exit codes (`2/3/4/1`) and keep detailed diagnostics in error type/code/message.
5. Ensure the catch path always prints a user-safe message, with debug-only stack details.

## Runtime behavior

1. Commands throw typed errors.
2. `main()` delegates all failures to the CLI error handler.
3. CLI error handler normalizes unknown failures to `UnhandledError`.
4. CLI error handler maps normalized error to exit code.
5. Print concise stderr message for users.
6. Log stack/details only at debug level.

## Message format

```text
Error [CONFIG]: zoneName is required
Fix: set zoneName in config.yaml, HUETEMPS_ZONE_NAME, or --zone
```

```text
Error [NETWORK]: Hue bridge unreachable at 192.168.1.50
Fix: verify bridge IP and local network connectivity
```

## Implementation

- `src/shared/errors.ts`
  - `AppError` base class (`code`, `exitCode`, `hint`, `cause`)
  - typed subclasses above
- `src/cli/error-handler.ts`
  - normalize unknown errors to `UnhandledError`
  - format user-facing output
  - return mapped exit code
- `src/cli/index.ts`
  - single catch block delegates to error handler

## Test coverage

- Unit: error → exit code mapping
- Unit: formatting and hint behavior
- Integration: representative command failures return expected stderr + exit code

## Considerations

- Never leak secrets/tokens in error text
- Keep messages short and actionable
- Treat unknown exceptions as `UnhandledError`
- Keep process exit codes stable even as command count grows
