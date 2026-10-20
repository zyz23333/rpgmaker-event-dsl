# Enemies and Battle Control

Read this before authoring enemy state, battle animation, Battle Processing,
Force Action or Abort Battle commands.

## Enemy state and animation

Enemy selectors use `{ kind: "runtimeSelector", scope: "enemy", target: "enemy",
index }`, where index is the saved zero-based position 0..7. Hidden members occupy
their original positions. These positions are runtime selectors rather than Enemy
database references. Preserve numeric negative zero when taking over saved data.

`changeEnemyHp`, `changeEnemyMp`, `changeEnemyTp`, `changeEnemyState` and
`enemyRecoverAll` also accept `{ kind: "runtimeSelector", scope: "enemy",
target: "all" }`. `enemyAppear`, `enemyTransform` and `showBattleAnimation` require
a single position. Only the all-capable commands encode the all selector as −1.

Resource changes require operation `"gain" | "lose"` and a named value:
`{ kind: "constant", value }` or `{ kind: "variable", variable: variableRef(...) }`.
HP/MP constants are integers 1..9999; TP constants are integers 1..100. HP also
requires an explicit `allowDeath` Boolean. State changes require `"add" | "remove"`
and a State reference; recovery requires only the target. Transform requires an
Enemy reference. Animation requires an Animation reference and explicit
`allEnemies` Boolean. Retain its single index even while `allEnemies` is true.

Fixed State, Enemy, Animation, Variable, Actor, Skill and Troop references must
resolve. Context warnings retain legal selectors: a Common Event caller is
unknown; map execution may read residual Troop state; missing Enemy references
in external members can shift runtime positions. Review the warning rather than
clipping the saved index to the current Troop size.

## Battle Processing

Choose a named troop mode:

- `{ kind: "fixed", troop: troopRef(...) }` selects an existing Troop.
- `{ kind: "variable", variable: variableRef(...) }` reads the Troop ID at runtime.
- `{ kind: "randomEncounter" }` uses the current map encounter selection.

`canEscape` and `canLose` each default to false, including explicit undefined.
Both false requires all result bodies absent. If either flag is true, `win` is
required; `escape` is required exactly when `canEscape` is true, and `lose` exactly
when `canLose` is true. Every body is `{ commands, endMarker? }`. A body defaults
to a present Body End Marker; only a nonempty saved body can use `"absent"`.
Keep raw markers with their owning body and preserve nested bodies independently.

```ts
battleProcessing({
  troop: { kind: "fixed", troop: troopRef({ id: 1 }) },
  canEscape: true,
  win: { commands: [comment(["Record victory here"])] },
  escape: { commands: [] },
});
```

MV skips Battle Processing during battle execution. Its saved branches and all
references still require validation. Random encounters depend on the actual map
and location; a map with an empty saved encounter list receives a warning.

## Force Action and Abort Battle

Force Action requires a Skill reference, a single battler subject, and a named
target. An enemy subject is `{ kind: "runtimeSelector", scope: "battler",
target: "enemy", index }`; an Actor subject uses `target: "actor", actor:
actorRef(...)`. Targets are `{ kind: "lastTarget" }`, `{ kind: "random" }`, or
`{ kind: "index", index }` with index 0..7. Skill scope determines how the target
is interpreted, so retain the saved index independently of current enemy count.
MV skips Force Action outside battle; a Common Event's execution context is unknown.

`abortBattle()` takes no arguments. MV sets BattleManager's aborting phase;
outside an active battle this can leave residual state rather than immediately
changing scenes. Treat the corresponding warning as context information.
