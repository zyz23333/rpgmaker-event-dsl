# Ticket 27 Choices — DEV checkpoint, 2026-10-20

State: **DEV only; not READY; ticket remains claimed.** Return the development slot
to root. No independent integration, contract bump, ticket resolution, broad check,
build, built baseline or native game execution was performed in this phase.

## Exact checkout

- Worktree: `C:/Users/Shuen/.codex/worktrees/mv-ticket-27/rpgmaker-event-dsl`
- Branch: `codex/mv-ticket-27`
- Development commit: `b53167a382462697f66b8ee60c392867fdba7fb2`
- Actual dependency 23 / integration base: `205334338d8e64e3d00e485849c9ddf67bd7e3b1`
- Base contract: `mv-1.6.1/8`; original 274 requirements unchanged.
- Clean `git status --short` after the commit; no other checkout was modified.
- Environment: Windows, Node `v22.23.0`, pnpm `10.33.0`.

## Delivered development behavior

- `showChoices({ choices: [{ text, commands, endMarker? }], defaultChoice?, cancel?, position?, background? })`.
  Choice/cancel bodies are nested, required command lists; removed authoring fields
  receive strict runtime rejection, including when passed by typed local constants.
- Dense 1–6 choices preserve empty/whitespace/CR/LF/tail-empty strings.
- Default: choice 0, cancel choice 1, right position, window background; a one-item
  list retains cancel 1 and warns. Saved choice indices 0–5 are not normalized to
  count and warn when out of count. Ordinal/categorical negative zero rejects.
- E102 text and ordered E402 text mirror a single authored source. Only branch
  cancel owns one E403 after all choices, exactly `[6, null]`; E404 is exact empty.
  Saved cancel 5 with no E403 remains valid; it is not expanded into branch mode.
- Body End Marker defaults present, empty absent rejects, nonempty present/absent
  round trips exactly, own raw marker conflicts reject, nested raw body markers work.
- Native/known-raw saved-parameter and structure validation cover the same contract.
  Cancel mode/body contradictions use `MV-CHOICE-CANCEL`; saved-index warnings use
  `MV-CHOICE-INDEX` with native paths and formal `.index` / raw `.parameters[n]` paths.
- Choice and cancel children receive recursive Project Data Reference and Script
  Command Gate checks even when the saved selection does not reach the body.
- Root/package READMEs and the agent event-pattern guide describe the accepted API.
  Current tests/examples were adapted; historical evidence/results were untouched.
- `vitest.windows.config.ts` includes the new Choices Workspace test for finalization.

The one shared modification to remember during integration is **owned by ticket 26**:
`validation/dsl-command-inputs.ts` maps known-raw native parameter diagnostic suffixes
to DSL parameter suffixes. Ticket 27 deliberately did not copy that fix. Its direct
invalid-E102 test currently expects the base's old raw `dslPath: "commands[0]"`;
after integrating the shared fix update this expectation to the actual specific
`commands[0].parameters[slot]` mapping and rerun focused verification.

## Passing DEV checks

All logs below are under `C:/Users/Shuen/.codex/tmp/`.

| Check | Actual result | Raw log |
| --- | --- | --- |
| Affected Vitest set, final rerun | **8 files / 118 tests passed** | `mv27-dev-focused-current-v3.log` |
| Package typecheck | passed | `mv27-dev-typecheck-v4.log` |
| Scoped oxlint, 17 changed TS files, `--no-ignore --threads 1 --deny-warnings` | exit 0 | `mv27-dev-lint-v2.log` |
| Scoped oxfmt check, 17 changed TS files, repo ignore path, one thread | passed, 17 files | `mv27-dev-format-check.log` |
| `git diff --check` | passed | command output; no findings |

Focused test command:

```powershell
pnpm --filter rpgmaker-event-dsl exec vitest run test/choices.test.ts test/choices-workspace.test.ts test/definitions.test.ts test/dsl.test.ts test/events.test.ts test/decompiler.test.ts test/command-boundary.test.ts test/command-boundary-workspace.test.ts
```

The new Workspace cases use `workspaceApiEntry`, actual Definition Source Discovery
and evaluation, public init → Clone → Decompile → formal source edit → Check →
Compile → Diff → Push. A nested cancel/marker fixture makes a real Common Event
name change and checks the exact replacement. Other cases cover all 1–6 counts,
saved modes and text slots, fixed one-choice defaults and warnings, removed-field
rejection, Script Gate failure/enablement, native malformed inputs and retry state.
Failed operations compare source, Project Root, Snapshot/manifest/generated state,
config and Discovery; operational lock files and empty directory names are excluded.

## TDD and failed-run provenance

Preserve all existing `mv27-dev-*.log` files, including failures. The relevant chains:

- Slice 1: public nested authoring type red; initial green attempt exposed an omitted
  existing System declaration in the test setup; v2 passes actual Workspace Push.
- Slice 2: E403 `[6, null]` rejected by old signature (red); native nested round trip green.
- Slice 3: strict runtime authored shape/accessors and local-const removed fields red;
  strict helper/family validation green (18 cases).
- Slice 4: native saved domains / cancel branch relationships red; green (33 cases).
- Slice 5: own raw body marker accepted or generic duplicate error red; family conflict green.
- `mv27-dev-warning-origin-red.log`: actual warning fields pointed to `.cancel` /
  `.defaultChoice` for both formal and raw. Final v2/v3 focused runs prove exact
  formal `.index` and raw `.parameters[n]` after the scoped warning fix.
- Matrix first/v2/v3 and focused-current-v1 retain harness corrections: a mixed
  missing-reference case prevented compilation reaching Gate, a wrong missing-close
  expected boundary, a Workspace regex expecting a dslPath in a native-path-only
  message, an accidentally unmarked empty fixture body, and Vitest spreading an
  array row intended as one malformed E403 parameter array. These are not product
  acceptance passes; final corrected focused v3 is the passing evidence.
- Typecheck first/v2/v3/v4 retain current API-example and test-only inference fixes.
  Explicit optional undefined is exercised as untyped input under exact optional types.
- `mv27-dev-format-write*.log` retain command-array invocation failures and Windows
  mapped-file save errors. Explicit paths plus `--threads 1` completed formatting;
  final check passes all 17 TS files. Scoped lint final run exited zero.

## Pending finalization — root must allocate actual integration and slot

1. Incorporate root's actual latest integration and reconcile the ticket 26 shared raw
   diagnostic suffix fix. Do not treat this old actual23 checkout as release candidate.
2. Run required broad Windows / Node 22 checks, build, built baseline and any newly
   relevant tests against the reconciled final candidate; record exact SHAs/environment.
3. Append requirement/evidence index and execution results without rewriting the
   original 274 requirements/history. No E2/R3 acceptance was claimed in DEV.
4. E2: use the existing branches/battle reverse evidence honestly as static code/JSON
   derivation, not UI capture. Evidence target SHA256:
   `1b7d685fd302505b104f51cc539e2d6c997b5164d4a6a55e745283536503d281`;
   decoded Choices SHA256:
   `d407a069ed266771e29c68cfabec47d96349da0fe74fbcaac55b1bf32cf33283`.
5. R3: follow `mv-r3-complete-native-control-v2.cjs` plus independent cases. Audit SHA:
   `8d0dea32cb990282c9a5cdf58b9a001fd843121451a6afa2fcacba12a908e925`.
   Seven allocated Choices cases: default-second, one-choice-cancel-selects-first,
   separate-cancel-body, disabled-cancel-keeps-wait, saved-cancel-five-without-403,
   saved-default-five-needs-navigation, no-default-down-selects-first.
6. Actual built/native pair: separately versioned delivery adapter with strict pair v5
   SHA `68b74b84bc597402ca437f3d5a045a89044f35e7c3a46dca73ded77a3d39cdf8`,
   complete profile, boolean comparator, public built Workspace lifecycle and real
   carrier replacement, complete 15-carrier identity/engine/process/log/exit evidence.
   Preparation does not count as acceptance. Saved cancel 5 input remains 5, runtime
   cancel becomes -2, no E403 means no cancel branch effect, continuation still runs.
   Preserve old synthetic cancel5+403 failure records; do not change accepted behavior.
7. Only after all required final checks/evidence may root allocate READY/independent
   review/contract bump/resolution. This checkpoint does not authorize those claims.

Preparation note retained at `mv27-choices-preparation-20261020.md`, SHA256
`4a6a5cb6ff5acb0a9121488d69d122de4f12a5fac4e963361ff60f9a69974f54`.
