# Ticket 09: shared System field grouping compatibility

`AV.C07.shared-system-field.formal.case.expected` now passes once through the source entry and once through the built entry on Windows / Node.js 22.23.4 with current Compile Contract Version `mv-1.6.1/40`. Each focused runner registered 105 cases, executed exactly this one successfully, and filtered 104. Filtered registrations are not passes. This is the compatibility revalidation of one ID; the 105-case System suite and whole-repository verification remain 17's responsibility.

The change corrects two stale group-header expectations from 2 to 1 after 12 introduced the grouping required by [specification section 7](../../../asset-validation/asset-validation-spec.md). The same `System.json.gameoverMe.name` failure basis produces one problem group while preserving both independent Game Over command origins. Product code and Contract 40 are unchanged by 09. The [original 09 acceptance](../09-system-acceptance.md) and [original machine receipts](../09-system-acceptance.json) remain unchanged historical evidence for their earlier revision, including this ID's earlier source and built passes.

## Actual behavior and assertions

The original input remains `gameOver(),gameOver(),returnToTitleScreen()` with `System.gameoverMe = null` and all three named title files present. API Check, API Compile and actual CLI Check each report:

- One `error MV-ASSET-INVALID-DATA` group for `System.json.gameoverMe.name`.
- Exactly two independent members at `Map001.json.events[1].pages[0].list[0]` and `list[1]`, each with the Game Over ME dependency chain, its own authored `commands[0]` / `commands[1]` location, and base/effective severity `error`.
- `1 problem group(s), 0 problem file(s), 2 affected use(s)` and incomplete coverage.
- No fabricated legal target, missing-file finding, or query failure; actual CLI exit code 1.
- Unchanged Definition Source, config, complete Project Root/media tree, Snapshot, generated tree, Manifest and pending tree after every failed operation.

The original native-position, missing-file and no-write assertions are retained. Both full API messages and the actual CLI process result, plus each before/after state, are recorded before assertions in the canonical receipts. A local helper asserts exact member prefixes and complete group statistics; it does not invoke the product collector, matcher or policy to derive expectations. There is still exactly one top-level canonical declaration with owner 09, and every other byte of the test file outside this callback is unchanged after line-ending normalization.

## Preserved failure and separate diagnostic capture

17's Contract 39 source run failed for real before its later cancellation. The [original failed receipt](raw/original-17-failed-receipt.json) records `expected ... length of 2 but got 1` and assertion-source SHA `0a6e12bc45987f79a2f8cb6a7ade8fce917e434156c26bea01c94a640972d7d4`. The [original callback file](raw/original-badexpect-asset-system-workspace.test.ts.txt) retains both stale expectations verbatim. The retained sandbox `asset-system-shared-field-tmu3VM` was never operated on or changed by this work. Its [process results](raw/original-17-failed-process-results.json) have no CLI process because the first API assertion stopped that callback. Neither the unexecuted later assertions nor that absent CLI are reported as passes.

Before changing the canonical callback, a separate diagnostic-only script used the same literal input at revision `126b1980014e5c9a4c9bd877505e04a30f097759`, Contract 39. It captured full public API Check/Compile and actual CLI Check output through the existing process seam. The [successful capture](raw/diagnostic-original-contract39.json) retains raw messages, IPC observations and complete states. All 14 independently specified checks passed per operation. Operating-system metadata observations prove each of the three exact title files was still queried despite the malformed Game Over field; no media content read occurred. The [input manifest](raw/diagnostic-product-inputs.json) identifies the frozen source and observer inputs. This diagnostic registers no AV alias and claims no canonical pass.

The first diagnostic attempt captured all three actual messages correctly but its CLI member-level assertion omitted Windows CRLF handling. The last member lines ended in carriage returns, so an `endsWith` observer check failed even though both actual base/effective levels were error. The original [script](raw/attempt-01-crlf-capture-original.ts), [log](raw/attempt-01-crlf-diagnostic-original-contract39.log), [complete captured data](raw/attempt-01-crlf-diagnostic-original-contract39.json) and [process results](raw/attempt-01-crlf-process-results.json) are preserved. Only observer line splitting was corrected before the successful diagnostic rerun. This is an observer failure, separate from the original stale canonical expectation and from product behavior.

## Current Contract 40 verification

The corrected callback and original Contract 39 diagnostic were committed at `7663648f`; current integration `f79bacb496b18f59562663b7fc9e9d10e86c747f` was then merged as `832c74d37e02fd99b6aedcb21d5a6759a3522182`. A fresh `pnpm build` produced the [current build log](raw/build-contract40.log). The [freeze manifest](raw/contract40-freeze.json) records Contract 40, all 158 product source files and 15 built artifacts. The source files and canonical test match their frozen Git blobs; all built bytes still match their recorded hashes.

| Current entry | Actual passes | Actual failures | Filtered registrations | Receipt |
| --- | ---: | ---: | ---: | --- |
| Source | 1 | 0 | 104 | [source receipt](raw/focused-source-receipt.json) |
| Built | 1 | 0 | 104 | [built receipt](raw/focused-built-receipt.json) |

Both receipts match the frozen callback-file SHA `86934f80311612ea09e08259af880c9b2de50bfe6f9f47a50f4fa3555cba7e91`, preserve the original input, and contain complete messages and unchanged-state evidence for all three operations. The [runner](raw/run-09-grouping.ps1) requires an actual single pass, zero failures, 105 registrations and a matching owner-09 receipt. Source and built runs were sequential with `--maxWorkers=1`; the built run used the explicit Windows configuration. Raw [source runner output](raw/focused-source.json) and [built runner output](raw/focused-built.json) retain the filtered registrations instead of counting them as successful execution.

The package typecheck, focused test-file lint and format checks passed; the fresh Contract 40 build and complete whitespace diff check passed. No unrelated test matrix was rerun for this correction. Public API and CLI remain the already-confirmed seams; no product report API, test flag or new AV ID was added.

Machine verification is [verification.json](raw/verification.json), with independent literals and static identity checks in [expected-and-registration.json](raw/expected-and-registration.json). The [verification script](raw/verify-09-grouping.mjs) checks source/built runner counts, receipt/source hashes, complete messages, exact origins, state equality, the Contract 40 source/build freeze and the absence of a 09 product patch. The [raw manifest](raw/manifest.json) preserves artifact byte counts and SHA256; `.gitattributes` keeps the raw archive byte-for-byte. All 34 local-link targets in this document and ticket 09 passed; their verification is recorded alongside the manifest. The script's `--check-only` mode also verifies committed raw Git blobs without updating evidence.
