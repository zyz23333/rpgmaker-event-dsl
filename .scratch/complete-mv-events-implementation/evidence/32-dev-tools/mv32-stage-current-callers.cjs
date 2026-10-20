const fs = require('node:fs');
const path = require('node:path');
const root = 'C:/Users/Shuen/.codex/worktrees/mv-ticket-32/rpgmaker-event-dsl';
const edit = (relative, changes) => {
  const file = path.join(root, relative);
  let text = fs.readFileSync(file, 'utf8');
  for (const [from, to] of new Map(changes)) {
    if (text.includes(to)) continue;
    if (!text.includes(from)) throw Error(`Missing exact caller in ${relative}: ${from}`);
    text = text.replaceAll(from, to);
  }
  fs.writeFileSync(file, text);
};
for (const name of ['dsl', 'events', 'staged-graph', 'system-slots']) {
  const file = `packages/rpgmaker-event-dsl/test/${name}.test.ts`;
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  const changes = [];
  for (const match of text.matchAll(/changeItems\(\{[^\n]+amount: (\d+) \}\)/g))
    changes.push([match[0], match[0].replace(`amount: ${match[1]}`, `amount: { kind: "constant", value: ${match[1]} }`)]);
  if (text.includes('changeGold({ operation: "gain", value: 5 })')) changes.push(['changeGold({ operation: "gain", value: 5 })', 'changeGold({ operation: "gain", value: { kind: "constant", value: 5 } })']);
  if (name === 'dsl') changes.push(
    ['changeWeapons({ weapon: { kind: "weapon", id: 1 }, operation: "gain", amount: 1 })', 'changeWeapons({ weapon: { kind: "weapon", id: 1 }, operation: "gain", amount: { kind: "constant", value: 1 }, includeEquipment: false })'],
    ['changeArmors({ armor: { kind: "armor", id: 1 }, operation: "lose", amount: 1 })', 'changeArmors({ armor: { kind: "armor", id: 1 }, operation: "lose", amount: { kind: "constant", value: 1 }, includeEquipment: false })'],
    ['changePartyMember({ actor: { kind: "actor", id: 1 }, operation: "add" })', 'changePartyMember({ actor: { kind: "actor", id: 1 }, operation: "add", initialize: false })']);
  if (name === 'events') changes.push(
    ['changeGold({ operation: "lose", value: variableRef({ name: "Count" }) })', 'changeGold({ operation: "lose", value: { kind: "variable", variable: variableRef({ name: "Count" }) } })'],
    ['amount: variableRef({ name: "Count" }),', 'amount: { kind: "variable", variable: variableRef({ name: "Count" }) },'],
    ['amount: 2,', 'amount: { kind: "constant", value: 2 },']);
  edit(file, changes);
}
edit('packages/rpgmaker-event-dsl/test/decompiler.test.ts', [
 ['operation: "lose", amount: 2 }),', 'operation: "lose", amount: { kind: "constant", value: 2 } }),'],
 ['operation: "gain", amount: variableRef({ id: 3 }), includeEquipment: true }),', 'operation: "gain", amount: { kind: "variable", variable: variableRef({ id: 3 }) }, includeEquipment: true }),'],
 ['operation: "lose", amount: 1, includeEquipment: false }),', 'operation: "lose", amount: { kind: "constant", value: 1 }, includeEquipment: false }),'],
]);
edit('example/full-event/src/full-event.events.ts', [
 ['value: 100,', 'value: { kind: "constant", value: 100 },'],
 ['amount: 1,', 'amount: { kind: "constant", value: 1 },'],
]);
