# Cancellation and Shutdown Handling

## What

Handle process shutdown signals (`SIGINT`, `SIGTERM`) with a single, centralized cancellation path.

## Why

- Prevent partial/unclean operations during interruption.
- Stop in-flight network work quickly and safely.
- Provide predictable behavior for users and scripts.

## Requirements

### 1) Signal handling

- The CLI MUST register handlers for `SIGINT` and `SIGTERM`.
- Signal handling MUST be initialized once during startup.
- Repeated signals MUST NOT trigger repeated shutdown flows.

### 2) Central cancellation primitive

- Use one shared `AbortController` for command execution lifetime.
- Signal handlers MUST call `abort()` on that shared controller.
- Commands/services that perform async work SHOULD accept and honor an `AbortSignal`.

### 3) In-flight work cancellation

- In-flight API requests MUST be aborted when shutdown begins.
- Long-running command work SHOULD check `signal.aborted` at safe checkpoints.
- Cancellation MUST avoid leaving command logic in an inconsistent state.

### 4) Logging and user messaging

- Emit a single shutdown message when cancellation starts.
- Additional duplicate shutdown messages SHOULD be suppressed.
- Shutdown diagnostics SHOULD go to stderr.

### 5) Exit behavior

- Cancellation exit behavior MUST be predictable and documented.
- Shutdown triggered by signal SHOULD set a stable non-zero exit code.
- Unexpected errors during shutdown MUST still flow through the structured error path.

## Runtime behavior

1. CLI startup creates shared `AbortController`.
2. Signal handlers for `SIGINT`/`SIGTERM` are registered.
3. On first signal, controller is aborted and shutdown message is logged once.
4. Running command and API calls observe `AbortSignal` and stop.
5. CLI exits with documented cancellation exit code.

## Implementation approach (lightweight)

- Add a small shutdown module (for example `src/cli/shutdown.ts`) that:
  - creates/owns the shared `AbortController`
  - registers signal handlers
  - enforces one-time shutdown message
- Inject `AbortSignal` from CLI composition root into command/service boundaries.
- Thread signal to HTTP/API layer so transport can abort requests.
- Keep cancellation checks minimal and centralized; avoid command-specific signal wiring.

## Test coverage

- Unit: first signal aborts controller and logs one shutdown message.
- Unit: repeated signals do not duplicate shutdown logging/logic.
- Unit: shutdown module returns stable cancellation exit behavior.
- Integration: interrupt a running command and verify:
  - in-flight work is cancelled
  - one shutdown message is emitted
  - process exits predictably

## Acceptance criteria

- `SIGINT` and `SIGTERM` trigger the same shutdown path.
- In-flight API calls are cancelled via `AbortSignal`.
- Exactly one shutdown message is logged per run.
- Exit behavior on cancellation is stable and documented.
