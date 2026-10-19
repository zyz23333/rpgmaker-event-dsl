# Ticket 14 — shared Movement Route acceptance

## Scope and contract

Ticket 14 owns E205 and the shared route envelope. `MovementRoute` is exported with required `commands`, optional boolean `repeat/skippable/wait`, and optional bounded `terminator`. Its defaults remain true/false/false and M0 empty parameters. E205's Character Runtime Selector stays outside that model. Every nonterminal instruction shares `savedShape.indent = absent/null/zero`, default absent; native null and numeric zero decompile explicitly. Parameterless instructions omit `parameters`. Parameterized instructions retain their semantic arrays. The sole final M0 omits indent and either omits parameters or contains an empty array; it never receives a 505.

Compiler, decompiler and native-route validation share these rules. E205 produces exactly one same-indent E505 per nonterminal, in order, carrying the complete original movement object. Validation compares key presence, arrays and nested values before any normalization and rejects inconsistent copies. Unsupported movement codes have no raw escape hatch. Recognized raw E205/E505 receive envelope, mirror, switch-reference and Script Command Gate checks. Invalid raw arrays fail before the compiler copies their elements.

The reusable codec is `commands/movement/{compile,decompile,validation,types}.ts`: `compileMovementRoute`, `renderMovementRoute`, `assertMovementRoute`, `assertNativeMovementRoute` and `validateNativeMovementRouteInputs`. The blank Map Event Page compiles its default through the same codec, and native page reading validates saved routes even when moveType is noncustom. Full authorable Autonomous Movement belongs to 18/24; all 45 instruction parameter domains, None variants and accepted parameter API renames remain the responsibility of 33. These are explicit ownership boundaries, not a claim that S5/S6 or the complete spec is finished.

## Product verification

Original literal fixture: `packages/rpgmaker-event-dsl/test/fixtures/mv-evidence/movement-route-cases.json`. No expected data was obtained from the compiler. It independently supplies both E205 list records and each E505 mirror, two M0 shapes, missing/null/zero indentation, parameterless and parameterized instructions, nested audio, a complete CRLF-bearing M45 string, and six Common Events. Separate expected native runtime states live beside those literals.

The approved T1 seams were command compile/decompile, the Staged Data Graph, actual Workspace API and separate CLI processes. The two new product test files execute 50 cases. They cover exact defaults and all eight flag combinations, each finite indent on both parameter families, optional undefined and empty saved descriptors, all M0 rejection shapes, unsupported native/authored fields, whole-object mirror differences, known raw checks, real Discovery/typecheck/evaluation and complete failure-state preservation. Existing 45-code compile/decompile smoke cases were updated to the shared envelope and parent-owned continuations; this does not sign off 33's complete parameter dimensions.

Workspace roundtrip performs Clone → Decompile → actual Discovery/load → Check → Compile → Diff → Push and compares the complete parsed CommonEvents fixture. Changing a generated event name then restoring it proves actual evaluation. Check leaves the manifest unchanged. A native mirror conflict fails at commonEvent:1/list[2] before any source is published. Invalid authored shape and disabled route Script fail both Check and Compile while all source text, Project Root data, complete Snapshot, Generated Project Data, manifest and Discovery remain unchanged.

Windows Node 22.23.0 verification:

- Typecheck, lint and format checks pass.
- Full joint suite passes with two workers: 215 tests in 22 files after merging ticket16. The original 50 Movement Route cases remain included. Default full concurrency previously exceeded the pre-existing S0 Workspace test's 10-second timeout; the bounded-worker rerun retained all assertions. The new multi-operation Workspace cases have a 30-second timeout because they perform repeated real TypeScript checks.
- `pnpm build` passes.
- Built Windows CLI verification passes eight tests across three files, including ticket16 locking; all five Movement Route Workspace tests also pass against the built package. Their separate actual CLI processes run Decompile, Check and Compile.
- A source-graph cycle exposed by the architecture test was corrected by moving `CommandStructureError` to the shared leaf `validation/command-errors.ts` and native movement types to their own leaf. The original error export remains available from command-structure. Both architecture checks pass.

The final product verification ran at `dad1fd4` with integration `b2f2acd` merged. The later `3e05dc3` merge adds ticket10 evidence only; Git comparison confirms the complete product/test/build/dependency paths are unchanged. The final index has 125 distinct requirements from both branches. The retained reports are [full joint suite](14-vitest-report.json), [built Windows CLI and locking](14-built-baseline-report.json), and [built Movement Route Workspace](14-built-workspace-report.json). The native fixture and executed CommonEvents remain byte-identical to the independently expected input across these product checks.

The recorder `14-record-acceptance.mjs` validates actual Vitest reports, native fixture hashes, exact executed inputs and all independently expected native states before producing requirement results. Eight requirements and immutable result records link these executions. No not-executed or failed run is promoted to passed.

## Actual MV execution

Documentary native requirement: `MV-R1-ROUTE-014`.

Actual engine: MV 1.6.1, NW.js 0.29.0, embedded Node 9.7.1, Chromium 65.0.3325.146, V8 6.5.254.31. Tooling launcher: Windows Node 22.23.0. Host `references/RPGMV/nwjs-win-test/game.exe` SHA-256 `78beb07fa8f2b905d468a40d64d0d5588b4cfa42d7822d5e16878245657da3aa`. The native scripts are unchanged; their hashes are retained in both run identities.

`14-movement-native-runner.cjs` launches two fresh hidden native game processes, one with independent literal input and one with actual Workspace Compile output. Each case resets through native setupNewGame/map/player operations, schedules the real map interpreter and permits normal Scene_Map frame updates. An original ES5 observer only schedules, reads state and quits; it replaces no engine method. The 505 input is present exactly as saved, even though execution ignores those continuation payloads. First-party engine files/assets remain outside Git; tracked artifacts contain only original harness/data, state observations and identities. Audio is muted and there is no audible or image assertion.

Each case is observed after 90 actual frames. All five pass in each process:

| Case | Independently expected observation |
| --- | --- |
| Envelope matrix, wait=true | Absent/null/zero records, both parameter families, audio and CRLF M45 execute; switches 1/2/3 true, direction 6, position 0/0, interpreter stopped and forcing false. |
| Nonblocking, wait=false | Immediately after interpreter update: switch 3 true, switch 1 false, interpreter stopped while forcing remains true. At 90 frames switch 1 true and forcing false. |
| repeat=true and wait=true | Switch 1 true but switch 3 false; interpreter and forcing remain active. Flags are preserved without rewriting the intended wait. |
| Blocked move-left, skippable=false | At the left boundary, position remains 0/0 and direction 4; both switches 1/3 false and interpreter/forcing remain active. |
| Blocked move-left, skippable=true | The failed move is skipped; direction becomes 6, switches 1/3 true, position remains 0/0, interpreter stops and forcing ends. |

Raw run directories: `C:/Users/Shuen/.codex/tmp/mv-ticket14-native-20261019-01` and `...-02`. Both passed; 02 is the final record after fixture formatting, with exact current fixture hash. The actual compiled input is retained at `.../mv-ticket14-workspaces/movement-roundtrip-T67mBd/最小 Workspace with spaces/.rpgmaker-event-dsl/generated-project-data/CommonEvents.json`. Source and built Workspace reports were rerun after the final product checks. Both native processes exit 0 normally; stdout/stderr and complete metadata are retained in `14-{literal,compiled}-*` artifacts.

These are actual game observations for the assigned R1/R6 route slice and product comparison for the E3 saved-shape representatives. They do not establish a Qt editor UI capture. The exact extracted editor functions and accepted finite zero amendment remain the separately classified evidence in [04](04-movement-records-and-mirrors-reverse.md). Final E1–E7 product evidence and R1–R7 integrated regressions remain 49–54.

## Reproduction

Use Windows Node22 and the existing dependencies. Run the two Movement Route test files with Vitest, retaining its JSON report; build, set `MV_CLI_ENTRY=built` and run the Workspace test file again with a second report. Keep a successful Workspace through `MV_KEEP_WINDOWS_SANDBOXES=1` to obtain actual Compile output. Run `14-movement-native-runner.cjs` with repo root, the external unchanged NewData template, native host, compiled CommonEvents path and a new output directory. Finally run `14-record-acceptance.mjs` with product Vitest JSON, native output directory and built Workspace JSON. The runner refuses to overwrite existing native evidence.
