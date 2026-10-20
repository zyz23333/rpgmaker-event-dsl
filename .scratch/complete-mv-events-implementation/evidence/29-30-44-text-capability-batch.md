# Text, Script and Actor presentation batch 29/30/44

Development is complete on `codex/mv-text-batch` under the specification's
2026-10-20 user amendment. The latest integrated product checkpoint is
`47211924`, which includes actual Inventory/Shop integration
`4c46520e5e826fb0e01864506f4682c73a41b045`, the independent merger's Text
boundary corrections in `58252653`, and the generated Choices source migration
in `e61a27ef`. The combined requirement index has416 rows, with all overlapping
incoming rows unchanged. Compile Contract Version advances once from actual
incoming `mv-1.6.1/18` to `/19` for the Text product change.

The earlier Text readiness `e246d835` had merged actual integration
`2ce2ba3b4a364dc3770f953323707d843a4f53c7` by `4f39e1a2`, with product
checkpoint `59328ebd`, formatting in `2e733ff7`, and type-only diagnostic
dependency cleanup `d4e2dac9`. Its original405-row/contract18 checks and compact
result records below remain historical evidence, supplemented by the actual
merger correction and latest-incoming checks below.

Final full/build checks belong to48 and final REA/game acceptance to51/52/54.
No editor UI or actual game execution is claimed by this batch.

## Delivered behavior

Ticket29 reuses DEV `5a155a027795fdbfaa9bfc516ba6d0c216b97b1b`, merged by
`d460c1ba`. Complete named messages retain required face/index/background/position,
physical CR/empty/trailing records, independent None/index, exact variable destinations,
finite line/digit/speed domains and non-None face layout warnings. See the original
[message DEV report](29-message-dev-checkpoint.md). Ticket30 reuses DEV
`4fd2f904f58d6e335213ba127dc068c7b8e1e756`, merged by `b3822324`.
Exact Label/Jump strings keep per-list first-match/duplicate/missing semantics;
Script uses LF-only 1–12 physical records, and Plugin Commands preserve their entire
line. Recursive Script Gate includes formal/raw/empty/nested recognized inputs.
See the original [text DEV report](30-text-dev-checkpoint.md). Their earlier broad
finalization holds are superseded by the user amendment, while original evidence
and pending final native obligations remain intact.

Ticket44 owns E303/E320/E322/E323/E324/E325. Name Input requires an existing fixed
Actor and explicit integer1..16. Actor Name/Nickname/Profile preserve complete
strings, including empty, whitespace, CR/LF/CRLF and trailing characters, without
an imposed length cap or Script Gate. LF warns for Name/Nickname; Profile warns
only from the second LF, counting trailing LF. CR independently warns about
parameter reconfirmation. Other single-slot fields do not inherit these warnings.

Actor and Vehicle images accept explicit None and preserve independent indices.
Character/vehicle indices use0..7; face indices use0..2,147,483,647 and reject
negative zero. Character and vehicle numeric negative zero remains preserved;
categorical vehicle negative zero is refused. Image namespaces are explicit
characters/faces/sv_actors. Non-None face indices>=8 warn about the official
two-row layout and unchecked dimensions; None retains the index without that
warning. No assets or dimensions are scanned. Battle Name Input warns that the
Name scene is skipped; Battle Vehicle Image warns about the held map vehicle
object and uncertain immediate visibility, without claiming it is a no-op.

Original helper inputs are checked before projection, with strict own plain data
fields and nested reference/asset shapes. Direct compilation, graph validation,
recognized native and raw records enforce the same family domains. E303 authoring
now lives in the Actor slice; its public helper name stays unchanged. Current root
and package documentation, authoring reference and full-event message/Choices/Label
examples use the accepted APIs. Existing imageAsset/scriptInput guards are reused.

## Independent inputs and actual checks

The version-controlled `actor-presentation-cases.json` is synthetic support, never
an editor capture. Its19 literal command records cover Name Input1/16; empty and
control-character text; all three Vehicle enums; None/real character, face and
battler combinations; large character names with nonzero index; face0/7/8/11/max;
and independently saved numeric negative zero. Unit cases reject malformed
original/native/raw fields and test exact decompiled-source evaluation. A separate
long-text case checks all three Actor string commands without a product cap.

All new execution used Windows, Node22.23.0, pnpm10.33.0, Vitest4.1.9, original
deadlines and two workers. Logs remain at
`M:/Shuen/Codex/mv-events-implementation-20261020/text-batch-temp/`.

| Actual command / scope                                                                                                               | Actual result                        | Original log                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `pnpm typecheck` after actual integration merge                                                                                      | passed                               | 021-text-postmerge-typecheck.log                                                                           |
| `vitest run` message, label-script-plugin, actor-presentation, decompiler, events, dsl, staged-graph, conditional, control-variables | 9files/342tests passed               | 022-text-postmerge-affected.log                                                                            |
| `vitest run` message-workspace, label-script-plugin-workspace, actor-presentation-workspace                                          | 3files/13tests passed                | 023-text-postmerge-workspace.log                                                                           |
| `vitest run test/compile-inputs.test.ts -t MV-S4-INPUT-007`                                                                          | 1test passed, other cases unselected | 026-text-contract-freshness.log                                                                            |
| `oxlint` on all changed TypeScript paths relative to actual integration                                                              | passed                               | 024-text-final-scoped-lint.log                                                                             |
| `oxfmt --check` on47 changed package/example/skill/document paths                                                                    | passed                               | 028-text-scoped-format-clean.log                                                                           |
| `vitest run test/mv-evidence.test.ts -t 'validates the evidence index'`                                                              | 1test passed;405 current rows valid  | 029-text-index-current.log                                                                                 |
| Final `pnpm typecheck` and one-file lint/format after type-only dependency cleanup                                                   | passed                               | 030-text-final-typecheck.log,031-text-diagnostic-boundary-lint.log,032-text-diagnostic-boundary-format.log |

The actual source Workspace tests discover and evaluate all three containers,
compare independently expected complete Compile Output and15 Project/Snapshot
carriers, prove Check read-only, edit a Common Event and install it through Push.
Rejected helper/forged source, malformed saved groups and stale Push compare
source, Project Root, Snapshot, generated data, manifest, config/descriptor,
pending state and Discovery. The new44 cases cover a late invalid native face
index before publication and both original-helper and direct-untyped refusals.

`MV-S6-ACTOR-PRESENTATION-001..004` link these actual Workspace/unit obligations.
Compact result records bind the product checkpoint, fixture/tests, commands,
environment and original logs. Existing29/30 captures remain unchanged. The
current index adds five44 rows to the incoming-plus-reused400 rows; its one
pending native obligation is separate from development passes.

## Retained failures

Log001 retains the first post-DEV merge typecheck failures from old API callers;
their migration is in the reused-API reconciliation. Log002 is the real None
compiler crash, followed by log003's pass. Log005 accepts invalid Name Input0
before the family guard; log006 passes. Log007 accepts malformed native303
before complete native domains; log008 passes. Log009 has no required Actor
warnings before diagnostics; log010 passes. Log013 verifies independent vectors.
Logs012/014 are the earlier source Workspace passes, superseded by the combined
postmerge log023 without removing their original records.

Logs016/017 retain the invalid UTF-8 test-file formatting/lint failure caused by
the local Python default encoding. Commit `d7ae4a6a` stores UTF-8; logs018/019
are the corrected checks. Log025 identifies three formatting-only merge callers;
log027 applies their correction. These are harness/format issues, not changes to
the accepted saved-value domains. All original logs remain at their listed paths.

## Independent merger corrections and latest incoming

The independent merger's original
`M:/Shuen/Codex/mv-events-implementation-20261020/text-batch-merger/cross-boundary.log`
records14 passes and two failures against Text readiness `e246d835`;
`baseline-cross-boundary.log` in that directory records16 passes against actual
integration `2ce2ba3b`. Both raw logs remain unchanged.

One regression was a real import cycle: the generic DSL input guard imported
message validation, while the same message module imported the generic guards
for Choices. Native message-group validation also reached that mixed module.
Commit `58252653` splits the unchanged Choices validator and pure native
message-group validator into their own modules and updates the consumers.
The architecture assertions stay intact. The other failure was an obsolete
boundary expectation that rejected the now-supported E101 None/index3 shape;
the replacement uses a complete literal E101/E401/end-marker list, exact
canonical source and helper names, real public helper evaluation, exact complete
compilation, and warning-free graph validation.

Necessary Workspace verification then found a separate old API call inside a
generated troop-event source string: Choices011 injected
`comment(["Installed Choices"])`. Log039 preserves its actual type-check
failure and the7 passing selected cases. The failing sandbox remains
`M:/Shuen/Codex/mv-events-implementation-20261020/text-batch-temp/choices-three-containers-aN7bLT`.
Commit `e61a27ef` changes only that injection to
`comment({ lines: ["Installed Choices"] })`; the independent expected native
E108 and complete-carrier/state assertions remain unchanged. This test file is
not a current requirement fixture, so no requirement fixture hashes were changed.

Actual Inventory/Shop integration `4c46520e` is merged by `47211924`.
Conflict resolution preserves both Actor presentation and Inventory/Shop
validators, the accepted `goods`/`purchaseOnly` APIs and the incoming pure
Shop guard. The index is the incoming399 rows plus17 unique Text rows:416,
with no differing overlapping requirement objects. Both parents had contract18
for different product changes; the combined Text delivery uses contract19.

All following logs remain under
`M:/Shuen/Codex/mv-events-implementation-20261020/text-batch-temp/`.
Original logs, including failed runs whose planned filenames said green, are
preserved without renaming or overwriting.

| Actual scope                                                                                                                                               | Actual result                                                                | Original log                                                                                                               |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Isolated architecture plus updated boundary assertion, before module split                                                                                 | 15passed/1failed; actual import cycle retained                               | 033-text-cross-boundary-isolated-red.log                                                                                   |
| Architecture and complete command boundary after module split                                                                                              | 16passed                                                                     | 034-text-cross-boundary-green.log                                                                                          |
| Scoped formatter/lint for boundary correction                                                                                                              | passed                                                                       | 035-text-boundary-format-write.log;036-text-boundary-lint.log                                                              |
| Architecture, command boundary, Choices, Message, decompiler and DSL                                                                                       | 6files/102tests passed                                                       | 037-text-boundary-affected-green.log                                                                                       |
| Typecheck after module split                                                                                                                               | passed                                                                       | 038-text-boundary-typecheck.log                                                                                            |
| Necessary Message/Choices Workspace selection before generated-source migration                                                                            | 7passed/1failed/17unselected; legacy Comment call failure retained           | 039-text-boundary-workspace-green.log                                                                                      |
| Exact formerly failing Choices011 edited Push                                                                                                              | 1passed/18unselected                                                         | 040-text-choices-edited-push-green.log                                                                                     |
| Generated-source migration formatting/lint                                                                                                                 | Initial format refusal retained; lint and formatting correction passed       | 041-text-choices-harness-format.log;042-text-choices-harness-lint.log;043-text-choices-harness-format-write.log            |
| Latest incoming conflict-resolution formatting                                                                                                             | passed                                                                       | 044-text-inventory-merge-format-write.log                                                                                  |
| Typecheck on merged `47211924`                                                                                                                             | passed                                                                       | 045-text-inventory-postmerge-typecheck.log                                                                                 |
| Architecture, boundary, Choices, Message, decompiler, DSL, Inventory and Shop on merged source                                                             | 8files/123tests passed                                                       | 046-text-inventory-postmerge-affected.log                                                                                  |
| Scoped lint of all correction/conflict-resolution TypeScript paths                                                                                         | passed                                                                       | 047-text-inventory-postmerge-lint.log                                                                                      |
| Current evidence index on merged source                                                                                                                    | 1test passed;416rows valid                                                   | 048-text-inventory-index-current.log                                                                                       |
| Actual stale/missing/mismatched contract-basis Workspace behavior on contract19                                                                            | 1test passed                                                                 | 049-text-inventory-contract19-freshness.log                                                                                |
| Message Workspace cases, nested Choices Script Gate, complete Choices edited Push, Inventory positive and Shop positive/rejection sources on merged source | 4files/12tests passed;50unselected                                           | 050-text-inventory-postmerge-workspace.log                                                                                 |
| Final correction/report formatting                                                                                                                         | Initial five-Markdown format refusal retained; corrected17-path check passed | 051-text-final-correction-format.log;052-text-final-correction-format-write.log;053-text-final-correction-format-clean.log |

These are source development and actual temporary-filesystem Workspace
observations. Full/build and final REA/game checks retain the allocation below.

## Remaining final acceptance

`MV-S6-ACTOR-PRESENTATION-NATIVE` remains **not executed**. Ticket51 owns final
E5/E6 REA/product comparisons, including message/script physical records, single-slot
text reconfirmation, None and face-index saved values. Reuse same-identity editor
REA evidence08/09 and accepted parameter tables; label synthetic extremes honestly.
Ticket52 owns actual R3 first-match/missing/duplicate Label and control flow.
Ticket54 owns actual R6 message/Name Input/Actor and Vehicle image display,
including standard/nonstandard/missing/replaced images and independent indices,
and R7 Script/Plugin complete strings and runtime consequences. Common Event
caller contexts remain dynamic; battle Vehicle Image is not a presumed no-op.
Retain the original R6/R7 normal-scene controls in final-regression-preparation.md.

These final obligations require the final integrated built product and actual
MV1.6.1/NW.js game observations as applicable. This batch does not replace them
with Node emulation. Development tickets29/30/44 resolve under the user amendment;
their combined native acceptance boxes remain unchecked and point here.
