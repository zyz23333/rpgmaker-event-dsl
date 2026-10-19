# Ticket 27 numeric saved choice indices — corrected DEV checkpoint

State: **DEV only, not READY.** Focused correction complete; return slot to root.
Ticket remains claimed. No broad check, build, built baseline, native game execution,
reference/seed mutation, contract bump, requirement-index update or ticket resolution.

## Exact checkout and scope

- Worktree: `C:/Users/Shuen/.codex/worktrees/mv-ticket-27/rpgmaker-event-dsl`
- Branch: `codex/mv-ticket-27`
- New corrective commit: `4f78bef151f21235cac4342aba7bac7cce6e55cd`
- Prior DEV commit: `b53167a382462697f66b8ee60c392867fdba7fb2`
- Actual dependency/integration base remains `205334338d8e64e3d00e485849c9ddf67bd7e3b1`.
- Clean worktree verified after commit and actual public green audit.
- Windows / Node `v22.23.0` / pnpm `10.33.0`.

This corrects the old DEV claim that all ordinal/categorical `-0` inputs reject:
E102 cancel/default `{ kind: "choice", index }` are explicit numeric saved fields
and retain `-0`. The old DEV handoff and independent red audit remain unchanged;
this handoff supersedes only their incorrect saved-index rejection claim.

Product correction is limited to:

1. Formal choice-index validation accepts numeric `-0` within integer 0..5.
2. Native/known-raw E102 slots 1/2 accept the same numeric saved value. Global
   `oneOf`, E402 derived ordinal, and symbolic position/background validation stay strict.
3. Decompile uses the existing exact literal renderer and `Object.is` default elision,
   preventing string interpolation or `=== 0` from normalizing `-0`.
4. Public docs describe numeric saved sign preservation. Current tests remove three
   mistaken rejection rows and add formal/raw/decompile positives plus seven actual
   Workspace lifecycle regressions.

The compiler and writer already preserve numeric `-0`; no changes were needed there.

## Focused red → green and checks

All log paths below are under `C:/Users/Shuen/.codex/tmp/`.

| Check | Actual result | Log |
| --- | --- | --- |
| Public formal/raw/decompile focused regression before fix | 3 actual failures at helper index validation | `mv27-dev-numeric-index-red.log` |
| Same focused regression after fix | 3 passed | `mv27-dev-numeric-index-green.log` |
| Choices + Workspace including new seven scenarios | 80 passed | `mv27-dev-numeric-index-workspace-green.log` |
| Final affected set | **8 files / 125 passed** | `mv27-dev-numeric-index-focused.log` |
| Package typecheck | passed | `mv27-dev-numeric-index-typecheck.log` |
| Scoped lint of 5 changed TS files, `--no-ignore --threads 1 --deny-warnings` | exit 0 | `mv27-dev-numeric-index-lint.log` |
| Scoped format check of 5 changed TS files | passed | `mv27-dev-numeric-index-format-check.log` |
| `git diff --check` | passed | command; no findings |

Final affected test command:

```powershell
pnpm --filter rpgmaker-event-dsl exec vitest run test/choices.test.ts test/choices-workspace.test.ts test/definitions.test.ts test/dsl.test.ts test/events.test.ts test/decompiler.test.ts test/command-boundary.test.ts test/command-boundary-workspace.test.ts
```

Workspace assertions use actual discovered source and public init → Clone →
Decompile → Check → Compile → Diff → Push; compare complete generated/pushed data
with strict equality and explicit `Object.is` slot assertions, verify Check does not
write business state, and assert exact `-0` source literals/default elision.

## Actual-source public green audit

New audit directory:
`C:/Users/Shuen/.codex/tmp/mv27-choice-saved-indices-public-green-0a195990-3c5d-4fde-9dbb-15c0d05dcddd`

- Report: `audit.json`, SHA256
  `5c8ae1f1089ffc60b0b58dc71e678a895eeb45aaec4df3af13425ce699d79bcc`.
- Actual clean HEAD: `4f78bef151f21235cac4342aba7bac7cce6e55cd`.
- All 98 current source files frozen and fingerprinted before/after:
  `cc5bf42b70d72024648e1d00ec52cc555b5b5e125111811889f1ce00a1cc5038`.
- Auditor: `C:/Users/Shuen/.codex/tmp/mv27-choice-saved-indices-public-audit-v2.mts`,
  SHA256 `571e1820fc8eae190872ee8ca6b0b8209f210309225b09988a11abcbb42488fa`;
  a copy is retained inside the new audit directory.
- Raw execution log: `mv27-dev-numeric-index-public-green-v1.log`.
- **All seven cases accepted with exact generated and pushed numeric signs**:
  native +0 control; native cancel -0; native default -0; native both -0;
  formal +0 control; formal cancel -0; formal default -0.
- Formal cases report a real generated-only Common Event and Push replacement;
  native cases retain exact saved inputs after decompilation and publication.
- These are synthetic native-data/public Workspace cases, not native game evidence.

Preserved original red audit is
`mv27-choice-saved-indices-public-audit-02b9f2d3-14ff-40f4-887b-cb87c7462e3e/audit.json`,
SHA256 `0866753d775225aedd12b27295ad767e8d7bc1cba88c9aefdc86006ac109345f`.
Both its report hash and original 98-file source-freeze fingerprint
`b5907b6b90554bc20ae255ac2fb8653e552cda00c2033504605986d4511223e6`
were verified before and after the new run. The original v1 auditor was not edited.

## Remaining integration/finalization work

- Root must provide actual latest integration and finalization slot. Reconcile
  ticket 26's shared raw diagnostic suffix mapping then; no unmerged26 dependency
  or independent copy was added here. The base invalid-E102 raw test still expects
  `commands[0]` until the shared fix is integrated.
- Original requirement/history/contract remains untouched. Complete broad/build/built
  checks, requirement/evidence updates and E2/R3 allocations remain pending.
- Native work remains outside this slot. Future native execution must follow the
  current hardened physical-isolation gate in `mv33-native-isolation-repair-guide-20261020.md`
  and root's current authorization, never the old generic copy approach.
- The prior DEV handoff retains additional E2/R3 finalization pointers:
  `C:/Users/Shuen/.codex/tmp/mv27-choices-dev-checkpoint-20261020.md`.
