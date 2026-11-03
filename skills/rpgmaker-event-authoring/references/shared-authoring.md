# Shared authoring

Use Shared Authoring Modules to maintain common source and expand commands into each
event at compilation. Use a Common Event and `callCommonEvent(...)` when the gameplay
needs a game-time event call. A Parameterized Command Function accepts compile-time
options; it does not add a runtime argument protocol. Keep runtime state in pages,
switches/variables and existing conditional/choice/loop DSL Commands. A reward helper
alone does not make a chest one-time.

Inspect the installed package's capability before extracting existing source. Preserve
Entry Identities and the order of commands and Child Command Bodies while extracting
a fragment. This complete two-file example works within the default sourceRoot; choose
an unused Common Event ID before adding its declaration to an existing Workspace.

```ts
// src/shared/rewards.ts
import { changeGold, comment, type DslCommand } from "rpgmaker-event-dsl";

type RewardOptions = { gold: number };
export const settings = { trigger: "none" } as const;
export function reward(options: RewardOptions): DslCommand[] {
  const quantity = { kind: "constant", value: options.gold } as const;
  return [changeGold({ operation: "gain", value: quantity })];
}
export const completedReward = (options: RewardOptions): DslCommand[] => [
  ...reward(options),
  comment({ lines: ["Reward complete"] }),
];
```

```ts
// src/rewards.events.ts
import { commonEvent } from "rpgmaker-event-dsl";
import { completedReward, settings } from "./shared/rewards.js";

export const rewardEvent = commonEvent({
  ...settings,
  id: 1,
  name: "Skill reward",
  commands: completedReward({ gold: 25 }),
});
```

For an optional larger example with a transitive dependency and stale-output exercise,
see the online [Sample Workspace](https://github.com/zyz23333/rpgmaker-event-dsl/tree/HEAD/example/shared-authoring).
The installed skill includes all guidance needed for the example above.

## Supported source

- Place value dependencies physically within the Workspace's configured sourceRoot,
  outside the tool's Decompile isolation area. Use relative static named imports,
  optional local aliases and ESM `.js` specifiers resolving to `.ts` implementations.
  Helpers need not match Definition Source Discovery patterns; only discovered
  entry exports become declarations. Type-only imports retain existing support.
- Export constants, configuration, reference values, single commands, command arrays
  or supported functions. Local named export lists and aliases are allowed. Local
  default/namespace imports, default exports, cross-module re-exports and value
  import cycles are unsupported; the DSL package's namespace import remains valid.
- Functions are named declarations or arrows assigned to const. Use zero parameters
  or one typed options object, accessed by property reads or shallow named property
  destructuring/renaming. Use an expression body or named const declarations followed
  by one final return. Calls can compose DSL helpers and supported author functions.
- Use explicit array spreads for ordering. Supported functions return command
  composition values, including configuration/references; events keep explicit
  top-level declarations. Event factories, higher-order functions, recursion, default
  or rest parameters, nested destructuring, mutation, author-time control flow or
  arithmetic, interpolated templates and host methods are outside this version.

## Validate a shared edit

Run Compile Check, Compile and Diff after changing a helper or any dependency. Review
all affected events, not only the entry being edited. Check validates loaded function
bodies and types even when a function is unused, but publishes no output and does not
restore Generated Freshness. Shared source and resolution changes invalidate old
output even if entry files or resulting commands are unchanged. Push follows the
skill's existing write boundary after the fresh Diff is reviewed.

For a failing call, inspect the actual source file/line/column and the shared
definition/call chain. Later validation retains event identities and DSL/native paths;
`source` is the nearest reliable expression, `use` is a shared expansion, and `call` /
`defined` follow nested functions. Repeated uses keep their own origins. Correct the
shared cause and validate every caller; do not hide a failure with an empty command
array or widen the Script Command Gate. Event JavaScript stays stored text under the
existing gate.

Decompile recognizes supported existing shared identities without validating unrelated
commands. It still refuses uncertain identities and collisions, publishes a complete
new directory, and emits expanded source rather than reconstructing shared functions.
