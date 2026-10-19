# MV acceptance evidence

`requirements.json` describes obligations. `results/` contains immutable, machine-produced run records. A requirement does not acquire a passing status merely because it appears in this index. The ordinary test suite validates the index schema, unique IDs, fixture hashes, source sections, test links, checklist completeness and recorded run references.

This index contains ticket 01 automated seeds, ticket 02 Windows automation baseline, tickets 03–06 reverse-engineering obligations and accepted contract review, and ticket 11 System-slot/switch coverage; it is not the complete command or native acceptance matrix. Later tickets add their own stable case IDs and independent input/expected data. Per the user's revised acceptance, editor validation uses REA reverse engineering while final actual game runs remain required. The Common Event seed itself does not execute these native groups; its synthetic project context is sufficient for Workspace data operations and is not claimed to be a playable MV project.

| Requirement            | Obligation                                                                                                                                        | Evidence kind                   | Required layer                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------ |
| MV-S0-CE-001           | Common Event → Decompiled Source → actual Discovery/evaluation → Compile Check/Compile → complete parsed equality                                 | synthetic-support               | public Workspace API and temporary filesystem                |
| MV-S0-COMPARE-001      | Strict comparison rejects structural/value loss, including inactive state and literal CR                                                          | synthetic-rejection             | harness negative controls                                    |
| MV-E03-BODY-EMPTY      | Empty branch body markers                                                                                                                         | reverse-engineering-observation | identified editor resources and conditional code-path review |
| MV-E03-BODY-NONEMPTY   | Nonempty branch marker preservation                                                                                                               | static-inference                | identified editor resources and conditional code-path review |
| MV-E03-BODY-NESTED     | Nested body preservation                                                                                                                          | static-inference                | identified editor resources and conditional code-path review |
| MV-E03-ELSE            | Missing, empty and disabled Else                                                                                                                  | reverse-engineering-observation | identified editor resources and conditional code-path review |
| MV-E03-LOOP            | Loop creation and command-list edits                                                                                                              | reverse-engineering-observation | identified editor resources and conditional code-path review |
| MV-E03-402             | Choices branch text mirror                                                                                                                        | reverse-engineering-observation | identified editor resources and conditional code-path review |
| MV-E03-403             | Cancel branch saved parameter inference                                                                                                           | static-inference                | identified editor resources and conditional code-path review |
| MV-E03-CHOICE-ONE      | One-item Choices reconfirmation boundary                                                                                                          | static-inference                | identified editor resources and conditional code-path review |
| MV-E03-CHOICE-EMPTY    | Empty and whitespace choice text                                                                                                                  | reverse-engineering-observation | identified editor resources and conditional code-path review |
| MV-E03-BATTLE-NEW      | Battle and Else false defaults in shipped Qt                                                                                                      | static-inference                | identified editor resources and conditional code-path review |
| MV-E03-BATTLE-FLAGS    | Battle result flags and body structure                                                                                                            | reverse-engineering-observation | identified editor resources and conditional code-path review |
| MV-S0-WIN-CLI-001      | Same minimal Workspace through source and built CLI subprocesses, read-only Check, exact data, actual edited-source Push and stderr/exit behavior | synthetic-support               | Windows / Node 22 filesystem and CLI                         |
| MV-S0-WIN-JUNCTION-001 | Mandatory real directory junction executes source and built CLI without silent skipping                                                           | synthetic-support               | Windows junction and CLI subprocess                          |

Ticket 02 extends the seed with the [Windows baseline and required filesystem responsibility matrix](windows-baseline.md). The additional cases establish the automation foundation; later safety tickets still own their fault and concurrency obligations.

| Requirement                | Obligation                                               | Evidence kind                   | Required layer                                           |
| -------------------------- | -------------------------------------------------------- | ------------------------------- | -------------------------------------------------------- |
| MV-E05-START-BOUNDS        | Start two slots and supported seconds bounds             | reverse-engineering-observation | identified editor resources and bounded code-path review |
| MV-E05-START-DEFAULT       | New Start default from identified bundled controls       | static-inference                | identified editor resources and bounded code-path review |
| MV-E05-NEW-STOP            | New Stop has one parameter slot                          | static-inference                | identified editor resources and bounded code-path review |
| MV-E05-SAVED-START-ZERO    | Saved Start zero changed to Stop retains zero slot       | static-inference                | identified editor resources and bounded code-path review |
| MV-E05-SAVED-START-NONZERO | Saved Start83 changed to Stop retains nonzero slot       | static-inference                | identified editor resources and bounded code-path review |
| MV-E05-STOP-RECONFIRM      | Stop reconfirmation retains missing or present seconds   | static-inference                | identified editor resources and bounded code-path review |
| MV-E05-UNSAVED-TOGGLE      | Unsaved Start controls do not create a Stop seconds slot | static-inference                | identified editor resources and bounded code-path review |
| MV-E05-CONTAINER           | Container serialization retains Timer slot structure     | reverse-engineering-observation | identified editor resources and bounded code-path review |
| MV-E05-START-REEDIT        | Explicit switch back to Start uses current controls      | static-inference                | identified editor resources and bounded code-path review |

| Requirement                  | Obligation                                                                                          | Evidence kind                   | Required layer                                            |
| ---------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------- | --------------------------------------------------------- |
| MV-E04-ROUTE-PATHS           | Page/205 creation, clone/load/edit/save, flags, M0 and exact505 mirror                              | reverse-engineering-observation | identified editor/Qt resource review                      |
| MV-E04-INDENT-COUNTEREXAMPLE | Numeric0 after null-record clipboard paste; original contradiction and accepted resolution retained | static-inference                | exact-function conditional replay and contract comparison |
| MV-E04-ZERO-CONTRACT         | Explicitly accepted finite zero contract and later product handoff                                  | static-inference                | accepted contract consistency review only                 |

| Requirement           | Obligation                                                                          | Evidence kind                   | Required layer                                                   |
| --------------------- | ----------------------------------------------------------------------------------- | ------------------------------- | ---------------------------------------------------------------- |
| MV-E06-NEW-CONTEXT    | Direct location initialization separates project map from explicit zero coordinates | reverse-engineering-observation | identified editor/Qt initialization and bounded code-path review |
| MV-E06-QT-FIRST-ITEM  | Bundled Menu and ComboBox first-selection initialization                            | static-inference                | identified editor/Qt initialization and bounded code-path review |
| MV-E06-NEW-DIRECT     | New direct Transfer six-slot default inference                                      | static-inference                | identified editor/Qt initialization and bounded code-path review |
| MV-E06-NEW-VARIABLES  | New variable Transfer uses three explicitly initialized variable controls           | static-inference                | identified editor/Qt initialization and bounded code-path review |
| MV-E06-DIRECT-LOAD    | Existing direct location is reloaded separately from new defaults                   | static-inference                | identified editor/Qt initialization and bounded code-path review |
| MV-E06-VARIABLES-LOAD | Existing variable location reloads variable identities and nondefault options       | static-inference                | identified editor/Qt initialization and bounded code-path review |
| MV-E06-MODE-SWITCH    | Mode switching reads the selected location controls                                 | reverse-engineering-observation | identified editor/Qt initialization and bounded code-path review |
| MV-E06-DIRECTION-FADE | Direction and fade saved mappings are independent                                   | reverse-engineering-observation | identified editor/Qt initialization and bounded code-path review |
| MV-E06-LOCATION-EDIT  | Child location picker has separate init and explicit confirmation path              | reverse-engineering-observation | identified editor/Qt initialization and bounded code-path review |
| MV-E06-CONTAINER      | Container serialization preserves existing Transfer parameters                      | reverse-engineering-observation | identified editor/Qt initialization and bounded code-path review |

| MV-S3-SLOTS-001 | preserves unnamed System capacity through real Workspace roundtrip and name removal | automated synthetic | real Workspace / staged validation |
| MV-S3-SLOTS-002 | separates actual empty-name IDs, unnamed slots and DSL-only name resolution | automated synthetic | real Workspace / staged validation |
| MV-S3-SWITCH-001 | validates formal and recognized raw switch commands without normalizing malformed native input | automated synthetic | real Workspace / staged validation |
| MV-S3-SLOTS-003 | rejects missing native switch references before publishing Decompiled Source | automated synthetic | real Workspace / staged validation |
| MV-R1-SWITCH-011 | Compiled versus independent native switch execution | game-observation | four fresh actual MV game processes |

| Requirement | Obligation | Evidence kind | Required layer |
| --- | --- | --- | --- |
| MV-S3-LOOP-013 | Exact Loop saved-list roundtrip through Discovery/evaluation, Check, Compile, Diff and Push | synthetic-support | actual Workspace API |
| MV-S3-FLOW-REJECT-013 | Malformed native flow fails before source publication, preserving project/Snapshot/manifest | synthetic-rejection | actual Workspace filesystem |
| MV-S3-LOOP-BODY-013 | Required Child Command Body fields and bounded marker shape | synthetic-rejection | command and Staged Data Graph seams |
| MV-S3-LOOP-RAW-013 | Final formal/raw marker agreement and valid nested raw code zero | synthetic-support | command compile/decompile seams |
| MV-S3-LOOP-STRUCTURE-013 | Loop ownership, indentation, closing and exact known flow envelopes | synthetic-rejection | shared structure validation |
| MV-S3-LOOP-RECURSION-013 | Loop child Script Gate, references and contextual locations | synthetic-rejection | Staged Data Graph seam |
| MV-S3-BREAK-WARNING-013 | Outside-Loop Break warning preserves native output | synthetic-support | Staged Data Graph and compile seams |
| MV-R3-LOOP-013 | Literal versus compiled Loop/Break/Exit and called-child Exit behavior | game-observation | two actual MV1.6.1 / NW0.29.0 processes |

Ticket 13's [acceptance report](13-loop-acceptance.md) records scope, exact test boundaries, native observations, retained failure history and reproduction inputs. Its game result covers the assigned R3 scenarios and an R1 caller-continuation slice; final integrated-candidate regressions remain required.

## Reproduce

On Windows with Node 22 and dependencies installed, run `pnpm --filter rpgmaker-event-dsl test -- test/mv-evidence.test.ts`. The test reconstructs an independent temporary Project Root from `packages/rpgmaker-event-dsl/test/fixtures/mv-evidence/common-event-project.json`, creates a Workspace, clones, decompiles, then invokes Compile Check and Compile. The temporary package exposes the actual repository TypeScript source through a directory junction for type resolution; declarations are not mocked and expected JSON is never produced by the compiler. Source mutation and restoration prove actual evaluation, beyond checking generated source text.

`node:assert/strict`'s `deepStrictEqual` compares complete parsed JSON. There is no key removal, missing-field/default filling, command filtering, CR normalization, marker removal or inactive-setting normalization. The byte-level fixture SHA-256 is also checked before the run is accepted. This fixture intentionally uses the existing exact subset (Common Event trigger `none` and its saved default switch ID); preservation of other inactive switch values belongs to later event-container tickets.

Every execution writes a new JSON record under ignored `test-results/mv-evidence/`. Set `MV_EVIDENCE_OUTPUT` to an absolute directory to select another artifact location. A record includes actual Node/OS/tool versions, operator, source Git revision plus SHA-256 of the exact source/harness input file set, fixture hash, stages, independent expected input, actual observations and an unabridged failure difference. Failed runs remain failed. Runtime is recorded as observed; baseline acceptance requires the specified Windows / Node 22 environment.

Reviewed successful run records may be copied into `results/`; retain failed or superseded records when they explain a change. Git revision identifies the baseline, and the source fingerprint identifies uncommitted implementation inputs. The full file/hash list makes that distinction checkable. Test artifact capture in CI should retain `test-results/mv-evidence/`.

## Extend and revalidate

Each case needs a stable ID; exact spec/parameter source section; A1–A8 dimensions; positive/negative/boundary/combination classes; explicit evidence kind; input description and byte-hashed fixture; independent expected structure/value/diagnostic/state; exact test file/case name or documentary review file/section (exactly one); E/R links when applicable; environment, operator responsibility, slice and mandatory layer. Keep this table synchronized with the index. Evidence kinds distinguish first-party help/templates, existing samples, static inference, REA reverse-engineering observations, synthetic support/rejection, historical editor UI capture and actual game observations. Reverse engineering and game observations record their method, identified MV/runtime/NW.js versions, tool versions and hashed raw artifacts; a static explanation is not a game run.

Execution statuses are `not-executed`, `passed`, `failed`, `blocked` and `retest-required`. Missing native tools or unavailable actions are blocked/not-executed, never inapplicable. For a genuinely inapplicable future case, record the concrete domain rule in its requirement; do not infer it from a missing environment. Preserve raw native captures separately before extracting minimal fixtures, and retain each extraction's provenance. Never overwrite a native capture while updating synthetic expected data.

After a relevant source, native version, fixture or procedure change, retain the prior record, record its impact/retest requirement and append a fresh run. A prior passing result applies only to its recorded source fingerprint, fixture, environment and stages. These seed records do not establish final integrated-candidate acceptance.

## Reverse-engineering records

Ticket 03 records identified shipped-artifact resource reads and analyst code-path review in [03-branches-and-battle-reverse.md](03-branches-and-battle-reverse.md), with the selected immutable identities in [03-resource-identities.json](03-resource-identities.json). A `review` link is an explicit alternative to a `test` link; the validator requires exactly one, a real referenced section, and the case ID in that document. It does not mislabel evidence review as an automated test.

For these records `passed` means the bounded editor code-review obligation was completed with the report’s stated conditions and limits. The actual field separates code observation, conditional inference and unknowns; `runtime`, `nwjs`, and automated test-runner fields explicitly say `not-executed` where no such run occurred. It does not indicate editor UI or game execution, product roundtrip success, or final candidate acceptance. Binary/resource digests were computed from the selected local bytes; raw first-party text remains only in the named local evidence directory.

Ticket 05 adds [Timer slot review](05-timer-stop-reverse.md) and [selected resource identities](05-resource-identities.json). The missing slot, present zero and present83 cases are distinct; the retained83 path requires a previously confirmed Start. The new unsaved-dialog toggle has its own case. These E4 code-review obligations do not establish ticket26/50 product verification or R1-R7 game execution.

Ticket04 findings: [movement paths, counterexample and accepted finite zero amendment](04-movement-records-and-mirrors-reverse.md). The user explicitly accepted the narrow `zero` state on2026-10-19; ADR0015, the authoritative decision Answer, spec I5 and04/14/33 responsibilities now agree. The three04 records close only bounded code review, conditional replay and accepted-contract documentation obligations. They do not establish product support, Qt/UI execution or actual game acceptance. Raw source stays outside the repo; [original conditional replay observations](04-controlled-replay-observations.json) are preserved as produced.

Ticket 06 adds [Transfer initialization and mode review](06-transfer-defaults-reverse.md) and [selected artifact/resource identities](06-resource-identities.json). A new same-install Menu native constructor/property chain supports the inherited first-item inference. Project-selected mapM and explicit coordinate0 are distinguished from fixed direction/fade defaults. Its10 review records do not establish ticket34/50 product comparison or actual game execution.

Ticket 11 adds [System-slot and native switch acceptance](11-system-slots-and-native-switches.md), including real Workspace extension/name removal and four actual MV game processes comparing independent literal inputs with compiled output. These results cover its bounded R1 slice; final integrated native regression remains required.
