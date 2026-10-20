# Final editor supplement: Audio, Inventory and Location

This supplement closes the three specific editor/product evidence gaps found while preparing55. It compares the fixed ticket48 candidate with independently specified complete saved values. The original E1–E7 report remains applicable; this report adds the missing domain-specific links. Actual R4/R5/R6 obligations remain separate.

The branch starts at `b29ae362c4797738e6226b6fcee2037da7f1acd9`. No product code, build, full test suite, editor UI or game execution was performed for this supplement. The controlling2026-10-20 lightweight amendment permits the focused comparison and unaffected evidence reuse.

## Candidate and actual comparison

Windows/Node22.23.0 ran `compare-supplement.cjs` at2026-10-20T03:01:17.694Z–03:01:23.271Z, exit0. Its product is the actual built package at `F:/Shuen/RPG/rpgmaker-event-dsl/packages/rpgmaker-event-dsl`, candidate/execution HEAD `2dc639015f908de6fd524e50236e5422b5f8e990`, Compile Contract Version `mv-1.6.1/22`. All15 dist file hashes match `final48-candidate.json` before and after execution. `workspace-api.mjs` SHA256 remains `24369d6d1d686b082665cda3b5e76292ed778420eadcfdad431a9cea11169788`.

External originals, scripts, machine receipts and temporary workspaces are under `M:/Shuen/Codex/mv-events-implementation-20261020/final55-audit/e-supplement/`. The completed receipt is `comparison-receipt.json`, SHA256 `9b6c611214230b888228459651b4003b93a149b734875196c25c4613fe147b83`. The complete independent input `supplement-input.json` has SHA256 `73890a852e5314b87882648dc006fb68d2ac98574eebe2b832575180c104cd02`; the executed script has SHA256 `538e27139a8addb2719e84c81a83699a135f3edfa64782f70e5ecb2a13c9550d`. Run timing/exit and stdout are `comparison-run-v2.json` / `.log`.

Three complete saved lists contain53 Audio,28 Inventory and65 Location commands, each repeated in Common, Map and Troop containers. These counts describe the inputs. The independent Inventory/Audio literals come from the accepted fixtures; Location is composed from the normative numeric table, matching the existing independent65-record fixture. The compiler never forms the expected arrays. A literal serializer retains numeric `-0` in filesystem input.

The public built API actually performs Decompile, discovers and evaluates four emitted source files, and Check leaves the full hashed business tree unchanged. Normal Compile matches the complete independent `CommonEvents.json`, `Map001.json`, `System.json` and `Troops.json`. All selected known commands use formal representations. A real harmless Common name edit then produces the expected Diff; Push leaves all15 project carriers and the complete Snapshot equal to the independently updated expected objects. Warnings preserve the shrunk-map coordinates and do not claim asset-file scanning. This verifies saved output, not runtime execution of those commands.

The first comparison (`comparison-run-v1.json` / `.log`) failed because the combined fixture inherited no Weapon/Armor entry1. The candidate accurately rejected all corresponding Inventory references. `compare-supplement-v1.cjs`, `supplement-input-v1.json`, the timestamped failure JSON and its original temporary workspace remain unchanged. The corrected fixture adds independent empty-name Weapon/Armor entries at1. No input domain or product behavior was weakened.

## Same editor identity and method

The identified target is `F:/Shuen/RPG/rpgmaker-event-dsl/references/RPGMV/RPGMV.exe`,19,595,264bytes, SHA256 `1b7d685fd302505b104f51cc539e2d6c997b5164d4a6a55e745283536503d281`. Historical PE Evidence `ev_007ba386e622855bf771049084c3103afebbcc6b5d813f18c441f3ecf1d16d24` establishes the retained self-reported1.6.1 metadata; it does not authenticate release origin.

Read-only Node fs/zlib/crypto rechecks31 selected resource records against the existing normative core/visual-map resource tables, including stored/decoded lengths, complete compressed input consumption and decoded SHA256. `resource-identity-receipt.json` SHA256 is `7482f9a8db1445fd9dd8f8cf66c80d8178a75437fe729fef8f1d803dfc8b3817`. Existing report facts below are reused only for those same bytes.

Two additional Audio child-control records were needed to close confirmation, so80 consecutive framed records in the bounded8678030..8787441 region were read to locate them. Their complete decoded bodies identify the roles by bindings/call paths; no qrc pathname is claimed. `audio-child-resource-receipt.json` SHA256 is `5726359ef1c6da58829bcf1984c49fa3995b1bf552e9ed23c4f9981ff1a557c8`. No new REA Evidence ID, native decompilation or extracted-code execution is claimed. First-party decoded text stays outside Git.

| Reference | Role from complete body | Offset | Stored bytes | Encoding | Decoded bytes | Decoded SHA256 |
| --- | --- | ---: | ---: | --- | ---: | --- |
| Q8718731 | Audio object selector with child initialization and OK copies | 8718731 | 629 | zlib | 2306 | `886da80479e446bf20b68b681dc5ba97329db2e5ec2062c324c18777c329adf9` |
| Q8774779 | Audio modal selector with parameter bindings and OK copies | 8774779 | 1062 | plain | 1058 | `f0a984ea3e9acfcacc799cd4fbf5e3729a3b0ce5d81e5683a3da599f39163397` |

## Audio E4

`MV-S6-AUDIO-E4` now has the required same-identity editor facts and final built comparison.

The generic selector declares name empty and volume90/pitch100/pan0, with restoreLast=false (Q642887:12–19). The four Play wrappers select their respective bgm/bgs/me/se folder (Q710234/Q723873/Q734917/Q752170). E132/E133/E139 instead copy System.battleBgm/victoryMe/defeatMe during initialization (Q754957/Q728356/Q793772:17–22). Those are project values, not fixed compiler defaults. E140 refresh reads the selected System boat/ship/airship BGM, then its existing-record load restores the saved selector and all four audio fields (Q804465:30–59). The built input uses six deliberately nondefault System audio values, including empty names with independent numeric values, and explicit command records matching those initialization sources.

Generic existing-record load/save copies name/volume/pitch/pan (Q662985:21–42); E140 writes the vehicle and a complete four-field object (Q804465:63–74). Name selection updates the name field (Q642887:129–131); the FileList None path supplies the empty base name (Q618109:247–264). In the child selector, Q8774779:25–40 binds the four fields and copies all of them on OK. Q8718731:28–43 initializes the child from either its member object or the nonmember parent fields; its OK path copies all four back, while allowNull is separately false by default. E140 uses this nonmember form. None does not authorize discarding its saved numerics or compiling Play SE None as Stop SE.

Existing load uses `pan || 0`, so negative-zero pan may become positive zero on that specific native reconfirmation path. The accepted saved-domain product still preserves original signed zero. The comparison is against the accepted saved contract, not a prediction that reconfirming every injected value in the editor preserves it. Full Qt signal order, file-list population timing, actual modal interaction and successful disk writing remain unexecuted.

The53-command built comparison covers all13 Audio families, None and named assets, numeric boundaries/non-step values, signed zero, all three vehicle categories, seconds fades1/999 and exact zero-parameter Save BGM/Replay BGM/Stop SE. The final six records separately bind the nondefault System initialization values. Playback, waits, persistence, concurrent sound and human hearing remain R6 responsibilities.

## Inventory E4 portion

For `MV-S6-INVENTORY-006`, E4 passed; R4 remains pending its separate actual game receipt.

The same-identity Change Gold/Items/Weapons/Armors/Party bodies (Q773339/Q752458/Q725548/Q801043/Q781359) separately load existing values and save the complete three/four/five-slot arrays. Group_Operation retains gain/lose0/1; Group_Operand retains constant/variable mode and the selected value (Q680842/Q683885). Gold overrides the constant maximum to9,999,999; item quantities use the accepted1..9999 control domain. The base validator’s minimum1 versus initial0 completion timing remains the pre-existing bounded unknown, so no new numeric compiler default is inferred.

Weapons/Armors disable the equipment checkbox for gain, but load and save its checked value independently (Q725548/Q801043:30–56). Party disables Initialize for remove and likewise saves it independently (Q781359:31–54). Consequently gain+includeEquipment=true and remove+initialize=true are retained saved values. The28-command fixture compares every quantity mode, both operations, all equipment flags and all four party operation/initialize combinations through final built evaluation and Push. Empty-name fixed database entries and the unnamed valid variable slot3 remain references with identity.

Runtime zero/negative variable quantities, currency/inventory caps, insufficient inventory with equipped loss, duplicate adds and actual actor initialization effects belong to R4. No editor fact or saved-array equality closes those game obligations.

## Location E4/E6 portion

For `MV-S6-LOCATION-004`, E4/E6 passed; R5 remains pending its separate actual game receipt.

Transfer’s original current-project initialization, existing-record reload and independent direction/fade facts remain covered by the final E4 report and Q758295/Q664736. Set Vehicle Location separately loads/saves category plus direct or variable map/x/y slots (Q733751:26–43). Set Event Location excludes Player, enables exchange, restores the selected mode and direction, then saves either direct/variable coordinates or exchange target with exact positive-zero padding (Q711364:15–59). Get Location Info loads/saves output variable, one of the seven info modes and the two-coordinate direct/variable location, with no exchange option (Q778493:15–52; Q916501:317–322). Shared Group_Location has separate direct, variables and exchange paths, and does not convert project initial selections into compiler defaults (Q664736).

The independent65-command comparison includes all Transfer direction/fade pairs in direct/variable modes, three Vehicle categories in both modes, Event direct/variable/exchange with all directions and all seven Location Info modes in both coordinate modes. The1×1 Map’s event initial position is0/0; saved command coordinates10000 and2,147,483,647 remain unchanged with context warnings. These large values are explicitly synthetic inputs in the user-accepted finite saved domain; no claim is made that ordinary picker clicking creates each value. Complete source evaluation/Compile/Push preserves the saved modes and coordinates without clamping.

Runtime map changes, query array aliases versus terrain/region/event matches, controlled Battle Transfer and vehicle/follower consequences remain R5. E6 warning/context fidelity is not runtime observation.

## Requirement disposition

The machine [supplement cases](49-51-editor-supplement-cases.json) retain the exact input/script/resource/runner links and per-requirement portions. The ordinary result record marks only `MV-S6-AUDIO-E4` passed. Inventory/Location have explicit E-only portion receipts in that cases file; their aggregate requirements still await R4/R5. All prior requirements/results remain preserved. Final55 and actual game acceptance remain open.
