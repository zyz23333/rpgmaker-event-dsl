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
