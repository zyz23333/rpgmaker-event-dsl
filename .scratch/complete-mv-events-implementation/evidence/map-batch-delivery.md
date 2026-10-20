# Map34/35 and S3/Loop input batch — development completion

The batch closes34/35 development and the11/13 supplementary input corrections under the accepted 2026-10-20 execution policy. Original DEV implementations and unaffected passing results are reused. Final full automation/build/built checks remain in48, REA comparisons in49–51, actual game execution in52–54 and completion audit in55. This report claims source automation, without new editor UI or game execution.

## Source and reconciliation

Recorded M worktree `mv-map-batch`, branch `codex/mv-map-batch`, fast-forwarded to actual integration `2ce2ba3b4a364dc3770f953323707d843a4f53c7` before development. It merges34 DEV `7033c4606cc8f7298189974cf7ad8046fb95d450`,35 DEV `b8ce66548a10bcfcd54a7f45a306b22378c9929d` and S3/Loop supplement `717171be17b3b8a2e7f745fa1f39af5007709478`. The functional product is `99128dda4c8a538ae910cac8119fdcc7f06bf82b`; `6352d5f5cb9c2800b0e2baf46879fbf4bd688e5a` only removes two unused type imports. Later documentation does not change product behavior.

Compile Contract Version advances once from incoming `mv-1.6.1/17` to `mv-1.6.1/18`. The405-row index retains incoming metadata and all388 objects in order, then appends the unchanged original four Location, six Character and seven S3-input obligations. The three pending identities below remain unexecuted. Existing result/history files remain in place; no historical archive audit or source freeze was repeated.

Creation receipt: `M:/Shuen/Codex/mv-events-implementation-20261020/worktree-registry/mv-map-batch-40b6c451-1e49-4799-9881-4c755fda6b12/creation-receipt.json`, SHA-256 `199b50eeecc36ecb49ec4748532440f678e4b3ce170b29e0a981c579b158a2f9`. Preparation, reconciliation scripts and all current run receipts/logs remain under `M:/Shuen/Codex/mv-events-implementation-20261020/map-batch-final/`.

## Delivered behavior

E201/E202/E203/E285 support every accepted mode, event-only Event Location selectors, named direction/fade/query values and fixed Transfer retain/black defaults. Direct coordinates retain the nonnegative32-bit domain and reject numeric negative zero before rewriting. Fixed missing maps fail; bounds and containing-map consequences warn without changing saved values. Unknown Common runtime maps do not receive speculative warnings. Terrain/region zero, tile-array alias and exact event-position matching remain distinct consequences.

E204/E206/E211/E212/E213/E214/E216/E217 enforce exact slots, named scroll directions, distance0..100, speed1..6, explicit flags and animation/balloon waits, all fifteen balloon icons and fixed Animation references. Formal, known raw and native Decompile paths share accepted domains and located diagnostics. Map/Common/Troop context inspections retain selectors and describe unavailable-target, battle and wait consequences without expanding the accepted subset.

S3/Loop rejects E121/E123 categorical negative zero, unknown helper/direct own fields and malformed nested references/ranges/endpoints before projection. All fifteen public Project Data Reference constructors use the uniform original-object shape guard, rejecting discarded fields and id/name ambiguity. Constructor id0, id-0 and empty names remain available for context-specific validation; no global numeric restriction was added. The domain reference module remains independent of command validation/authoring.

Reconciliation preserves Variables/Conditional/Timer/Actor/presentation context hooks, the audio family relocation and precise raw native parameter suffix mapping. README, example and Event Authoring Skill describe the current API without obsolete aliases.

## Additional original-target correction

The switch discriminator had the same earliest-read defect independently repaired for Variables31: an own `kind` getter could replace itself with data before original-object validation; an inherited getter was read before rejection. The switch helper now validates the complete original plain, enumerable own-data object before reading `kind`, then applies existing mode-specific checks. This changes no domain contract.

Eighteen independent public cases cover Switch Reference/Reference Range, own self-replacing accessors, inherited accessors and non-enumerable discriminators through helper, direct graph validation and direct compilation. Every invocation creates its own original target and requires rejection and zero getter reads. `switch-target-red-v1` records12 failures/6 passes; `switch-target-green-v1` passes all18. The five existing cases were unselected for these targeted runs and pass in the broader runs below. Original red logs are retained.

## Actual affected verification

Windows, Node22.23.0, pnpm10.33.0, Vitest4.1.9; existing deadlines/two workers. Each run below retains its exact command, starting/ending Git state, environment, stdout/stderr and completion receipt in the M output directory above. TEMP/TMP, retained Workspace sandboxes and machine results are also on M.

| Run directory | Actual input | Result |
| --- | --- | --- |
| `initial-owned-shared-v1` | Clean `063f4095` |11files/135tests passed: Location/Character, original control inputs, Loop, decompiler, events, DSL, staged graph, command boundary, System slots and architecture |
| `initial-typecheck-v1` | Clean `063f4095` |Package typecheck passed |
| `switch-target-red-v1`, `switch-target-green-v1` | `063f4095` plus recorded test/fix subsequently committed in `99128dda` |12-failure red followed by18-case green |
| `final-affected-unit-v1` | Clean `99128dda` |5files/67tests passed: control inputs including18 new cases, System slots, Loop, snapshot context and current405-row evidence index |
| `final-workspace-selection-v1` | Clean `99128dda` |3files/43tests passed;47 unselected historical cases retained |
| `final-typecheck-v1`, `final-scoped-format-v1` | Clean `99128dda` |Package typecheck and50-file source/test/fixture/doc format passed |
| `final-scoped-lint-v1` | Clean `99128dda` |Exit0 with two unused Direction type-import warnings; original log retained |
| `cleanup-typecheck-v1`, `cleanup-scoped-lint-v1`, `cleanup-scoped-format-v1` | Clean `6352d5f5` |Package typecheck, all scoped TypeScript lint without warnings and two changed files' format passed |

The43-case Workspace selection runs all three Location tests; the complete Character positive matrix, six native refusals, public type refusals, raw/undefined formal sources and representative helper/direct excess controls; all fifteen reference-constructor actual-source positive Push and unknown/id-name refusals; native/raw signed-zero and positive Switch/Loop controls; representative source extras and nested-shape refusals. Expected literal records remain independent of the compiler. Positive workflows compare all fifteen complete Project/Snapshot carriers and owned generated output. Refusals compare source, Discovery, Project Root, Snapshot, generated output, config/descriptor and manifest. All43 standard records remain in `final-workspace-selection-v1/results/` and declare native not executed.

Original broader DEV reports remain unchanged: [Location](34-map-locations-dev-checkpoint.md), [Character](35-map-characters-dev.md), [S3/Loop inputs](control-input-fix-dev.md). Their original index timeouts, harness/premise, registration/type/diagnostic failures and failed raw records remain retained. The current normal index passes at the unchanged deadline; original timeout causes were not diagnosed here. `reconcile35-v1.cjs` retains its missing-heading failure; v2 handles the actual historical headings. This reconciliation attempt is separate from product test results.

## Final acceptance still required

- `MV-S6-LOCATION-004`:50 owns E4 Transfer defaults and51 owns E6 old-coordinate/image-map comparisons.53 owns actual R5 Transfer/Vehicle/Event Location, small-map coordinates and distinct terrain/region/tileId/eventId consequences.
- `MV-S6-CHARACTER-006`:52–54 own actual R1/R4/R6. Observe scrolling start/wait order and battle skipping, boarding/disembark terrain outcomes, rendered animations/balloons and waits, missing selectors, Common callers, erase-current-event behavior, follower refresh and gather wait in the normal Scene scheduler.
- `MV-S3-INPUT-007`:48 owns final integrated full/build/built checks;52 owns applicable R1/R3 game regressions. Preserve accepted Switch/SelfSwitch/Loop behavior and supplementary original-object refusal obligations.

These three identities retain zero executed results.49–51 compares final public-product output with same-identity REA facts;52–54 still requires actual games. Source tests and earlier literal preparations do not substitute for those observations.55 audits API/docs and completion evidence. Original inputs and domain notes remain linked from `M:/Shuen/Codex/mv-events-implementation-20261020/remaining-batch-handoffs.md`; old per-ticket full/build/native, source-freeze, physical-tree and staged root-release procedures are superseded by the accepted execution policy.
