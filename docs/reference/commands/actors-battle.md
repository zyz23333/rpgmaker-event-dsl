# Actors, enemies and battle

[Documentation](../../README.md)

Examples use helpers from `rpgmaker-event-dsl`; short fragments omit imports and containing event declarations. See [events and references](../events.md) for enclosing types and [asset validation](../assets.md) for file checks.

- [Actor resources and states](#actor-resources-and-states)
- [Actor growth, skills and classes](#actor-growth-skills-and-classes)
- [Dynamic equipment slots](#dynamic-equipment-slots)
- [Actor Text and Images](#actor-text-and-images)
- [Enemies and battle control](#enemies-and-battle-control)

## Actor resources and states

`changeHp`, `changeMp`, `changeTp`, `changeState` and `recoverAll` share the
`ActorResourceTarget` Runtime Selector:

| Target                       | Shape                                                                                                        |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Entire party                 | `{ kind: "runtimeSelector", scope: "actor", target: "entireParty" }`                                         |
| Fixed actor                  | `{ kind: "runtimeSelector", scope: "actor", target: "actor", actor: actorRef({ id: 1 }) }`                   |
| Actor selected by a variable | `{ kind: "runtimeSelector", scope: "actor", target: "actorFromVariable", variable: variableRef({ id: 3 }) }` |

HP, MP and TP require `operation: "gain" | "lose"` and an explicit
`ActorResourceOperand`: `{ kind: "constant", value }` or
`{ kind: "variable", variable: variableRef(...) }`. Constant HP/MP quantities are
integers 1..9999; constant TP quantities are integers 1..100. HP also requires
the independent Boolean `allowDeath`, including when gaining HP:

```ts
changeHp({
  target: { kind: "runtimeSelector", scope: "actor", target: "entireParty" },
  operation: "gain",
  value: { kind: "constant", value: 25 },
  allowDeath: false,
});

changeTp({
  target: {
    kind: "runtimeSelector",
    scope: "actor",
    target: "actorFromVariable",
    variable: variableRef({ id: 3 }),
  },
  operation: "lose",
  value: { kind: "variable", variable: variableRef({ id: 4 }) },
});
```

The selector and variable operand remain dynamic. A target variable whose runtime
value is 0 selects the entire party. A quantity variable may hold 0 or a negative
value; compilation preserves the variable mode and leaves MV to evaluate it.
Party iteration follows MV's execution context, including the participating
members during battle. Runtime HP/MP/TP limits and death behavior belong to MV.

Use `changeState({ target, operation: "add" | "remove", state: stateRef(...) })`
with an existing State reference, and `recoverAll({ target })` for complete
recovery. Fixed Actor and State references must exist in the Snapshot, and
Variable references must resolve to valid System slots. Explicit IDs support
existing unnamed records and slots. Every supplied field is required by its
variant; extra fields and non-data objects are rejected. Known raw actor commands
use the same exact saved-slot counts, ranges and reference checks. Native mode,
operation and actor sentinel slots reject negative zero before conversion to
named selectors.

## Actor growth, skills and classes

`changeExp`, `changeLevel`, `changeParameter` and `changeSkill` use the same
`ActorResourceTarget` variants above. EXP, level and parameter changes require
`operation: "gain" | "lose"` and an `ActorResourceOperand`. Constant EXP is an
integer in 1..9,999,999, level in 1..98, and parameter quantity in 1..9999.
Variable operands retain runtime values independently of those constant ranges.
`changeParameter` requires `parameter: "mhp" | "mmp" | "atk" | "def" | "mat" |
"mdf" | "agi" | "luk"`.

```ts
changeExp({
  target: { kind: "runtimeSelector", scope: "actor", target: "actor", actor: actorRef({ id: 1 }) },
  operation: "lose",
  value: { kind: "constant", value: 100 },
  showLevelUp: true,
});
changeSkill({
  target: { kind: "runtimeSelector", scope: "actor", target: "entireParty" },
  operation: "learn",
  skill: skillRef({ id: 2 }),
});
changeClass({ actor: actorRef({ id: 1 }), class: classRef({ id: 2 }), keepExp: false });
```

`showLevelUp` is an explicit saved Boolean for both EXP and level changes,
including loss operations. `changeSkill` requires `operation: "learn" | "forget"`
and an existing Skill reference. `changeClass` requires existing Actor and Class
references and the explicit Boolean `keepExp`. Keeping EXP transfers cumulative
EXP to the new class; the resulting level depends on that class's EXP curve.
Decompile preserves both Boolean values explicitly. Formal commands and known
raw records use identical saved-slot, value and reference validation.

## Dynamic equipment slots

```ts
changeEquipment({
  actor: actorRef({ id: 1 }),
  slotIndex: 1,
  equipment: { kind: "runtimeSelector", scope: "equipment", target: "idForSlot", id: 3 },
});
changeEquipment({ actor: actorRef({ id: 1 }), slotIndex: 6, equipment: null });
```

`slotIndex` is zero based and must fit the final `System.equipTypes.length - 1`
capacity. The native command stores `slotIndex + 1`; configurations with more
than five slots remain supported. The Actor reference must exist. Explicit
`null` means unload, while a nonempty equipment selector carries a positive safe
integer candidate ID. MV chooses Weapon or Armor from the actor's execution-time
slot type, including dual wield in the second slot. Initial Actor/Class traits
do not freeze that choice.

Missing candidates in a possible table warn with `MV-E319-CANDIDATE`; the native
operation can unload equipment. `MV-E319-RUNTIME` describes the remaining slot,
inventory and equipability uncertainty. Validation preserves the candidate and
uses no substitute from another table. An invalid final System slot is an error
(`MV-E319-SLOTS`) for formal commands, recognized raw records and Decompile.

## Actor Text and Images

```ts
nameInputProcessing({ actor: actorRef({ id: 1 }), maxCharacters: 16 });
changeName({ actor: actorRef({ id: 1 }), name: "" });
changeNickname({ actor: actorRef({ id: 1 }), nickname: "  Mira  " });
changeProfile({ actor: actorRef({ id: 1 }), profile: "First line\nSecond line\n" });
changeActorImages({
  actor: actorRef({ id: 1 }),
  character: { image: null, index: 7 },
  face: { image: imageAsset({ folder: "faces", name: "Actor1" }), index: 11 },
  battler: null,
});
changeVehicleImage({ vehicle: "airship", image: null, index: 7 });
```

All shown fields are required. Name Input uses a fixed existing Actor and an integer
`maxCharacters` from 1 through 16. Battle execution skips its Name scene and produces
a context warning. Name, nickname and profile are complete strings, including empty
text, whitespace, CR, LF, CRLF and trailing characters, without a product length cap.
Name and nickname warn on LF; profile warns on two or more LF characters, including
trailing LF. CR independently warns about parameter reconfirmation. These strings
remain one saved slot and do not require the Script Command Gate.

Character and vehicle images use the `characters` folder, faces use `faces`, and
battlers use `sv_actors`. Explicit `null` selects None. Character and vehicle indices
are independent integers 0 through 7, including with None or a large character image.
Face indices use 0 through 2,147,483,647 excluding negative zero. A non-None face
index of at least 8 warns that it exceeds the official two-row layout and its asset
dimensions are unchecked; None preserves the index without that warning. Vehicles
are `boat`, `ship` or `airship`. In battle, Change Vehicle Image changes the held map
vehicle object, with a warning that immediate visibility is uncertain.

## Enemies and battle control

Enemy resource commands use named operands and explicit saved selectors:

```ts
changeEnemyHp({
  target: { kind: "runtimeSelector", scope: "enemy", target: "all" },
  operation: "lose",
  value: { kind: "constant", value: 10 },
  allowDeath: false,
});
showBattleAnimation({
  target: { kind: "runtimeSelector", scope: "enemy", target: "enemy", index: 7 },
  animation: animationRef({ id: 1 }),
  allEnemies: true,
});
battleProcessing({
  troop: { kind: "fixed", troop: troopRef({ id: 1 }) },
  canEscape: true,
  win: { commands: [comment({ lines: ["Victory"] })] },
  escape: { commands: [] },
});
forceAction({
  subject: {
    kind: "runtimeSelector",
    scope: "battler",
    target: "actor",
    actor: actorRef({ id: 1 }),
  },
  skill: skillRef({ id: 1 }),
  target: { kind: "lastTarget" },
});
abortBattle();
```

Enemy positions are integers 0..7 and include hidden members in their saved order.
HP/MP/TP/State/Recover All accept `target: "all"` as well. Appear, Transform and
Animation require a single index; Animation retains it independently of its required
`allEnemies` Boolean. HP/MP constants are 1..9999, TP constants 1..100. Resource
changes require `operation: "gain" | "lose"` and either `{ kind: "constant", value }`
or `{ kind: "variable", variable: variableRef(...) }`. HP requires `allowDeath`.
State uses `operation: "add" | "remove"` with a State reference; Transform and
Animation require existing Enemy and Animation references respectively.

Battle's troop modes are `fixed` with a Troop reference, `variable` with a Variable
reference, or `{ kind: "randomEncounter" }`. Escape/Lose flags default to false.
Both false forbids result bodies; either true requires `win`, and each true flag
requires its matching `escape`/`lose` body. Bodies require `commands` and default
their `endMarker` to `"present"`; only a nonempty saved body may select `"absent"`.

Force Action's subject is one enemy position or fixed Actor reference. Its target
is `lastTarget`, `random`, or `{ kind: "index", index }` with index 0..7. Skill scope
determines its execution meaning, so the index is preserved independently of current
Troop size. Abort Battle has no inputs. Missing fixed references are errors; legal
runtime positions, unknown Common callers and incompatible map/battle contexts
produce warnings. MV skips Battle Processing in battle and Force Action outside
battle; Abort Battle can set residual aborting state outside an active battle.
