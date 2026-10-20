import { expect, it } from "vitest";

import { actorRef, changeEquipment, commonEvent, rawDslCommand } from "../src/index.js";
import { compileCommonEvent } from "../src/compiler/events.js";
import { readRawCommandList } from "../src/decompiler/core.js";
import { renderDecompiledCommandList } from "../src/decompiler/dispatch.js";
import { buildStagedDataGraph, validateStagedDataGraph } from "../src/validation/staged-graph.js";

it("preserves None and runtime equipment candidates at zero-based non-five-slot positions", () => {
  const declaration = commonEvent({ id: 1, name: "Equipment", trigger: "none", commands: [
    changeEquipment({ actor: actorRef({ id: 7 }), slotIndex: 0, equipment: null } as never),
    changeEquipment({ actor: actorRef({ id: 7 }), slotIndex: 1, equipment: {
      kind: "runtimeSelector", scope: "equipment", target: "idForSlot", id: 3,
    } } as never),
    changeEquipment({ actor: actorRef({ id: 7 }), slotIndex: 6, equipment: {
      kind: "runtimeSelector", scope: "equipment", target: "idForSlot", id: 999,
    } } as never),
  ] });
  const graph = buildStagedDataGraph({ declarations: [declaration], snapshotReferences: {
    actors: [{ id: 7, name: "Hero" }],
  } });
  const expected = [
    { code: 319, indent: 0, parameters: [7, 1, 0] },
    { code: 319, indent: 0, parameters: [7, 2, 3] },
    { code: 319, indent: 0, parameters: [7, 7, 999] },
    { code: 0, indent: 0, parameters: [] },
  ];
  expect(compileCommonEvent(declaration, { nextId: 1, resolver: graph.resolver }).list).toStrictEqual(expected);
  const source = renderDecompiledCommandList(readRawCommandList(expected)).source;
  expect(source).toContain("slotIndex: 0, equipment: null");
  expect(source).toContain('slotIndex: 1, equipment: { kind: "runtimeSelector", scope: "equipment", target: "idForSlot", id: 3 }');
  expect(source).toContain("slotIndex: 6");
  expect(source).not.toMatch(/weaponRef|armorRef|equipmentTypeId|itemId/u);
});

it("refuses malformed native equipment slots and known raw None sentinels", () => {
  const graph = buildStagedDataGraph({ declarations: [], snapshotReferences: { actors: [{ id: 7, name: "Hero" }] } });
  for (const parameters of [
    [7, 1, -0], [7, 1, 0, 0], [7, 1], [7, 0, 3], [7, 1.5, 3],
    [-0, 1, 3], [7, 1, -1], [7, 1, Number.MAX_SAFE_INTEGER + 1],
  ]) {
    expect(() => renderDecompiledCommandList(readRawCommandList([
      { code: 319, indent: 0, parameters }, { code: 0, indent: 0, parameters: [] },
    ]))).toThrow(/MV-E319-PARAMETERS.*parameters/u);
    const declaration = commonEvent({ id: 1, name: "Bad raw", trigger: "none", commands: [rawDslCommand({ code: 319, parameters })] });
    expect(() => compileCommonEvent(declaration, { nextId: 1, resolver: graph.resolver })).toThrow(/MV-E319-PARAMETERS.*parameters/u);
  }
});

it("validates final System slot capacity and warns about dynamic candidates without fixed-table substitution", () => {
  const equipmentTypes = ["", "Weapon", "Shield", "Head", "Body", "Ring", "Boots", "Cape"];
  const snapshotReferences = {
    actors: [{ id: 7, name: "Hero" }],
    weapons: [{ id: 3, name: "Sword" }],
    armors: [{ id: 3, name: "Shield" }, { id: 4, name: "Armor only" }],
  };
  const validate = (slotIndex: number, id: number | null, raw = false) => {
    const declaration = commonEvent({ id: 1, name: "Dynamic", trigger: "none", commands: [
      raw ? rawDslCommand({ code: 319, parameters: [7, slotIndex + 1, id ?? 0] }) : changeEquipment({
        actor: actorRef({ id: 7 }), slotIndex, equipment: id === null ? null : {
          kind: "runtimeSelector", scope: "equipment", target: "idForSlot", id,
        },
      }),
    ] });
    return validateStagedDataGraph(buildStagedDataGraph({ declarations: [declaration], snapshotReferences, snapshotEquipmentTypes: equipmentTypes }), { scriptEnabled: false }).issues;
  };
  for (const raw of [false, true]) {
    expect(validate(0, null, raw).filter((issue) => issue.level === "error")).toStrictEqual([]);
    expect(validate(6, null, raw).filter((issue) => issue.level === "error")).toStrictEqual([]);
    expect(validate(7, null, raw)).toEqual(expect.arrayContaining([
      expect.objectContaining({ level: "error", code: "MV-E319-SLOTS", nativePath: "list[0].parameters[1]" }),
    ]));
    const missingWeapon = validate(0, 4, raw);
    expect(missingWeapon.filter((issue) => issue.level === "error")).toStrictEqual([]);
    expect(missingWeapon).toEqual(expect.arrayContaining([
      expect.objectContaining({ level: "warning", code: "MV-E319-CANDIDATE", message: expect.stringMatching(/weapon.*missing.*unload/iu) }),
    ]));
    expect(validate(1, 3, raw).filter((issue) => issue.level === "error")).toStrictEqual([]);
    expect(validate(6, 999, raw)).toEqual(expect.arrayContaining([
      expect.objectContaining({ level: "warning", code: "MV-E319-CANDIDATE" }),
    ]));
  }
});

it("rejects malformed equipment helpers and direct commands without replacing the runtime selector", () => {
  const input = { actor: actorRef({ id: 7 }), slotIndex: 1, equipment: {
    kind: "runtimeSelector", scope: "equipment", target: "idForSlot", id: 3,
  } };
  let reads = 0;
  const accessor = Object.defineProperty({ ...input }, "equipment", {
    enumerable: true, get() { reads++; return input.equipment; },
  });
  for (const bad of [
    { ...input, ignored: true }, accessor, Object.create(input),
    { ...input, slotIndex: -1 }, { ...input, slotIndex: 1.5 },
    { ...input, equipment: undefined }, { ...input, equipment: { ...input.equipment, id: 0 } },
    { ...input, equipment: { kind: "weapon", id: 3 } },
    { ...input, equipment: { ...input.equipment, fallback: true } },
    { ...input, actor: { kind: "actor", id: 7, extra: true } },
  ]) expect(() => changeEquipment(bad as never)).toThrow(/MV-(?:DSL-SHAPE|E319-INPUT)/u);
  expect(reads).toBe(0);
  const graph = buildStagedDataGraph({ declarations: [], snapshotReferences: { actors: [{ id: 7, name: "Hero" }] } });
  const direct = commonEvent({ id: 1, name: "Bad direct", trigger: "none", commands: [
    { kind: "changeEquipment", ...input, equipment: { kind: "armor", id: 3 } } as never,
  ] });
  expect(() => compileCommonEvent(direct, { nextId: 1, resolver: graph.resolver })).toThrow(/MV-E319-INPUT.*equipment/u);
});
