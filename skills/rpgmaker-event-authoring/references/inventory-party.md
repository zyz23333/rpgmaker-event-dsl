# Inventory and party commands

Choose a quantity mode explicitly for `changeGold`, `changeItems`, `changeWeapons`
and `changeArmors`: `{ kind: "constant", value }` or
`{ kind: "variable", variable: variableRef({ id }) }`. Gold constants are integers
1..9,999,999; item, weapon and armor constants are integers 1..9999. Select `gain`
or `lose` independently. A runtime variable may contain zero, a negative number or
a value outside the constant range. The command preserves the source reference;
MV applies that runtime value and its inventory or gold caps during execution.

```ts
changeGold({ operation: "gain", value: { kind: "constant", value: 250 } });
changeItems({
  item: itemRef({ id: 1 }),
  operation: "lose",
  amount: { kind: "variable", variable: variableRef({ id: 3 }) },
});
changeWeapons({
  weapon: weaponRef({ id: 1 }),
  operation: "gain",
  amount: { kind: "constant", value: 1 },
  includeEquipment: true,
});
changeArmors({
  armor: armorRef({ id: 1 }),
  operation: "lose",
  amount: { kind: "constant", value: 1 },
  includeEquipment: false,
});
changePartyMember({ actor: actorRef({ id: 1 }), operation: "remove", initialize: true });
```

Every shown field is required. Item, weapon, armor and actor references resolve
within their matching project category. Variable references may address unnamed
System slots within the final capacity. `includeEquipment` is an explicit saved
boolean for weapons and armors even during gain; `initialize` is an explicit saved
boolean for party membership even during removal. Keep these inactive settings
when taking over existing data. Party membership selects one fixed Actor reference
and uses `add` or `remove`.
