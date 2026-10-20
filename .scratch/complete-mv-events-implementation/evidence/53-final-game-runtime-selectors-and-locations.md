# Ticket53 — final R4–R5 game regression

## Execution status

**Preparation only. Product lifecycle and native games are not executed.**
Ticket53 is claimed and remains blocked on ticket48's recorded final candidate
and freshly built package. The first2026-10-20 specification amendment governs
checks and evidence; no old source-freeze, per-stage release or full-history
choreography is introduced. Full automation/build belongs to48.

Dedicated worktree:
`M:/Shuen/Codex/mv-events-implementation-20261020/worktrees/mv-final-r4-r5`,
branch `codex/mv-final-r4-r5`, initially based on actual integration
`4c46520e5e826fb0e01864506f4682c73a41b045`. Text READY tree remains untouched.

## Independent scenarios

[Versioned scenario definitions](53-runtime-scenarios.cjs) construct eleven
independent inputs. Existing complete controls remain individually mandatory;
supplements extend their coverage.

| Scenario                                | Required actual consequence                                                                                                                                                 |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| final-r4-original-operands-64           | 64 actual Random targets, integer/range/distinct-observed predicates; self-alias multiply2,3,4→4,6,8; one Script evaluation and1,1,1; constant preservation                 |
| final-r4-original-equipment-six         | Original six expectations: same ID chooses Armor versus Weapon after dual wield; missing candidate/None/insufficient inventory; variable Actor0 affects four members        |
| final-r4-common-complete                | Original complete Map7 action→Common1→Battle→same Common1→native victory and normal Map return; all three owned containers receive real source edits                        |
| final-r4-common-game-data-context       | Original Map/Battle caller supplemented by filtered missing Enemy, hidden runtime member, absent positions/Character/Party, scroll Battle skip and inherited-event erase    |
| final-r4-force-full-range               | Original complete28 cases, actual Guard inputs for four Actors, targets0..7/last/random/hidden/appeared/dead, dead subjects and Map skip; original HP/delay/wait predicates |
| final-r4-variable-operations-game-data  | All six operations, positive/negative floor, division/modulo0 raw storage versus public value, result beyond literal bounds and eight Game Data source kinds                |
| final-r4-states-equipment-eligibility   | Variable Actor0 add/remove/recover state, fixed Actor distinction, death-state recovery and ineligible equipment returned to inventory                                      |
| final-r4-inventory-party                | Gain/loss with negative/zero runtime quantity, stock cap/insufficient stock, included/excluded equipment and Party duplicate/add/remove initialize consequences             |
| final-r4-r5-map-character-consequences  | Scroll starts immediately; next Scroll waits; terrain rejects/allows leaving Boat; followers show/hide refresh and Gather wait; missing event selector stays absent         |
| final-r4-force-skill-scopes             | Separate one-friend/all-friends/all-visible-enemies/self/random-friend skill scope target sets and every actual HP consequence                                              |
| final-r5-original-location-consequences | Original complete small-map coordinate and terrain/region/tile alias/event ID differences, Event/Boat locations and normal native Transfer                                  |

## R5 scenario

The original R5 normal-Scene control is retained without shrinking its three
expected traces: invalid-x queries produce `[0,0,101,0,77,1]`; Event/Vehicle
outside locations retain their values while bounded versus alias queries differ;
Transfer retains player7,0 on a4×3 map. The Map-character supplement independently
checks blocked versus passable landing and actual player/Boat/follower positions.

## Sources and safe reuse

Frozen source pointers stay under `C:/Users/Shuen/.codex/tmp/`:
`mv-r4-operands-native-pair.cjs`,
`mv-r4-equipment-normal-scene-native-control-v3.cjs`,
`mv-r4-force-action-range-native.cjs`,
`mv-r2-r4-future-pair-adapters-v4.cjs` and
`mv-r5-locations-normal-scene-native-control-v1.cjs`.
They were inspected for guarded entry points before importing. The Common
`mv23-r4-common-context-delivery-v2.cjs` had an unguarded terminal run.
[The owned Common input](53-common-context-input.cjs) derives an export-only
version, preserving its complete saved records/original oracle and observer.
The current outer source editor uses named Comment syntax and requires the exact
three Map/Common/Troop edits. The original remains unchanged.

External derivation record:
`M:/Shuen/Codex/mv-events-implementation-20261020/ticket53-final/tools/common-context-export-derivation-v1.json`.
The shared `final-game-supplements.cjs` supplies Inventory and generic normal
Scene fixtures. Those are preparation assumptions until the actual paired games
prove them. In particular seed HP/initial equipment expectations have not been
promoted to game observations.

## Actual preparation checks

Windows tooling used Node22.23.0 with TEMP/TMP under
`M:/Shuen/Codex/mv-events-implementation-20261020/ticket53-final/temp`.
Logs remain under the sibling `logs/` directory.

- Log001: scenario module syntax passes.
- Log002: retained preflight failure because the local construction script had not
  produced its intended preflight file; no product or game was invoked.
- Log003/004/005:9/10/11 scenarios respectively pass observer syntax and read-only
  independent fixture assembly.
- Log006: final execution runner syntax passes.
- Log007: all eleven scenarios pass syntax/fixture assembly after moving the safe
  Common input into version control.

These checks use `new Function` only to parse observer strings. They do not
execute engine code in Node and do not prove runtime expectations.

## Final execution entry point

`M:/Shuen/Codex/mv-events-implementation-20261020/ticket53-final/tools/run-final-r4-r5-v1.cjs`
requires an explicit final `packageRoot`, `candidateCommit`, `seedRoot`,
`host` and this scenario `module`. The package HEAD must match the candidate.
The runner invokes the shared public built Workspace Init/Clone/Decompile/
source-edit/Check/Compile/Diff/Push lifecycle, compares complete independent
carrier values, requires real file replacements and formal known-command source,
then runs each private literal/compiled game with a fresh native profile.
It retains process ownership, reliable exit, unchanged engine identities,
actually loaded data and runtime consequences. Random actual traces are retained
but only appropriate per-side predicates are compared.

All new outputs and private game copies go under
`M:/Shuen/Codex/mv-events-implementation-20261020/ticket53-final/`.
First-party assets/runtime projects remain outside Git. The original failures
and prior raw results stay at their recorded paths. Final candidate execution,
expected-versus-actual differences and requirement result records will be appended
after48; every native acceptance checkbox currently remains unchecked.

## Allocation with other final tickets

Root54 covers Actor HP nondeath/death/recovery and TP alongside EXP/level/parameter/
Skill/Class, and rendered Animation/Balloon waits.53 adds state/Actor0/equipment
and movement/vehicle/follower consequences.52 retains full R1 route contexts and
Battle scheduling, Battle skip/Abort residual behavior. No smaller guard replaces
the original complete scheduling or Common controls.
