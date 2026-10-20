# Ticket31 Control Variables development closure

Ticket31 closes the E122 development scope under the accepted 2026-10-20 execution policy. The original DEV is reused, the current integration is merged, and affected public DSL/Workspace checks pass. Final build and native acceptance remain assigned to48–55; no new full-suite, build, built-product or game run is claimed here.

## Current correction after independent review

The first READY `b9b1b12cb5a94111199878bfab7ea8607e65e7e4` was returned for one product defect: a nested target's `kind` accessor could replace itself with a data property before the original own-data check. Both the public helper and directly authored graph/compile could accept that invalid original input. The independent report and unmodified public-entry reproduction remain at `M:/Shuen/Codex/mv-events-implementation-20261020/ticket31-merger/review-b9b1b12c.md`, `reproduce-original-target.mts` and `original-target-reproduction-helper-and-graph.log` in that same directory.

Fix `6a3c79b6` checks the complete original target's plain, enumerable own-data shape before reading its discriminator; the existing mode-specific field checks then run normally. It changes no accepted domain contract. Tests cover Variable Reference and Reference Range targets, own self-replacing accessors, inherited accessors and non-enumerable data discriminators through helper, direct graph validation and direct compilation. Each invocation uses its own original target and asserts zero getter reads as well as rejection.

The actual TDD red (`original-target-red-v1`) had12 failures and6 passes: own accessor inputs were accepted, while inherited accessor inputs were rejected only after one getter read. After the minimal guard change, `original-target-green-v1` passed all18 new cases. Both original receipts and logs remain under `M:/Shuen/Codex/mv-events-implementation-20261020/ticket31-final/`.

The actual Actor integration `ad04129163119da21efac04a0bc374f55d5fda98` was then merged without product source conflicts. Current clean product `89eb3e34a86f15b6d303d085d261e3c75ba7842d` uses contract `mv-1.6.1/17` and388 requirements: exact incoming383 metadata/objects/order plus the unchanged original Variables five. Reconciliation receipt: `ticket31-final/reconcile-actor-v1.json` under the same M output parent. Existing Actor metadata, Common fixture hashes, original results and `005` pending identity remain intact.

At clean `89eb3e34`, `original-target-affected-v1` passed6 files /257 tests: all188 Variables unit cases, Variables Workspace16, command boundary, DSL, staged graph and the current388-row evidence index. The Workspace run exercises actual source Discovery/evaluation and real Push. `original-target-typecheck-v1`, `original-target-lint-v1` and `original-target-format-v1` passed package typecheck and the three affected source/test/contract files' static checks. These current affected checks replace no historical failure, and unrelated previous passing checks are reused. This correction adds no full/build/built/game run or large archive. All final E5/R4/R7 obligations and `MV-S6-VARIABLES-005` below remain unexecuted.

## First READY source and requirements

- Initial incoming integration: `6dfa75eb96cc089bb00d85012c643ec9af2cdad7`, contract `mv-1.6.1/14`,332 requirements.
- Reused original DEV: `e3f947a592cf8251211803a7a04ccf4e40a3e553`; DEV integration merge: `9f498f61776f093a4e7991a1d424d732adc21423`.
- Variables product fix: `30fc987e32733b4fa2f2dc95dabf05afe291618c`.
- Latest incoming presentation integration: `57db7ed36cc48f4341ace65c83e4b319c924f76f`, contract `mv-1.6.1/15`,374 requirements. The clean current product is merge `e10356a0d2d2a7b8605fba95c1243cd8d94b1ad9`, contract `mv-1.6.1/16`,379 requirements.
- Current requirements preserve incoming metadata and all374 objects in order, then append the five unchanged original DEV rows `MV-S6-VARIABLES-001` through `005`. Original DEV result/history files remain unchanged. Reconciliation receipt: `M:/Shuen/Codex/mv-events-implementation-20261020/ticket31-final/reconcile-presentation-v1.json`.
- All five rows retain fixture `test/support/control-variable-cases.ts`, SHA-256 `6ec7bafca14c8bc5f74e652fc163b8a3a8d6e638eb7941ec4804dec6d30bc560`. `005` remains required with zero results.

## Delivered behavior

E122 covers ordered inclusive variable ranges; set/add/sub/mul/div/mod; constant/variable/random/gameData/script operands; all eight Game Data sources and every saved subtype/status. Fixed references and runtime selectors remain distinct. Formal helpers, evaluated untyped source, native inputs and known raw commands enforce exact slot counts and padding, ±99,999,999 integer literal bounds, reverse-range rejection, saved numeric negative zero and complete single-slot Script Input/Gate behavior. Runtime results do not inherit literal input bounds. Current public documentation, examples and Agent Event Authoring Skill references describe the named API.

Public Workspace tests discover and evaluate generated Definition Sources, exercise Check/Compile/Diff/real Push and failure isolation, and compare complete fifteen-carrier values and business state against independent native expectations. Existing Timer, Conditional, Map appearance and current presentation family hooks remain integrated. The latest conflicts were additive imports/validators and independent documentation pointers; both family behaviors were retained.

An additional defect received a meaningful red→green test: MV omits missing Enemy entries while constructing runtime Troop members, so an E122 enemy selector can shift to a later saved member or fall outside the effective runtime array. Family-owned `variableTroopContext` supplies the same context to Compile and Decompile; `MV-E122-RUNTIME-TARGET` explains the native consequence without changing the saved selector. A valid hidden Enemy remains available to Game Data. The public graph test and existing Workspace fixture cover both skipped-position warnings and the hidden-member case.

## Actual affected checks

Windows, Node22.23.0, pnpm10.33.0, Vitest4.1.9; existing two workers and deadlines. Each run below retains its exact command, environment, starting Git status, stdout/stderr and completion receipt under `M:/Shuen/Codex/mv-events-implementation-20261020/ticket31-final/`.

| Run directory | Actual input | Result |
| --- | --- | --- |
| `initial-units-v1` | Clean `9f498f61` | 8 files /427 tests passed: Variables, Conditional and shared public boundaries |
| `runtime-position-red-v1` | `9f498f61` plus recorded new test | The new skipped-Enemy test failed because both expected warnings were absent; original failure retained |
| `runtime-position-green-v1` | `9f498f61` plus recorded fix/test | Targeted skipped-Enemy test passed |
| `variables-workspace-v1` | `9f498f61` plus five recorded dirty source/test files subsequently committed in `30fc987e` | 1 file /16 tests passed, including real Push and precise Decompile warnings |
| `final-units-v1` | Clean `30fc987e` | 4 files /185 tests passed: Variables170 and decompiler/system-slots/architecture |
| `final-shared-workspace-v1` | Clean `30fc987e` | 3 files /41 tests passed: Conditional Workspace, evidence index and workflow |
| `final-typecheck-v1`, `final-lint-v1`, `final-format-v1` | Clean `30fc987e` | Package typecheck, changed TypeScript lint and30-file format passed |
| `post-merge-boundaries-v1` | Clean `e10356a0` | 5 files /223 tests passed: Variables, command boundary, DSL, staged graph and current379-row evidence index |
| `post-merge-typecheck-v1`, `post-merge-lint-v1`, `post-merge-source-format-v1` | Clean `e10356a0` | Package typecheck, four reconciled TypeScript files lint and five source/skill files format passed |

The16-case Workspace run is bound to its recorded dirty execution inputs, not presented as a clean `30fc987e` run. Its five files are Variables diagnostics, native Decompile context, compiled-command context and the two Variables test files. Unaffected passing results are reused under the accepted execution policy.

The original DEV evidence-index10000ms timeout remains in [its original log](31-history/20261020-dev/logs/evidence-index.log); its cause was not diagnosed here. The current normal index passed at the unchanged deadline in both shared runs above. An initial latest-merge format command also included the historical `.scratch` evidence README/index, whose existing formatting failed that check (`post-merge-format-v1`, exit1). Their requirement values/history were retained; the source/skill scope from the original30-file check passed as `post-merge-source-format-v1`. Original failed receipts remain unchanged. Index validity does not execute native requirements.

The recorded worktree creation receipt is `M:/Shuen/Codex/mv-events-implementation-20261020/worktree-registry/mv-variables-batch-315ac5d2-feb2-4d94-8592-f7276489e69f/creation-receipt.json`. No new large archive or source freeze was created. The [original DEV report](31-control-variables-dev.md) and [original audit](31-control-variables-dev-audit.json) remain historical checkpoints, including then-pending wording and failed attempts.

## Final acceptance still required

`MV-S6-VARIABLES-005` is unexecuted. Ticket48 owns final full automation/build/built baseline;49–51 own final E1–E7 reverse-engineering versus actual product comparisons;52–54 own actual normal-Scene game runs;55 audits acceptance status. Preserve the original E5/R4/R7 obligations:

- Compare exact complete Script Input strings with version-bound editor reverse-engineering facts and final built product output, including empty, multiline and CRLF strings.
- Execute the complete64-sample Random plan with unmodified RNG in native normal Scene scheduling. Observe in-range integer behavior; do not require64 distinct values as a universal oracle or infer statistical independence/exact RNG call count from one observation. Source evidence establishes per-target invocation.
- Verify a self-aliasing variable range and a side-effecting Script counter: non-Random operands evaluate once before target iteration. Preserve the independent multiply expectation2,3,4 →4,6,8 and Script counter result1,1,1/counter1.
- Observe native numeric storage flooring and division/modulo-zero outcomes, including results outside literal operand bounds.
- Run Common and battle caller contexts, preserving independent expectations and saved unavailable enemy/character/party selector consequences.

Original literal preparation supports planning and is not final compiled product acceptance. Domain/history pointers remain in `M:/Shuen/Codex/mv-events-implementation-20261020/remaining-batch-handoffs.md`, `M:/Shuen/Codex/mv-events-implementation-20261020/ticket31-finalization-preparation.md`, `C:/Users/Shuen/.codex/tmp/mv31-control-variables-preparation-20261020.md`, `C:/Users/Shuen/.codex/tmp/mv-runtime-execution-baseline.md` (lines125–129) and `C:/Users/Shuen/.codex/tmp/mv-common-operands-native-probe.cjs`. Older operational freeze/root-release requirements in preparation records are superseded by the accepted execution policy.

Original literal project: `C:/Users/Shuen/.codex/tmp/mv-common-operands-native-control-20261019-0d33d41e-892e-421d-81c4-9550275bd869`. Its baseline hashes remain: result `9bc0c0e9750623f4e6e3cb55e23db71628e1f583f9d7b48915d8cd9c980c807b`; observer `44b4fb2b3448322f9ea4091da5b3fb9767db2fa316a42cacd5c98cdacd5dfb86`; inputs `dc05c569f413b8bade3483bc7f83805111404a0febdeca5a999e1e935cc42c76`; setup `d0855c079335240e8d991a1fe5418b62d0165bc5c1d026393268eba101c31bf1`.
