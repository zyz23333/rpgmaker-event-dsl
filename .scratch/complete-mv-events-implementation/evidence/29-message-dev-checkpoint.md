# Ticket 29 message DEV checkpoint

This is a focused development checkpoint, not final acceptance. Ticket 29 remains
claimed. Its integration baseline is `205334338d8e64e3d00e485849c9ddf67bd7e3b1`,
on branch `codex/mv-ticket-29` in the managed `mv-ticket-29` worktree.

## Implemented behavior

- E101 uses required named `lines`, `face`, `background` and `position`. None is
  explicit `image: null` with an independently retained index. Face index accepts
  integers 0..2147483647 and rejects negative zero before conversion or rendering.
- E103 requires a result variable and digits 1..8. E104 requires its result
  variable and regular/key/hiddenA/hiddenB. Variable references resolve against final
  System capacity and exact staged names. Located formal reference errors include
  `.variable`.
- E105 requires lines, speed 1..8 and explicit `noFastForward`. E108 uses the
  schema-first `comment({ lines })` form. There are no compatibility aliases or
  newly inferred convenience defaults.
- Authored, untyped and known native/raw messages validate exact field/slot shapes,
  dense line arrays and physical records. E101 requires 1..4 E401 records; E105
  requires at least one E405 without an accepted upper count; E108 has 1..6 total
  E108/E408 records. Every line excludes LF and preserves CR, whitespace, empty and
  trailing empty strings. Unsupported groups fail before source publication.
- Non-None face indices at least 8 produce the bounded official-two-row-layout /
  unchecked-dimensions warning. None retains its index without that warning. No
  asset file or dimensions are read. Message text is available with Script Gate
  disabled.
- Message helpers validate before copying their input. The owning imageAsset
  helper also checks its own fields before copying, so an unknown field cannot
  disappear before E101 validates its face asset.

## Focused verification

Windows, Node 22.23.0, pnpm 10.33.0, Vitest 4.1.9:

- Eight affected test files passed, 112 tests: message, message-workspace, dsl,
  events, decompiler, definitions, workflow and troop-workflow.
- Package TypeScript check passed.
- Lint and formatter checks passed for all 24 changed/new TypeScript files.
- Evidence index validation passed directly and through its existing targeted
  Vitest test. An initial concurrent-load run exceeded the existing 10-second
  timeout; no timeout or worker setting changed. The direct run took 5836 ms; the
  targeted retry plus the repaired legacy workflow fixture passed in 4.23 seconds.
- `git diff --check` passed.

The Workspace cases actually discover and evaluate generated TypeScript before
Check/Compile/Diff/Push. Independently authored complete Map/Common/Troop carriers
are compared, including CR, empty/trailing records, external fields and complete
native message lists. A Common name edit proves Push installs the current source.
Rejected native, authored, untyped, known raw and public TypeScript inputs compare
all source, Project Root, Snapshot, generated output, manifests, config and Discovery
state; Check also preserves that state. Synthetic fixtures are not playable MV
projects and are not claimed as editor UI or runtime evidence.

New stable obligations are MV-S6-MESSAGE-001..005 in `requirements.json`. Immutable
machine results for the focused delivery run are under `results/29-message-dev/`.
They carry exact source fingerprints, fixture hashes, Windows/tool versions,
expectations and observed complete states, with native execution `not-executed`.
The working-tree source fingerprint is authoritative for this DEV run; the recorded
base revision alone does not identify its uncommitted source changes.

Local raw development logs are in `C:/Users/Shuen/.codex/tmp/`:
`mv29-tdd-01..08-*-red/green.log`, `mv29-dev-typecheck.log`,
`mv29-dev-focused.log`, `mv29-focused-workflow-index.log`, and
`mv29-evidence-index-direct.log`. These are diagnostic pointers, not substitutes for
the linked immutable machine results.

## Pending integration and final acceptance

No broad suite, build, built Windows baseline, contract-version bump or native
launch was executed for this DEV checkpoint. No NewData runtime seed was copied or
mutated. Final E5/E6 reverse-engineering product comparisons and actual R6 game
validation remain required and unexecuted. Preparatory native controls from other
work are not claimed as ticket29 delivery evidence.

Reconcile against the actual merged 26/27/28 changes before final checks: 26 improves
raw parameter diagnostic suffixes; 27/28 own Choices/Conditional child bodies and
their complete marker combinations. This checkpoint does not claim those unmerged
implementations or final cross-family child-body acceptance. Then run the parent
integration queue's required checks, build/version work and isolated native pairs
before resolving ticket 29.
