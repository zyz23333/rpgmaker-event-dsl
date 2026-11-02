# Ticket 09 System and host battle-background acceptance

Verified implementation revision: `ab7150c1a0c74b8744a3fe4c3f24cadd33e75764`. Initial integration base: `898b87db05b47dda648bfa42e2f2ace0a26d3e67`.

Windows / Node.js 22.23.4 / pnpm 10.33.0. Real Workspace API and actual source and built CLI subprocesses. 96 normative IDs plus 9 supplemental regressions: 105 source + 105 built = 210 passing receipts. Native execution is not claimed here.

Independent test inputs specify exact names, namespaces, native positions, field chains, conditions, candidate/inactive reasons and severity. Check and failure assertions compare source, config, project/media tree, Snapshot, generated tree, Manifest and pending state. Successful Compile preserves the project and captured external data; explicit test repairs are accounted for before comparison.

TDD red/green history: Game Over, title, battle-default, host-background and dynamic301 tracer cases each failed for the missing behavior before implementation. The first full source96 run passed94 and exposed2 fixture omissions masked by setup defaults; explicit undefined overrides now produce truly absent native fields. Supplemental tests preserve existing context warnings and count shared diagnostic headers independently from repeated path rendering.

B14 target-missing applicability: its host Map must exist to retain a current Map Event root. The two provisional target-missing candidate IDs are not applicable; the real missing Map prerequisite is demonstrated by the supplemental host-map-required case. Field-missing/type/None/file variants remain fully covered. No nonexistent host fixture is counted as a missing asset or successful asset pass.

Shared C05 callbacks are unique in asset-system-workspace.test.ts and remain available for11 to append independent Skill/weapon scenarios. Dynamic301 stops only the Troop/Enemy branch; known System and Map siblings still report independent errors/warnings.

Per-ID receipts (full inputs, independent assertion source, environment and actual results are in the adjacent JSON):

| ID | Source | Built |
| --- | --- | --- |
| `AV.B11.game-over.formal.gameover-me.missing` | passed | passed |
| `AV.B11.game-over.formal.gameover-me.present` | passed | passed |
| `AV.B11.game-over.raw.gameover-me.missing` | passed | passed |
| `AV.B11.game-over.raw.gameover-me.present` | passed | passed |
| `AV.B12.return-title.formal.title-bgm.missing` | passed | passed |
| `AV.B12.return-title.formal.title-bgm.present` | passed | passed |
| `AV.B12.return-title.formal.title1.missing` | passed | passed |
| `AV.B12.return-title.formal.title1.present` | passed | passed |
| `AV.B12.return-title.formal.title2.missing` | passed | passed |
| `AV.B12.return-title.formal.title2.present` | passed | passed |
| `AV.B12.return-title.raw.title-bgm.missing` | passed | passed |
| `AV.B12.return-title.raw.title-bgm.present` | passed | passed |
| `AV.B12.return-title.raw.title1.missing` | passed | passed |
| `AV.B12.return-title.raw.title1.present` | passed | passed |
| `AV.B12.return-title.raw.title2.missing` | passed | passed |
| `AV.B12.return-title.raw.title2.present` | passed | passed |
| `AV.B13.battle-system.formal.battle-bgm.missing` | passed | passed |
| `AV.B13.battle-system.formal.battle-bgm.present` | passed | passed |
| `AV.B13.battle-system.formal.defeat-me.missing` | passed | passed |
| `AV.B13.battle-system.formal.defeat-me.present` | passed | passed |
| `AV.B13.battle-system.formal.start-se.missing` | passed | passed |
| `AV.B13.battle-system.formal.start-se.present` | passed | passed |
| `AV.B13.battle-system.formal.victory-me.missing` | passed | passed |
| `AV.B13.battle-system.formal.victory-me.present` | passed | passed |
| `AV.B13.battle-system.raw.battle-bgm.missing` | passed | passed |
| `AV.B13.battle-system.raw.battle-bgm.present` | passed | passed |
| `AV.B13.battle-system.raw.defeat-me.missing` | passed | passed |
| `AV.B13.battle-system.raw.defeat-me.present` | passed | passed |
| `AV.B13.battle-system.raw.start-se.missing` | passed | passed |
| `AV.B13.battle-system.raw.start-se.present` | passed | passed |
| `AV.B13.battle-system.raw.victory-me.missing` | passed | passed |
| `AV.B13.battle-system.raw.victory-me.present` | passed | passed |
| `AV.B14.map-battle-background.formal.battleback1.missing` | passed | passed |
| `AV.B14.map-battle-background.formal.battleback1.present` | passed | passed |
| `AV.B14.map-battle-background.formal.battleback2.missing` | passed | passed |
| `AV.B14.map-battle-background.formal.battleback2.present` | passed | passed |
| `AV.B14.map-battle-background.raw.battleback1.missing` | passed | passed |
| `AV.B14.map-battle-background.raw.battleback1.present` | passed | passed |
| `AV.B14.map-battle-background.raw.battleback2.missing` | passed | passed |
| `AV.B14.map-battle-background.raw.battleback2.present` | passed | passed |
| `AV.B14.non-map-roots.formal.case.expected` | passed | passed |
| `AV.C05.dynamic-target.formal.case.expected` | passed | passed |
| `AV.C05.known-sibling.formal.case.expected` | passed | passed |
| `AV.C06.none-indirect.formal.B11-game-over-gameover-me.expected` | passed | passed |
| `AV.C06.none-indirect.formal.B12-return-title-title-bgm.expected` | passed | passed |
| `AV.C06.none-indirect.formal.B12-return-title-title1.expected` | passed | passed |
| `AV.C06.none-indirect.formal.B12-return-title-title2.expected` | passed | passed |
| `AV.C06.none-indirect.formal.B13-battle-system-battle-bgm.expected` | passed | passed |
| `AV.C06.none-indirect.formal.B13-battle-system-defeat-me.expected` | passed | passed |
| `AV.C06.none-indirect.formal.B13-battle-system-start-se.expected` | passed | passed |
| `AV.C06.none-indirect.formal.B13-battle-system-victory-me.expected` | passed | passed |
| `AV.C06.none-indirect.formal.B14-map-battle-background-battleback1.expected` | passed | passed |
| `AV.C06.none-indirect.formal.B14-map-battle-background-battleback2.expected` | passed | passed |
| `AV.C07.field-empty.formal.B11-game-over-gameover-me.expected` | passed | passed |
| `AV.C07.field-empty.formal.B12-return-title-title-bgm.expected` | passed | passed |
| `AV.C07.field-empty.formal.B12-return-title-title1.expected` | passed | passed |
| `AV.C07.field-empty.formal.B12-return-title-title2.expected` | passed | passed |
| `AV.C07.field-empty.formal.B13-battle-system-battle-bgm.expected` | passed | passed |
| `AV.C07.field-empty.formal.B13-battle-system-defeat-me.expected` | passed | passed |
| `AV.C07.field-empty.formal.B13-battle-system-start-se.expected` | passed | passed |
| `AV.C07.field-empty.formal.B13-battle-system-victory-me.expected` | passed | passed |
| `AV.C07.field-empty.formal.B14-map-battle-background-battleback1.expected` | passed | passed |
| `AV.C07.field-empty.formal.B14-map-battle-background-battleback2.expected` | passed | passed |
| `AV.C07.field-missing.formal.B11-game-over-gameover-me.expected` | passed | passed |
| `AV.C07.field-missing.formal.B12-return-title-title-bgm.expected` | passed | passed |
| `AV.C07.field-missing.formal.B12-return-title-title1.expected` | passed | passed |
| `AV.C07.field-missing.formal.B12-return-title-title2.expected` | passed | passed |
| `AV.C07.field-missing.formal.B13-battle-system-battle-bgm.expected` | passed | passed |
| `AV.C07.field-missing.formal.B13-battle-system-defeat-me.expected` | passed | passed |
| `AV.C07.field-missing.formal.B13-battle-system-start-se.expected` | passed | passed |
| `AV.C07.field-missing.formal.B13-battle-system-victory-me.expected` | passed | passed |
| `AV.C07.field-missing.formal.B14-map-battle-background-battleback1.expected` | passed | passed |
| `AV.C07.field-missing.formal.B14-map-battle-background-battleback2.expected` | passed | passed |
| `AV.C07.field-wrong-type.formal.B11-game-over-gameover-me.expected` | passed | passed |
| `AV.C07.field-wrong-type.formal.B12-return-title-title-bgm.expected` | passed | passed |
| `AV.C07.field-wrong-type.formal.B12-return-title-title1.expected` | passed | passed |
| `AV.C07.field-wrong-type.formal.B12-return-title-title2.expected` | passed | passed |
| `AV.C07.field-wrong-type.formal.B13-battle-system-battle-bgm.expected` | passed | passed |
| `AV.C07.field-wrong-type.formal.B13-battle-system-defeat-me.expected` | passed | passed |
| `AV.C07.field-wrong-type.formal.B13-battle-system-start-se.expected` | passed | passed |
| `AV.C07.field-wrong-type.formal.B13-battle-system-victory-me.expected` | passed | passed |
| `AV.C07.field-wrong-type.formal.B14-map-battle-background-battleback1.expected` | passed | passed |
| `AV.C07.field-wrong-type.formal.B14-map-battle-background-battleback2.expected` | passed | passed |
| `AV.C07.file-missing.formal.B11-game-over-gameover-me.expected` | passed | passed |
| `AV.C07.file-missing.formal.B12-return-title-title-bgm.expected` | passed | passed |
| `AV.C07.file-missing.formal.B12-return-title-title1.expected` | passed | passed |
| `AV.C07.file-missing.formal.B12-return-title-title2.expected` | passed | passed |
| `AV.C07.file-missing.formal.B13-battle-system-battle-bgm.expected` | passed | passed |
| `AV.C07.file-missing.formal.B13-battle-system-defeat-me.expected` | passed | passed |
| `AV.C07.file-missing.formal.B13-battle-system-start-se.expected` | passed | passed |
| `AV.C07.file-missing.formal.B13-battle-system-victory-me.expected` | passed | passed |
| `AV.C07.file-missing.formal.B14-map-battle-background-battleback1.expected` | passed | passed |
| `AV.C07.file-missing.formal.B14-map-battle-background-battleback2.expected` | passed | passed |
| `AV.C07.host-map-control.formal.absent.expected` | passed | passed |
| `AV.C07.host-map-control.formal.null.expected` | passed | passed |
| `AV.C07.host-map-control.formal.wrong-type.expected` | passed | passed |
| `AV.C07.host-map-required.formal.case.expected` | passed | passed |
| `AV.C07.shared-system-field.formal.case.expected` | passed | passed |
| `AV.C07.system-container.formal.audio-object.expected` | passed | passed |
| `AV.C07.system-container.formal.sound-array.expected` | passed | passed |
| `AV.C07.system-container.formal.sound-slot.expected` | passed | passed |
| `AV.C08.battleback-off.formal.case.expected` | passed | passed |
| `AV.C12.battle-test-background.formal.case.expected` | passed | passed |
| `AV.C12.hardcoded-system.formal.case.expected` | passed | passed |
| `AV.C12.terrain-background.formal.case.expected` | passed | passed |
