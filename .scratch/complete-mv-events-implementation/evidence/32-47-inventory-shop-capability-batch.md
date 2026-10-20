# Inventory and Shop capability batch 32/47

Development follows the specification's first 2026-10-20 execution amendment.
Inventory DEV `3f23518b` was merged into the Actor integration at `fa9eee45`;
Shop product `fc7c249a` and actual Variables integration `2ce2ba3b` were combined
at `4e64d75e`. Original DEV captures and failures remain at their recorded paths.
The final incoming integration, contract increment and validation are appended
below before READY. This report does not claim final full/build/native acceptance.

## Product behavior and independent inputs

E125–E129 use complete constant/variable quantities, matching fixed references,
and required independent equipment/initialization flags, including inactive
gain+true and remove+true states. The existing 28-record literal matrix and
44 tests remain the input and observable behavior defined by the Inventory DEV.

E302 now requires `goods` and uses `purchaseOnly`, default false. Real item,
weapon and armor goods require matching named reference fields. Optional custom
prices are integers0..999999; omitted price is standard pricing. The exact
four-zero structural placeholder is explicit and preserves ordering, mixtures
and repetition. Empty goods emits a sole placeholder, and only the sole exact
placeholder canonically decompiles to empty goods. The independent fixture is
`packages/rpgmaker-event-dsl/test/fixtures/mv-evidence/shop-cases.json`.

Original helper/direct objects are checked before projection or nested field
reads. Wrong fields, sparse/nondata goods, mismatched references and invalid
prices fail. Native302/605 use exact five/four slots, actual purchaseOnly Boolean,
category-specific positive IDs and owned continuations. Other zero-ID forms,
categorical negative zero and nonzero saved standard-price values refuse. Custom
numeric negative zero is preserved. Public README, package guide, example,
authoring patterns and old callers use the canonical API without an alias.

## Executed development checks

Windows, Node22.23.0, Vitest4.1.9, two workers, original10-second deadlines.
Logs and failed sandboxes are retained under
`M:/Shuen/Codex/mv-events-implementation-20261020/inventory-shop-batch/`.

| Check | Actual result | Original log |
| --- | --- | --- |
| Shop and Inventory units plus actual Workspace |4files/58 passed, including37 Workspace cases |shop-inventory-focused.log |
| After Variables integration: Shop, Inventory, Variables and crossing command/structure/architecture units |9files/277 passed |postvariables-units.log |
| Package types after Variables merge and typed test cleanup |passed |typecheck-v2.log |

Shop Workspace actually discovers and evaluates source in Map/Common/Troop,
checks complete Compile Output, proves Check read-only, edits source and Pushes
the complete independent Project/Snapshot carriers. Refusal checks retain source,
Discovery, Project Root, Snapshot, generated files, config, descriptor, manifest
and pending state. A local const/spread/as-any placeholder with a price fails
before publication, and late malformed or missing category-specific native IDs
fail before any Decompiled Source is exposed. Current stable cases are
MV-S6-SHOP-001 through MV-S6-SHOP-004; requirements.json records fixture identity.

## Retained failures and corrected premises

`shop-empty-red.log`, `shop-ordered-red.log`, `shop-decompile-red.log`,
`shop-input-red.log` and `shop-native-red.log` retain the actual unsupported or
incorrect behaviors exposed before their product fixes. `shop-input-green-v2.log`
corrects the first graph test's argument premise. `shop-workspace-first.log`
records one mismatched no-change report string; the complete data assertions had
passed, and the assertion now uses the actual Structured Diff contract.
`intersection-first.log` retains two old caller expectations: the native Boolean
was already true, so the tests now author/expect the accepted `purchaseOnly:true`
name and keep the independent raw fixture unchanged. `lint.log` records the new
test's explicit-any warning; its replacement uses unknown and local typed data.
Inventory's original ENOSPC sandbox and recovery artifacts remain at the paths
in [its original DEV report](32-inventory-party-dev.md).

## Pending native acceptance

MV-S6-SHOP-005 remains required and unexecuted by this batch. Ticket49 owns
final E2 body/Shop comparisons and50 owns applicable E4 saved-state comparisons
against the identity-bound shipped editor reports. Ticket54 owns actual Shop
Scene and purchase-only/empty/ordered goods consequences within R6. Inventory
MV-S6-INVENTORY-006 remains required for final E4 comparison and R4 game behavior
at50/53. Native zero/negative variable quantities, caps, equipped loss, duplicate
party add and initialization must be observed in the actual final games. Ticket48
owns final full source/build/built checks. Static analysis and synthetic fixtures
do not discharge actual game execution.
