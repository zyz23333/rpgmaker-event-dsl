# Ticket 13 — Loop and Child Command Body acceptance

## Scope and independent expectations

This ticket owns E112 Loop, E113 Break Loop and E115 Exit Event Processing. The accepted API is `loop({ body: { commands, endMarker? } })`, `breakLoop()` and `exitEventProcessing()`. The body marker defaults to present; an empty body cannot use absent. ADR 0015 describes final saved state after formal and raw records are combined. No old helper alias is exported.

The literal [Loop fixture](../../../packages/rpgmaker-event-dsl/test/fixtures/mv-evidence/loop-cases.json) was written independently of the compiler. It contains complete Common Event envelopes and exact code/indent/parameter arrays, plus separate runtime switch expectations. The accepted parameter contract is in [core.md](../../complete-mv-events/research/command-parameters/core.md). These inputs are synthetic support, not editor captures. Ticket 03 supplies the editor reverse-engineering provenance; this ticket does not relabel it as UI execution.

## Product boundary validation

`MV-S3-LOOP-013` uses real Workspace Clone → Decompile → actual Definition Source Discovery/typecheck/evaluation → Check → Compile → Diff → Push. All five complete Common Event objects equal the independent fixture, including nested marker presence/absence and the complete event terminator. The source uses formal helpers, including Exit Event Processing, without raw fallback.

`MV-S3-FLOW-REJECT-013` replaces native E115 with a record lacking its required parameter array. Decompile reports `MV-COMMAND-ENVELOPE`, `stage: decompile`, `identity: commonEvent:5`, `list[2]`; it publishes no discoverable source and leaves Project Root, Snapshot and manifest bytes unchanged. Native readers preserve all records before structural validation and do not manufacture a missing indent or parameter array.

`MV-S3-LOOP-BODY-013` covers required body/commands, empty commands, optional undefined as omission, unknown fields, marker enum, undefined/sparse/null children and forbidden empty/absent. `MV-S3-LOOP-RAW-013` checks combined final state: raw owning tail markers cannot duplicate present or contradict absent, while nested raw Loop markers and a handwritten complete event terminator remain legal.

`MV-S3-LOOP-STRUCTURE-013` covers orphan/missing 413, exact empty parameters for known flow/structural records, wrong child indent, a middle marker and missing empty-body marker. Additional cases cover known raw missing/non-array parameters, null/negative indent, parameterless formal extra fields, and a nested Loop inside a Conditional. Expected output and locations are literal assertions in the command compile/decompile and Staged Data Graph seams accepted under spec T1.

`MV-S3-LOOP-RECURSION-013` verifies recursive Script Command Gate and contextual switch reference errors inside Loop, preserving ticket 11 hooks. Nested compile diagnostics retain full DSL paths through other parents. `MV-S3-BREAK-WARNING-013` retains outside-Loop formal/raw commands and reports a warning at each native list position; an inside-Loop Break is not warned.

Complete Workspace native lists and compiler output use the shared strict structure scanner. The internal `renderDecompiledCommandList` family seam retains its command-fragment contract for established partial-family tests. Fragments still reject malformed Loop boundaries and exact-parameter violations for this ticket's known codes. Full Workspace input never uses fragment mode. The scanner recognizes Conditional/Choices/Battle bodies and continuation ownership; their API migrations and full marker/parameter contracts remain tickets 27/28/46.

## Actual MV execution

`MV-R3-LOOP-013` ran independent literal and actual compiled saved lists in separate native game processes. Each scenario calls the unchanged engine's `DataManager.setupNewGame()` and `$gameMap.setup(1)` before execution, verifies all observed switches start false, then uses the actual native `Game_Interpreter` on the saved list. The ES5 observer schedules execution, reads state and exits; it neither replaces engine methods nor reimplements command behavior.

| Scenario | Independent expected switches | Actual literal / compiled | Interpreter |
| --- | --- | --- | --- |
| Present-marker Loop → Break → Exit | 1=true, 2=false | equal / equal | stopped / stopped |
| Inner present / outer absent, nested Break → Exit | 3=true, 4=false | equal / equal | stopped / stopped |
| Outside-Loop Break → later commands | 5=false, 6=false | equal / equal | stopped / stopped |
| Caller invokes Common Event whose Exit ends only child | 7=true, 8=false, 9=true, 10=false | equal / equal | stopped / stopped |

Observed runtime: RPG Maker MV 1.6.1, NW.js 0.29.0, Chromium 65.0.3325.146, embedded Node 9.7.1, V8 6.5.254.31. The Node 22 harness launches `game.exe` with `windowsHide: true`; the game window is hidden. Both processes exited zero with empty stdout/stderr. This verifies stateful flow behavior; no visual or audio observation is claimed.

Final replay directory: `C:/Users/Shuen/.codex/tmp/mv-ticket13-native-20261019-02`. Original observer, own fixture inputs, native output, host/input identities and the Vitest JSON report are retained as `13-*` evidence artifacts. No first-party engine code, native binary, default project data or assets are committed. [The original runner](13-loop-native-runner.cjs) accepts repository, native template, native host, generated CommonEvents path and a fresh output directory. The recorder hashes source, fixture and native artifacts and refuses to overwrite immutable results.

Earlier independent control history is retained outside Git: `mv-loop-native-control-20261019-01` failed because its independent expectation incorrectly treated outside-Loop Break as a no-op. `...-02` corrected that expectation to native's search-and-skip behavior and passed. The same expected outcome is independently encoded in this ticket's fixture. Neither failure was suppressed or described as a product success. Ticket13's first two-input acceptance run in `mv-ticket13-native-20261019-01` also passed; the final `...-02` run uses the checked-in reproducible runner and final formatted fixture.

## Verification and remaining graph obligations

Windows / Node 22 product checks include typecheck, lint, formatter, all package tests and build. The command and Workspace tests use existing accepted seams and literal expected native values. The immutable records contain actual runner reports and native observations, plus revision and file fingerprints, rather than a status inferred from this index.

Final recorded checks on this branch: Node 22.23.0, `pnpm check` passed all 156 tests in 18 files; `pnpm build` passed. The own Loop/Workspace Vitest JSON report records 34 passing cases. The final native inputs are unchanged by the subsequent additional rejection of extra authored fields on Break/Exit: the final Workspace test recompiles and compares every saved list to the exact native-tested fixture. Native runtime state comparisons therefore retain their input identity; final integrated-candidate game regressions remain separate.

This closes only ticket 13's assigned Loop/Break/Exit slice. It does not close final E1–E7 comparison or R1–R7 regressions on the integrated candidate, migrate other parent APIs, or declare all MV commands supported. Those remain in the task graph.
