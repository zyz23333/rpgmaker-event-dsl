# MV acceptance evidence

Ticket15 adds [finite raw boundary and recursive Script Gate acceptance](15-command-boundary-and-script-gate.md).
Its original independent fixture runs through actual source Discovery/evaluation and
source/built Workspace CLI. These bounded records have `native: not-executed`;
later full family matrices and allocated native regression remain required.

| Requirement              | Obligation                                                                  | Evidence kind       | Required layer                                 |
| ------------------------ | --------------------------------------------------------------------------- | ------------------- | ---------------------------------------------- |
| MV-S2-RAW-015            | Exact finite raw JSON, own keys, negative zero and explicit indent          | synthetic-support   | Public compiler and actual Workspace           |
| MV-S2-KNOWN-015          | Same known shape and reference boundary for formal and raw                  | synthetic-rejection | Public compiler and Staged Data Graph          |
| MV-S2-MIRROR-015         | Exact ordered choice/route mirrors with both Page locations                 | synthetic-rejection | Public native reader and validation            |
| MV-S2-GATE-015           | Every recognizable physical script location including inactive saved routes | synthetic-rejection | Staged Data Graph and native reader            |
| MV-S2-WORKSPACE-015      | Independent complete roundtrip and unchanged failure state                  | synthetic-support   | Actual filesystem Workspace and CLI            |
| MV-S2-CURRENT-SOURCE-015 | Removed scripts permit current source despite old Snapshot                  | synthetic-support   | Actual Discovery/evaluation and Check/Compile  |
| MV-S2-CANDIDATE-015      | Complete Common candidate, unusual export names and data boundaries         | synthetic-support   | Actual Workspace plus direct compiler boundary |
| MV-S2-BUILT-015          | All five boundary cases and Windows baseline through built CLI              | synthetic-support   | Separate actual Windows CLI processes          |

`requirements.json` describes obligations. `results/` contains immutable, machine-produced run records. A requirement does not acquire a passing status merely because it appears in this index. The ordinary test suite validates the index schema, unique IDs, fixture hashes, source sections, test links, checklist completeness and current recorded run references.

Daily result validation selects the latest run for each requirement using the timestamp in canonical recorder filenames; legacy filenames are parsed and ordered by `completedAt`. Every tied latest run is checked, and selection never filters by passing status. Selected canonical records must match their filename identity. Legacy or malformed filenames are always fully validated, even when superseded, so unreadable JSON, corrupt records and unknown requirement IDs cannot disappear through selection. Superseded canonical payloads remain immutable and are checked by the explicit `pnpm --filter rpgmaker-event-dsl test:evidence:history` entry, which preserves the complete schema, run identity uniqueness, captured source fingerprint, fixture binding and result difference checks. This entry is an on-demand full history audit, separate from daily units.

Both modes check record integrity. A structurally valid `failed`, `blocked` or `retest-required` record can pass integrity validation; neither mode certifies that final coverage is complete or that all requirements passed. Ticket55 audits that final acceptance status against the final candidate.

This index contains ticket 01 automated seeds, ticket 02 Windows automation baseline, tickets 03–10 reverse-engineering obligations and contract review, ticket 11 System-slot/switch coverage, ticket12 captured map/battle context and ticket13 Loop/Break/Exit coverage; it is not the complete command or native acceptance matrix. Later tickets add their own stable case IDs and independent input/expected data. Per the user's revised acceptance, editor validation uses REA reverse engineering while final actual game runs remain required. The Common Event seed itself does not execute these native groups; its synthetic project context is sufficient for Workspace data operations and is not claimed to be a playable MV project.

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

| Requirement              | Obligation                                                           | Evidence kind                   | Required layer                                                |
| ------------------------ | -------------------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------- |
| MV-E07-NEW-EMPTY         | New empty Shop and both purchase flags                               | static-inference                | identified editor/Qt resources and bounded source review      |
| MV-E07-PURCHASE          | Purchase Only belongs to the first Shop record                       | reverse-engineering-observation | identified editor/Qt resources and bounded source review      |
| MV-E07-GOODS-ORDER       | Three goods kinds, order and duplicates                              | reverse-engineering-observation | identified editor/Qt resources and bounded source review      |
| MV-E07-PRICE-MODES       | Standard and custom zero/max prices                                  | reverse-engineering-observation | identified editor/Qt resources and bounded source review      |
| MV-E07-PRICE-RECONFIRM   | Existing standard and custom goods reconfirmation                    | static-inference                | identified editor/Qt resources and bounded source review      |
| MV-E07-RESET-PRICE       | Adding another good can retain prior price state                     | reverse-engineering-observation | identified editor/Qt resources and bounded source review      |
| MV-E07-EMPTY-RELOAD      | Empty placeholder reconfirms separately from child edit              | static-inference                | identified editor/Qt resources and bounded source review      |
| MV-E07-PLACEHOLDER-EDIT  | Active zero-ID goods editing has a positive-ID path                  | static-inference                | identified editor/Qt resources and bounded source review      |
| MV-E07-MIX-PATH          | Native empty Shop reload plus tail addition counterexample           | static-inference                | identified editor/Qt resources and bounded source review      |
| MV-E07-PLACEHOLDER-ORDER | Placeholder drag position and conditional copying                    | static-inference                | identified editor/Qt resources and bounded source review      |
| MV-E07-STANDARD-NONZERO  | Standard nonzero saved slot remains an unsupported input distinction | static-inference                | identified editor/Qt resources and bounded source review      |
| MV-E07-CONTAINER         | Container serialization retains complete Shop data                   | reverse-engineering-observation | identified editor/Qt resources and bounded source review      |
| MV-E07-CONTRACT          | Accepted exact-four-zero Shop placeholder contract and closure       | static-inference                | explicit user decision and authoritative contract consistency |

| Requirement              | Obligation                                                                                  | Evidence kind       | Required layer                          |
| ------------------------ | ------------------------------------------------------------------------------------------- | ------------------- | --------------------------------------- |
| MV-S3-LOOP-013           | Exact Loop saved-list roundtrip through Discovery/evaluation, Check, Compile, Diff and Push | synthetic-support   | actual Workspace API                    |
| MV-S3-FLOW-REJECT-013    | Malformed native flow fails before source publication, preserving project/Snapshot/manifest | synthetic-rejection | actual Workspace filesystem             |
| MV-S3-LOOP-BODY-013      | Required Child Command Body fields and bounded marker shape                                 | synthetic-rejection | command and Staged Data Graph seams     |
| MV-S3-LOOP-RAW-013       | Final formal/raw marker agreement and valid nested raw code zero                            | synthetic-support   | command compile/decompile seams         |
| MV-S3-LOOP-STRUCTURE-013 | Loop ownership, indentation, closing and exact known flow envelopes                         | synthetic-rejection | shared structure validation             |
| MV-S3-LOOP-RECURSION-013 | Loop child Script Gate, references and contextual locations                                 | synthetic-rejection | Staged Data Graph seam                  |
| MV-S3-BREAK-WARNING-013  | Outside-Loop Break warning preserves native output                                          | synthetic-support   | Staged Data Graph and compile seams     |
| MV-R3-LOOP-013           | Literal versus compiled Loop/Break/Exit and called-child Exit behavior                      | game-observation    | two actual MV1.6.1 / NW0.29.0 processes |

Ticket 13's [acceptance report](13-loop-acceptance.md) records scope, exact test boundaries, native observations, retained failure history and reproduction inputs. Its game result covers the assigned R3 scenarios and an R1 caller-continuation slice; final integrated-candidate regressions remain required.

| Requirement                | Obligation                                                          | Evidence kind                   | Required layer                                       |
| -------------------------- | ------------------------------------------------------------------- | ------------------------------- | ---------------------------------------------------- |
| MV-E08-GRID                | Official grid and dynamic picker rows                               | reverse-engineering-observation | identified editor resources; conditional review only |
| MV-E08-STANDARD            | Standard face sheet selection path                                  | static-inference                | identified editor resources; conditional review only |
| MV-E08-THIRD-ROW           | Third-row mouse and keyboard selection                              | static-inference                | identified editor resources; conditional review only |
| MV-E08-E101-LOAD-SAVE      | Show Text face parameter load and save                              | static-inference                | identified editor resources; conditional review only |
| MV-E08-E322-LOAD-SAVE      | Change Actor Images saved pair and actor refresh                    | static-inference                | identified editor resources; conditional review only |
| MV-E08-NEW-PROJECT-DEFAULT | New face control and project-dependent actor initial values         | static-inference                | identified editor resources; conditional review only |
| MV-E08-PREVIEW             | Parent preview inheritance does not clamp saved index               | reverse-engineering-observation | identified editor resources; conditional review only |
| MV-E08-NONE-PARENT         | None plus independent index in parent reconfirmation                | static-inference                | identified editor resources; conditional review only |
| MV-E08-NONE-CHILD          | Conditional None confirmation in child picker                       | static-inference                | identified editor resources; conditional review only |
| MV-E08-SMALLER-ACTIVE      | Active two-row replacement can reset old third-row index            | static-inference                | identified editor resources; conditional review only |
| MV-E08-SMALLER-INACTIVE    | One-row replacement skips cursor adjustment                         | static-inference                | identified editor resources; conditional review only |
| MV-E08-ASYNC-MISSING       | Image loading and missing filename limits                           | static-inference                | identified editor resources; conditional review only |
| MV-E08-CONTAINER           | Container-only serialization preserves face slots                   | reverse-engineering-observation | identified editor resources; conditional review only |
| MV-E08-FINITE-DOMAIN       | Accepted finite saved-value domain differs from picker reachability | static-inference                | identified editor resources; conditional review only |

| Requirement             | Obligation                                                           | Evidence kind                   | Required layer                                   |
| ----------------------- | -------------------------------------------------------------------- | ------------------------------- | ------------------------------------------------ |
| MV-E09-LABEL            | Label single-slot load and save                                      | reverse-engineering-observation | identified editor resources; bounded review only |
| MV-E09-JUMP-LABEL       | Jump to Label single-slot load and save                              | reverse-engineering-observation | identified editor resources; bounded review only |
| MV-E09-ACTOR-NAME       | Change Name complete text slot                                       | reverse-engineering-observation | identified editor resources; bounded review only |
| MV-E09-ACTOR-NICKNAME   | Change Nickname complete text slot                                   | reverse-engineering-observation | identified editor resources; bounded review only |
| MV-E09-PROFILE          | Profile text slot with two-line control                              | reverse-engineering-observation | identified editor resources; bounded review only |
| MV-E09-CONDITION-SCRIPT | Conditional Script single text slot                                  | reverse-engineering-observation | identified editor resources; bounded review only |
| MV-E09-VARIABLE-SCRIPT  | Control Variables Script operand slot                                | reverse-engineering-observation | identified editor resources; bounded review only |
| MV-E09-MOVEMENT-SCRIPT  | Movement Script text and record-envelope boundary                    | reverse-engineering-observation | identified editor resources; bounded review only |
| MV-E09-EMPTY-WHITESPACE | Empty and whitespace values versus ordinary input                    | static-inference                | identified editor resources; bounded review only |
| MV-E09-CONTROL-CHARS    | CR, LF and CRLF load/reconfirmation limits                           | static-inference                | identified editor resources; bounded review only |
| MV-E09-TRAILING         | Trailing characters and delimiters                                   | static-inference                | identified editor resources; bounded review only |
| MV-E09-LONG             | Long string and bounded absence of a character cap                   | static-inference                | identified editor resources; bounded review only |
| MV-E09-LINE-LIMIT       | Line-limit change trigger differs from load                          | reverse-engineering-observation | identified editor resources; bounded review only |
| MV-E09-INPUT-LIMITS     | Tab, Return and text-change input guards                             | reverse-engineering-observation | identified editor resources; bounded review only |
| MV-E09-QT-TIMING        | Qt document and signal timing boundaries                             | static-inference                | identified editor resources; bounded review only |
| MV-E09-CONTAINER        | Container and outer route confirmation keep strings outside TextEdit | reverse-engineering-observation | identified editor resources; bounded review only |
| MV-E09-WARNING-POLICY   | Accepted original-string warning rules and independent Gate          | static-inference                | identified editor resources; bounded review only |

| Requirement          | Obligation                                                           | Evidence kind                   | Required layer                            |
| -------------------- | -------------------------------------------------------------------- | ------------------------------- | ----------------------------------------- |
| MV-E10-RANGE         | EXP constant range from editor and bundled native control            | reverse-engineering-observation | identified editor/Qt; bounded review only |
| MV-E10-INITIALIZE    | EXP new-dialog completed initialization                              | static-inference                | identified editor/Qt; bounded review only |
| MV-E10-LOAD-MAX      | Upper constant numeric load and confirmation                         | static-inference                | identified editor/Qt; bounded review only |
| MV-E10-LOAD-OVER     | Injected out-of-domain numeric load versus text input                | static-inference                | identified editor/Qt; bounded review only |
| MV-E10-TEXT-MAX      | Seven-digit text handler boundary                                    | static-inference                | identified editor/Qt; bounded review only |
| MV-E10-TEXT-OVER     | Eight-digit text truncation precedes numeric clamp                   | static-inference                | identified editor/Qt; bounded review only |
| MV-E10-STEP          | Endpoint increment and decrement use bounded setter                  | reverse-engineering-observation | identified editor/Qt; bounded review only |
| MV-E10-CONFIRM       | Six current properties saved on parameter confirmation               | reverse-engineering-observation | identified editor/Qt; bounded review only |
| MV-E10-CONTAINER     | Container serialization does not open the EXP parameter control      | reverse-engineering-observation | identified editor/Qt; bounded review only |
| MV-E10-HELP          | Same-install help maximum discrepancy                                | reverse-engineering-observation | identified editor/Qt; bounded review only |
| MV-E10-VARIABLE      | Variable slot ID versus runtime operand value                        | reverse-engineering-observation | identified editor/Qt; bounded review only |
| MV-E10-SHOW-LEVEL-UP | Disabled Show Level Up remains an independent saved boolean          | reverse-engineering-observation | identified editor/Qt; bounded review only |
| MV-E10-TIMING        | Unexecuted text, focus and signal order remains explicit             | static-inference                | identified editor/Qt; bounded review only |
| MV-E10-CONTRACT      | Accepted EXP range consistency and separate product/game obligations | static-inference                | identified editor/Qt; bounded review only |

| Requirement               | Obligation                                                                       | Evidence kind       | Required layer                          |
| ------------------------- | -------------------------------------------------------------------------------- | ------------------- | --------------------------------------- |
| MV-S2-ROUTE-014           | Shared route defaults, finite indent and M0 state, all eight flags               | synthetic-support   | command and Staged Data Graph           |
| MV-S2-MIRROR-014          | Ordered, same-indent, complete-object E205/E505 agreement                        | synthetic-rejection | compile/decompile shared scanner        |
| MV-S2-SHAPE-014           | Unknown codes, extra keys and unsupported envelope rejection                     | synthetic-rejection | formal/native/recognized raw            |
| MV-S2-ROUTE-RAW-014       | Known raw route Script Gate and switch references                                | synthetic-rejection | Staged Data Graph                       |
| MV-S2-ROUTE-WORKSPACE-014 | Independent saved data through Discovery/typecheck/evaluation and safe roundtrip | synthetic-support   | actual Workspace API                    |
| MV-S2-ROUTE-STATE-014     | Check/Compile failure leaves all observable Workspace state intact               | synthetic-rejection | actual filesystem and Discovery         |
| MV-S2-ROUTE-CLI-014       | Shared route behavior through built Windows CLI processes                        | synthetic-support   | built package and actual CLI            |
| MV-R1-ROUTE-014           | 90-frame route wait/repeat/skip and finite-envelope controls                     | game-observation    | two actual MV1.6.1 / NW0.29.0 processes |

Ticket 14's [acceptance report](14-movement-acceptance.md) distinguishes product saved-shape comparison, actual native game state and the earlier conditional editor-code evidence. The shared route envelope is delivered; complete Page authoring, all 45 parameter contracts and final integrated R1–R7 regressions retain their own tickets.

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

Ticket 07 adds [Shop/list/defaults and mixed-placeholder review](07-shop-defaults-and-goods-reverse.md) and [selected resource identities](07-resource-identities.json). The user explicitly accepted exact-four-zero Shop Goods Placeholders at arbitrary positions, interleaved with real goods and with ordered repetitions; sole placeholder decompiles as goods=[]. The initial `MV-E07-CONTRACT` blocked result is retained, followed by a new passed finite-contract consistency record. Ticket07 closes the reverse-engineering/contract prerequisite only; product47, final E2/E4 output comparison and actual game execution remain separate obligations.

Ticket12 adds captured Snapshot assembly and bounded existing-command validation. Actual Troop page/selector binding remains with25/48; complete command-family parameter acceptance and game execution remain with their assigned later tickets.

| Requirement       | Obligation                                                                                                     | Evidence kind       | Required layer                               |
| ----------------- | -------------------------------------------------------------------------------------------------------------- | ------------------- | -------------------------------------------- |
| MV-S3-CONTEXT-001 | resolves empty-name external targets through actual Snapshot and evaluated Decompiled Source                   | automated synthetic | actual Workspace / captured Snapshot adapter |
| MV-S3-CONTEXT-002 | assembles ordered hidden and missing-Enemy members, map tiles and all equipment slots from a captured Snapshot | automated synthetic | actual Workspace / captured Snapshot adapter |
| MV-S3-CONTEXT-003 | checks fixed external references while retaining unknown-caller runtime selectors                              | automated synthetic | actual Workspace / captured Snapshot adapter |
| MV-S3-CONTEXT-004 | rejects missing native external targets before publishing any Decompiled Source                                | automated synthetic | actual Workspace / captured Snapshot adapter |
| MV-S3-CONTEXT-005 | uses captured map dimensions and event positions for actual Workspace placement diagnostics                    | automated synthetic | actual Workspace / captured Snapshot adapter |

Ticket 08 adds [face index, preview, replacement and None review](08-face-index-and-image-replacement-reverse.md) with [resource identities and independent dimension examples](08-resource-identities.json). Its 14 bounded review records preserve third-row 8/11 reachability, active two-row reset, inactive one-row non-reset, independent None index and the 1 ms/missing-file timing limits. Accepted 0..2147483647 saved-value support is distinct from ordinary picker creation; no contract amendment, actual UI/game execution or product pass is claimed.

Ticket 09 adds [single-slot text, input and reconfirmation review](09-single-slot-strings-and-reconfirmation-reverse.md), [28 selected resource identities](09-resource-identities.json), and [12 independent exact-character examples](09-string-inputs.json). Its 17 bounded review records distinguish direct command-slot assignments from shared TextEdit line-limit/change/keyboard handling, Qt timing and CR/CRLF unknowns, and container/outer-route serialization. Original-string warning thresholds remain accepted product choices, with no new length restriction or normalization. No editor UI, extracted-code, product or game execution is claimed.

Ticket16 adds [Workspace operation lock acceptance](16-workspace-operation-locking.md). These are automated synthetic filesystem/process cases; they do not execute the editor or a game.

| Requirement    | Obligation                                                                      | Evidence kind     | Required layer                              |
| -------------- | ------------------------------------------------------------------------------- | ----------------- | ------------------------------------------- |
| MV-S4-LOCK-001 | All same-Workspace API and CLI operations immediately reject contention         | synthetic-support | Windows public API and real child processes |
| MV-S4-LOCK-002 | hides Snapshot publication gaps and aliases while other Workspaces operate      | synthetic-support | Windows public API and real child processes |
| MV-S4-LOCK-003 | recovers kernel leases after interruption and crash without stale-cleaner races | synthetic-support | Windows public API and real child processes |
| MV-S4-LOCK-004 | preserves Interrupted Push independently of abandoned locks and failed checks   | synthetic-support | Windows public API and real child processes |

Ticket 10 adds [EXP range, input, load and save review](10-exp-boundaries-reverse.md), [16 selected resource identities and real native Evidence pointers](10-resource-identities.json), and [11 independent literal boundary inputs](10-exp-inputs.json). Its 14 bounded review records distinguish seven-digit text truncation from numeric setter clamping, initialization/completion and step paths, six-slot confirmation, container-only serialization, variable runtime values and the conflicting help maximum. Fresh same-DLL REA/Ghidra evidence closes the completion/range gap; exact UI signal order remains explicitly unexecuted. No editor UI, extracted-code, product or game execution is claimed.

Ticket17 adds [Snapshot capture and Project Root Binding acceptance](17-snapshot-capture-and-project-binding.md).
These cases execute actual public Workspace operations and filesystem boundaries;
all record `native: not-executed`. Final E/R validation remains assigned to later tickets.

| Requirement        | Obligation                                                                                                              | Evidence kind     | Required layer                                                                          |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- | ----------------- | --------------------------------------------------------------------------------------- |
| MV-S4-SNAPSHOT-001 | Clone and Pull reject observed content, collection, deletion and configuration changes before publication               | synthetic-support | Windows public API and actual child process                                             |
| MV-S4-SNAPSHOT-002 | Pending remains bound to its original target, then recovers after returning there                                       | synthetic-support | Windows public API/CLI and interrupted actual Push                                      |
| MV-S4-SNAPSHOT-003 | All target consumers reject wrong binding; explicit Pull rebinds and invalidates output; canonical aliases remain valid | synthetic-support | Windows public API/CLI and junction                                                     |
| MV-S4-SNAPSHOT-004 | Exact original bytes and hash agree; undecodable UTF-8 is rejected without publication                                  | synthetic-support | Windows public API and byte-level comparison                                            |
| MV-S4-SNAPSHOT-005 | Unsafe MapInfos never filters into a partial Snapshot; registered maps are complete and unrelated files excluded        | synthetic-support | Windows public API and independent collection cases                                     |
| MV-S4-SNAPSHOT-006 | Manifest installation failure restores previous complete Snapshot and metadata                                          | synthetic-support | Actual filesystem rename failure in a real child                                        |
| MV-S4-SNAPSHOT-007 | Unknown, corrupt, incomplete and unsafe Snapshot metadata stops before output publication                               | synthetic-support | Windows public API/CLI and file-state comparison                                        |
| MV-S4-SNAPSHOT-008 | Snapshot set/content must agree with its captured manifest before consumption                                           | synthetic-support | Windows public API and byte-level corruption                                            |
| MV-S4-SNAPSHOT-009 | Invalid standard carriers and registered map event locations stop explicitly                                            | synthetic-support | Windows public API and independent malformed carriers                                   |
| MV-S4-SNAPSHOT-010 | Unknown/inconsistent pending formats and corrupt backup/generated evidence remain intact                                | synthetic-support | Windows public API/CLI, interrupted actual Push and successful generated-state recovery |

Ticket18 adds compilation input capture and Generated Freshness cases. These cases record `native: not-executed`; final game validation remains separately assigned.

| Requirement     | Obligation                                                                                 | Evidence kind     | Required layer                                           |
| --------------- | ------------------------------------------------------------------------------------------ | ----------------- | -------------------------------------------------------- |
| MV-S4-INPUT-001 | type dependency content invalidates Generated Freshness and blocks Diff/Push               | synthetic-support | Windows public API / real filesystem and child processes |
| MV-S4-INPUT-002 | Compile and Check refuse input changes observed before publication                         | synthetic-support | Windows public API / real filesystem and child processes |
| MV-S4-INPUT-003 | resolution lookups and package metadata invalidate unchanged loaded declarations           | synthetic-support | Windows public API / real filesystem and child processes |
| MV-S4-INPUT-004 | Compile and Check refuse changed discovery and Snapshot sets                               | synthetic-support | Windows public API / real filesystem and child processes |
| MV-S4-INPUT-005 | Compile and Check refuse changed configuration target and captured bytes                   | synthetic-support | Windows public API / real filesystem and child processes |
| MV-S4-INPUT-006 | Decompile refuses changed existing source discovery config and Snapshot before publication | synthetic-support | Windows public API / real filesystem and child processes |
| MV-S4-INPUT-007 | missing old or mismatched contract basis stays stale and Check creates no Freshness        | synthetic-support | Windows public API / real filesystem and child processes |
| MV-S4-INPUT-008 | capturing type dependencies never executes helper values or event JavaScript               | synthetic-support | Windows public API / real filesystem and child processes |

Ticket19 adds complete Compile Output validation and publication safety cases; all record native:not-executed.

| Requirement      | Obligation                                                                         | Evidence kind     | Required layer                                               |
| ---------------- | ---------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------ |
| MV-S4-OUTPUT-001 | Diff and Push reject omitted owned output domains                                  | synthetic-support | Windows public API and actual filesystem                     |
| MV-S4-OUTPUT-002 | Check and Compile reject invalid emitted JSON without publishing                   | synthetic-support | Windows public API and actual filesystem                     |
| MV-S4-OUTPUT-003 | Compile refuses changed inputs before manifest commitment                          | synthetic-support | Windows public API and actual child filesystem checkpoint    |
| MV-S4-OUTPUT-004 | Check validates a complete candidate in memory and leaves Freshness unchanged      | synthetic-support | Windows public API/CLI and real filesystem/process boundary  |
| MV-S4-OUTPUT-005 | real candidate installation and manifest failures cannot authorize stale output    | synthetic-support | Windows public API/CLI and real filesystem/process boundary  |
| MV-S4-OUTPUT-006 | interruption after installation leaves unusable output until explicit Compile      | synthetic-support | Windows public API/CLI and real filesystem/process boundary  |
| MV-S4-OUTPUT-007 | integrity rejects missing replaced corrupt and extra claimed generated files       | synthetic-support | Windows public API/CLI and real filesystem/process boundary  |
| MV-S4-OUTPUT-008 | integrity compares actual generated bytes without lossy UTF8 decoding              | synthetic-support | Windows public API and actual byte-corrupted generated files |
| MV-S4-OUTPUT-009 | Check and Compile share structure reference and Gate rejection without publication | synthetic-support | Windows public API and actual Discovery/evaluation           |

[Ticket19验收报告](19-compile-check-and-output-publication.md)记录完整候选、发布故障、字节完整性、9项源码／构建矩阵、4个产品红灯与2个测试预期错误；全部本票机器记录为native not-executed。

Ticket20 adds [complete isolated Decompile directory publication acceptance](20-decompile-complete-directory-publication.md), including 33 source and 33 own-worktree built passed records, retained failed history, and an actual C:/F: cross-volume rejection supplement. All cases record native:not-executed.

| Requirement         | Obligation                                                                                               | Evidence kind     | Required layer                                                     |
| ------------------- | -------------------------------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------ |
| MV-S4-DECOMPILE-001 | Existing source provides only reliable Entry Identity despite unrelated errors                           | synthetic-support | Windows public API/CLI and actual filesystem/process checkpoints   |
| MV-S4-DECOMPILE-002 | Complete candidate uses final-location dependency resolution                                             | synthetic-support | Windows public API/CLI and actual filesystem/process checkpoints   |
| MV-S4-DECOMPILE-003 | Own undefined spread overrides an earlier identity and fails reliably                                    | synthetic-support | Windows public API/CLI and actual filesystem/process checkpoints   |
| MV-S4-DECOMPILE-004 | Existing entire destination refuses publication for every directory/file/link kind                       | synthetic-support | Windows public API/CLI and actual filesystem/process checkpoints   |
| MV-S4-DECOMPILE-005 | Protected remnants remain outside broad and explicit junction Discovery                                  | synthetic-support | Windows public API/CLI and actual filesystem/process checkpoints   |
| MV-S4-DECOMPILE-006 | Observed sourceRoot replacement after capture refuses publication                                        | synthetic-support | Windows public API/CLI and actual filesystem/process checkpoints   |
| MV-S4-DECOMPILE-007 | Concurrent destination occupation refuses actual final directory move                                    | synthetic-support | Windows public API/CLI and actual filesystem/process checkpoints   |
| MV-S4-DECOMPILE-008 | Killed partial stage remains undiscoverable and explicit retry publishes complete batch                  | synthetic-support | Windows public API/CLI and actual filesystem/process checkpoints   |
| MV-S4-DECOMPILE-009 | Lost success after actual directory move preserves complete batch and retry refuses existing destination | synthetic-support | Windows public API/CLI and actual filesystem/process checkpoints   |
| MV-S4-DECOMPILE-010 | Every planned file must match complete Discovery include and ancestor exclude rules                      | synthetic-support | Windows public API/CLI and actual filesystem/process checkpoints   |
| MV-S4-DECOMPILE-011 | Direct object namespace alias and spread Entry Identity extraction stays reliable                        | synthetic-support | Windows public API/CLI and actual filesystem/process checkpoints   |
| MV-S4-DECOMPILE-012 | Existing source cannot repair a target missing from complete candidate                                   | synthetic-support | Windows public API/CLI and actual filesystem/process checkpoints   |
| MV-S4-DECOMPILE-013 | Changed source Discovery config Snapshot dependency or stage refuses publication                         | synthetic-support | Windows public API/CLI and actual filesystem/process checkpoints   |
| MV-S4-DECOMPILE-014 | Supported absolute junction and parent-relative sourceRoot publish and compile exact independent data    | synthetic-support | Windows public API/CLI and actual filesystem/process checkpoints   |
| MV-S4-DECOMPILE-015 | Unsupported path and actual write or unavailable host failures preserve all business state               | synthetic-support | Windows public Workspace and real process/filesystem boundaries    |
| MV-S4-DECOMPILE-016 | Pinned logical junction physical parent and ancestor resist mutation and release after publication       | synthetic-support | Windows public Workspace and actual external filesystem operations |

Ticket21 records [full-input byte Drift and non-overwriting Push checks](21-push-full-input-drift-checks.md).
These synthetic Windows public API/CLI records use actual filesystem and child-process
boundaries; native execution remains `not-executed` for this ticket.

| Requirement     | Obligation                                                                                      | Evidence kind     | Required layer                                                          |
| --------------- | ----------------------------------------------------------------------------------------------- | ----------------- | ----------------------------------------------------------------------- |
| MV-S4-DRIFT-001 | no-op Push checks every captured standard file and registered map by bytes                      | synthetic-support | Windows public Workspace API/CLI and real filesystem/process boundaries |
| MV-S4-DRIFT-002 | live byte corruption cannot pass through replacement UTF8 decoding                              | synthetic-support | Windows public Workspace API/CLI and real filesystem/process boundaries |
| MV-S4-DRIFT-003 | semantic Diff ignores key order while preserving saved-value distinctions and byte Drift        | synthetic-support | Windows public Workspace API/CLI and real filesystem/process boundaries |
| MV-S4-DRIFT-004 | the full input set is checked again after staging before first replacement                      | synthetic-support | Windows public Workspace API/CLI and real filesystem/process boundaries |
| MV-S4-DRIFT-005 | postwrite full check preserves unrelated external bytes and Interrupted Push                    | synthetic-support | Windows public Workspace API/CLI and real filesystem/process boundaries |
| MV-S4-DRIFT-006 | actual installation never overwrites a concurrently arriving external file                      | synthetic-support | Windows public Workspace API/CLI and real filesystem/process boundaries |
| MV-S4-DRIFT-007 | each captured old file is byte checked after earlier replacements                               | synthetic-support | Windows public Workspace API/CLI and real filesystem/process boundaries |
| MV-S4-DRIFT-008 | failed nonoverwriting restoration retains unique captured external objects                      | synthetic-support | Windows public Workspace API/CLI and real filesystem/process boundaries |
| MV-S4-DRIFT-009 | canonical high maps support Diff filters and safe interrupted Push                              | synthetic-support | Windows public Workspace API/CLI and real filesystem/process boundaries |
| MV-S4-DRIFT-010 | only Affected backups and writes preserve exact captured bytes                                  | synthetic-support | Windows public Workspace API/CLI and real filesystem/process boundaries |
| MV-S4-DRIFT-011 | staging rechecks actual generated bytes before live replacement                                 | synthetic-support | Windows public Workspace API/CLI and real filesystem/process boundaries |
| MV-S4-DRIFT-012 | postwrite check preserves an external edit to an already written affected file                  | synthetic-support | Windows public Workspace API/CLI and real filesystem/process boundaries |
| MV-S4-DRIFT-013 | atomic installation preserves directory and junction arrivals and fails safely when unsupported | synthetic-support | Windows public Workspace API/CLI and real filesystem/process boundaries |
| MV-S4-DRIFT-014 | deletion before a later capture leaves earlier writes and the external absence intact           | synthetic-support | Windows public Workspace API/CLI and real filesystem/process boundaries |
| MV-S4-DRIFT-015 | manifest finalization failure retains pending and the original compilation basis                | synthetic-support | Windows public Workspace API/CLI and real filesystem/process boundaries |

Ticket22 verifies Interrupted Push content recovery through the public Workspace API/CLI, independently preconstructed evidence and actual held child processes. All records remain synthetic support; native execution is `not-executed`.

| Requirement        | Obligation                                                                                  | Evidence kind     | Required layer                                                      |
| ------------------ | ------------------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------- |
| MV-S4-RECOVERY-001 | finishes an actual killed Push with a partially refreshed Snapshot                          | synthetic-support | Windows public API/CLI, real filesystem and held process boundaries |
| MV-S4-RECOVERY-002 | recognizes a committed manifest with intact pending after actual process death              | synthetic-support | Windows public API/CLI, real filesystem and held process boundaries |
| MV-S4-RECOVERY-003 | finishes preconstructed understood old evidence without manufacturing current Freshness     | synthetic-support | Windows public API/CLI, real filesystem and held process boundaries |
| MV-S4-RECOVERY-004 | completes preconstructed all-generated Snapshot matrix (%s)                                 | synthetic-support | Windows public API/CLI, real filesystem and held process boundaries |
| MV-S4-RECOVERY-005 | retains original basis under changed current assumptions (%s)                               | synthetic-support | Windows public API/CLI, real filesystem and held process boundaries |
| MV-S4-RECOVERY-006 | continues ordinary checks after content-based resolution (%s)                               | synthetic-support | Windows public API/CLI, real filesystem and held process boundaries |
| MV-S4-RECOVERY-007 | refuses contradictory live and recovery evidence without state changes                      | synthetic-support | Windows public API/CLI, real filesystem and held process boundaries |
| MV-S4-RECOVERY-008 | resumes repeated real process deaths across Snapshot, manifest and retirement               | synthetic-support | Windows public API/CLI, real filesystem and held process boundaries |
| MV-S4-RECOVERY-009 | compares original bytes for live, backup, generated and Snapshot evidence                   | synthetic-support | Windows public API/CLI, real filesystem and held process boundaries |
| MV-S4-RECOVERY-010 | refuses late generated mutation at actual consumption boundaries (%s)                       | synthetic-support | Windows public API/CLI, real filesystem and held process boundaries |
| MV-S4-RECOVERY-011 | preserves the appropriate authority across deterministic I/O failures (%s)                  | synthetic-support | Windows public API/CLI, real filesystem and held process boundaries |
| MV-S4-RECOVERY-012 | refuses a committed manifest whose Snapshot or live content contradicts completion          | synthetic-support | Windows public API/CLI, real filesystem and held process boundaries |
| MV-S4-RECOVERY-013 | non-Push commands and dead-owner lock cleanup preserve pending evidence                     | synthetic-support | Windows public API/CLI, real filesystem and held process boundaries |
| MV-S4-RECOVERY-014 | rejects an incomplete affected set instead of losing pending authority                      | synthetic-support | Windows public API/CLI, real filesystem and held process boundaries |
| MV-S4-RECOVERY-015 | missing or uninterpretable recovery evidence has an explicit pending diagnostic             | synthetic-support | Windows public API/CLI and actual filesystem                        |
| MV-S4-RECOVERY-016 | all-Snapshot abandonment completes retirement before any new write (%s)                     | synthetic-support | Windows public API/CLI and actual filesystem/process boundary       |
| MV-S4-RECOVERY-017 | recognizes an independently preconstructed committed manifest without rerecording basis     | synthetic-support | Windows public API/CLI and actual filesystem/process boundary       |
| MV-S4-RECOVERY-018 | rejects byte-corrupt metadata even when replacement decoding produces identical fields (%s) | synthetic-support | Windows public API/CLI and raw metadata bytes                       |
| MV-S4-RECOVERY-019 | refuses pending replacement after its original bytes are captured                           | synthetic-support | Windows public API and actual held filesystem/process boundary      |

Ticket22 records [the frozen recovery protocol, actual red/green runs and byte-preserved evidence](22-interrupted-push-content-recovery.md). Historical failures and superseded passes keep their original status and provenance; native execution remains `not-executed`.

Ticket23 verifies complete Common Event state and E117 through public authoring and Workspace operations. Native evidence is recorded separately in [the Common roundtrip report](23-common-event-roundtrip.md).

| Requirement      | Obligation                                                                                 | Evidence kind       | Required layer                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------ | ------------------- | ------------------------------------------------------------------------------------------------- |
| MV-S5-COMMON-001 | evaluates named-object Common calls against complete current declarations                  | synthetic-support   | Public Workspace API/CLI, actual Discovery and TypeScript evaluation; no native execution claimed |
| MV-S5-COMMON-002 | preserves every trigger and independent saved switch through editable source and safe Push | synthetic-support   | Public Workspace API/CLI, actual Discovery and TypeScript evaluation; no native execution claimed |
| MV-S5-COMMON-003 | rejects malformed owned Common metadata before any source publication                      | synthetic-rejection | Public Workspace API/CLI, actual Discovery and TypeScript evaluation; no native execution claimed |
| MV-S5-COMMON-004 | rejects malformed formal Common containers without publishing output                       | synthetic-rejection | Public Workspace API/CLI, actual Discovery and TypeScript evaluation; no native execution claimed |
| MV-S5-COMMON-005 | rejects invalid E117 shape through real source                                             | synthetic-rejection | Public Workspace API/CLI, actual Discovery and TypeScript evaluation; no native execution claimed |
| MV-S5-COMMON-006 | applies ordinary Switch reference rules                                                    | synthetic-support   | Public Workspace API/CLI, actual Discovery and TypeScript evaluation; no native execution claimed |
| MV-S5-COMMON-007 | rejects saved Switch references outside actual capacity                                    | synthetic-rejection | Public Workspace API/CLI, actual Discovery and TypeScript evaluation; no native execution claimed |
| MV-S5-COMMON-008 | reports independent saved-field changes and safely removes entries without compacting IDs  | synthetic-support   | Public Workspace API/CLI, actual Discovery and TypeScript evaluation; no native execution claimed |
| MV-S5-COMMON-009 | resolves E117 only against current complete declarations                                   | synthetic-support   | Public Workspace API/CLI, actual Discovery and TypeScript evaluation; no native execution claimed |
| MV-S5-COMMON-010 | rejects malformed late Common command lists                                                | synthetic-rejection | Public Workspace API/CLI, actual Discovery and TypeScript evaluation; no native execution claimed |
| MV-S5-COMMON-011 | existing handwritten declarations cannot repair an incomplete native candidate             | synthetic-rejection | Public Workspace API/CLI, actual Discovery and TypeScript evaluation; no native execution claimed |
| MV-S5-COMMON-012 | preserves a distant explicit identity and omitted none default without a picker cap        | synthetic-support   | Public Workspace API/CLI, actual Discovery and TypeScript evaluation; no native execution claimed |
| MV-S5-COMMON-013 | preserves known calls and opaque raw payloads while the Script Gate remains effective      | synthetic-support   | Public Workspace API/CLI, actual Discovery and TypeScript evaluation; no native execution claimed |
| MV-S5-COMMON-014 | public types require an active trigger Switch and the named E117 input                     | synthetic-rejection | Public Workspace API/CLI, actual Discovery and TypeScript evaluation; no native execution claimed |
| MV-S5-COMMON-015 | validates direct exported Common definitions before scope construction                     | synthetic-rejection | Public Workspace API/CLI, actual Discovery and TypeScript evaluation; no native execution claimed |
| MV-S5-COMMON-016 | preserves caller-dependent current-event operations without inventing a fixed Map context  | synthetic-support   | Public Workspace API/CLI, actual Discovery and TypeScript evaluation; no native execution claimed |

| MV-S5-COMMON-E1 | Identified editor Common factory/load/edit/save and E117 selection code facts | reverse-engineering-observation | Read-only resource identity and complete Common initialization/load/edit/serialize code review |

Ticket25 records [Troop Event ownership, Reset, complete carrier safety, E1 reverse/product comparison and actual R2](25-troop-event-ownership-and-reset.md). Historical rows and captured result bytes remain unchanged.

| Requirement               | Obligation                                                                                                             | Evidence kind                   | Required layer                                                             |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------- | -------------------------------------------------------------------------- |
| MV-S5-TROOP-AUTHOR-001    | authors a Troop Event with one complete fixed-default native Battle Event Page                                         | synthetic-support               | Approved authoring/validation and public Workspace API/filesystem boundary |
| MV-S5-TROOP-AUTHOR-002    | rejects an enabled enemy condition when an earlier hidden member has a missing Enemy                                   | synthetic-support               | Approved authoring/validation and public Workspace API/filesystem boundary |
| MV-S5-TROOP-AUTHOR-003    | preserves inactive saved condition values but rejects malformed inactive slots                                         | synthetic-support               | Approved authoring/validation and public Workspace API/filesystem boundary |
| MV-S5-TROOP-AUTHOR-004    | requires unique existing Troop identities and nonempty ordered pages without an editor ID cap                          | synthetic-support               | Approved authoring/validation and public Workspace API/filesystem boundary |
| MV-S5-TROOP-AUTHOR-005    | resolves active actor and switch names, keeps inactive ID exceptions local, and validates complete Troop command lists | synthetic-support               | Approved authoring/validation and public Workspace API/filesystem boundary |
| MV-S5-TROOP-AUTHOR-006    | locates an invalid inactive condition at its exact DSL field with expected and actual values                           | synthetic-support               | Approved authoring/validation and public Workspace API/filesystem boundary |
| MV-S5-TROOP-AUTHOR-007    | locates invalid span and fixed actor references with their saved actual values                                         | synthetic-support               | Approved authoring/validation and public Workspace API/filesystem boundary |
| MV-S5-TROOP-WORKSPACE-001 | materializes every actual Troop carrier and resets omitted pages to the exact Blank                                    | synthetic-support               | Approved authoring/validation and public Workspace API/filesystem boundary |
| MV-S5-TROOP-WORKSPACE-002 | decompiles all actual Troops including Blank and roundtrips complete inactive state and page order                     | synthetic-support               | Approved authoring/validation and public Workspace API/filesystem boundary |
| MV-S5-TROOP-WORKSPACE-003 | reports omission as Troop Event Reset in every Diff view and gates Push while retaining all carrier fields             | synthetic-support               | Approved authoring/validation and public Workspace API/filesystem boundary |
| MV-S5-TROOP-WORKSPACE-004 | rejects an existing Troop source identity before publishing Decompile                                                  | synthetic-support               | Approved authoring/validation and public Workspace API/filesystem boundary |
| MV-S5-TROOP-WORKSPACE-005 | rejects %s in native Troop input before source publication                                                             | synthetic-support               | Approved authoring/validation and public Workspace API/filesystem boundary |
| MV-S5-TROOP-WORKSPACE-006 | classifies %s by exact page state and compares native positions                                                        | synthetic-support               | Approved authoring/validation and public Workspace API/filesystem boundary |
| MV-S5-TROOP-SAFETY-001    | Troops participates in late candidate write failure with no partial publication                                        | synthetic-support               | Approved authoring/validation and public Workspace API/filesystem boundary |
| MV-S5-TROOP-SAFETY-002    | recovers a real interrupted Troops replacement using the complete captured output and unchanged source basis           | synthetic-support               | Approved authoring/validation and public Workspace API/filesystem boundary |
| MV-S5-TROOP-SAFETY-003    | rejects Troops carrier drift before Project Root writes                                                                | synthetic-support               | Approved authoring/validation and public Workspace API/filesystem boundary |
| MV-S5-TROOP-PRIOR-001     | recognizes the bounded pre-Troops complete output set: %s                                                              | synthetic-support               | Approved authoring/validation and public Workspace API/filesystem boundary |
| MV-S5-TROOP-E1            | Allocated E1 reverse code facts and complete independent product comparison                                            | reverse-engineering-observation | Retained artifact review and actual specified boundary                     |
| MV-S5-TROOP-R2            | Allocated R2 actual normal Scene/Input literal and formal DSL product pair                                             | game-observation                | Retained artifact review and actual specified boundary                     |
| MV-S5-TROOP-PRIOR-002     | Actual build22 prior-output-set pending recovered by built25 without new Freshness                                     | synthetic-support               | Retained artifact review and actual specified boundary                     |

Ticket24 adds [complete Map Event pages and exact saved state](24-map-event-full-pages.md). Native rows close only its allocated representative scenes, not final49–54.

| Requirement           | Obligation                                                                                                    | Evidence kind                   | Required layer                                                       |
| --------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------- | -------------------------------------------------------------------- |
| MV-S5-MAP-001         | round trips the complete native blank Map Event and exact note through actual Workspace operations            | synthetic-support               | Actual public product operations and independent complete assertions |
| MV-S5-MAP-002         | rejects a malformed late native page without publishing any candidate or changing Workspace state             | synthetic-rejection             | Actual public product operations and independent complete assertions |
| MV-S5-MAP-003         | preserves disabled condition settings, independent images and every saved page field                          | synthetic-support               | Actual public product operations and independent complete assertions |
| MV-S5-MAP-004         | rejects malformed authored page options in Check and Compile without changing Workspace state                 | synthetic-rejection             | Actual public product operations and independent complete assertions |
| MV-S5-MAP-005         | requires the active tile's actual Map and Tilesets Snapshot context before publishing source                  | synthetic-rejection             | Actual public product operations and independent complete assertions |
| MV-S5-MAP-006         | reports page positions and native paths on Map1001 and removes a high-ID entry without compacting the carrier | synthetic-support               | Actual public product operations and independent complete assertions |
| MV-S5-MAP-007         | rejects incomplete native Map saved shape: %s                                                                 | synthetic-rejection             | Actual public product operations and independent complete assertions |
| MV-S5-MAP-008         | recursively gates a saved empty script in a fixed page route while Decompile retains the source               | synthetic-support               | Actual public product operations and independent complete assertions |
| MV-S5-MAP-009         | does not extend the disabled-condition ID exception to a noncustom saved route                                | synthetic-rejection             | Actual public product operations and independent complete assertions |
| MV-S5-MAP-010         | complete Map Event saved state                                                                                | synthetic-support               | Actual public product operations and independent complete assertions |
| MV-S5-MAP-E1          | Ticket24 E1 allocated representative evidence                                                                 | reverse-engineering-observation | Identified resource/product comparison or actual native pair         |
| MV-S5-MAP-E3          | Ticket24 E3 allocated representative evidence                                                                 | reverse-engineering-observation | Identified resource/product comparison or actual native pair         |
| MV-S5-MAP-E6          | Ticket24 E6 allocated representative evidence                                                                 | reverse-engineering-observation | Identified resource/product comparison or actual native pair         |
| MV-S5-MAP-R1-TRIGGERS | Ticket24 R1-TRIGGERS allocated representative evidence                                                        | game-observation                | Identified resource/product comparison or actual native pair         |
| MV-S5-MAP-R1-ROUTES   | Ticket24 R1-ROUTES allocated representative evidence                                                          | game-observation                | Identified resource/product comparison or actual native pair         |

| Requirement   | Obligation                                                                                                        | Evidence kind       | Required layer                    |
| ------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------- | --------------------------------- |
| MV-S5-MAP-011 | Reject missing mandatory native event slot0 on a late Map without publishing or changing complete Workspace state | synthetic-rejection | Actual source/built Workspace API |

| MV-S5-TROOP-PRIOR-003 | Authentic actual built24 /6 pending recovered by actual built25 /7 without new Freshness | synthetic-support | Original path-bound public built Workspace API, frozen before/after and complete immutable build provenance |

| MV-S5-TROOP-R2-DELIVERY-002 | Allocated R2 delivery revision 2: complete17-page/three-turn normal Scene/Input literal and formal DSL product pair | game-observation | Explicit version-bound delivery input; original R2 remains separate |

| MV-S5-TROOP-R2-AUXILIARY-E301 | roundtrips an unbranched Battle Processing launch without inventing a result close record | synthetic-support | Public source/built Workspace API; independent complete native literal |

| MV-S5-TROOP-R2-DELIVERY-003 | Allocated R2 delivery revision 3: complete17-page/three-turn normal Scene/Input literal and formal DSL product pair | game-observation | Explicit version-bound delivery input; original R2 remains separate |

| MV-S5-TROOP-R2-DELIVERY-004 | Allocated R2 delivery revision 4: complete17-page/three-turn normal Scene/Input literal and formal DSL product pair | game-observation | Explicit version-bound delivery input; original R2 remains separate |

| MV-S5-COMMON-R1-TRIGGERS | Complete Map/Common trigger and named E117 runtime pair | game-observation | Actual built Workspace and two fresh normal Scene native processes |

| MV-S5-COMMON-R1-PARALLEL | Shared-switch Common Parallel wait and shutdown runtime pair | game-observation | Actual built Workspace and two fresh normal Scene native processes |

| MV-S5-COMMON-R1-AUTORUN | Lowest active Common Autorun ID selection runtime pair | game-observation | Actual built Workspace and two fresh normal Scene native processes |

| MV-S5-COMMON-R4-CONTEXT | Same Common formal current-event and self-switch behavior from Map and Battle | game-observation | Actual built Workspace and two fresh normal Scene native processes |

| MV-S5-COMMON-CARRIER-BOUNDARY | Reject missing or nonnull Common reserved slot0 and preserve ordinary null-only carrier | synthetic-rejection | Actual public Workspace native carrier boundary |
| MV-S5-COMMON-TRIGGER-BOUNDARY | Reject categorical Common trigger negative zero with exact diagnostic and unchanged complete business state | synthetic-rejection | Actual public Workspace native carrier boundary |

| MV-S6-CONDITIONAL-R2-GUARD | preserves the original R2 Conditional guard marker through actual discovered source and Workspace Push | synthetic-support | Actual public source/built Workspace boundary; native obligations remain separate |
| MV-S6-CONDITIONAL-ALL-CARRIERS | round-trips every Conditional mode and numeric negative zero through actual source in all three carriers | synthetic-support | Actual public source/built Workspace boundary; native obligations remain separate |
| MV-S6-CONDITIONAL-NATIVE-REJECTION | rejects malformed Conditional native inputs and missing fixed references before source publication | synthetic-rejection | Actual public source/built Workspace boundary; native obligations remain separate |
| MV-S6-CONDITIONAL-SOURCE-REJECTION | rejects malformed actual discovered Conditional source with Check and Compile while preserving business files | synthetic-rejection | Actual public source/built Workspace boundary; native obligations remain separate |

## Ticket33 — all45 movement instructions

| Requirement        | Case                                                                                   | Scope                                           |
| ------------------ | -------------------------------------------------------------------------------------- | ----------------------------------------------- |
| MV-S6-MOVEMENT-001 | All45 finite movement shells and parameter cases through actual Workspace installation | E3/E5; [record](33-movement-instructions.md)    |
| MV-S6-MOVEMENT-002 | M45 closed Gate warning and recovery across fixed and forced routes                    | E5/R7; [record](33-movement-instructions.md)    |
| MV-S6-MOVEMENT-003 | Evaluated untyped movement fields reach real product validation                        | Product; [record](33-movement-instructions.md)  |
| MV-S6-MOVEMENT-004 | Late malformed saved route and exact mirror publication atomicity                      | Product; [record](33-movement-instructions.md)  |
| MV-S6-MOVEMENT-005 | All45 authoring/compiler/native/known-raw parameter and shape matrix                   | E3/E5; [record](33-movement-instructions.md)    |
| MV-S6-MOVEMENT-006 | Actual normal-Scene autonomous and forced route waiting with Parallel                  | R1; [record](33-movement-instructions.md)       |
| MV-S6-MOVEMENT-007 | Actual movement None image/SE and complete M45 single-slot execution                   | R1/R6/R7; [record](33-movement-instructions.md) |
| MV-S6-MOVEMENT-008 | Same-identity E3/E5 movement resources and product comparison                          | E3/E5; [record](33-movement-instructions.md)    |

| Requirement        | Case                                                                                         | Scope                                                                                                      |
| ------------------ | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| MV-S6-MOVEMENT-009 | R1 immutable complete native input binding                                                   | R1; [record](33-movement-instructions.md#native-delivery-input-bindings)                                   |
| MV-S6-MOVEMENT-010 | R6/R7 immutable complete native input binding                                                | R1/R6/R7; [record](33-movement-instructions.md#native-delivery-input-bindings)                             |
| MV-S6-MOVEMENT-011 | Preserve accepted negative-zero saved movement numbers through actual Workspace installation | Public source/built Workspace API; [record](33-movement-instructions.md#scoped-negative-zero-saved-values) |
| MV-S6-MOVEMENT-012 | Reject negative-zero categorical M43 before source publication                               | Public source/built Workspace API; [record](33-movement-instructions.md#scoped-negative-zero-saved-values) |

Ticket33's original R1-v2/R6/R7-v3 native acceptance was rejected for shared data
junctions. Four append-only `retest-required` records supersede those claims;
four fresh passed records bind physically independent R1-v4/R6/R7-v5 pairs.
The [isolation repair](33-movement-instructions.md#native-isolation-repair--2026-10-20)
preserves the incident, restored-reference provenance, physical guards and all
original records. Both new pairs retain the original13/19 predicates and all
strict native checks, with32 physical checkpoints each and unchanged full1100
reference/full1101 seed files. Product contract remains `mv-1.6.1/9`; source
check39files/980tests and built Windows15files/366tests remain applicable to the
unchanged97-source/15-dist product. All286 requirement objects retain their exact
bytes and order. Final49–55 remain separate from this allocated delivery.

Ticket36 map appearance cases use independent complete saved literals and actual Workspace operations.

| Requirement              | Obligation                                                                                                  | Evidence kind       | Required layer                                                   |
| ------------------------ | ----------------------------------------------------------------------------------------------------------- | ------------------- | ---------------------------------------------------------------- |
| MV-S6-MAP-APPEARANCE-001 | preserves independent None and inactive map appearance values through discovered source and real Push       | synthetic-support   | Public source/built Workspace and complete data/state assertions |
| MV-S6-MAP-APPEARANCE-006 | rejects malformed known native and raw appearance slots at their actual native and authored paths           | synthetic-rejection | Public source/built Workspace and complete data/state assertions |
| MV-S6-MAP-APPEARANCE-005 | requires all E284 fields and enforces saved speed bounds even with None and disabled looping                | synthetic-rejection | Public source/built Workspace and complete data/state assertions |
| MV-S6-MAP-APPEARANCE-004 | requires both independent E283 asset-or-None slots with exact folders and nonempty names                    | synthetic-rejection | Public source/built Workspace and complete data/state assertions |
| MV-S6-MAP-APPEARANCE-003 | rejects E282 None, zero, wrong scope and absent actual Tilesets with precise source paths                   | synthetic-rejection | Public source/built Workspace and complete data/state assertions |
| MV-S6-MAP-APPEARANCE-002 | rejects missing and untyped E281 values and helper unknown fields without changing complete Workspace state | synthetic-rejection | Public source/built Workspace and complete data/state assertions |

| Requirement                     | Obligation                                                                                        | Evidence kind                   | Required layer                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------ |
| MV-S6-MAP-APPEARANCE-E6         | Ticket36 allocated E6 identified map appearance resources and actual product comparison           | reverse-engineering-observation | Exact resource identity plus actual current built product/literal native pairs |
| MV-S6-MAP-APPEARANCE-R6         | Ticket36 allocated R6 current built normal-Scene map appearance and eight Battle background pairs | game-observation                | Exact resource identity plus actual current built product/literal native pairs |
| MV-S6-MAP-APPEARANCE-R6-MISSING | Ticket36 allocated actual missing-Tileset-image Loading Error and E282 stall pair                 | game-observation                | Exact resource identity plus actual current built product/literal native pairs |

| Requirement              | Obligation                                                                                                 | Evidence kind     | Required layer                                                                      |
| ------------------------ | ---------------------------------------------------------------------------------------------------------- | ----------------- | ----------------------------------------------------------------------------------- |
| MV-S6-MAP-APPEARANCE-007 | preserves E284 signed zero through formal and known raw source, native Decompile, evaluation and real Push | synthetic-support | Public source/built Workspace; literal signed-zero carrier and Object.is assertions |

Ticket36 allocated delivery is complete on contract `mv-1.6.1/10`: current source40 files/987 tests, fresh build, built Windows16 files/373 tests,9 exact E6 resource checks and10 physically isolated current-built/native pairs (20 game sides) passed. The [current delivery record](36-map-appearance-settings.md#final-current-delivery--contract-mv-16110) and `36-history/` preserve actual source/dist identities, rejected/incomplete attempts, original captures and safe native projections. All286 incoming rows/history bytes are preserved; final49–55 remain separate.

| Requirement           | Supplemental Map numeric saved-value check                                                                                     | Source              | Boundary                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------- | -------------------------------------------------------------------- |
| MV-S5-MAP-NUMERIC-001 | Preserve ten accepted Map Page numeric negative-zero states through actual native Decompile/source/Check/Compile/Diff/Push     | synthetic-support   | Actual public Workspace/Discovery/evaluation and complete filesystem |
| MV-S5-MAP-NUMERIC-002 | Preserve authored Map Page numeric negative zero through helper and untyped actual source evaluation and complete Push         | synthetic-support   | Actual public Workspace/Discovery/evaluation and complete filesystem |
| MV-S5-MAP-NUMERIC-003 | Refuse categorical or enabled-reference native Map negative zero before publication with exact diagnostics and unchanged state | synthetic-rejection | Actual public Workspace/Discovery/evaluation and complete filesystem |
| MV-S5-MAP-NUMERIC-004 | Refuse enabled Map condition negative-zero IDs from helper and untyped source in Check/Compile without changing state          | synthetic-rejection | Actual public Workspace/Discovery/evaluation and complete filesystem |

Ticket24's supplemental numeric correction now has current contract `mv-1.6.1/11` evidence: full source41files/1009tests, fresh15-file build, built Windows17files/395tests,34identified resource checks and two physically isolated actual native pairs passed. Ten synthetic numeric saved states remain distinct from editor-origin claims; actual native loaded values preserve their sign. The [current delivery report](24-map-event-full-pages.md#supplemental-numeric-saved-value-correction--current-delivery-contract-mv-16111) links1220new exact machine records, full input membership/bytes, independent native audit, retained original timeout and append-only history verification. Original requirement rows, result blobs and earlier delivery claims remain unchanged; final49–55 remain separate.

| MV-S6-TIMER-001 | authored Stop preserves absent, undefined, zero and nonzero slots | synthetic-support | Public source/built boundary; final candidate build remains separately required |

| MV-S6-TIMER-002 | independently saved slots roundtrip all three containers and install exact complete carriers | synthetic-support | Public source/built boundary; final candidate build remains separately required |

| MV-S6-TIMER-003 | numeric negative zero survives actual generated source and complete native installation | synthetic-support | Public source/built boundary; final candidate build remains separately required |

| MV-S6-TIMER-004 | invalid authored seconds fails Check and Compile without changing business state | synthetic-rejection | Public source/built boundary; final candidate build remains separately required |

| MV-S6-TIMER-005 | invalid native seconds has a precise diagnostic before publication | synthetic-rejection | Public source/built boundary; final candidate build remains separately required |

| MV-S6-TIMER-006 | public helper rejects invalid untyped Timer input | synthetic-rejection | Public source/built boundary; final candidate build remains separately required |

| MV-S6-TIMER-007 | native and known raw reject the same malformed saved slots | synthetic-rejection | Public source/built boundary; final candidate build remains separately required |

| MV-S6-TIMER-008 | command compilation rejects non-JSON array values without normalizing | synthetic-rejection | Public source/built boundary; final candidate build remains separately required |

| MV-S6-TIMER-009 | real loader rejects extra fields from a structurally typed local const | synthetic-rejection | Public source/built boundary; final candidate build remains separately required |

| MV-S6-TIMER-010 | real loader validates untyped source-local values | synthetic-rejection | Public source/built boundary; final candidate build remains separately required |

| MV-S6-TIMER-011 | actual loader rejects an undefined known raw saved slot before any business write | synthetic-rejection | Public source/built boundary; final candidate build remains separately required |

| MV-S6-TIMER-012 | valid known raw slots compile and Push complete three-container state | synthetic-support | Public source/built boundary; final candidate build remains separately required |

| MV-S6-TIMER-013 | public types reject incomplete or invalid authored Timer input | synthetic-rejection | Public source/built boundary; final candidate build remains separately required |

| MV-S6-TIMER-E4-COMPARE | Allocated E4 actual candidate built Timer output versus independent REA saved-slot contract | reverse-engineering-observation | Not executed at focused checkpoint; finalization required |

Ticket26 now has current contract `mv-1.6.1/12` delivery evidence: full source42 files/1069 tests, fresh15-file build, built Windows18 files/455 tests, and actual E4 comparison of14 independent scenarios/10 negative cases passed. The [current Timer report](26-timer-saved-slot-roundtrip.md#最终化构建与-e4-产品比较--mv-16112) and [26-final-history](26-final-history/README.md) preserve actual source/dist identities, the original full-check failures and exact closed captures. E4 verifies current10 resource identities against the bounded05 REA report and exercises real built public Workspace writes across complete15 carriers; it does not claim editor UI or game execution. The original checklist rows and their pending-at-DEV wording are historical and unchanged; final50 and52–54 remain separate.

Ticket26 final closure audit passed:314 requirements retain the complete incoming300 prefix and own288 rows,6084 historical raw blobs/prefixes remain exact,1507 initial archive source/copy pairs match, and189 actual/physically retained execution inputs (including15 dist files) remain unchanged. The original10-second selected evidence-index test passed in4.11 seconds. Closed captures are appended through26-final-history/post-archive-index-v1.json; the initial archive map is immutable. Ticket26 is resolved under the allocated E4 boundary.

## Ticket27 Choices finalization

| Requirement              | Coverage                                                                                                  | Evidence                                                |
| ------------------------ | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| MV-S6-CHOICES-001        | Numeric saved default/cancel indices including negative zero, full0..5 and precise out-of-count warnings  | actual automatic result records                         |
| MV-S6-CHOICES-002        | Named position/background, None/disabled and optional-undefined defaults                                  | actual automatic result records                         |
| MV-S6-CHOICES-003        | Exact mirror/order/cancel/body markers and nested raw ownership                                           | actual automatic result records                         |
| MV-S6-CHOICES-004        | Recursive reference and Script Gate validation in unreachable bodies                                      | actual automatic result records                         |
| MV-S6-CHOICES-005        | Strict helper/declaration shapes and malformed native/known-raw E102 slots                                | actual automatic result records                         |
| MV-S6-CHOICES-006        | Actual discovered numeric-sign Workspace roundtrip and installation                                       | actual automatic result records                         |
| MV-S6-CHOICES-007        | One-to-six lists, empty/trailing text, nested cancel and native markers through real source               | actual automatic result records                         |
| MV-S6-CHOICES-008        | Fixed one-choice defaults and out-of-count cancel warning through real source                             | actual automatic result records                         |
| MV-S6-CHOICES-009        | Native and structurally typed formal failures preserve complete business state on retry                   | actual automatic result records                         |
| MV-S6-CHOICES-010        | Recursive Gate fails before publication and allows exact installation when enabled                        | actual automatic result records                         |
| MV-S6-CHOICES-011        | Independent complete three-container/15-carrier and four-generated-carrier roundtrip with real Push edits | actual automatic result records                         |
| MV-S6-CHOICES-012        | All three native containers reject mirror conflict with exact paths and unchanged complete state          | actual automatic result records                         |
| MV-S6-CHOICES-E2-COMPARE | Allocated E2 candidate built product versus version-bound REA Choices save/container facts                | allocated documentary result; final regression separate |
| MV-S6-CHOICES-R3-PAIRS   | Allocated R3 actual native literal and compiled Choices game pairs                                        | allocated documentary result; final regression separate |

Ticket27 current delivery now has contract mv-1.6.1/13 evidence: full44files/1153tests, fresh15-file build, built Windows19files/474tests, E2 actual built public comparison with13 same-identity resource records and6 malformed cases, and R3 actual8literal/compiled pairs across16native processes. Original7Choices predicates plus finite numeric negative-zero are retained; complete15disk/4generated/4loaded and1100-file physical isolation were independently verified after root's exact prepare release. See [current27report](27-choices-complete-branches.md#后续实际完成记录--当前产品与分配验收). Earlier pending statements remain historical; final49–54 remain separate.

Ticket27 native audit addendum: all8 pairs have76data/11full checkpoints. Original independent-reader v1 exit1 is preserved; its initial inode invariant was narrowed only for the proven atomic Push replacement compiled/data/Map001.json, with every current data identity/hash still bound to the final checkpoint. Versioned v2 exit0 and root independent actual-outcome v2 both pass8pairs/16sides. Root also verifies18 complete globally disjoint regular physical trees including profiles,193execution inputs and6frozen tools; report SHA85957228f3538f8c449e72aa425d3cb8779038a54c01eaa9870bc383e62a13a5.

Ticket27 final-index-v1 actually timed out at the original10s. Complete8389-file timeout inputs remain physically retained and independently rehashed. Full phase probes did not reproduce the timeout; its cause remains undetermined. After root review, one original-CLI/no-plugin final-index-v2 recheck passed1test/2filtered in4.86s at original10s/2workers. This actual gate pass, original failure and all diagnostic limitations are preserved. Original archive-v3 EISDIR and boundedv4 handling of14 historical src junctions/756regular files/196original source snapshot files also remain explicit.

Ticket27 closure audit passed:328 requirements retain incoming314 in order and own274 by ID;7610 historical raw blobs/prefixes,3030 initial archive source/copy pairs and193 physical/current execution inputs including15dist remain exact. The final selected index passed at the original10s/2workers. Closed captures append via27-final-history/post-archive-index-v1.json. Ticket27 is resolved after allocated actual E2/R3; final49–54 remain separate.

| MV-S6-SYSTEM-SCENES-001 | Four explicit E134–137 access flags; independent false-zero/true-one saved slots | 40 focused DEV; source automation, no native claim |

| MV-S6-SYSTEM-SCENES-002 | rejects missing or nonboolean access flags and unsupported own shapes before projection | 40 focused DEV; source automation, no native claim |

| MV-S6-SYSTEM-SCENES-003 | requires exact named window Tone fields and preserves hidden gray and numeric negative zero | 40 focused DEV; source automation, no native claim |

| MV-S6-SYSTEM-SCENES-004 | validates exact native access flag slots before decompilation or known raw compilation | 40 focused DEV; source automation, no native claim |

| MV-S6-SYSTEM-SCENES-005 | validates exact native Window Tone shape and ranges while preserving all numeric zero signs | 40 focused DEV; source automation, no native claim |

| MV-S6-SYSTEM-SCENES-006 | decompiles all access flags with explicit booleans and only the new Encounter helper | 40 focused DEV; source automation, no native claim |

| MV-S6-SYSTEM-SCENES-007 | decompiles Window Tone as four explicit named fields including hidden gray and negative zero | 40 focused DEV; source automation, no native claim |

| MV-S6-SYSTEM-SCENES-008 | requires zero scene helper inputs and exact direct command fields | 40 focused DEV; source automation, no native claim |

| MV-S6-SYSTEM-SCENES-009 | accepts only empty saved scene slots through native and both known raw compilation inputs | 40 focused DEV; source automation, no native claim |

| MV-S6-SYSTEM-SCENES-010 | decompiles full native carriers and evaluates discovered formal source with read-only Check | 40 focused DEV; source Workspace automation, no native claim |
| MV-S6-SYSTEM-SCENES-011 | compiles all generated carriers and really pushes independent formal edits in all three event containers | 40 focused DEV; source Workspace automation, no native claim |
| MV-S6-SYSTEM-SCENES-012 | evaluates every known raw command in three containers and really pushes exact independent saved state | 40 focused DEV; source Workspace automation, no native claim |
| MV-S6-SYSTEM-SCENES-013 | rejects helper local-const extra access fields before projection and preserves complete stale Workspace state | 40 focused DEV; source Workspace automation, no native claim |
| MV-S6-SYSTEM-SCENES-014 | rejects nested spread Tone extras before projection and preserves complete stale Workspace state | 40 focused DEV; source Workspace automation, no native claim |
| MV-S6-SYSTEM-SCENES-015 | rejects runtime scene inputs from a typed local helper alias and preserves complete stale Workspace state | 40 focused DEV; source Workspace automation, no native claim |
| MV-S6-SYSTEM-SCENES-016 | rejects directly constructed nonboolean access state with exact identity and authored slot | 40 focused DEV; source Workspace automation, no native claim |
| MV-S6-SYSTEM-SCENES-017 | rejects directly constructed missing hidden gray with exact map identity and authored Tone field | 40 focused DEV; source Workspace automation, no native claim |
| MV-S6-SYSTEM-SCENES-018 | rejects known raw categorical negative zero with exact authored slot and preserves stale guards | 40 focused DEV; source Workspace automation, no native claim |
| MV-S6-SYSTEM-SCENES-019 | rejects known raw out-of-range Window Tone with exact nested authored slot and preserves stale guards | 40 focused DEV; source Workspace automation, no native claim |
| MV-S6-SYSTEM-SCENES-020 | rejects known raw scene extra slots with exact troop authored path and preserves stale guards | 40 focused DEV; source Workspace automation, no native claim |
| MV-S6-SYSTEM-SCENES-021 | rejects native common access negative zero before any source publication with complete state preserved | 40 focused DEV; source Workspace automation, no native claim |
| MV-S6-SYSTEM-SCENES-022 | rejects native map Window Tone bounds before any source publication with exact nested slot | 40 focused DEV; source Workspace automation, no native claim |
| MV-S6-SYSTEM-SCENES-023 | rejects native troop scene extra slots before any source publication with complete state preserved | 40 focused DEV; source Workspace automation, no native claim |
| MV-S6-SYSTEM-SCENES-024 | rejects direct scene unknown fields under an assertion with exact map authored path | 40 focused DEV; source Workspace automation, no native claim |

Ticket37 focused DEV appends independent screen cases; its R6 game gate remains pending.

| Requirement      | Obligation                                                                                                            | Evidence kind       | Required layer                                                               |
| ---------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------- | ---------------------------------------------------------------------------- |
| MV-S6-SCREEN-001 | reconstructs every Screen mode and signed zero through evaluated formal and known raw source and real 15-carrier Push | synthetic-support   | Public Workspace API, actual source evaluation and complete filesystem state |
| MV-S6-SCREEN-002 | rejects evaluated const spread as-any helper and direct Screen inputs while preserving complete Workspace state       | synthetic-rejection | Public Workspace API, actual source evaluation and complete filesystem state |
| MV-S6-SCREEN-003 | rejects late malformed native Screen slots before source publication without changing existing business state         | synthetic-rejection | Public Workspace API, actual source evaluation and complete filesystem state |
| MV-S6-SCREEN-R6  | Current built normal-Scene screen waits, parallel effects, Weather and Movie runtime acceptance                       | game-observation    | Actual game normal Scenes from current built Workspace output                |

Ticket38 focused DEV uses independent Picture literals and actual Workspace operations. Full/build/built/native remain pending.

| Requirement       | Obligation                                                              | Evidence kind       | Required layer                                                    |
| ----------------- | ----------------------------------------------------------------------- | ------------------- | ----------------------------------------------------------------- |
| MV-S6-PICTURE-001 | Complete Picture public command and native parameter domains            | synthetic-support   | Public command and actual Workspace source/filesystem boundary    |
| MV-S6-PICTURE-002 | Complete Picture matrix through actual Workspace and real Push          | synthetic-support   | Public command and actual Workspace source/filesystem boundary    |
| MV-S6-PICTURE-003 | Actual Picture helper/direct/nested fields reject projection loss       | synthetic-rejection | Public command and actual Workspace source/filesystem boundary    |
| MV-S6-PICTURE-004 | Picture malformed native and known raw refusal preserves complete state | synthetic-rejection | Public command and actual Workspace source/filesystem boundary    |
| MV-S6-PICTURE-005 | Picture signed numeric zero through formal direct and raw real Push     | synthetic-support   | Public command and actual Workspace source/filesystem boundary    |
| MV-S6-PICTURE-006 | Picture current public types reject incomplete and legacy forms         | synthetic-rejection | Public command and actual Workspace source/filesystem boundary    |
| MV-S6-PICTURE-R6  | Picture allocated R6 actual current built game validation pending       | game-observation    | Pending actual current built product and literal native game pair |

| Requirement       | Obligation                                                            | Evidence kind     | Required layer                                         |
| ----------------- | --------------------------------------------------------------------- | ----------------- | ------------------------------------------------------ |
| MV-S6-PICTURE-007 | Picture Map and Battle page carriers preserve complete inactive state | synthetic-support | Public Workspace and complete carrier/state assertions |

| Requirement       | Obligation                                                                | Evidence kind       | Required layer                                                            |
| ----------------- | ------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------- |
| MV-S6-PICTURE-008 | imageAsset refuses extra own inputs before projection into Picture values | synthetic-rejection | Public constructor and actual Workspace complete failure-state assertions |

Ticket39 focused DEV adds independent audio saved literals and public Workspace obligations. E4/R6 remain pending finalization.

| Requirement     | Obligation                                                                                                    | Evidence kind                   | Required layer                                                                     |
| --------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------- | ---------------------------------------------------------------------------------- |
| MV-S6-AUDIO-001 | reconstructs all audio modes and signed zero through evaluated formal and raw source with real15-carrier Push | synthetic-support               | Public helpers and actual Workspace native/source/filesystem boundary              |
| MV-S6-AUDIO-E4  | Ticket39 allocated E4 shipped audio editor resources and current built product comparison                     | reverse-engineering-observation | Pending allocated current built product/native comparison; no DEV acceptance claim |
| MV-S6-AUDIO-R6  | Ticket39 allocated R6 current built normal-Scene audio and system audio pairs                                 | game-observation                | Pending allocated current built product/native comparison; no DEV acceptance claim |

| Requirement     | Obligation                                                                                                         | Evidence kind       | Required layer                                                        |
| --------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------- | --------------------------------------------------------------------- |
| MV-S6-AUDIO-002 | refuses evaluated malformed helper direct and known raw audio sources without changing complete business state     | synthetic-rejection | Public helpers and actual Workspace native/source/filesystem boundary |
| MV-S6-AUDIO-003 | refuses late malformed saved audio records before Decompile publication and preserves every existing business file | synthetic-rejection | Public helpers and actual Workspace native/source/filesystem boundary |

2026-10-20：37–40 的当前功能及受影响自动化交付统一见
[批次交付记录](presentation-batch-delivery.md)。最终产品 `8e51e031` 已合入实际
Conditional 集成，契约 `/15`、374 条要求；开发票按用户执行修订关闭，
48 的最终全量/构建、50/51 的适用逆向/产品比较及 54 的实际 R6 继续待执行。
历史 DEV 记录及原始失败保留，不把旧执行冒称为最终候选全量或游戏通过。

| Requirement               | Obligation                                                                                                                                      | Evidence kind       | Required layer                                                   |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | ---------------------------------------------------------------- |
| MV-S6-ACTOR-RESOURCES-001 | Independent formal, named-reference, known raw and edit/Push Actor resource Workspace behaviors; all 4 independently bounded scenarios required | synthetic-support   | Actual public Workspace API, Discovery/evaluation and filesystem |
| MV-S6-ACTOR-RESOURCES-002 | Original Actor helper inputs fail public Workspace operations without changing business state; all 13 independently bounded scenarios required  | synthetic-rejection | Actual public Workspace API, Discovery/evaluation and filesystem |
| MV-S6-ACTOR-RESOURCES-003 | Direct and known raw Actor inputs share complete Workspace refusal boundaries; all 15 independently bounded scenarios required                  | synthetic-rejection | Actual public Workspace API, Discovery/evaluation and filesystem |
| MV-S6-ACTOR-RESOURCES-004 | Late malformed native Actor records fail Decompile before source publication; all 21 independently bounded scenarios required                   | synthetic-rejection | Actual public Workspace API, Discovery/evaluation and filesystem |

## Actor capability batch 41/42/43 development completion

| Requirement               | Obligation                                                                                                        | Evidence kind       | Required layer                                            |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------- | --------------------------------------------------------- |
| MV-S6-ACTOR-GROWTH-001    | Complete growth and dynamic equipment three-container saved data through actual evaluated Workspace and Push      | synthetic-support   | Actual Workspace API, Discovery/evaluation and filesystem |
| MV-S6-ACTOR-GROWTH-002    | Untyped saved growth flag and invalid final equipment slot refuse Workspace operations without business writes    | synthetic-rejection | Actual Workspace API, Discovery/evaluation and filesystem |
| MV-S6-ACTOR-EQUIPMENT-001 | Late native equipment slot outside final System capacity fails before source publication                          | synthetic-rejection | Actual Workspace API, Discovery/evaluation and filesystem |
| MV-S6-ACTOR-GROWTH-003    | Growth saved flags, literal domains, exact authored forms and fixed references                                    | synthetic-rejection | Existing authoring/compiler/decompiler/validation seams   |
| MV-S6-ACTOR-EQUIPMENT-002 | Final System equipment capacity and candidate warnings preserve runtime identity without fixed-table substitution | synthetic-support   | Existing authoring/compiler/decompiler/validation seams   |

[Current batch report](41-43-actor-capability-batch.md) links the executed source version, independent inputs, actual commands and original logs. Development is complete; final E7 product comparison and R4/R7 actual game execution remain required in51/53/54. Existing41 raw results and all prior failures stay at their original paths. No per-ticket full/build/native or large archive was added under the 2026-10-20 user amendment.

| Requirement         | Case                                                                                               | Scope                                                                    |
| ------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| MV-S6-INVENTORY-001 | Complete native quantity mode and independent flag matrix through actual Workspace publication     | Synthetic focused DEV; native:not-executed                               |
| MV-S6-INVENTORY-002 | Local const helper and direct node unknown fields fail without changing business state             | Synthetic focused DEV; native:not-executed                               |
| MV-S6-INVENTORY-003 | Native invalid saved slots fail before source publication including categorical negative zero      | Synthetic focused DEV; native:not-executed                               |
| MV-S6-INVENTORY-004 | Native fixed references must exist in their real project category before takeover                  | Synthetic focused DEV; native:not-executed                               |
| MV-S6-INVENTORY-005 | Formal helpers, direct nodes, native and recognized raw share complete inventory and party domains | Synthetic focused DEV; native:not-executed                               |
| MV-S6-INVENTORY-006 | Same-identity E4/product comparison and actual R4 execution                                        | Pending; [DEV record](32-inventory-party-dev.md#pending-e4r4-acceptance) |

| Requirement    | Obligation                                                                                                                                                                     | Evidence kind       |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------- |
| MV-S6-SHOP-001 | Exact ordered placeholders, categories, standard/custom prices and purchaseOnly survive Decompile, evaluated source, Check, Compile, Diff and real Push with complete carriers | synthetic-support   |
| MV-S6-SHOP-002 | Evaluated original placeholder extra fields reject Check, Compile, stale Diff and Push while preserving all business state                                                     | synthetic-rejection |
| MV-S6-SHOP-003 | Late malformed Shop in Troop fails before publishing any source with complete business state unchanged                                                                         | synthetic-rejection |

| Requirement    | Obligation                                                                                                                          | Evidence kind       |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| MV-S6-SHOP-004 | Item, weapon and armor native IDs must exist in their actual category before source publication; another category cannot substitute | synthetic-rejection |

## Ticket31 Control Variables

The five stable obligations below retain the original DEV records. Current development closure and affected reruns are recorded in the [Ticket31 finalization report](31-control-variables-finalization.md); `MV-S6-VARIABLES-005` remains unexecuted and is carried to49/51–54. Its complete64-sample Random, self-alias, once-before-loop Script and numeric runtime outcomes remain required. Daily index validity does not mark that native obligation passed.

| Requirement         | Obligation                                                                   | Evidence kind                                                                           | Required layer |
| ------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | -------------- |
| MV-S6-VARIABLES-001 | Independent six-operation/five-mode and all Game Data saved-parameter cases  | Synthetic DEV; [record](31-control-variables-dev.md)                                    |
| MV-S6-VARIABLES-002 | Actual source Discovery, Check, Compile, Diff and complete-carrier real Push | Synthetic DEV E5 support; [record](31-control-variables-dev.md)                         |
| MV-S6-VARIABLES-003 | Native saved-shape and fixed-reference rejection before source publication   | Synthetic DEV rejection; [record](31-control-variables-dev.md)                          |
| MV-S6-VARIABLES-004 | Evaluated untyped source and known-raw Gate Check/Compile isolation          | Synthetic DEV rejection; [record](31-control-variables-dev.md)                          |
| MV-S6-VARIABLES-005 | Final built lifecycle and actual normal-Scene variable runtime observations  | Required E5/R4/R7 pending; [record](31-control-variables-dev.md#remaining-finalization) |

| MV-S6-SHOP-005 | Final E2/E4 and actual R6 Shop Scene consequences | Pending; see [batch report](32-47-inventory-shop-capability-batch.md#pending-native-acceptance) |

## Ticket34 Map Locations

Original DEV records are retained. [Current batch development closure](map-batch-delivery.md) records actual affected and real Workspace checks. `MV-S6-LOCATION-004` remains required and unexecuted for final E4/E6/R5 in50/51/53.

| Requirement        | Obligation                                                                     | Evidence                                                                                      |
| ------------------ | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| MV-S6-LOCATION-001 | Complete Location modes through actual Workspace installation                  | Synthetic source Workspace; native not executed; [record](34-map-locations-dev-checkpoint.md) |
| MV-S6-LOCATION-002 | Reject evaluated untyped Location sources without changing business state      | Synthetic source Workspace; native not executed; [record](34-map-locations-dev-checkpoint.md) |
| MV-S6-LOCATION-003 | Reject native Location coordinates and unsupported exchange padding atomically | Synthetic source Workspace; native not executed; [record](34-map-locations-dev-checkpoint.md) |
| MV-S6-LOCATION-004 | Pending final E4/E6 product comparison and R5 native game acceptance           | Pending E4/E6/R5; not executed; [record](34-map-locations-dev-checkpoint.md)                  |

## Ticket35 Map Characters

Original DEV records are retained. [Current batch development closure](map-batch-delivery.md) records actual affected and real Workspace checks. `MV-S6-CHARACTER-006` remains required and unexecuted for final R1/R4/R6 in52–54.

| Requirement         | Obligation                                                                    | Evidence |
| ------------------- | ----------------------------------------------------------------------------- | -------- |
| MV-S6-CHARACTER-001 | Complete native matrix through real Workspace evaluation and Push             |
| MV-S6-CHARACTER-002 | Evaluated helper and direct-node excess fields refuse before projection       |
| MV-S6-CHARACTER-003 | Invalid native slots and fixed animation references refuse before publication |
| MV-S6-CHARACTER-004 | Current public types require named enums and explicit wait                    |
| MV-S6-CHARACTER-005 | Approved command seams validate complete map-character contract               |
| MV-S6-CHARACTER-006 | Pending actual R1/R4/R6 normal Scene product comparison                       |

## Shared S3 / Loop input supplement

All fifteen constructors and original DEV controls are retained. [Current batch development closure](map-batch-delivery.md) records all15 actual-source constructor/Push cases and the original-switch-target correction. `MV-S3-INPUT-007` remains unexecuted for final candidate/full/build/built in48 and applicable R1/R3 normal-Scene regressions in52.

| Requirement     | Obligation                                                                                       | Evidence          |
| --------------- | ------------------------------------------------------------------------------------------------ | ----------------- | ---------------------------------------------------------------------------------- |
| MV-S3-INPUT-001 | Public command boundaries refuse discarded fields and symbolic negative zero                     | synthetic-support | Approved public command / actual Discovery and evaluated Workspace source boundary |
| MV-S3-INPUT-002 | Actual local, spread, asserted and direct source fields refuse before output                     | synthetic-support | Approved public command / actual Discovery and evaluated Workspace source boundary |
| MV-S3-INPUT-003 | All fifteen reference constructors preserve valid controls and reject discarded source fields    | synthetic-support | Approved public command / actual Discovery and evaluated Workspace source boundary |
| MV-S3-INPUT-004 | Nested direct switch references and ranges refuse excess and ambiguous fields                    | synthetic-support | Approved public command / actual Discovery and evaluated Workspace source boundary |
| MV-S3-INPUT-005 | Native categorical signed zero refuses before publication while positive-zero controls roundtrip | synthetic-support | Approved public command / actual Discovery and evaluated Workspace source boundary |
| MV-S3-INPUT-006 | Evaluated known raw categorical signed zero reports its precise authored slot                    | synthetic-support | Approved public command / actual Discovery and evaluated Workspace source boundary |
| MV-S3-INPUT-007 | Pending final integrated source/build/built and impacted R1/R3 validation                        | synthetic-support | Not executed: final integrated delivery and native normal-Scene game regression    |

Ticket29 adds focused synthetic message delivery checks; its E5/E6 reverse-engineering product comparisons and R6 actual game delivery remain separate and pending.

| Requirement       | Obligation                                                                                                     | Evidence kind       | Required layer                                                   |
| ----------------- | -------------------------------------------------------------------------------------------------------------- | ------------------- | ---------------------------------------------------------------- |
| MV-S6-MESSAGE-001 | Exact messages in complete Map/Common/Troop through discovered source and edited Push                          | synthetic-support   | Actual source/built Workspace API and independent complete state |
| MV-S6-MESSAGE-002 | Authored helper-before-copy, forged known messages and stale Push preserve complete business state             | synthetic-rejection | Actual source/built Workspace API and independent complete state |
| MV-S6-MESSAGE-003 | Invalid native physical records fail before publishing any generated source in every carrier                   | synthetic-rejection | Actual source/built Workspace API and independent complete state |
| MV-S6-MESSAGE-004 | Actual TypeScript source rejects missing required settings and removed positional/numeric forms                | synthetic-rejection | Actual source/built Workspace API and independent complete state |
| MV-S6-MESSAGE-005 | Complete message value domains and exact saved fields through public compiler/decompiler and Staged Data Graph | synthetic-support   | Public authoring/compiler/decompiler/Staged Data Graph           |

| Ticket 30 requirement | Focused development coverage / pending final layer                                                                   |
| --------------------- | -------------------------------------------------------------------------------------------------------------------- |
| MV-S6-TEXT-001        | round trips exact Label Script and Plugin records in all three event containers and all fifteen carriers             |
| MV-S6-TEXT-002        | malformed known Script groups refuse complete Decompile publication                                                  |
| MV-S6-TEXT-003        | closed Gate permits Decompile and complete Plugin lines but rejects nested and raw empty scripts without publication |
| MV-S6-TEXT-004        | source const spread casts and direct untyped commands retain strict text validation                                  |
| MV-S6-TEXT-E5         | Ticket 30 allocated E5 final product/native verification                                                             |
| MV-S6-TEXT-R3         | Ticket 30 allocated R3 final product/native verification                                                             |
| MV-S6-TEXT-R7         | Ticket 30 allocated R7 final product/native verification                                                             |

## Text capability batch29/30/44 development closure

[Current batch report](29-30-44-text-capability-batch.md) records actual source, inputs, commands, logs and retained failures. Development resolves under the user amendment; final E5/E6, R3 and R6/R7 remain with51/52/54.

| Requirement                     | Obligation                                                                                | Actual layer                                                 |
| ------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| MV-S6-ACTOR-PRESENTATION-001    | Actor presentation in complete three-container evaluated Workspace and edited Push        | Actual public source tests and complete temporary filesystem |
| MV-S6-ACTOR-PRESENTATION-002    | Original helper and forged Actor presentation source refuse writes and stale Push         | Actual public source tests and complete temporary filesystem |
| MV-S6-ACTOR-PRESENTATION-003    | Late malformed recognized Actor image refuses all source publication                      | Actual public source tests and complete temporary filesystem |
| MV-S6-ACTOR-PRESENTATION-004    | Public Actor text and image helpers compiler decompiler raw domains and accurate warnings | Actual public source tests and complete temporary filesystem |
| MV-S6-ACTOR-PRESENTATION-NATIVE | Final E5/E6 product comparison and actual R6 Actor text image display remain required     | Pending51/54; not executed                                   |

## Enemy and battle batch 45/46

[Batch delivery](battle-batch-delivery.md) records the actual merged product, focused
Windows/Node 22 verification and original logs. Scalar boundaries use public unit
cases; actual Discovery/evaluation, full business state and genuine Push use three
small Workspace groups. Final native requirements remain pending.

| Requirement | Obligation | Evidence kind | Required layer |
| --- | --- | --- | --- |
| MV-S6-BATTLE-001 | Complete Enemy/Force/Battle slots and nested bodies in formal/raw source and all three carriers, changed Diff and real 15-file Push | synthetic-support | Actual public Workspace API, Discovery/evaluation and filesystem |
| MV-S6-BATTLE-002 | Evaluated helper/local/direct/raw/reference/nested Gate refusals preserve complete business state | synthetic-rejection | Actual public Workspace API, Discovery/evaluation and filesystem |
| MV-S6-BATTLE-003 | Late known-native rejection publishes no partial Decompiled Source | synthetic-rejection | Actual public Workspace API and complete business state |
| MV-S6-BATTLE-004 | Final E2/E4 editor code-path facts and independent final product comparison | Required pending | Final49/50 REA/product comparison |
| MV-S6-BATTLE-005 | Full original R2, R4 forced/selector contexts and R6 Enemy Animation | Required pending | Final52/53/54 actual MV1.6.1/NW.js game pairs |

## Final editor E1–E7

[Final comparison](49-51-final-editor-comparison.md) binds ticket48 actual built output to independent saved arrays and same-identity editor facts. Qt timing limits remain explicit; actual R1–R7 game results remain separate.

| Requirement | Obligation | Evidence kind | Actual layer |
| --- | --- | --- | --- |
| MV-S7-E1 | Final complete containers and saved page state | Synthetic support plus reused REA observations | Final built Workspace comparison and identified editor code paths |
| MV-S7-E2 | Final structured child bodies, Battle flags and Shop goods | Synthetic support plus reused REA observations | Final built Workspace comparison and identified editor code paths |
| MV-S7-E3 | Final Page/205 route shells and exact505 mirrors | Synthetic support plus reused REA observations | Final built Workspace comparison and identified editor code paths |
| MV-S7-E4 | Final saved slots and defaults after parameter-mode edits | Synthetic support plus reused REA observations | Final built Workspace comparison and identified editor code paths |
| MV-S7-E5 | Final physical records and complete single-slot strings | Synthetic support plus reused REA observations | Final built Workspace comparison and identified editor code paths |
| MV-S7-E6 | Final independent image indices and shrunk-map saved values | Synthetic support plus reused REA observations | Final built Workspace comparison and identified editor code paths |
| MV-S7-E7 | Final EXP bound, flags and all three refusal paths | Synthetic support plus reused REA observations | Final built Workspace comparison and identified editor code paths |

## Final editor domain supplement

[Supplement report](49-51-editor-supplement.md) and [independent saved inputs / portion receipts](49-51-editor-supplement-cases.json) close the Audio E4 evidence gap and the Inventory E4 / Location E4,E6 portions on the fixed contract22 build. Only `MV-S6-AUDIO-E4` gains a passing aggregate result here. `MV-S6-INVENTORY-006` and `MV-S6-LOCATION-004` still await final53 actual R4/R5 game receipts. Prior results and the original fixture failure remain preserved.

## Final53 R4–R5 actual game closure

[Final execution and retained failures](53-final-game-runtime-selectors-and-locations.md)
records twelve final passing literal/product pairs and24 actual native processes
on candidate `2dc639015f908de6fd524e50236e5422b5f8e990`, contract `mv-1.6.1/22`.
All original eleven complete controls and the required Script-context supplement
ran through the real final built Workspace lifecycle and fresh MV1.6.1/NW.js
games. Four failed pair attempts remain preserved. Three immutable passed result
records close the two rows below and `MV-S5-COMMON-R4-CONTEXT`.

| Requirement       | Obligation                                                                                         | Actual layer           |
| ----------------- | -------------------------------------------------------------------------------------------------- | ---------------------- |
| MV-S7-GAME-R4-053 | Complete dynamic Common, Variables, Actor0/state/equipment/Inventory and Force Action actual pairs | Passed actual game pairs |
| MV-S7-GAME-R5-053 | Actual location, small-map query differences and vehicle/follower consequences                     | Passed actual game pairs |

The report's final receipt records only53's assigned native portions for the
mixed VARIABLES-005, LOCATION-004, INVENTORY-006, CHARACTER-006 and BATTLE-005
requirements. Their other E/R portions remain with51/52/54 and final55's
aggregation; the earlier development/pending statements above retain their
historical meaning.

## Final54 assigned R6–R7 actual game closure

[Final54 execution and retained strict results](54-final-game-r6-r7.md) records
27 final effective literal/product pairs and54 actual native processes on fixed
candidate `2dc639015f908de6fd524e50236e5422b5f8e990`, contract `mv-1.6.1/22`.
26 pairs strictly pass; Movie passes its required native behavior with the exact
retained Chromium diagnostic while its original strict result stays failed.
The [safe manifest](54-final-game-manifest.json) binds original/effective pairs,
actual loaded-versus-on-disk harness identities and the frozen root receipt.

| Requirement | Obligation | Actual layer |
| --- | --- | --- |
| MV-S7-GAME-R6-054 | Complete assigned Face/message/choices, Picture/audio/None/waits, Map/Battle appearance, System scenes, Actor/Enemy/Character presentation, actual Movie and movement None | Passed required actual game behavior; Movie strict failure and exact diagnostic retained |
| MV-S7-GAME-R7-054 | Assigned controlled single-slot/multiline/empty Script, complete Plugin Line, EXP and both native M45 route entrances | Both actual game pairs strictly passed |

Two immutable new results close only these assigned54 requirements. The manifest
records exact portions of older family IDs for55's aggregation; earlier pending
development text remains historical. In particular54's four Battle-background
cases do not replace the original eight-case obligation or separate missing
Tileset Loading Error control. No blanket old-family pass is added here.

## Final actual game ticket52

[Actual final52 execution](52-final-games.md) records33 native pairs and four separate original invalid-input refusals.

| Requirement | Actual obligation |
| --- | --- |
| MV-S7-R1-TRIGGERS-052 | Final five Map triggers, page priority and Common triggers/call |
| MV-S7-R1-ROUTES-052 | Final inactive/autonomous/forced Movement Route and waiting |
| MV-S7-R2-SCHEDULING-052 | Full17-page three-turn original R2 scheduling with legal amount variant |
| MV-S7-R2-RESULTS-052 | Native victory, party Escape input and allowed-defeat callbacks |
| MV-S7-R2-CONTEXTS-052 | Battle/Name skip, residual Troop objects and Abort phase consequences |
| MV-S7-R3-CHOICES-052 | Actual Choices defaults, cancellation, out-of-range saved state and negative zero |
| MV-S7-R3-CONTROL-052 | Exact/duplicate/missing Labels, Loop/Break/Exit and stagnation |
| MV-S7-R3-CONDITIONAL-052 | Complete Conditional modes in held/released/direct and three boarded vehicles |
| MV-S7-ORIGINAL-AMOUNT-REFUSALS-052 | Original four invalid Enemy HP amount inputs refuse before game launch |
