## Config precedence model

### Why this is needed

Without explicit precedence, users and developers cannot reliably predict which value wins when the same setting exists in multiple places (defaults, file, env, flags).
For a CLI controlling lights, this can cause incorrect zone targeting, wrong log level, or unexpected runtime behavior.

A formal precedence model provides:

- **Predictability**: the same inputs always produce the same config.
- **Safety**: command-line overrides work for one-off operations without editing files.
- **Automation support**: CI/scripts can use environment variables confidently.
- **Debuggability**: users can inspect exactly where each resolved value came from.

---

### Precedence order (lowest to highest)

1. **Built-in defaults**
2. **`config.yaml`**
3. **Environment variables**
4. **CLI flags**

Rule: **higher layer always overrides lower layer**.

Example:

- default `zoneName = "Living Room"`
- config.yaml `zoneName = "Office"`
- env `HUETEMPS_ZONE_NAME=Kitchen`
- flag `--zone Bedroom`

Resolved value: `Bedroom`

---

### Scope and shape

Apply precedence to all runtime settings, including:

- Connection: bridge host, app key/token
- Behavior: zone, timeout, retries
- Output: log level, color/no-color, json/human
- Command-specific options where applicable

Use one canonical internal config type (e.g. `ResolvedConfig`) so all commands use the same source of truth.

---

### Merge semantics

- **Scalars** (`string`, `number`, `boolean`): replace with highest-precedence value.
- **Objects**: deep-merge by key.
- **Arrays**: replace (not concatenate) unless explicitly documented.
- **Unset/empty handling**:
  - empty string env var should be treated as “not set” unless field allows empty strings.
  - invalid values fail validation (do not silently coerce).

---

### Source mapping (critical for supportability)

Keep metadata for each final value:

- `value`
- `source` (`default | file | env | flag`)

This powers diagnostics and `config show --resolved`.

Example resolved view:

```yaml
zoneName:
  value: Bedroom
  source: flag
logging.level:
  value: debug
  source: env
timeoutMs:
  value: 5000
  source: default
```

---

### Proposed command: `huetemps config show --resolved`

Purpose: print effective config plus source for each field.

Behavior:

- default: human-readable table/tree
- `--json`: machine-readable output
- sensitive values masked (e.g. tokens)

Example:

- `huetemps config show --resolved`
- `huetemps config show --resolved --json`

---

### Validation pipeline

After merge, run schema validation once:

1. Load defaults
2. Overlay config file
3. Overlay env
4. Overlay flags
5. Validate resolved config
6. Start command execution

If invalid:

- return actionable error message
- include field name + expected format
- non-zero exit code (stable code for config errors)

---

### Environment variable naming convention

Use a strict prefix and predictable mapping:

- `HUETEMPS_ZONE_NAME`
- `HUETEMPS_TIMEOUT_MS`
- `HUETEMPS_LOG_LEVEL`
- `HUETEMPS_NO_COLOR`

Document each variable with type and examples.

---

### Implementation design (high-level)

- `loadDefaults(): Partial<Config>`
- `loadFileConfig(path): Partial<Config>`
- `loadEnvConfig(env): Partial<Config>`
- `loadFlagConfig(opts): Partial<Config>`
- `mergeConfig(layers): ResolvedConfig + sourceMap`
- `validateConfig(resolved): ValidatedConfig`
- `getResolvedConfig(argv): { config, sourceMap }`

Keep this logic centralized in one module (e.g. `src/shared/config-resolution.ts`) and never duplicate precedence logic inside commands.

---

## Acceptance criteria

- Same input set always yields same resolved config.
- Every configurable field has documented env var + flag behavior.
- `config show --resolved` displays value source.
- Validation errors are clear and deterministic.
- Unit tests cover precedence collisions across all 4 layers.
