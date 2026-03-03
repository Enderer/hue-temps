# Runtime Config Validation

## What

Validate resolved runtime config at startup before any command runs.

## Why

- Fail fast on bad config
- Clear, actionable errors
- Predictable behavior in scripts/automation

## How it works

1. Resolve config from defaults, file, env, and flags.
2. Validate with schema.
3. If invalid: print errors to stderr and exit with code `3`.
4. If valid: continue CLI startup with typed config.

## Validation scope

- Required fields (for example `zoneName`)
- Logging enum values (for example `debug|info|warn|error`)
- Numeric constraints (positive integers like timeout)
- Boolean parsing from env/flags
- Non-empty string constraints

## Example errors

```text
Configuration error:
- zoneName: required value is missing
Fix: set zoneName in config.yaml, HUETEMPS_ZONE_NAME, or --zone
```

```text
Configuration error:
- logging.level: invalid value "verboseplus"; expected one of: debug, info, warn, error
```

## Implementation

- `src/shared/config-resolution.ts` (merge layers)
- `src/shared/config-schema.ts` (runtime schema)
- `src/shared/config-validation.ts` (validate + map issues)
- `src/shared/errors.ts` (`ConfigError` with `exitCode = 2`)

Run validation in `main()` before command registration/execution.

## Test coverage

- Unit: valid/invalid config parsing and error mapping
- CLI integration: invalid config exits `3`, valid config runs

## Considerations

- Never print secrets in error output
- Keep validation centralized (no duplicate checks in commands)
- Document error behavior and exit code in README
