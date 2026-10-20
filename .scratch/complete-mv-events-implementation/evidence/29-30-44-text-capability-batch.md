# Text, Script and Actor presentation batch 29/30/44

Development is complete on `codex/mv-text-batch` under the specification's
2026-10-20 user amendment. Actual integration `2ce2ba3b4a364dc3770f953323707d843a4f53c7`
is merged by `4f39e1a2`; the product checkpoint is
`59328ebd`, followed by formatting in `2e733ff73466ccfd6f4fbdf984f5e7c1d98ca2e9`
and the type-only diagnostic dependency cleanup `d4e2dac9`. The latter replaces
a dependency on the input-inspection coordinator with stable stage types; emitted
behavior is unchanged, and the final typecheck/lint/format pass covers it.
Compile Contract Version advances once from incoming `mv-1.6.1/17` to `/18`.
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

| Actual command / scope | Actual result | Original log |
| --- | --- | --- |
| `pnpm typecheck` after actual integration merge | passed |021-text-postmerge-typecheck.log |
| `vitest run` message, label-script-plugin, actor-presentation, decompiler, events, dsl, staged-graph, conditional, control-variables |9files/342tests passed |022-text-postmerge-affected.log |
| `vitest run` message-workspace, label-script-plugin-workspace, actor-presentation-workspace |3files/13tests passed |023-text-postmerge-workspace.log |
| `vitest run test/compile-inputs.test.ts -t MV-S4-INPUT-007` |1test passed, other cases unselected |026-text-contract-freshness.log |
| `oxlint` on all changed TypeScript paths relative to actual integration | passed |024-text-final-scoped-lint.log |
| `oxfmt --check` on47 changed package/example/skill/document paths | passed |028-text-scoped-format-clean.log |
| `vitest run test/mv-evidence.test.ts -t 'validates the evidence index'` |1test passed;405 current rows valid |029-text-index-current.log |
| Final `pnpm typecheck` and one-file lint/format after type-only dependency cleanup | passed |030-text-final-typecheck.log,031-text-diagnostic-boundary-lint.log,032-text-diagnostic-boundary-format.log |

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
