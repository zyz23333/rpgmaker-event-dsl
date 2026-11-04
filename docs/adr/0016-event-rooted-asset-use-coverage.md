---
status: accepted
---

# Check event asset uses through explicit native relationships

All current Map, Common and Troop Event Definitions are independent roots. Direct saved asset fields, nested command bodies, both movement-route containers, recognized raw commands, legal None, Compiler Defaults and native mirrors retain the rules in [ticket 02](https://github.com/zyz23333/rpgmaker-event-dsl/blob/98ad17b61371e349e09719009204e29264b16f1b/.scratch/asset-validation/issues/02-direct-asset-reference-coverage.md#answer). Explicitly inactive saved names remain in scope. External reads do not expand DSL-Owned Project Data.

The first release follows only the selected Animation, Tileset, fixed Troop/Enemy, Enemy Transform, fixed Skill positive-animation, Game Over and Return to Title relationships. Each Event Asset Use retains its defining event, native saved position and event-local Asset Dependency Chain. Different real fields, members, timings and slots retain their origins even when filenames match; a native mirror is one logical use. Runtime execution is not guaranteed.

On 2026-11-02 the user requested further simplification after reviewing the first-release cost. Initial/default candidates, fixed Transfer Player destination-map initialization assets, default attacks, battle system audio/backgrounds, and Common Event caller reports are deferred. All Common Events are checked independently, so collecting direct call sites or Skill effect call edges would add explanation but no asset coverage. The checker therefore does not collect or traverse those edges, duplicate called-event uses, or diagnose call cycles. Existing fixed-reference and structure validation still applies.

Selected dynamic relationships and a Force Action default-attack branch retain their position and an unchecked reason, without guessing weapons or fallback files. Other deferred operations need no per-operation stop report; documentation names the excluded coverage. Their missing assets and fields that this checker no longer needs cannot introduce asset errors. Direct commands that explicitly save actor images, battle backgrounds or audio remain covered.

The 2026-10-25 revision removed all-path caller expansion; this revision also removes direct-call reporting and the candidate model from the first-release contract. The smaller scope can ship independently once its own acceptance checks pass. Deferred cases are recorded separately and are not required to complete that release. [ADR 0017](0017-exact-asset-file-existence-in-editing-projects.md), [0018](0018-asset-check-diagnostics-and-explicit-exceptions.md) and [0019](0019-asset-checks-at-workflow-boundaries.md) retain exact file rules, diagnostic policy and one check per workflow operation. Push reconstructs the same event-local uses from verified generated events and their corresponding snapshot. No product implementation or acceptance execution is claimed.
