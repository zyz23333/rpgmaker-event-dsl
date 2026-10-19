# Ticket 27 Choices read-only preparation

Prepared 2026-10-20, primary integration `codex/complete-mv-events-implementation` at `233db5420d6cf83da0220c6aa5aed56626798f39`. Primary was clean before and after inspection. No claim, product/test/tracker change, build, test execution, native launch, acceptance or new managed worktree was performed. Only this external note was created. Ticket 23 is not yet integrated; implementation must wait for root's actual integrated23 SHA and a new separate managed worktree/new branch based on it.

## Authority read

Repository AGENTS; docs/agents/{issue-tracker,triage-labels,domain}.md; GLOSSARY; .agents/skills/{implement-spec,tdd}/SKILL.md and TDD examples/mocking; full assigned27 ticket and full implementation spec including approved editor reverse-engineering revision and T1 seams. Accepted Answers05/12/13; normative core.md E102; relevant ADR0001/0003/0008/0011/0012/0015. Existing03 branches-and-battle reverse evidence is directly relevant; it is read-only code evidence, never an editor UI capture.

External coordination: mv-s6-family-delivery-guide.md, mv-core-family-implementation-prep.md, mv-native-product-pair-prep.md, mv-numeric-saved-values-followup-20261020.md, mv-r3-complete-native-control-v2-notes.md, all under C:/Users/Shuen/.codex/tmp. Re-read actual latest integration files before implementation, because23 changes Common shape and the current snapshot still has old `callCommonEvent(ref)`.

## Fixed Choices contract

- E102 API: `showChoices({choices:[{text,commands,endMarker?}],defaultChoice?,cancel?,position?,background?})`. Ordered dense 1..6 choices. Text retains empty/whitespace/CR/LF/trailing empty items; commands required and may be empty. No parallel branches array, defaultType/cancelType/cancelBranch/positionType aliases.
- defaultChoice `{kind:"none"}` -> -1 or `{kind:"choice",index:0..5}`. cancel `{kind:"disabled"}` -> -1, `{kind:"choice",index:0..5}` or `{kind:"branch",commands,endMarker?}` -> -2. All mode-specific shapes exact; contradictory/unknown/missing fields error.
- Fixed defaults: choice0 default, choice1 cancel, right position, window background. A one-item list still saves cancel1 and warns; do not alter header or infer branch. In-domain indices beyond actual count warn and remain unchanged.
- position left/center/right ->0/1/2; background window/dim/transparent ->0/1/2. These categorical mappings require deliberate native negative-zero handling; do not globally change unrelated saved numeric domains.
- Header p0 and each ordered402 `[index,text]` derive from the same authored text. Every choice has exactly one402/body. branch cancel requires one403 after all402; other cancel modes must have none. Native403 parameters are exactly `[6,null]`, derived from editor Q@706715 save plus JSON array semantics;404 has `[]`.
- Each choice and branch cancel flattens commands/endMarker. Default present means one own trailing code0 at indent+1; empty absent errors. Nonempty absent/present both preserve exact final state. Nested/body/event terminators remain distinct. Raw output contradicting declared marker state, duplicate/mid-body markers and malformed boundaries fail without raw fallback. Legal nested raw code0 remains allowed.
- All child bodies recursively use ordinary reference/Gate rules, including unreachable branches and raw children. Known native raw and decompiled native receive the same contract. Decompile must not publish partial source on an anomaly; Compile/Check must agree and preserve safety19–22.

## Concrete current implementation seams and gaps

All paths below relative to packages/rpgmaker-event-dsl/.

- `src/domain/command.ts:166` still defines old string[] choices, parallel branches, numeric cancel/default/position/background and cancelBranch. ChildCommandBody exists next to it. Add owned exact mode/body types; keep public exports in domain/types.ts and authoring/index.ts current.
- `src/commands/message/authoring.ts:86` selects only recognized old fields. New helper must validate actual input before selecting fields, so a structurally typed local const containing an old or forbidden field cannot silently disappear and become a default. TypeScript direct-literal excess-property rejection alone is insufficient.
- `src/compiler/dispatch.ts:661` currently emits header with default cancel -1 and calls `src/compiler/shared/branches.ts:5`. Branch compiler emits403 `[]` and adds body0 only for empty arrays. Replace together with complete origin paths for choices[i].commands and cancel.commands, accepted defaults/modes and marker semantics.
- `src/commands/message/decompile.ts:75` preallocates parallel branch arrays and renders old numeric fields. Strip only each own final marker before recursively rendering; render absent explicitly, retain branch text and emit named modes. Do not let fallback erase a known malformed shape.
- `src/validation/commands.ts:193` compares old parallel lengths and recurses old arrays. Replace with exact input/body/mode shape validation then new child traversal. Reuse strict plain-own-field/dense-array machinery in `validation/dsl-command-inputs.ts`; family validation can own semantic rules without a facade or public testing API.
- `src/validation/native-parameters.ts` has102 `annnn`,403 empty signature, only a nonempty string-array check, no6-item max and no exact cancel/default domains. It rejects negative-zero in shared integer(), but enum oneOf needs review. Scope changes to E102/402/403; no global loosening.
- `src/validation/command-structure.ts:213` already checks402 order/text and missing402 with MV-CHOICE-MIRROR plus related header location. It tracks cancelSeen but does not tie403 presence to parent cancel value;27 must add this and preserve precise diagnostics. Duplicate403, orphan/close/indent and empty-body checks already exist but must be proven for new shape and raw mixtures.
- `src/validation/compiled-commands.ts` compiles complete lists, checks structure, native inputs/references/Gate and maps origins. Extend it through existing paths, not a new Workspace implementation.
- Loop's `commands/flow/{validation,decompile}.ts` and compiler loop slice demonstrate already delivered bounded body state and raw conflict handling. Reuse the approach while preserving new Choices flattened shape.
- Real source loader `src/workspace/definitions.ts` evaluates helpers from authoring/index dynamically. No separate explicit showChoices registry found. Public seams include real discovered/evaluated source and actual untyped helper inputs.
- Compile contract owner currently `src/workspace/type-inputs.ts` = `mv-1.6.1/7` on this pre23 baseline. Increment relative to actual latest integration, not this stale value.

## Proposed vertical red-green sequence (already approved T1 seams)

1. One-choice authored Workspace Check/Compile with omitted options: independent literal expects cancel1/header and one402/body0/404/final0; exact missing-choice warning and no default adjustment. Implement minimal ordered schema/defaults.
2. Native-start Decompile -> real Discovery/evaluation -> Check/Compile -> Diff/Push for branch=-2,403[6,null], ordered texts and mixed marker states; compare complete carrier and saved key/array/value structure against independent literals.
3. Add modes/enums/texts/boundaries one slice at a time: counts1..6, max/min rejection, empty/all-empty/trailing-empty/CR/LF text; every0..5 saved default/cancel index, none/disabled/branch, all position/background modes, out-of-count warnings. Explicit optional undefined equals omission; required missing/null/sparse/undefined slots error.
4. Exact formal/known-raw/native rejection: mirror conflict, missing/duplicate/reordered402, forbidden/missing/duplicate403, wrong403 payload, bad404, missing close, wrong indent, empty absent and own/nested/raw marker conflict. Assert intended stable code/path/identity/related location, not merely an earlier container failure.
5. Public loaded-source local const extra/old-field/mode contradictions; nested valid reference and missing reference; Gate closed/open in choice and cancel bodies, including unreachable/empty script and legal raw nesting. Verify source/project/Snapshot/manifest/Discovery state for publication failures.
6. Appropriate docs/current examples/authoring guide and appended independent acceptance fixture/requirement/result rows. Use writing-for-agents if editing skill material. Preserve all original requirement rows deep-equal and historical result/history bytes.

Reusable tests: `test/loop-workspace.test.ts`, `test/command-boundary-workspace.test.ts`, `test/support/windows-sandbox.ts`. Existing Choices tests in dsl/decompiler/command-boundary are old shape; update current expectations without rewriting captured historical fixture/result bytes or dropping obligations. No tests were run in this prep.

## Native E2/R3 delivery

E2 code evidence can reuse `.scratch/complete-mv-events-implementation/evidence/03-branches-and-battle-reverse.md`, same target RPGMV.exe SHA256 `1b7d685fd302505b104f51cc539e2d6c997b5164d4a6a55e745283536503d281`; Show Choices decoded resource SHA256 `d407a069ed266771e29c68cfabec47d96349da0fe74fbcaac55b1bf32cf33283`. Existing Evidence ID provenance and static limits must remain honest. Pair actual product output with the independent saved contract; no new UI claim.

Complete native controls: `mv-r3-complete-native-control-v2.cjs` SHA256 `e0ad8388632b1281da90b2ebf133bd2fd129e54fb501c16e214ae3d9122bc3ef`; independent19cases retained at `mv-r3-independent-cases.cjs`; audit SHA256 `8d0dea32cb990282c9a5cdf58b9a001fd843121451a6afa2fcacba12a908e925`. Seven Choices IDs: default-second, one-choice-cancel-selects-first, separate-cancel-body, disabled-cancel-keeps-wait, saved-cancel-five-without-403, saved-default-five-needs-navigation, no-default-down-selects-first. All existing runs are preparation; they do not close27.

Create a separately versioned27 delivery adapter using frozen strict pair helperv5 (`68b74b84bc597402ca437f3d5a045a89044f35e7c3a46dca73ded77a3d39cdf8`) and complete profile. Derive from normal-Scene observer and original independent inputs without rewriting frozen scripts. Require boolean comparator===true, latest actual built package, public init/Clone/Decompile/formal edit/Check/Compile/Diff/Push, real Map owned-name difference proving generated installation, complete15disk/loaded carriers, same engine bytes, fresh isolated profile/appName, actual PID/PPID/cwd, empty logs, clean exit, independent per-side native oracle. Normal Scene scheduling and real Input only; no interpreter setup/update or engine replacement.

Critical accepted cancel5 observation: NO403 in valid choice5 input. Native preserves saved5, turns runtime cancel to-2, Cancel runs no402/403 body, variable50 stays0 and continuation51 becomes1. Branch=-2/403 separately executes body50=9. Old synthetic cancel5 PLUS403 fixture is not supported normal mode and must never motivate a domain expansion/raw workaround. Preserve all old failed probes and audit-premise corrections.

## Start/delivery gates

Wait for root actual integrated23 SHA and dedicated managed worktree/new branch. Confirm ancestry+clean state, claim only then. Do not run broad suites/native builds concurrently with root; serialize Windows Node22 pnpm check, pnpm build and pnpm --filter rpgmaker-event-dsl test:windows-baseline, retain2workers/deadlines. Before delivery merge latest actual integration, reconcile single contract version and rerun affected checks/evidence. Preserve evidence-referenced old dist plus sources externally before replacing it. Mark27 resolved only after allocated actual E2/R3 evidence and required checks; final49–55 remain separate. No new permission question is needed for preapproved seams or finite movement/Shop decisions.
