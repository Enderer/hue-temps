# Command Aliases

## What

Add lightweight command aliases for high-frequency workflows to reduce typing while keeping primary commands unchanged.

## Why

- Faster day-to-day usage.
- Better ergonomics for repetitive actions.
- No impact on existing scripts using full commands.

## Scope (v1)

Support a small, explicit alias set only:

- `ls` -> `list`
- `ll` -> `list lights`
- `lg` -> `list groups`
- `lt` -> `list temps`
- `cs` -> `connect set`
- `cb` -> `connect set bridge`
- `cu` -> `connect set user`
- `cl` -> `connect list`
- `cc` -> `connect clear`
- `id` -> `alert`

## Requirements

- Aliases MUST behave identically to their canonical command equivalents.
- Alias execution MUST preserve argument handling and validation.
- Help output SHOULD show aliases clearly next to canonical commands.
- Unknown aliases MUST return standard usage error behavior.
- Canonical commands remain the source of truth; aliases are thin routing only.

## UX and compatibility rules

- Keep aliases mnemonic and short (2-3 chars where possible).
- Avoid shell-confusing overload where practical.
- Alias set MUST be deterministic and documented.
- Adding/removing aliases is a user-facing change and MUST be noted in release notes.

## Implementation guidelines (lightweight)

- Register aliases in one centralized map near CLI setup.
- Route aliases to existing command handlers; do not duplicate command logic.
- Keep alias resolution before command execution and independent from business logic.
- Reuse existing error handling and output paths.

## Test coverage

- Integration: each alias resolves to expected canonical command behavior.
- Integration: alias and canonical command produce same stdout/stderr/exit code for representative scenarios.
- Unit: alias map contains no collisions and only known targets.

## Acceptance criteria

- All v1 aliases execute successfully with canonical behavior.
- No duplicate command logic is introduced.
- Alias behavior is documented in CLI help and docs.
- Regressions are caught by alias integration tests.
