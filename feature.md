Product spec: Credential storage + configuration for Node.js CLI (host + Docker)
Goal

Provide a secure, cross-platform way for the CLI to obtain and store user connection credentials:

Host installs (macOS/Windows/Linux): interactive setup + store secrets in OS keychain

Docker deployments: secrets provided via environment variables only

No secrets file support.

Requirements
Functional requirements

Credential resolution order

Environment variables (highest priority)

OS keychain (host installs)

Interactive prompt (fallback) → store into keychain → return creds

What is stored

Host IP / endpoint: can be stored in keychain (simple) or in a non-secret config file; but spec says “store it in OS keychain”, so do that.

User key / API token: must be stored in OS keychain.

Store in a way that supports multiple profiles later (at minimum, one “default”).

Docker behavior

If running in Docker (or more generally, env vars provided), do not prompt and do not attempt keychain writes.

If env vars are missing inside Docker/non-interactive mode, error with a clear message.

Cross-platform

Must work on macOS, Windows, Linux.

Linux may not always have a keychain service available; handle failures gracefully.

UX

Provide a dedicated command: mycli configure (and optionally mycli auth logout / mycli auth status).

Interactive prompts should be pleasant and safe (masked input for key).

Security

Never print secrets.

Never write secrets to YAML/JSON files.

Avoid logging env var contents.

Use distinct keychain “service name” for your CLI and a stable “account key” for lookup.

Non-functional requirements

Works in TypeScript.

Clear errors and exit codes (non-zero on missing/invalid creds).

Minimal dependencies; well-maintained libraries.

Proposed interfaces
Environment variables

MYCLI_HOST — host/ip/endpoint (e.g., https://10.0.0.5:8443 or 10.0.0.5)

MYCLI_USER_KEY — secret token/key

Optional (recommended):

MYCLI_PROFILE — profile name (default: default)

MYCLI_NO_INTERACTIVE=1 — disable prompts (useful for CI)

Keychain storage schema

Service name: mycli (or com.yourorg.mycli)

Account key: profile:<PROFILE_NAME> (e.g., profile:default)

Secret payload: JSON string containing both values:

{ "host": "10.0.0.5", "userKey": "..." }

Rationale: keychain APIs are usually “one password per (service, account)”; storing a JSON blob avoids needing multiple entries.

Libraries
Keychain (OS secure storage)

Recommended: keytar

Pros: widely used; supports macOS Keychain, Windows Credential Manager, and Linux Secret Service.

Notes: on Linux, requires a Secret Service implementation (GNOME Keyring/KWallet) and sometimes DBus access; can fail in headless environments.

Fallback strategy (required):

If keychain is unavailable (common on headless Linux), do not silently fall back to insecure storage. Instead:

If env vars are present → proceed.

Else if interactive is available → show a clear error that keychain is not available and instruct to use env vars (or install keyring service).

Exit non-zero.

Interactive prompts

Recommended: enquirer (clean API, good UX)
Alternatives: prompts, inquirer (heavier but common)

Must use masked input for secrets (password type).

CLI framework (optional but common)

commander or yargs or oclif (if you already use one, keep it)

Not required by this spec, but commands assume some framework.

Commands & behaviors
mycli configure

Forces interactive prompt (unless MYCLI_NO_INTERACTIVE=1).

Collect:

Host/ip (validate non-empty; optionally validate hostname/IP/URL format)

User key (masked input; validate non-empty)

Store in keychain under (service, account=profile:<profile>).

Print success message without revealing values.

mycli auth status (optional)

Show where creds are coming from:

env, keychain, missing

Never print userKey; can print host (non-secret) if desired.

mycli auth logout (optional)

Delete keychain entry for current profile.

No-op if not present.

Credential resolution algorithm
Inputs

profile = process.env.MYCLI_PROFILE ?? "default"

Resolution steps (must match)

Env vars

If MYCLI_HOST and MYCLI_USER_KEY are set:

return { host, userKey, source: "env" }

If one is set without the other:

error: “Both MYCLI_HOST and MYCLI_USER_KEY must be set”

OS keychain

Attempt getPassword(service, account)

If found:

parse JSON; validate it has host and userKey; return with source: "keychain"

If not found:

continue

Interactive prompt

Only if TTY is interactive and MYCLI_NO_INTERACTIVE is not set

Prompt for host and userKey

Store JSON blob into keychain via setPassword(service, account, payload)

Return with source: "prompt->keychain"

Non-interactive mode rules

If not interactive (no TTY) or MYCLI_NO_INTERACTIVE=1:

Do not prompt.

If env vars missing and keychain missing → fail with actionable error.

Docker note

Do not hard-detect Docker unless you want to; the behavior is naturally correct:

Docker users provide env vars → step (1) succeeds.

If they don’t → they get a clear error (since keychain likely unavailable and/or non-interactive).

Validation rules

host

Required

Accept either:

IP (v4/v6), hostname, or URL

Trim whitespace

userKey

Required

Trim whitespace

Must not be echoed to logs/output

Error messages (examples)

Missing env pair:

“MYCLI_HOST is set but MYCLI_USER_KEY is missing. Set both, or run mycli configure on a host install.”

No credentials available:

“No credentials found. Set MYCLI_HOST and MYCLI_USER_KEY (recommended for Docker/CI) or run mycli configure on a host machine.”

Keychain unavailable:

“OS keychain is not available on this system. Use environment variables (MYCLI_HOST, MYCLI_USER_KEY) or install a Secret Service/keyring.”

Implementation steps (engineering plan)
Step 0 — Define shared types and constants

SERVICE_NAME = "mycli" (or reverse-DNS)

profile resolution

type Credentials = { host: string; userKey: string; source: "env" | "keychain" | "prompt->keychain" }

Step 1 — Implement env var loader

loadFromEnv(profile?): Credentials | null

Enforce “both-or-neither” for MYCLI_HOST and MYCLI_USER_KEY

Return source: "env"

Step 2 — Implement keychain adapter

loadFromKeychain(profile): Credentials | null

saveToKeychain(profile, creds): void

deleteFromKeychain(profile): void (optional)

Use keytar.getPassword/setPassword/deletePassword

Store JSON string payload

Validate JSON on read (schema check)

Step 3 — Implement interactive prompt

promptForCredentials(): Promise<{host, userKey}>

Use enquirer:

input for host

password for userKey

Add validation functions

Detect interactivity: process.stdin.isTTY && process.stdout.isTTY

Step 4 — Implement resolveCredentials()

Encapsulate the algorithm:

env

keychain

prompt + save

Respect MYCLI_NO_INTERACTIVE

Step 5 — Wire into CLI commands

Default behavior: any command that needs auth calls resolveCredentials() first.

Add configure command that forces prompt + save (unless non-interactive).

Step 6 — Hardening and test coverage

Unit tests:

env precedence

partial env var error

keychain parse failures

non-interactive failure path

Integration test (optional) can mock keytar to avoid platform keychains in CI.

Acceptance criteria

On macOS/Windows/Linux host with keychain available:

First run of an auth-required command prompts, stores to keychain, then proceeds.

Subsequent runs use keychain without prompting.

In Docker/CI with env vars:

Works without prompts and without keychain.

In Docker/CI without env vars:

Fails fast with clear instructions and non-zero exit code.

Secrets never appear in logs, stack traces, or config files.
