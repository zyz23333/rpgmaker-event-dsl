# Shared Authoring Sample Workspace

This sample composes two explicit Common Events from shared configuration, a command
array, a named function with shallow option destructuring, and a const arrow function
that calls it. The gold amounts are 25 and 90; each list contains the shared introduction,
its own chest label, Change Gold, a completion comment, and the native end marker.
All imports resolve within `src/`; the sample needs no database or asset references.

`src/rewards.events.ts` is the Definition Source. `src/shared/*.ts` are dependencies,
outside the default `*.events.ts` / `*.dsl.ts` discovery patterns. The `.js` import
specifiers resolve to their TypeScript implementations. `introduction.ts` is a
transitive dependency reached through `rewards.ts`.

Use this checkout's package to try the feature before publishing it. At the repository
root, run `pnpm install --frozen-lockfile` and `pnpm --filter rpgmaker-event-dsl build`.
The sample's `workspace:*` dependency selects that package. From this sample directory,
initialize against a disposable MV project:

```sh
pnpm exec rpgmaker-event-dsl init . --project-root /absolute/path/to/MV-project
pnpm exec rpgmaker-event-dsl clone
pnpm exec rpgmaker-event-dsl decompile
pnpm exec rpgmaker-event-dsl compile --check
pnpm exec rpgmaker-event-dsl compile
pnpm exec rpgmaker-event-dsl diff
pnpm exec rpgmaker-event-dsl push
```

Before Decompile, choose unused Common Event IDs for the two explicit declarations
(the sample uses 2 and 3). Decompile retains the project's other owned entries; its
destination must be absent and identities must not collide. Review Diff before Push.
For an existing Workspace, copy the `src` files into its sourceRoot, choose free IDs,
and use its already installed version with shared authoring support. When distributing
a copy outside this monorepo, replace `workspace:*` with the installed package version.

Change `Reward rules v1` to `Reward rules v2` in `src/shared/introduction.ts` while
leaving the entry unchanged. Diff and Push now fail with a stale-output diagnostic
before project writes. Compile Check can validate the change but leaves the output
stale. Run Compile, review Diff, then Push: both rewards now contain the revised
introduction and retain their distinct gold amounts.

For an error example, change the first `gold: 25` to `gold: "25"`: Compile Check
reports a type error at the call in `rewards.events.ts`. Restore the number before
continuing. Changing a reward amount to `0` instead fails the DSL constructor's
range validation; the diagnostic identifies `rewards.ts` and its author call chain
back to the event. For later reference or asset errors, read the event identity and
DSL/native path together with `source`, `use`, `call` and `defined` locations.

These functions expand during compilation. They do not check a chest's opened state
at runtime or make a reward one-time. A gameplay chest still needs its Map Event
page/self-switch or runtime `conditional(...)` state guard. Use `callCommonEvent(...)`
for a game-time event call; extracting a helper does not allocate Common Event IDs
or add such calls. Decompile emits expanded source, not the original helper functions.

The supported syntax and exclusions are listed in the
[parameterized command function guide](../../README.md#parameterized-command-functions).
Functions have zero parameters or one options object, and return an expression or use
const declarations followed by a final return. General TypeScript execution, mutation,
host methods, event factories, automatic ID allocation and automatic extraction of
duplicate source are outside this version.
