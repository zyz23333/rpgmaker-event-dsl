"use strict";
// Additional complete normal-Scene Common Map/Battle pair for VARIABLES-005.
// Importing this module does not launch a product lifecycle or a native game.
const assert = require("node:assert/strict");
const controls = require("./53-runtime-scenarios.cjs");
const copy = (value) => structuredClone(value);
const c = (code, parameters = []) => ({ code, indent: 0, parameters });
function makeScenarios() {
  const base = controls
    .makeScenarios()
    .find((scenario) => scenario.slug === "final-r4-common-complete-variable99");
  assert.ok(base);
  const expected = {
    ...base.plan.expected,
    variableScriptContexts: [7, 0].map((eventId) => ({
      eventId,
      inBattle: eventId === 0,
      emptyPublic: [0, 0, 0],
      emptyStored: ["undefined", "undefined", "undefined"],
      multilinePublic: [5, 5, 5],
      evaluations: 1,
      contextValue: eventId,
    })),
  };
  const commands = [
    c(355, ["window.finalVariableScriptEvaluations=0;"]),
    c(122, [60, 62, 0, 4, ""]),
    c(122, [63, 65, 0, 4, "window.finalVariableScriptEvaluations += 1;\r\n5.9;\r\n"]),
    c(122, [66, 66, 0, 4, "this._eventId\r\n"]),
    c(355, [
      "window.finalVariableScriptContexts.push({eventId:this._eventId,inBattle:$gameParty.inBattle(),emptyPublic:[60,61,62].map(function(id){return $gameVariables.value(id);}),emptyStored:[60,61,62].map(function(id){return String($gameVariables._data[id]);}),multilinePublic:[63,64,65].map(function(id){return $gameVariables.value(id);}),evaluations:window.finalVariableScriptEvaluations,contextValue:$gameVariables.value(66)});",
    ]),
  ];
  const beforeExpected = "expected=" + JSON.stringify(base.plan.expected);
  const oldActual =
    "traceCounts:{map:window.commonContextMapTraces.length,common:window.commonContextTrace.length}}";
  assert.ok(base.observer.includes(beforeExpected));
  assert.ok(base.observer.includes(oldActual));
  const observer =
    "window.finalVariableScriptContexts=[];\n" +
    base.observer
      .replace(beforeExpected, "expected=" + JSON.stringify(expected))
      .replace(
        oldActual,
        oldActual.slice(0, -1) + ",variableScriptContexts:window.finalVariableScriptContexts}",
      );
  return [
    {
      ...base,
      slug: "final-r4-variable-script-map-battle",
      scriptPath: __filename,
      observer,
      plan: {
        ...base.plan,
        expected,
        commands,
        purpose:
          "Additional VARIABLES-005 obligation: full preserved Map/Common/Battle caller with actual empty and CRLF multiline single-slot Script operands, once-before-three-target loop and interpreter context; original eleven pairs remain separately required.",
      },
      async fixture(seed) {
        const value = copy(await base.fixture(seed));
        const list = value.carriers["CommonEvents.json"][1].list;
        list.splice(list.length - 1, 0, ...copy(commands));
        value.loadedCarriers["CommonEvents.json"] = copy(value.carriers["CommonEvents.json"]);
        return { ...value, expected, variableScriptContextSupplement: { commands, expected } };
      },
    },
  ];
}
module.exports = { makeScenarios };
