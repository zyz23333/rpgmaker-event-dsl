# Final asset-validation registration audit

Read-only audit of integration `403b39aa` (2026-11-03). Compared current `.scratch/asset-validation/implementation-acceptance-cases.md` against the actual Vitest name collection at `M:\Shuen\Codex\notes\final-run\collected-tests-final.json`. This is a **registration** audit; it does not turn a collected test into a runtime pass. All ID set comparisons used ordinal string equality so Windows device names containing superscript digits remain distinct.

## Counts and closure of previous gaps

- Final collection: **3,064** total test names; **895** names beginning `AV.`; **895 ordinal-unique AV IDs; zero duplicate AV IDs**. The final list has 81 distinct current automated family prefixes (A 18, B 7, C 13, F 14, D 9, W 20) and no deferred B/D family prefix. The prior collection had 3,012 total, 843 AV registrations but only 840 unique AV IDs.
- The 55 exact C IDs missing in the earlier audit are all present now: C04 3 (`two-callers`, `common-independent-root`, `repeated-common-effect`); C05 1 (`dynamic-troop`); C06 8 selected B05/B11/B12 None fields; C07 36 selected B05/B11/B12 target/field/file variants; C12 7 excluded relationships (`initial-equipment`, `transfer-network`, `hardcoded-system`, `terrain-background`, `battle-test-background`, `actor-default-attack`, `battle-map-background`). The current collector gained those 55 canonical IDs, plus one `AV.SUPPLEMENT.C07.title1-wrong-type` auxiliary ID; it removed the old noncanonical `AV.C07.field-wrong-type.formal.title1.expected`.
- All three formerly duplicated canonical IDs are now unique: `AV.C01.common-uncalled.formal.case.expected`, `AV.C05.default-attack.formal.case.expected`, and `AV.C12.transfer-initial-assets.formal.case.expected`. No new AV ID collision was found.

## Per-family finite expansion

| Current families | Result against collected names |
| --- | --- |
| A01–A18 | Every prescribed formal/raw/page, field and present/missing Cartesian ID remains registered. Includes A13 p0/p1, A15 p1/p3/p5, A17/A18 autonomous/page and set-route/formal/raw. |
| B01–B05, B11–B12 | Every prescribed entry, field, formal/raw and present/missing Cartesian ID remains registered. Covers both Animation entry commands, all nine Tileset slots, front/side Enemy member positions, positive Skill animation fields and all four System fields. |
| C01–C13 | Every current branch ID and the C03 image/se pair is registered. C04/C05/C12 previously absent branches are now present. C06 selected-field matrix includes all 31 current B field tokens (B01 8 + B02 9 + B03 4 + B04 2 + B05 4 + B11 1 + B12 3). C07 includes 5 variants for each fixed-target field and 4 for each System field (no invented System target-missing), all using canonical field tokens. Other C branches and direct None IDs from the prior audit remain registered. |
| F01–F14 | All finite branch tokens retained from the prior audit. F06 includes 3 image input, 2 audio filesystem and 2 movie input branches. F07 has all 130 ordinal-distinct IDs: five base forms, nine forbidden characters, 32 controls and 28 device names × name/extension/case. F03 coexisting case names and F09 link cases remain registered, with actual host capability still a runtime question. |
| D01–D04, D06–D10 | All prescribed severity combinations, exact exception and invalid-config branches, grouping, origin and CLI branches retained; D05 is deferred and has no active family ID. |
| W01–W20 | All current finite timing/input branches and required CLI pairings retained: W01 18 combinations, W11 7 facts × 3 gates, W13 7 inputs × pre/post plus source CLI at both points; W02–W08/W15/W20 required first CLI branches present. |

The final collector has no missing current automated family or finite branch ID. Supplemental IDs are outside the 86-family canonical obligations and do not substitute for them.

## Native and built entry mapping

- All **12 current native IDs** appear in preserved real-run evidence: N01 3 and supported N02 4 in `evidence/01-native-media/policy-resolution-2026-11-02.json` with the original raw results beside it; N03 2 in `evidence/06-native-animation/acceptance-receipts.json`; retained N04 Change Tileset 1 in `evidence/07-native-maps/acceptance-receipts.json`; N05 front/side 2 in `evidence/08-native-battlers/acceptance-receipts.json`. Historical N02 image-name counterexamples, N04 page-tile and N06 Actor candidate remain outside current success obligations and must retain their original observations.
- `packages/rpgmaker-event-dsl/vitest.windows.config.ts` explicitly includes **all 18 `test/asset-*.test.ts` files** found in the current tree; the newly added `asset-selected-field-matrix.test.ts` and `asset-scope-workspace.test.ts` are both present. Thus the built Windows baseline is configured to run every asset suite. Configuration inclusion does not show that a built CLI case actually ran or passed.

## Remaining ticket 14 evidence gate

No registration gap remains at `403b39aa`. The final frozen `pnpm check`, `pnpm build`, and `pnpm --filter rpgmaker-event-dsl test:windows-baseline` must still report actual Windows/Node 22 results, including capabilities such as case-coexisting files and links. Compare the final implementation with the N01–N05 native observations, then bind passing runtime receipts to the current IDs. This audit alone cannot resolve ticket 14 or the spec.
