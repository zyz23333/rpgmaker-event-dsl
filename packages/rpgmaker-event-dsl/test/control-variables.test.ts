import { expect, it } from "vitest";
import { commonEvent, controlVariables, variableRef } from "../src/index.js";
import { compileCommonEvent } from "../src/compiler/events.js";
import { buildStagedDataGraph, validateStagedDataGraph } from "../src/validation/staged-graph.js";
import { rawDslCommand } from "../src/index.js";
import { renderDecompiledCommandList } from "../src/decompiler/dispatch.js";
import { scriptInput } from "../src/index.js";
import { battlePage, troopEvent } from "../src/index.js";

it("compiles the named constant operand to the exact five saved slots", () => {
  const event = commonEvent({ id: 1, name: "Variables", trigger: "none", commands: [
    controlVariables({ variable: variableRef({ id: 1 }), operation: "add", value: { kind: "constant", value: -0 } } as never),
  ] });
  const graph = buildStagedDataGraph({ declarations: [event], snapshotReferences: { variableCapacity: 1 } });
  expect(compileCommonEvent(event, { nextId: 1, resolver: graph.resolver }).list).toEqual([
    { code: 122, indent: 0, parameters: [1, 1, 1, 0, -0] },
    { code: 0, indent: 0, parameters: [] },
  ]);
});

it("warns for absent runtime members in a known Troop while keeping Common Event context open", () => {
  const command = controlVariables({ variable: variableRef({ id: 1 }), operation: "set", value: { kind: "gameData", source: "enemy", enemy: { kind: "runtimeSelector", scope: "enemy", target: "enemy", index: 7 }, value: "hp" } });
  const common = commonEvent({ id: 1, name: "Reusable", trigger: "none", commands: [command] });
  const troop = troopEvent({ troopId: 1, pages: [battlePage({ commands: [command] })] });
  const graph = buildStagedDataGraph({ declarations: [common, troop], snapshotReferences: { variableCapacity: 1, troops: [{id: 1, name: ""}] }, snapshotTroops: [{id: 1, members: []}] });
  const warnings = validateStagedDataGraph(graph, {scriptEnabled: true}).issues.filter(({code}) => code === "MV-E122-RUNTIME-TARGET");
  expect(warnings).toEqual([expect.objectContaining({identity: "troop:1", nativePath: "pages[0].list[0].parameters[5]", dslPath: "pages[0].commands[0].value.enemy.index", level: "warning"})]);
});

it("warns about single-slot script CR/LF while preserving the complete text", () => {
  const event = commonEvent({ id: 1, name: "Script text", trigger: "none", commands: [controlVariables({ variable: variableRef({ id: 1 }), operation: "set", value: { kind: "script", script: scriptInput({ code: "  1\r\n+2\n" }) } })] });
  const graph = buildStagedDataGraph({ declarations: [event], snapshotReferences: { variableCapacity: 1 } });
  const issues = validateStagedDataGraph(graph, { scriptEnabled: true }).issues;
  expect(issues).toContainEqual(expect.objectContaining({ code: "MV-TEXT-RECONFIRMATION", level: "warning", dslPath: "commands[0].value.script.code", nativePath: "list[0].parameters[4]" }));
  expect(compileCommonEvent(event, {nextId: 1, resolver: graph.resolver}).list[0]?.parameters[4]).toBe("  1\r\n+2\n");
});

it("locates an untyped direct command's missing source variable at its actual DSL position", () => {
  const event = commonEvent({ id: 1, name: "Invalid source", trigger: "none", commands: [{ kind: "controlVariables", variable: variableRef({ id: 1 }), operation: "set", value: { kind: "variable", variable: variableRef({ id: 9 }) } }] });
  const graph = buildStagedDataGraph({ declarations: [event], snapshotReferences: { variableCapacity: 2 } });
  expect(validateStagedDataGraph(graph, { scriptEnabled: true }).issues).toContainEqual(expect.objectContaining({ code: "MV-E122-INPUT", dslPath: "commands[0].value.variable" }));
});

it("validates the named variable operand against its source slot", () => {
  const event = commonEvent({ id: 1, name: "Variable source", trigger: "none", commands: [controlVariables({ variable: variableRef({ id: 1 }), operation: "set", value: { kind: "variable", variable: variableRef({ id: 2 }) } })] });
  const graph = buildStagedDataGraph({ declarations: [event], snapshotReferences: { variableCapacity: 2 } });
  expect(validateStagedDataGraph(graph, {scriptEnabled: true}).issues).toEqual([]);
});

it("renders numeric negative zero in named operands and explicit position selectors", () => {
  const rendered = renderDecompiledCommandList([
    { code: 122, indent: 0, parameters: [1, 1, 0, 0, -0] },
    { code: 122, indent: 0, parameters: [1, 1, 0, 3, 4, -0, 0] },
    { code: 122, indent: 0, parameters: [1, 1, 0, 3, 6, -0, 0] },
    { code: 0, indent: 0, parameters: [] },
  ]);
  expect(rendered.source).toContain('value: { kind: "constant", value: -0 }');
  expect(rendered.source).toContain('enemy: { kind: "runtimeSelector", scope: "enemy", target: "enemy", index: -0 }');
  expect(rendered.source).toContain('member: { kind: "runtimeSelector", scope: "party", target: "member", index: -0 }');
});

it("rejects untyped helper extras and invalid native Game Data padding before they are discarded", () => {
  expect(() => controlVariables({ variable: variableRef({ id: 1 }), operation: "set", value: { kind: "constant", value: 1 }, extra: true } as never)).toThrow(/MV-DSL-SHAPE/);
  const event = commonEvent({ id: 1, name: "Invalid padding", trigger: "none", commands: [rawDslCommand({code: 122, parameters: [1, 1, 0, 3, 0, 1, 9]})] });
  const graph = buildStagedDataGraph({ declarations: [event], snapshotReferences: { variableCapacity: 1 } });
  expect(() => compileCommonEvent(event, { nextId: 1, resolver: graph.resolver })).toThrow(/MV-E122-PADDING/);
});

it("encodes enemy, character and party Game Data using distinct Runtime Selectors", () => {
  const event = commonEvent({ id: 1, name: "Selectors", trigger: "none", commands: [
    controlVariables({ variable: variableRef({ id: 1 }), operation: "set", value: { kind: "gameData", source: "enemy", enemy: { kind: "runtimeSelector", scope: "enemy", target: "enemy", index: -0 }, value: "hp" } } as never),
    controlVariables({ variable: variableRef({ id: 1 }), operation: "set", value: { kind: "gameData", source: "character", target: { kind: "runtimeSelector", scope: "character", target: "currentEvent" }, value: "screenY" } } as never),
    controlVariables({ variable: variableRef({ id: 1 }), operation: "set", value: { kind: "gameData", source: "party", member: { kind: "runtimeSelector", scope: "party", target: "member", index: 7 } } } as never),
  ] });
  const graph = buildStagedDataGraph({ declarations: [event], snapshotReferences: { variableCapacity: 1 } });
  expect(compileCommonEvent(event, { nextId: 1, resolver: graph.resolver }).list).toEqual([
    { code: 122, indent: 0, parameters: [1, 1, 0, 3, 4, -0, 0] },
    { code: 122, indent: 0, parameters: [1, 1, 0, 3, 5, 0, 4] },
    { code: 122, indent: 0, parameters: [1, 1, 0, 3, 6, 7, 0] },
    { code: 0, indent: 0, parameters: [] },
  ]);
});


