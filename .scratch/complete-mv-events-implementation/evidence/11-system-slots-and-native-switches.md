# Ticket 11: System slots and native switches

This slice owns E121/E123 for the currently supported Map Event and Common Event
carriers. It establishes neither complete command-family acceptance nor final
integrated R1–R7 acceptance. The synthetic fixture is original test data, and is
independent of the compiler. It contains complete saved records rather than a
compiler-produced expected value.

## Automated acceptance

- `MV-S3-SLOTS-001` reconstructs the original fixture in a real Windows Workspace,
  clones and decompiles it, discovers and evaluates the emitted source, runs Check
  and Compile, and compares complete parsed System/CommonEvents data. It then
  extends names to switch5/variable4, Pushes, removes all names, adds a real source
  referencing unnamed variable4 and actual empty-name item1, compiles and Pushes
  again. Both refreshed Snapshots match the Project; final Diff is clean and final
  capacities remain5/4. External Items data stays intact.
- `MV-S3-SLOTS-002` distinguishes actual empty-name database IDs, unnamed System
  slots, missing IDs, Snapshot-only names and ambiguous DSL names. Names resolve
  only from DSL declarations, and references do not expand capacity.
- `MV-S3-SWITCH-001` compares formal and recognized raw E121/E123 output against the
  complete independent native list. Invalid count, native operation, letter,
  nonpositive/fractional ID and reversed range inputs fail validation and
  decompilation. Formal values are mandatory Booleans. The Common Event itself
  receives no speculative caller-context warning.
- `MV-S3-SLOTS-003` rejects an out-of-capacity native range before new source is
  published. Existing source, Discovery directory contents, Project data, Snapshot
  and manifest remain unchanged.

Per-case execution records retain exact source fingerprints and observations.
Run `pnpm --filter rpgmaker-event-dsl exec vitest run test/system-slots.test.ts`
on Windows/Node22. The ordinary suite requires no installed editor or native game.

## Native game execution

`MV-R1-SWITCH-011` was executed on2026-10-19 by the Codex ticket11 implementer
(`/root/ticket_02`). Four separate native game processes booted fresh copies of an
ordinary self-authored map and first-party NewData runtime/assets stored outside
this repository. Each reached `Scene_Map` after `DataManager.setupNewGame()`.

The observed engine reports MV1.6.1, NW.js0.29.0, Chromium65.0.3325.146 and embedded
Node9.7.1. The launch host is
`references/RPGMV/nwjs-win-test/game.exe`; host SHA-256 is
`78beb07fa8f2b905d468a40d64d0d5588b4cfa42d7822d5e16878245657da3aa`,
`nw.dll` SHA-256 is
`805e7c76008be83acf5da3401c638ff67a0fa897361996a5ef1788c5cc759ef2`,
and `node.dll` SHA-256 is
`547975eb298eac7a4bd4a452ef3d451d25a85c5fc7c01dd74dc2705cae80a85c`.
The game is launched hidden through PowerShell `Start-Process -WindowStyle Hidden`.
No editor UI capture or screenshot is claimed.

The literal control list comes from the independent system-slots fixture. The
compiled list was copied directly from the successful real Workspace's
`generated-project-data/CommonEvents.json`, after actual Discovery/evaluation and
Compile. Its exact original bytes are [11-switch-compiled.json](11-switch-compiled.json);
[11-switch-provenance.json](11-switch-provenance.json) records the preserved
Workspace path, input hash and four external runtime project paths. Both sets of
native projects use identical fresh System capacity and Map data. Neither expected
states nor control commands are produced by the compiler.

The original [observer](11-switch-observer.js) only schedules native interpreter
methods and reads engine state; it replaces no engine method. For direct execution,
it calls `Game_Interpreter.executeCommand()` once per original record with
eventId1, observes the state immediately, and lets native `update()` terminate the
list. For Common Event execution, a native117 calls event1 through the engine's
child interpreter with the same Map Event identity and runs to completion.

Independent [expected states](11-switch-expected.json) assert:

1. All four observed switch slots and all A–D self switches start false.
2. E121 turns1..3 on, then turns2 off, retaining1/3 on and4 off.
3. All A–D ON/OFF commands each produce their respective intermediate state.
4. The direct list and Common call finish with switches `[true,false,true,false]`,
   self switches `[false,false,false,false]`, and a terminated interpreter.

All four raw process results report `passed:true`:

| Input | Execution | Raw observation |
| --- | --- | --- |
| Independent literal | Direct,11 per-command snapshots | [literal direct](11-literal-control-direct.json) |
| Compiled Workspace | Direct,11 per-command snapshots | [compiled direct](11-compiled-workspace-direct.json) |
| Independent literal | Native117 Common call | [literal Common](11-literal-control-common-call.json) |
| Compiled Workspace | Native117 Common call | [compiled Common](11-compiled-workspace-common-call.json) |

The passing native run is a bounded ticket11 R1 slice. Troop Event support and its
known eventId0 E123 context warning belong to tickets25/48; final native regression
still belongs to tickets52–54. Common Events may inherit a Map caller, so unknown
callers remain valid. No unused battle hook is introduced for a carrier the product
cannot yet represent.

## Limits and follow-up

The acceptance record preserves runtime version details and hashed original
observer/input/expected/output artifacts. First-party runtime files, map asset data
and binaries remain local and are not distributed. The observation schedule does
not claim interactive keyboard, screenshot, audio or editor parameter-dialog
acceptance. Final integrated candidate runs must append new evidence after relevant
changes; these records retain their exact source fingerprint.

## Final candidate verification

After adding contextual diagnostics and merging integration tip 7d2ea0b, the current
Workspace output was regenerated and all four native boots ran again.
[Final provenance](11-switch-final-provenance.json) identifies the preserved Workspace
at revision2861e76; the [final compiled bytes](11-switch-final-compiled.json) retain
SHA-256 2e8e8191836616974c0a38e0df17b8012b67a3ebee82dd6c8090dfa0e5b6c8a1.
Initial raw observations remain intact. Final raw observations are
[literal direct](11-final-literal-control-direct.json),
[compiled direct](11-final-compiled-workspace-direct.json),
[literal Common call](11-final-literal-control-common-call.json), and
[compiled Common call](11-final-compiled-workspace-common-call.json); all passed.
The original [local recorder](11-record-native-result.mjs) checks complete independent
input/state equality and control-versus-compiled equality, then records source and
artifact hashes plus observed native/tool versions through the acceptance schema.

Windows/Node22.23.0 verification after merge passed pnpm check
(16files/122tests, including typecheck/lint/format), pnpm build and the built CLI
Windows baseline (2files/4tests). Owned diagnostics identify validation/Decompile
stage, Common/Map identity, nested DSL/native parameter path, stable E121/E123 code
and expected/actual values. No public diagnostic JSON API is introduced.
