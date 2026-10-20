# Ticket53 — final R4–R5 game regression

## Execution status

Requirement `MV-S7-GAME-R4-053` **passed** the final actual game pairs on
candidate `2dc639015f908de6fd524e50236e5422b5f8e990`, contract `mv-1.6.1/22`.
The original eleven complete controls plus one required Script-context supplement
give twelve final effective pairs and24 passing native processes. Four failed
pairs remain intact; two failed before game launch and two reached actual games.
See [Final execution](#final-execution) for exact identities, commands and results.

The preparation sections below preserve their then-current pending statements.
Their static checks were not game observations. Final full automation/build
belongs to48 and was reused without another build or full test run.

Dedicated worktree:
`M:/Shuen/Codex/mv-events-implementation-20261020/worktrees/mv-final-r4-r5`,
branch `codex/mv-final-r4-r5`, initially based on actual integration
`4c46520e5e826fb0e01864506f4682c73a41b045`. Text READY tree remains untouched.

## Independent scenarios

[Versioned scenario definitions](53-runtime-scenarios.cjs) construct eleven
independent inputs. Existing complete controls remain individually mandatory;
supplements extend their coverage.

| Scenario                                     | Required actual consequence                                                                                                                                                 |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| final-r4-original-operands-64                | 64 actual Random targets, integer/range/distinct-observed predicates; self-alias multiply2,3,4→4,6,8; one Script evaluation and1,1,1; constant preservation                 |
| final-r4-original-equipment-six              | Original six expectations: same ID chooses Armor versus Weapon after dual wield; missing candidate/None/insufficient inventory; variable Actor0 affects four members        |
| final-r4-common-complete-variable99          | Original complete Map7 action→Common1→Battle→same Common1→native victory and normal Map return; all three owned containers receive real source edits                        |
| final-r4-common-game-data-context-variable99 | Original Map/Battle caller supplemented by filtered missing Enemy, hidden runtime member, absent positions/Character/Party, scroll Battle skip and inherited-event erase    |
| final-r4-force-full-range-variable99         | Original complete28 cases, actual Guard inputs for four Actors, targets0..7/last/random/hidden/appeared/dead, dead subjects and Map skip; original HP/delay/wait predicates |
| final-r4-variable-operations-game-data       | All six operations, positive/negative floor, division/modulo0 raw storage versus public value, result beyond literal bounds and eight Game Data source kinds                |
| final-r4-states-equipment-eligibility        | Variable Actor0 add/remove/recover state, fixed Actor distinction, death-state recovery and ineligible equipment returned to inventory                                      |
| final-r4-inventory-party                     | Gain/loss with negative/zero runtime quantity, stock cap/insufficient stock, included/excluded equipment and Party duplicate/add/remove initialize consequences             |
| final-r4-r5-map-character-consequences       | Scroll starts immediately; next Scroll waits; terrain rejects/allows leaving Boat; followers show/hide refresh and Gather wait; missing event selector stays absent         |
| final-r4-force-skill-scopes-variable99       | Separate one-friend/all-friends/all-visible-enemies/self/random-friend skill scope target sets and every actual HP consequence                                              |
| final-r5-original-location-consequences      | Original complete small-map coordinate and terrain/region/tile alias/event ID differences, Event/Boat locations and normal native Transfer                                  |

## R5 scenario

Requirement `MV-S7-GAME-R5-053` **passed** the original location control and
Map-character consequence supplement; see [Final execution](#final-execution).

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

## Accepted native HP operand derivation

The original Common and Force controls predate the final HP constant domain and
contain the literal9999999 to create dead targets/subjects and native victory.
The current contract accepts HP constants1..9999. The original files, all28
Force definitions, complete Common flow and every original oracle remain
preserved. The four separately named `variable99` scenarios use one finite
derivation rather than changing the product domain or lowering the kill value:

- Initialize Variable99 to9999999 with native122 at the original Map caller
  before native301. Reserve its System name/capacity without changing other
  variables.
- Change only HP311/331 records whose constant operand is exactly9999999 to
  variable mode with Variable99. The runtime quantity, operation, selector,
  allow-death setting, ordering and full oracle remain the same.
- Apply identical changes to each independent input and loaded-carrier
  expectation. Keep the exact native path and before/after parameter tuples in
  `nativeOperandAdaptation` in the retained independent-fixture record.

Common/full-context/scopes each adapt one HP record; full Force adapts three.
Log014 validates scenario syntax,015 formats the affected file,016 passes all
eleven observer syntax/independent fixture assemblies including exact adaptation
counts, and017 validates the current final runner syntax. Product lifecycle and
native games still have not executed. This is an explicitly named legal-input
derivation of each preserved control, not an observation of the original rejected
literal through the product.

Preparation review also corrected the supplementary Common current-event X
prediction from9 to10: its original Common203 first moves Event7 to10,6,
then the added Character Game Data query reads that current position. Shipped
`rpg_objects.js` `command203`/`gameDataOperand` branches support this input-based
prediction; it is still not an actual game observation. Log019 records scoped
lint with zero errors and the same three preserved unused-variable warnings.
Log021 repeats all eleven static assemblies after preserving Variable99's System
name in the contextual supplement. Later affected static records retain the
corrected X prediction.

## Latest incoming and retained preparation failures

The preparation branch merges actual Map/Text/Battle integration
`03c87fbf0a45c0304c612dbce64a49bbf8a16235`. Its438 incoming requirements
remain unchanged, followed by the two pending53 identities, giving440.
No Compile Contract Version change is made for this evidence/tooling preparation.

The initial union script incorrectly assumed433 incoming rows and stopped its
assertion before writing; subsequent queued Git commands committed the unresolved
index at `b4a51244`. This affected only the private53 branch. The immediate
correction reads the actual438-row input, retains every incoming object and its
raw prefix, and appends only the two53 rows. The original intermediate commit
remains visible rather than being rewritten.

Log010 is the actual current-index failure on an incoming documentary reference:
`MV-S6-BATTLE-005` was abbreviated in its report rather than present literally.
The owning root was notified; this is not a native observation or a changed
domain rule. Log011 is scoped lint with zero errors and three unused-variable
warnings in the preserved Common wrapper and deterministic comparison.
Log012 passes observer syntax and independent fixture assembly for all eleven
formatted inputs. Source construction and formatting do not prove any game
expectation. The original failed log002 also remains unchanged.

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

## Final execution

The released48 manifest is
`M:/Shuen/Codex/mv-events-implementation-20261020/final48-candidate.json`.
Every final pair used its fixed candidate
`2dc639015f908de6fd524e50236e5422b5f8e990`, package
`F:/Shuen/RPG/rpgmaker-event-dsl/packages/rpgmaker-event-dsl`, contract22 and
built public API SHA256
`24369d6d1d686b082665cda3b5e76292ed778420eadcfdad431a9cea11169788`.
The dedicated source worktree merged that candidate at `059a163d`; later owned
supplementary source bytes are bound by their captured hashes, rather than being
misrepresented as already committed at that execution HEAD.

The compact actual receipt is
`M:/Shuen/Codex/mv-events-implementation-20261020/ticket53-final/tools/final-delivery-01a43682-7e25-403b-99c8-12a1de5452c3.json`,
SHA256 `2f9e2df0e09da15ca9836173c5e7aeef5e19d9b72c2e900638a43c0e233b8d4a`.
It retains all16 attempts, their original pair-result identities, all twelve
final effective expected/actual observations, exact fixtures/source/tool hashes,
formal-source checks and the mixed-obligation portion verdicts.

Windows tooling used Node22.23.0; each actual game reports MV1.6.1,
NW.js0.29.0, bundled Node9.7.1 and Chromium65.0.3325.146. Seed and host remain
the released manifest's `references/RPGMV/NewData` and
`references/RPGMV/nwjs-win-test/game.exe`. TEMP/TMP, private physical games,
fresh per-process profiles and all new outputs are on M. No first-party game
assets, engine files or private runtime projects are added to Git.

All final rows pass public Init/Clone/Decompile, a real edit of generated formal
source, Check with unchanged business state, Compile/Diff/Push with genuine
replacement, complete independent carrier comparison and both actual games.
Each final side passes loaded-carrier equality, unchanged engine identity,
explicit fresh profile, declared project/host, owned process ancestry, empty
stdout/stderr and reliable exit0. Stochastic actual values remain in raw results;
pair comparison uses the specified per-side predicates.

| Final scenario                | Actual final consequence                                                                                                                                                     |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Original64 operands           | Integer/range/distinct-observed predicates pass on both actual64-value samples; self-alias2,3,4→4,6,8 and Script1,1,1/counter1 remain exact                                  |
| Original six equipment cases  | Same ID switches Armor/Weapon after dual wield; missing/None/stock effects and variable Actor0 across four members match the original oracle                                 |
| Complete Common V99           | Normal Map7 input→Common1→native Battle→same Common1→victory→Map return, three real source edits and all original context/self-switch observations pass                      |
| Common context supplement V99 | Missing/hidden/filtered Enemy, unavailable Character/Party, Map/Battle values, scrolling skip and inherited-current-event erase pass                                         |
| Original28 Force V99          | All28 cases pass,25 hits, all four actual Guard inputs, hidden/appeared/dead subjects/targets, fixed/last/random targets, native waits and normal victory/return             |
| Original R5 locations         | All three complete traces pass, including `[0,0,101,0,77,1]`, outside Event/Boat coordinates and player7,0 transfer on a4×3 map                                              |
| Inventory/Party               | Negative/zero runtime values, cap99, insufficient loss, include/exclude equipment and duplicate/initialize/remove consequences pass                                          |
| Variable operations/Game Data | All six operations, storage floor, division/modulo0, result100000000 and all eight Game Data source kinds pass                                                               |
| State/equipability            | Variable Actor0 add/remove/recover state, fixed Actor distinction, death-state removal and unusable candidate returned to inventory pass                                     |
| Map-character supplement      | Scroll start/next wait, blocked right landing, permitted down landing, show/hide refresh, actual Gather wait and missing Event selector pass                                 |
| Five Force skill scopes V99   | One friend/all friends/all visible enemies/self/random friend; all target sets and every native HP consequence pass, with14 actual hits                                      |
| Script Map/Battle supplement  | Empty Script stores undefined/public0 across three targets; complete CRLF multiline Script floors to5 and evaluates once across three targets; interpreter eventId is7 then0 |

The last row is [its own versioned input](53-variable-script-context-supplement.cjs).
It preserves the complete Common control while filling the explicit
VARIABLES-005 empty/multiline Common/Battle runtime obligation. It supplements
the original eleven controls rather than replacing one.

The actual command entry point is
`M:/Shuen/Codex/mv-events-implementation-20261020/ticket53-final/tools/run-final-r4-r5-v1.cjs`
under the recorded Node22 binary. All calls pass `--mode=native`, the released
`--packageRoot`, `--candidateCommit`, `--seedRoot` and `--host`, and either the
main `--module` or the Script supplement `--module`. The original full call is
log025; log029 uses `--from=final-r4-force-full-range-variable99`; log033 runs
the Script supplement; log039 starts at Map-character; log042 and044 select only
the affected Map and scope cases. Six immutable execution summaries remain under
`ticket53-final/runs/`: `execution-1f50bf1b-d02b-4514-97c3-2900d45a216c`,
`execution-a0e90772-24f7-4b00-a635-545cf1799336`,
`execution-81d65c3e-0927-4878-b92c-f58ab3a39c2b`,
`execution-2c9d9b34-afc7-4068-8ee3-86f0aa105808`,
`execution-9db65db6-ef2b-419b-9acc-430aa5ebe636` and
`execution-28166991-a25f-4472-837e-f026aacc5f26`.

## Retained failures and affected corrections

- The first launcher call lost its saved environment-prefix binding after the
  task resumed and PowerShell attempted `undefinednode`. It failed before Node,
  product or game execution. The original tool output remains; log025 is the
  corrected explicit environment call.
- The first Force attempt failed before product execution because the external
  strict JSON writer used sparse `Array.map`, creating consecutive commas in
  the authored high-ID skill table. Root authorized only `Array.from` so holes
  serialize as null while negative zero remains exact. Log028 proves both.
  Original harness bytes remain at
  `ticket53-final/tools/final-native-pair-support-v1-before-array-holes.cjs`,
  SHA256 `36169a1747e6d16030b530d2581950eb1d178e59af3263756d35a7b5e4708974`;
  corrected harness SHA256 is
  `085091b1b316eaab2d76257e9f7d119fc13df95ffaa84ad2fd321e3c45954c0b`.
  The first four passing pairs executed the former loaded helper; later53
  processes loaded the latter. Original source, per-run copied helper and
  captured require-cache hashes identify the actual versions. Log030 also
  preserves the first runner bytes against its captured original hash.
- The first authored Map-character route was correctly refused by Decompile:
  parameterless movement records had an invalid empty parameter key and lacked
  full205/505 mirrors. The corrected authored input follows ADR0015, with the
  same movement codes, flags and consequence oracle. Its original rejection and
  source remain in log029 and the corresponding failed pair.
- The next Map pair reached both actual games and failed. Native boarding adopts
  the boat's facing; the assumed right-facing blocked landing instead left
  towards the left and later blocked the walking route. An explicit native
  TurnRight after boarding makes the intended input precise; all existing
  blocked/passable/Gather predicates are retained. Log039 keeps the failure;
  log042 passes the affected pair.
- The first skill-scope pair had all five scope/target/HP cases pass, but retained
  a hidden enemy through cleanup. Native HP changes skip that hidden subject;
  battle-end appearance made the complete enemy-dead oracle fail. After all
  scope observations, native335 now reveals it before the original cleanup HP
  command. Unused slots in the self-authored high-ID Skills table are explicit
  JSON nulls before constructing the loaded-carrier expectation. The existing
  action and victory predicates are preserved. Log039 retains both actual sides
  of that failure; log044 passes the affected complete pair.
- Current index log026 retained its10-second timeout. The same current-index
  case passed with a60-second affected-run budget in log027; this is not a new
  full suite or a replacement for48's released full/built checks. Scoped lint
  log035 found no files because the integrated archived-scratch ignore applies;
  explicit owned-file lint with `--no-ignore` passed in036 and040.

No product source, accepted domain or compile contract was changed by53.
Full original controls remain separately exercised. Original game failures,
private copies, earlier static failures and raw results stay at their original
paths; only affected scenarios were rerun.

## Final requirement receipts and aggregation

Three fresh immutable passed results are added under `results/`, all timestamped
`2026-10-20T03-01-32-073Z`: `MV-S7-GAME-R4-053` suffix
`4e62ad07-f094-467c-a6d9-4999e924dba2`, `MV-S7-GAME-R5-053` suffix
`b9cc4901-65f8-4c3e-ae5d-2aff8a714251`, and independently complete
`MV-S5-COMMON-R4-CONTEXT` suffix `67096d4e-0928-4361-9107-29ee7f096b31`.
Log045 binds their exact hashes to the compact receipt.

| Immutable result                                                                                                        | SHA256                                                             |
| ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| [R4](results/MV-S7-GAME-R4-053-2026-10-20T03-01-32-073Z-4e62ad07-f094-467c-a6d9-4999e924dba2.json)                      | `aae8ebc6cd43dfeeac43f091acceb28b1860d521a012f27f21711218ec2d7000` |
| [R5](results/MV-S7-GAME-R5-053-2026-10-20T03-01-32-073Z-b9cc4901-65f8-4c3e-ae5d-2aff8a714251.json)                      | `f89af4d57519508dcd829cd96709bfc85dc16a2091a7c327edd88fac674f6a33` |
| [Common R4 context](results/MV-S5-COMMON-R4-CONTEXT-2026-10-20T03-01-32-073Z-67096d4e-0928-4361-9107-29ee7f096b31.json) | `d43912514996921c7c5a3932c5a7491b356bd9e6e819b2fee78728e2d03c29da` |

The receipt's `portions` records VARIABLES-005's complete assigned native
operands/numeric/Script/Common/Battle portion, LOCATION-004's R5 portion,
INVENTORY-006's R4 portion, CHARACTER-006's assigned Map-character portion and
BATTLE-005's Force/skill-scope R4 portion. Final55 aggregates their other E/R
receipts from51/52/54. No blanket passed result is emitted here for a mixed
requirement whose other portions belong to those tickets.

## Final affected verification

Log046 formats this owned report; log047 passes `git diff --check`. Log048 runs
`pnpm --filter rpgmaker-event-dsl exec vitest run test/mv-evidence.test.ts -t 'validates the evidence index' --testTimeout=120000`:
one test passed and two intentionally unselected tests skipped; actual test time
529ms, total2.77s. This checks the current440-row index and newly added results,
not another full test suite, build or native run. The extended affected-case
budget retains log026's original timeout and log027's earlier success.

The external final-static-and-index receipt
`M:/Shuen/Codex/mv-events-implementation-20261020/ticket53-final/tools/final-static-and-index-4318c5e0-9c1f-4f42-8515-1142deae2faf.json`
records exact commands/environment/HEAD/status, unchanged hashes of the three
new immutable results, and object-for-object equality of all438 incoming
requirement rows and index metadata against the released candidate. Only53's
two owned rows were updated. No product source or compile contract changes are
part of this delivery.
