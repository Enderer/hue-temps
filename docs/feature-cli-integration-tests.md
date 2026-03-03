# CLI Integration Tests

## What

Add black-box CLI integration tests that execute the built binary and assert:

- stdout
- stderr
- exit code

## Why

- Catch runtime wiring issues unit tests miss.
- Prevent regressions in bin entrypoint and command registration.
- Increase confidence for scripting/automation use cases.

## Scope (v1)

- Test representative commands only (for example `list`, `connect list`, one failure path).
- Run against built output (not internal function calls).
- Keep fixtures/mocks minimal.

## Requirements

- Tests MUST invoke the CLI the same way users do.
- Tests MUST assert stdout, stderr, and exit code for each scenario.
- Tests MUST be deterministic and CI-safe.
- Failure output MUST be actionable.

## Implementation (lightweight)

- Add a small integration test suite under test sources.
- Use child-process execution of the built bin.
- Add helper utilities for command execution + output capture.

## Acceptance criteria

- At least one success and one failure scenario are covered end-to-end.
- Tests fail on output/exit regressions.
- Suite runs in CI with stable results.
