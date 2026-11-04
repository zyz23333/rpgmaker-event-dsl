# Switches, variables, inventory and party

[Documentation](../../README.md)

Examples use helpers from `rpgmaker-event-dsl`; short fragments omit imports and containing event declarations. See [events and references](../events.md) for enclosing types and [asset validation](../assets.md) for file checks.

- [Switches and self switches](#switches-and-self-switches)
- [Control Variables](#control-variables)
- [Timer saved slots](#timer-saved-slots)
- [Inventory and party changes](#inventory-and-party-changes)
- [Shop Processing](#shop-processing)

## Switches and self switches

`controlSwitches(...)` accepts one switch reference or an inclusive
`{ kind: "referenceRange", from: switchRef({ id: 1 }), to: switchRef({ id: 3 }) }`.
Both endpoints must exist in the final capacity; unnamed intermediate slots are
valid. Reversed ranges fail validation. Both switch commands require an explicit
Boolean `value`. `controlSelfSwitch({ selfSwitch: "A", value: true })` accepts A–D
and uses the executing Map Event's identity. A Common Event called from a Map Event
inherits that identity, so its self switch can affect the caller.

## Control Variables

Control Variables uses a named operand and an explicit operation:

```ts
controlVariables({
  variable: variableRef({ id: 1 }),
  operation: "add",
  value: { kind: "constant", value: 1 },
});
controlVariables({
  variable: { kind: "referenceRange", from: variableRef({ id: 1 }), to: variableRef({ id: 3 }) },
  operation: "set",
  value: { kind: "variable", variable: variableRef({ id: 2 }) },
});
```

Operations are `set`, `add`, `sub`, `mul`, `div`, `mod`. Operand modes are
constant, variable, random, gameData and script. Constants and random endpoints
are integers −99,999,999..99,999,999, retaining numeric negative zero. Ranges and
random endpoints must be ordered. Runtime variable, Game Data and Script values
use native MV evaluation, including flooring when storing numbers, without
literal bounds or clamping. Random samples for each target; every other operand
is evaluated once before the range loop, including self-aliasing variable sources.

Game Data sources use `{ kind: "gameData", source, ... }`:

| source                | Required inputs                                                                                                                          |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| item / weapon / armor | matching item / weapon / armor Project Data Reference                                                                                    |
| actor                 | actorRef and value level/exp/hp/mp/mhp/mmp/atk/def/mat/mdf/agi/luk                                                                       |
| enemy                 | enemy Runtime Selector (`scope: "enemy", target: "enemy", index: 0..7`) and value hp/mp/mhp/mmp/atk/def/mat/mdf/agi/luk                  |
| character             | target Runtime Selector (`scope: "character"`, player/currentEvent/event with positive id) and value mapX/mapY/direction/screenX/screenY |
| party                 | member Runtime Selector (`scope: "party", target: "member", index: 0..7`)                                                                |
| other                 | value mapId/partyMembers/gold/steps/playTime/timer/saveCount/battleCount/winCount/escapeCount                                            |

Every Runtime Selector includes `kind: "runtimeSelector"`. Enemy and party
positions retain numeric negative zero. Fixed references must resolve; unknown
Common Event runtime context is allowed. Determinable unavailable runtime targets
warn and may return native 0. Missing Enemy entries are skipped when a Troop's
runtime members are constructed; saved positions can shift or become unavailable,
and warnings preserve those positions. A hidden member still supplies Game Data.
Inventory Game Data counts exclude equipped items;
actor/enemy status sources have no TP. Script mode uses
`{ kind: "script", script: scriptInput({ code }) }`: the complete single-slot
string is preserved, including empty text, whitespace, CR/LF/CRLF and trailing
characters, without a character or line limit. LF/CR warn about parameter
reconfirmation while retaining text. Native symbolic operation/source/status
codes, character symbolic targets and unused Game Data padding reject negative
zero before conversion; supported numeric values keep it.

## Timer saved slots

```ts
import { controlTimer } from "rpgmaker-event-dsl";

const commands = [
  controlTimer({ action: "start", seconds: 83 }), // [0, 83]
  controlTimer({ action: "stop" }), // [1]
  controlTimer({ action: "stop", seconds: 0 }), // [1, 0]
  controlTimer({ action: "stop", seconds: 83 }), // [1, 83]
];
```

Action is required. Start requires seconds; Stop permits omission or explicit
`undefined`, which leaves the saved seconds slot absent. Every present seconds
value is an integer in 0..5999, including numeric negative zero with its sign
preserved. Decompile writes a present Stop seconds value explicitly, including 0.
Recognized raw Timer commands use the same exact one/two-slot contract. Native
action codes 0/1 are categorical and reject negative zero. Invalid types, null,
missing Start seconds, extra slots, sparse slots and undefined array elements fail
validation before output publication or Push.

## Inventory and party changes

`changeGold({ operation, value })` and `changeItems({ item, operation, amount })`
use explicit quantity objects: `{ kind: "constant", value }` or
`{ kind: "variable", variable: variableRef({ id }) }`. Gold constants are integers
1..9,999,999; item, weapon and armor constants are integers 1..9999. The operation
is `gain` or `lose`. Variable mode preserves its source reference and accepts
runtime values outside the constant range, including zero and negative values;
MV handles its runtime caps separately.

`changeWeapons({ weapon, operation, amount, includeEquipment })` and
`changeArmors({ armor, operation, amount, includeEquipment })` require the boolean
flag, including gain mode. `changePartyMember({ actor, operation, initialize })`
selects one fixed actor, uses `add` or `remove`, and requires the boolean
initialization flag even during removal. All shown fields are required, and the
fixed item/weapon/armor/actor references resolve in their matching project tables.

```ts
changeWeapons({
  weapon: weaponRef({ id: 1 }),
  operation: "gain",
  amount: { kind: "variable", variable: variableRef({ id: 3 }) },
  includeEquipment: true,
});
changePartyMember({ actor: actorRef({ id: 1 }), operation: "remove", initialize: true });
```

## Shop Processing

```ts
shopProcessing({
  goods: [
    { kind: "item", item: itemRef({ id: 1 }) },
    { kind: "weapon", weapon: weaponRef({ id: 2 }), price: 0 },
    { kind: "placeholder" },
    { kind: "armor", armor: armorRef({ id: 3 }), price: 999999 },
  ],
  purchaseOnly: true,
});
```

`goods` is required and may be empty. Each real good uses an existing reference
from its matching category. Omitted `price` means standard price; a custom price
is an integer 0..999999. `purchaseOnly` defaults to false. Goods preserve order
and duplicates. A structural `{ kind: "placeholder" }` has no reference or price
and preserves the exact native four-zero entry, even when mixed or repeated.
Empty goods emits one placeholder; only a sole placeholder decompiles to empty
goods. All 605 continuation records belong to their 302 Shop command.
