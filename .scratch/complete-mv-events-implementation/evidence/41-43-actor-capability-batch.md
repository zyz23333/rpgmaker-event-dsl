# Actor capability batch 41/42/43 — development completion

The batch implements E311/312/313/314/315/316/317/318/319/321/326 on
`codex/mv-ticket-41`. Actual integration `6dfa75eb96cc089bb00d85012c643ec9af2cdad7`
is merged by `0d6cc516`; the current product checkpoint is
`c1590a697eeaaef06ef5292e5075b27e68abf6e4`. Compile Contract Version advances once
from incoming `mv-1.6.1/14` to `mv-1.6.1/15`. The only subsequent code cleanup
removes an unused test import. Later ticket/evidence edits do not change product
behavior. This closes development under the specification's 2026-10-20 user
amendment. Full/build checks belong to48 and final native acceptance belongs to
49–54; no editor UI or game execution is claimed here.

## Implemented behavior

Actor resources, growth and skills share explicit entire-party, fixed `actorRef`
and variable-target selectors. Resource and growth operands use complete
constant/variable variants. Original helpers, direct graphs and known native raw
records validate exact fields and slots before conversion. Fixed references
resolve in their own category. HP `allowDeath`, EXP/level `showLevelUp`, and Class
`keepExp` are explicit independent Booleans, including inactive loss flags and
false values. EXP constants use1..9,999,999, level1..98, parameter1..9999 and all
eight parameter enums; runtime variable values remain dynamic. Class changes
retain cumulative EXP semantics rather than promising the previous level.

E319 uses a fixed Actor reference, zero-based `slotIndex`, and either `null` or
an equipment `idForSlot` Runtime Selector with a positive safe candidate ID.
The saved native values remain `[actorId, slotIndex + 1, candidateOrZero]`.
Final `System.equipTypes` capacity reaches graph validation, all three native
Decompile containers and the final complete emitted-output validation. Dynamic
dual wield and candidate/slot/inventory uncertainty remain warnings, with no
fixed Weapon/Armor reference or cross-table substitution. Out-of-capacity slots
fail with located `MV-E319-SLOTS` errors. Current README, package API reference
and agent authoring guidance use the canonical API; dead legacy Actor target
types/helpers/re-exports are removed.

## Inputs and executed checks

The independent synthetic fixture
`packages/rpgmaker-event-dsl/test/fixtures/mv-evidence/actor-growth-equipment-cases.json`
contains29 literal commands plus the terminator. It covers three target modes,
constant/variable operands, min/max quantities, both saved flags, all eight
parameter enums, all Skill target/operation combinations, both Class flags and
six equipment None/candidate/slot combinations, including seven-slot System
capacity and missing candidate999. It is self-authored saved-data input, without
an editor-origin or runtime-observation claim. The version-controlled fixture and
tests identify the input; requirements.json records the current fixture hash.

All commands ran on Windows, Node22.23.0, pnpm10.33.0 and Vitest4.1.9. New tests
use the original10-second deadline/two workers. Logs remain in place at
`M:/Shuen/Codex/mv-events-implementation-20261020/ticket41-temp/`.

| Actual command / coverage | Result | Original log |
| --- | --- | --- |
| `pnpm --filter rpgmaker-event-dsl typecheck` after integration merge | passed |138-actor-batch-postmerge-typecheck.log |
| `pnpm --filter rpgmaker-event-dsl exec vitest run test/actor-growth.test.ts test/actor-equipment.test.ts test/actor-resources.test.ts test/dsl.test.ts test/events.test.ts test/decompiler.test.ts test/staged-graph.test.ts test/conditional.test.ts test/conditional-context.test.ts test/conditional-validation.test.ts` |10files/273tests passed |139-actor-batch-postmerge-affected.log |
| `pnpm --filter rpgmaker-event-dsl exec vitest run test/actor-growth-equipment-workspace.test.ts` on product checkpoint |4tests passed |140-actor-batch-current-workspace.log |
| `pnpm --filter rpgmaker-event-dsl exec vitest run test/snapshot-context.test.ts -t 'MV-S3-CONTEXT-001\|MV-S3-CONTEXT-003\|MV-S3-CONTEXT-002'` |3tests passed; reused after unrelated Conditional merge |134-actor-batch-context-regression.log |
| `pnpm --filter rpgmaker-event-dsl exec vitest run test/compile-inputs.test.ts -t 'MV-S4-INPUT-007'` |1test passed |143-actor-batch-contract-freshness.log |
| `pnpm exec oxlint` on changed TypeScript paths | passed after removing one unused test import |144-actor-batch-scoped-lint-clean.log |
| `pnpm exec oxfmt --ignore-path .oxfmtignore --check` on37 changed formatted paths | passed |142-actor-batch-scoped-format.log |
| `pnpm --filter rpgmaker-event-dsl exec vitest run test/mv-evidence.test.ts -t 'validates the evidence index'` |1test passed at original deadline |145-actor-batch-index-current.log |

The341-row current index retains the actual integration's332-row prefix, then
the four existing41 obligations and five new42/43 obligations. The selected
index test checks current sources, fixture hashes, test links and latest results;
no full historical archive audit was repeated.

`MV-S6-ACTOR-GROWTH-001` actually discovers and evaluates Decompiled Source from
Map/Common/Troop containers, checks complete independent four-file Compile Output,
checks read-only Compile Check state, edits the Common Event and Pushes all15
independently expected Project/Snapshot files. `MV-S6-ACTOR-GROWTH-002` has two
actual source scenarios: untyped missing `showLevelUp` and an out-of-capacity
direct equipment command. Check, Compile and stale Push refuse; each checks
complete Project, Snapshot, generated data, source, Discovery, config/descriptor,
manifest and pending state. `MV-S6-ACTOR-EQUIPMENT-001` puts an invalid native
slot after29 valid commands and verifies located rejection before publication.
`MV-S6-ACTOR-GROWTH-003` and `MV-S6-ACTOR-EQUIPMENT-002` link the affected boundary
unit suites, including strict original objects and exact native/raw slot domains.

## Retained failures and corrections

Log127 is the first real positive Workspace red: final `assertCompileOutput`
omitted System equipment context and rejected valid E319. The product fix passes
the emitted final System context. Log128 then reached Push and exposed shared
mutable expected-list aliases between the three test containers; independently
cloning each expected list corrected only that test premise. Log129 passed the
positive case and two equipment refusals; its growth refusal was caught by
TypeScript before the intended runtime seam. An explicit untyped local corrected
that premise, and log130 passed the affected case. Log140 subsequently passed
all4 on one current product checkpoint. Original logs and retained failed
sandboxes are preserved, without changing expected product domains or removing
business-state assertions.

Earlier red/green logs103–126 remain at the same external root. Log131 records a
missed dead re-export discovered by TypeScript; removing it produces log132's
pass. Logs135/136 record unmatched formatter argument invocations; explicit
PowerShell argument splatting gives log137's actual formatting pass. Log141's
unused-import warning is followed by log144's clean lint. These failures are not
rewritten as passes. Existing41 evidence is retained in
[41-actor-resources-and-states.md](41-actor-resources-and-states.md), including
all57 raw Workspace records and the exact mixed v26/v27 coverage; those53
historical scenarios were not mechanically rerun for this batch.

## Remaining final acceptance

Ticket51 owns final E7 comparison against the identity-bound
[EXP reverse report](10-exp-boundaries-reverse.md). Ticket53 owns actual R4
Actor-target zero/party context, HP/death/state/recovery and dynamic equipment
slots, dual wield, missing candidates, inventory and equipability. Ticket54 owns
actual R7 EXP constant/variable gain/loss, level/parameter/Skill consequences and
Class cumulative-EXP behavior. These remain required and unexecuted by this batch.
Tickets41/42/43 may resolve development while their original combined native
acceptance boxes stay unchecked and point here. No Node reconstruction or
synthetic fixture substitutes for the final MV1.6.1/NW.js game runs.
