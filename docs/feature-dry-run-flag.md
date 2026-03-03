# Dry-Run Flag

## What

Add a lightweight global `--dry-run` flag that previews command actions without making external changes.

## Patterns from common CLI tools

Follow familiar dry-run behavior seen in tools like Terraform, package managers, and deployment CLIs:

- show intended actions
- do not mutate remote/local state
- keep output explicit and predictable

## Scope (v1)

Apply `--dry-run` to mutating commands first (for example `alert`, future write/update commands).

Read-only commands (for example `list`, `connect list`) should ignore `--dry-run` with no behavior change.

## Requirements

- `--dry-run` MUST be parsed globally.
- In dry-run mode, mutating commands MUST NOT call write/mutation APIs.
- Command output MUST clearly indicate preview mode.
- Preview output MUST include the key intended action inputs (target/resource/params).
- Exit code semantics MUST remain the same as normal execution for equivalent validation outcomes.

## Output contract (minimal)

Human mode:

- short preview line(s), for example: `DRY RUN: would alert light "Desk Lamp" (id: 3)`

JSON mode (`--json`):

- include `dryRun: true` and intended action payload.
- output MUST be parseable and stable for scripting.

## Implementation guidelines (lightweight)

- Resolve `dryRun` once at CLI startup and inject via runtime options.
- Keep command logic flag-agnostic where possible (dependency inversion).
- Place mutation guard at a single boundary before write API calls.
- Reuse existing validation/resolution logic; only skip side effects.
- Avoid building simulation engines in v1.

## Acceptance criteria

- Mutating commands with `--dry-run` perform no writes.
- Users can see exactly what would happen.
- JSON output is explicit about preview mode.
- Behavior is consistent across supported commands.
