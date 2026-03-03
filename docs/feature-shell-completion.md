# Shell Completion

## What

Add a lightweight completion command that outputs shell completion scripts:

- `huetemps completion bash`
- `huetemps completion zsh`
- `huetemps completion powershell`

## Why

- Faster command discovery and fewer typing errors.
- Familiar UX used by common CLIs.
- Improves day-to-day usability with minimal runtime complexity.

## Scope (v1)

Keep v1 static and simple:

- Complete top-level commands and known subcommands.
- Complete fixed argument choices (for example `list` target values).
- No network-backed or dynamic resource completion.
- No auto-install subcommand in v1.

## Requirements

- Add `completion <shell>` command with choices: `bash | zsh | powershell`.
- Command MUST print completion script text to stdout only.
- Invalid shell input MUST print a clear error and return non-zero exit.
- Completion output MUST be deterministic for the same CLI version.
- Generated scripts MUST support current command tree and fixed choices.

## Output and behavior

- Success: script emitted on stdout, no extra noise.
- Errors: diagnostics on stderr, stable non-zero exit code.
- Completion generation MUST be read-only and fast.

## Implementation guidelines (lightweight)

- Implement with small in-repo script templates/functions (no extra dependency required).
- Keep completion token definitions centralized to reduce drift.
- Use current command registration as the source of truth where practical.
- Keep shell-specific logic minimal and isolated.

## Install guidance (docs requirement)

Document manual install usage in README for each shell:

- bash: source completion script from profile.
- zsh: load `_huetemps` via `fpath`/`compinit`.
- powershell: register via `$PROFILE` (`Register-ArgumentCompleter -Native`).

## Test coverage

- Unit: emits script for each supported shell.
- Unit: invalid shell returns error + non-zero exit.
- Integration smoke: generated script includes expected command tokens.

## Acceptance criteria

- `huetemps completion bash|zsh|powershell` works.
- Top-level commands and `list` target values are completable.
- Output/error stream behavior is consistent and parse-safe.
- Feature ships without large new dependencies or architecture changes.
