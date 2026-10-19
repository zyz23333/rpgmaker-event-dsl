# MV acceptance evidence

`requirements.json` describes obligations. `results/` contains immutable, machine-produced run records. A requirement does not acquire a passing status merely because it appears in this index. The ordinary test suite validates the index schema, unique IDs, fixture hashes, source sections, test links, checklist completeness and recorded run references.

This is ticket 01's seed, not the complete command or native acceptance matrix. Later tickets add their own stable case IDs and independent input/expected data. Per the user's revised acceptance, editor validation uses REA reverse engineering while final actual game runs remain required. These native evidence groups remain unexecuted by this fixture; its synthetic project context is sufficient for Workspace data operations and is not claimed to be a playable MV project.

| Requirement | Obligation | Evidence kind | Required layer |
| --- | --- | --- | --- |
| MV-S0-CE-001 | Common Event → Decompiled Source → actual Discovery/evaluation → Compile Check/Compile → complete parsed equality | synthetic-support | public Workspace API and temporary filesystem |
| MV-S0-COMPARE-001 | Strict comparison rejects structural/value loss, including inactive state and literal CR | synthetic-rejection | harness negative controls |
| MV-S0-WIN-CLI-001 | Same minimal Workspace through source and built CLI subprocesses, read-only Check, exact data, actual edited-source Push and stderr/exit behavior | synthetic-support | Windows / Node 22 filesystem and CLI |
| MV-S0-WIN-JUNCTION-001 | Mandatory real directory junction executes source and built CLI without silent skipping | synthetic-support | Windows junction and CLI subprocess |

Ticket 02 extends the seed with the [Windows baseline and required filesystem responsibility matrix](windows-baseline.md). The additional cases establish the automation foundation; later safety tickets still own their fault and concurrency obligations.

## Reproduce

On Windows with Node 22 and dependencies installed, run `pnpm --filter rpgmaker-event-dsl test -- test/mv-evidence.test.ts`. The test reconstructs an independent temporary Project Root from `packages/rpgmaker-event-dsl/test/fixtures/mv-evidence/common-event-project.json`, creates a Workspace, clones, decompiles, then invokes Compile Check and Compile. The temporary package exposes the actual repository TypeScript source through a directory junction for type resolution; declarations are not mocked and expected JSON is never produced by the compiler. Source mutation and restoration prove actual evaluation, beyond checking generated source text.

`node:assert/strict`'s `deepStrictEqual` compares complete parsed JSON. There is no key removal, missing-field/default filling, command filtering, CR normalization, marker removal or inactive-setting normalization. The byte-level fixture SHA-256 is also checked before the run is accepted. This fixture intentionally uses the existing exact subset (Common Event trigger `none` and its saved default switch ID); preservation of other inactive switch values belongs to later event-container tickets.

Every execution writes a new JSON record under ignored `test-results/mv-evidence/`. Set `MV_EVIDENCE_OUTPUT` to an absolute directory to select another artifact location. A record includes actual Node/OS/tool versions, operator, source Git revision plus SHA-256 of the exact source/harness input file set, fixture hash, stages, independent expected input, actual observations and an unabridged failure difference. Failed runs remain failed. Runtime is recorded as observed; baseline acceptance requires the specified Windows / Node 22 environment.

Reviewed successful run records may be copied into `results/`; retain failed or superseded records when they explain a change. Git revision identifies the baseline, and the source fingerprint identifies uncommitted implementation inputs. The full file/hash list makes that distinction checkable. Test artifact capture in CI should retain `test-results/mv-evidence/`.

## Extend and revalidate

Each case needs a stable ID; exact spec/parameter source section; A1–A8 dimensions; positive/negative/boundary/combination classes; explicit evidence kind; input description and byte-hashed fixture; independent expected structure/value/diagnostic/state; exact test file and case name; E/R links when applicable; environment, operator responsibility, slice and mandatory layer. Keep this table synchronized with the index. Evidence kinds distinguish first-party help/templates, existing samples, static inference, REA reverse-engineering observations, synthetic support/rejection, historical editor UI capture and actual game observations. Reverse engineering and game observations record their method, identified MV/runtime/NW.js versions, tool versions and hashed raw artifacts; a static explanation is not a game run.

Execution statuses are `not-executed`, `passed`, `failed`, `blocked` and `retest-required`. Missing native tools or unavailable actions are blocked/not-executed, never inapplicable. For a genuinely inapplicable future case, record the concrete domain rule in its requirement; do not infer it from a missing environment. Preserve raw native captures separately before extracting minimal fixtures, and retain each extraction's provenance. Never overwrite a native capture while updating synthetic expected data.

After a relevant source, native version, fixture or procedure change, retain the prior record, record its impact/retest requirement and append a fresh run. A prior passing result applies only to its recorded source fingerprint, fixture, environment and stages. These seed records do not establish final integrated-candidate acceptance.
