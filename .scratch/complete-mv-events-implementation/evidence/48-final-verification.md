# 48 final integration verification

Status: in progress; no native acceptance claimed.

The 2026-10-20 execution amendment applies. Logs and original failures are retained under `M:/Shuen/Codex/mv-events-implementation-20261020/`; unaffected checks will be reused with the affected reruns identified explicitly.

## Confirmed Loop correction

Independent parameter review: `final-matrix/parameter-review.md`. On original integration HEAD `03c87fbf0a45c0304c612dbce64a49bbf8a16235`, five original body/child shapes through helper, staged validation and direct compilation produced 15 failing rejection expectations. The original scripts and JSON results remain in `final-matrix/loop-original-{shape,child}-probe*`.

A genuine public-helper regression failed before implementation (`final-loop-red-helper`), then passed after the minimal correction (`final-loop-green-helper`). Loop now validates its original Child Command Body and dense child command array before reading fields, array slots or command discriminators. Fifteen fresh-input public helper/graph/compiler regressions require rejection with zero getter reads. The helper applies the same body contract, while existing graph tests construct deliberately invalid direct nodes to retain graph diagnostic coverage. Compile Contract Version advances from `mv-1.6.1/21` to `/22` per ADR0013.

Affected verification: `final-loop-focused` passed 143 tests; the stable post-format run `final-loop-stable-rerun` passed 43 selected tests across six files, including all 15 original-shape regressions, complete Loop Workspace roundtrip, actual-source invalid-body refusal without business-state changes, and old/missing contract freshness rejection. The earlier Workspace getter attempt was refused by the source grammar (`Object` is unavailable), so it was replaced by a representable invalid-body source case; original failure retained. The first contract rerun overlapped formatting: `type-input-mismatches.json` identifies the changed `flow/validation.ts` hash. The stable rerun passed without changing the freshness implementation.

`final-loop-static` records successful package typecheck, root source lint and configured format checks. Root lint excludes `.scratch/**`, matching the existing archival boundary of format checks; the original archived invalid-regex failure remains in `final-48/lint-1792461214949.log` and archived inputs are unchanged.

## Full source baseline and affected followups

The single full source run started at HEAD `03c87fbf`, with contract21. It finished with 77 passing / 7 failing files and 2086 passing / 11 failing tests (2097 total). Its actual JSON and full output are `final-48/source-result.json` and `source-1792461216654.log`. Product edits above occurred while that run was active, so this is explicitly a mixed execution interval, not a claim that all checks ran on the final unmodified tree. Affected final checks supersede only their identified responsibilities.

Original failures: five Picture 10s timeouts; one Audio 30s timeout; stale generated-source edits in Timer/Conditional tests after the Comment API migration; a stale Input Number diagnostic expectation; Choices input-change refusal; and a Troop recovery child that explicitly reported stale generated data. The latter two overlapped source/contract edits. Timeout causes remain unproven until inspected; a later pass alone is not a diagnosis of the original timeout.

Build succeeded at `2026-10-20T02:13:10Z` after the Loop source and format correction. The built Windows baseline is still pending. Final failure corrections, focused rerun results, exact candidate/hash, matrix conclusions and ticket closure will be appended after execution.

## Affected failure corrections and reruns

The Timer source insertion and Conditional source-edit match now use the accepted `comment({lines:[...]})` API; complete independently expected installed carriers are retained. The System Slots test expects the current precise E103 reference diagnostic, including command path and actual reference. The evidence writer uses non-executing `node:util.inspect` for non-Error thrown values, avoiding a secondary logging exception that previously obscured the Timer failure.

`final-48-fixture-corrections` passed all three affected source cases. `final-48-timeouts-and-overlap-rerun` passed the five original Picture cases, Choices default case and original complete interrupted Troop recovery case under their original deadlines. The sole remaining Audio aggregate reproduced its 30s timeout. Splitting its same 23 inputs into three independent batches (8/8/7), retaining both Check/Compile rejections, full state comparisons and stale Push refusal for every input, passed all three source tests in `final-audio-bounded-batches`. The existing 30s per-test limit remains unchanged. This diagnoses excessive aggregation in the Audio test; no cause is claimed for the historical Picture timeouts merely from a later pass.

`final-48-built-fixture-corrections` passed five affected built-entry tests: Timer, Conditional and the three Audio batches. `final-48-corrected-static` passed typecheck/lint/format after those test-only corrections. Product source and built output are unchanged since the successful contract22 build; no repeated build or full source run was necessary.

Current index check `final-48-current-index` passed. `final48-index-refresh.json` records only four Conditional shared-test fixture SHA pins and the Audio test-name link changed after correcting/splitting those tests. All five original values remain in Git and that receipt; requirement behavior and historical records are unchanged. The failed precheck is retained separately.

The full-run Vitest verdict is authoritative for timeouts. A timed-out asynchronous test can later finish its own evidence writer, so a late per-requirement `status:passed` record alone does not supersede the original runner failure. The successful focused runner logs above establish the effective superseding results.

## Final 48 result

The built Windows run completed all 22 files: 19 passed / 3 failed files, 541 passed / 3 failed tests (544 original tests). Those three original failures are the exact Timer/Conditional source edits and Audio aggregate addressed by the five passing built-entry reruns above. The original full-run failure and secondary Timer logging failure remain in `final-48/built-windows-result.json` and `built-windows-1792462392742.log`. All other built responsibilities are reused unchanged. The successful build artifact `dist/workspace-api.mjs` has SHA256 `24369d6d1d686b082665cda3b5e76292ed778420eadcfdad431a9cea11169788`.

The source baseline plus explicit affected runs cover all original 2097 source tests, fifteen new original-body/child-shape regressions, one actual-source Loop body refusal, and the two additional Audio batches. This is a union of recorded runs, not a fictional second full-suite result. Product source is unchanged after `91b79e35`; `ea24d4c8` corrects only tests and evidence links. No original unresolved test responsibility remains at this checkpoint.

The final current-contract traceability inventory is `final-matrix-contract22/matrix.json` / `matrix.md`: 105 event families, 45 movement codes, 438 requirements and A1–A8 links, with no unmapped family. This count is traceability only. Independent `final-matrix/parameter-review.md` separately reviews the authoritative per-parameter responsibility groups, None/modes/saved fields and constructor/counterexample obligations; its demonstrated Loop finding is closed by the original red and current affected results above. Complete three-container, mixed-body/raw/mirror/carrier/reference cases and Workspace drift/freshness/publication/recovery/lock responsibilities are exercised by the source/built suites. No test-only input normalization or engine-domain expansion was introduced.

Ticket48 is complete. Final E1–E7 product comparisons and actual R1–R7 games remain the separate49–54 obligations. The external `final48-candidate.json` binds the exact release HEAD, source/dist fingerprints and built API hash when dispatched; subsequent evidence/document merges do not imply new product builds. Final55 audits the applicable current and reused results after those executions.
