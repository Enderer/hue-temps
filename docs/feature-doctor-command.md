# Doctor Command

## What

Add a lightweight `huetemps doctor` command that runs quick environment and connectivity checks, then reports pass/warn/fail results.

## Patterns from common CLI tools

Follow familiar behavior from tools like `brew doctor`, `npm doctor`, and `gh auth status`:

- fast, read-only diagnostics
- clear status per check
- actionable fix hints
- non-zero exit when critical checks fail

## Scope (v1)

Keep v1 small and local:

- config file presence/readability
- connection values present (bridge/user)
- bridge reachability check
- basic auth check against bridge API

No auto-fix, no deep network probing, no interactive flows.

## Requirements

- Command: `huetemps doctor`
- Optional: `--json` for machine-readable results.
- Human output: compact checklist with `PASS | WARN | FAIL`.
- Each failed/warned check MUST include a short fix hint.
- Checks MUST be independent; one failure should not stop all checks.
- Exit code MUST be deterministic:
  - `0` all pass (or only non-critical warnings)
  - non-zero when one or more critical checks fail

## Output contract (minimal)

Human (default):

- one line per check
- final summary line (`x passed, y warnings, z failed`)

JSON (`--json`):

- top-level object with `checks[]` and `summary`
- each check: `id`, `status`, `message`, optional `hint`

## Implementation guidelines (lightweight)

- Create a small check runner with a static list of checks.
- Represent each check as: `id`, `critical`, `run()`.
- Reuse existing config/connection/API modules; avoid duplicate logic.
- Keep checks read-only and time-bounded.
- Isolate formatting from check execution (shared output layer).

## Acceptance criteria

- `huetemps doctor` runs all v1 checks and prints a clear summary.
- Failures include actionable hints.
- JSON mode is parseable and stable for scripting.
- Exit behavior is predictable and documented.
