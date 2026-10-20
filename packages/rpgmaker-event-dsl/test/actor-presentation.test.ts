import { expect, it } from "vitest";
import { actorRef, changeActorImages, changeVehicleImage, commonEvent } from "../src/index.js";
import { compileCommonEvent } from "../src/compiler/events.js";
import { readRawCommandList } from "../src/decompiler/core.js";
import { renderDecompiledCommandList } from "../src/decompiler/dispatch.js";
import { buildStagedDataGraph } from "../src/validation/staged-graph.js";

it("preserves independent None image indices in actor and vehicle native records", () => {
  const commands = [
    changeActorImages({ actor: actorRef({ id: 1 }), character: { image: null, index: 7 }, face: { image: null, index: 11 }, battler: null } as never),
    changeVehicleImage({ vehicle: "airship", image: null, index: 7 } as never),
  ];
  const declaration = commonEvent({ id: 1, name: "None images", trigger: "none", commands });
  const graph = buildStagedDataGraph({ declarations: [declaration], snapshotReferences: { actors: [{ id: 1, name: "Mira" }] } });
  const expected = [
    { code: 322, indent: 0, parameters: [1, "", 7, "", 11, ""] },
    { code: 323, indent: 0, parameters: [2, "", 7] },
    { code: 0, indent: 0, parameters: [] },
  ];
  expect(compileCommonEvent(declaration, { nextId: 1, resolver: graph.resolver }).list).toStrictEqual(expected);
  const rendered = renderDecompiledCommandList(readRawCommandList(expected));
  expect(rendered.source).toContain("character: { image: null, index: 7 }");
  expect(rendered.source).toContain("face: { image: null, index: 11 }");
  expect(rendered.source).toContain("battler: null");
  expect(rendered.source).toContain('vehicle: "airship", image: null, index: 7');
});
