import { readFile } from "node:fs/promises";
import { expect, it } from "vitest";
import { actorRef, changeActorImages, changeVehicleImage, changeName, changeNickname, changeProfile, nameInputProcessing, commonEvent, rawDslCommand, imageAsset, troopEvent, battlePage, type DslCommand } from "../src/index.js";
import { compileCommonEvent } from "../src/compiler/events.js";
import { readRawCommandList } from "../src/decompiler/core.js";
import { renderDecompiledCommandList } from "../src/decompiler/dispatch.js";
import { buildStagedDataGraph, validateDslOwnedDeclarations } from "../src/validation/staged-graph.js";

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

it("validates original actor text and image inputs before projection at helpers and direct compilation", () => {
  const actor = actorRef({ id: 1 });
  const images = { actor, character: { image: null, index: 7 }, face: { image: null, index: 11 }, battler: null };
  const graph = buildStagedDataGraph({ declarations: [], snapshotReferences: { actors: [{ id: 1, name: "Mira" }] } });
  const cases = [
    [nameInputProcessing, "nameInputProcessing", { actor, maxCharacters: 0 }],
    [nameInputProcessing, "nameInputProcessing", { actor, maxCharacters: 17 }],
    [nameInputProcessing, "nameInputProcessing", { actor, maxCharacters: undefined }],
    [changeName, "changeName", { actor, name: "", ignored: true }],
    [changeNickname, "changeNickname", { actor, nickname: null }],
    [changeProfile, "changeProfile", { actor: { kind: "actor", id: 1, ignored: true }, profile: "" }],
    [changeActorImages, "changeActorImages", { ...images, face: { image: null, index: -0 } }],
    [changeActorImages, "changeActorImages", { ...images, face: { image: null, index: 2147483648 } }],
    [changeActorImages, "changeActorImages", { ...images, character: { image: null, index: 8 } }],
    [changeActorImages, "changeActorImages", { ...images, character: null }],
    [changeActorImages, "changeActorImages", { ...images, battler: { kind: "asset", category: "image", folder: "faces", name: "Actor1" } }],
    [changeVehicleImage, "changeVehicleImage", { vehicle: "car", image: null, index: 0 }],
    [changeVehicleImage, "changeVehicleImage", { vehicle: "boat", image: null, index: 8 }],
  ] as const;
  for (const [helper, kind, input] of cases) {
    expect(() => helper(input as never)).toThrow(/MV-(?:DSL-SHAPE|E\d+-INPUT)/u);
    const declaration = commonEvent({ id: 1, name: "Bad actor presentation", trigger: "none", commands: [{ kind, ...input } as never] });
    expect(() => compileCommonEvent(declaration, { nextId: 1, resolver: graph.resolver })).toThrow(/MV-(?:DSL-SHAPE|E\d+-INPUT)/u);
  }
  let reads = 0;
  const accessor = Object.defineProperty({ actor, name: "" }, "name", { enumerable: true, get() { reads++; return ""; } });
  expect(() => changeName(accessor)).toThrow(/MV-DSL-SHAPE/u);
  expect(reads).toBe(0);
});

it("rejects malformed recognized Actor presentation native and raw saved slots", () => {
  const graph = buildStagedDataGraph({ declarations: [], snapshotReferences: { actors: [{ id: 1, name: "Mira" }] } });
  const invalid: Array<[number, unknown[]]> = [
    [303, [1, 0]], [303, [1, 17]], [303, [0, 1]], [303, [1, 1.5]],
    [320, [0, ""]], [324, [1, null]], [325, [1, "", "extra"]],
    [322, [1, "", 8, "", 0, ""]], [322, [1, "", 0, "", 2147483648, ""]],
    [322, [1, "", 0, "", -0, ""]], [322, [1, "", 0, "", 0]],
    [323, [-0, "", 0]], [323, [3, "", 0]], [323, [0, "", 8]], [323, [0, "", 0.5]],
  ];
  for (const [code, parameters] of invalid) {
    const saved = [{ code, indent: 0, parameters }, { code: 0, indent: 0, parameters: [] }];
    expect(() => renderDecompiledCommandList(readRawCommandList(saved))).toThrow(/MV-(?:E\d+-PARAMETERS|COMMAND-PARAMETERS)/u);
    const declaration = commonEvent({ id: 1, name: "Bad raw presentation", trigger: "none", commands: [rawDslCommand({ code, parameters } as never)] });
    expect(() => compileCommonEvent(declaration, { nextId: 1, resolver: graph.resolver })).toThrow(/MV-(?:E\d+-PARAMETERS|COMMAND-PARAMETERS)/u);
  }
});

it("warns for complete Actor strings, non-None face layout and known battle context without changing saved text", () => {
  const actor = actorRef({ id: 1 });
  const commands = [
    changeName({ actor, name: " a\n " }),
    changeNickname({ actor, nickname: "a\r\nb" }),
    changeProfile({ actor, profile: "a\n" }),
    changeProfile({ actor, profile: "a\n\n" }),
    changeProfile({ actor, profile: "a\r\nb" }),
    changeActorImages({ actor, character: { image: null, index: 7 }, face: { image: imageAsset({ folder: "faces", name: "Unscanned" }), index: 11 }, battler: null }),
    changeActorImages({ actor, character: { image: null, index: 7 }, face: { image: null, index: 2147483647 }, battler: null }),
    nameInputProcessing({ actor, maxCharacters: 16 }),
    changeVehicleImage({ vehicle: "boat", image: null, index: 7 }),
  ];
  const common = commonEvent({ id: 1, name: "Text warning boundary", trigger: "none", commands });
  const options = { scriptEnabled: false, snapshotReferences: { actors: [{ id: 1, name: "Mira" }], troops: [{ id: 1, name: "Troop" }] }, snapshotTroops: [{ id: 1, members: [] }] };
  const issues = validateDslOwnedDeclarations([common], options).issues;
  expect(issues.map(({ code, nativePath, dslPath }) => ({ code, nativePath, dslPath }))).toStrictEqual([
    { code: "MV-E320-TEXT-RECONFIRMATION", nativePath: "list[0].parameters[1]", dslPath: "commands[0].name" },
    { code: "MV-E324-TEXT-RECONFIRMATION", nativePath: "list[1].parameters[1]", dslPath: "commands[1].nickname" },
    { code: "MV-E325-TEXT-RECONFIRMATION", nativePath: "list[3].parameters[1]", dslPath: "commands[3].profile" },
    { code: "MV-E325-TEXT-RECONFIRMATION", nativePath: "list[4].parameters[1]", dslPath: "commands[4].profile" },
    { code: "MV-E322-FACE-LAYOUT", nativePath: "list[5].parameters[4]", dslPath: "commands[5].face.index" },
  ]);
  expect(issues[0]?.message).toMatch(/LF.*single-line/u);
  expect(issues[1]?.message).toMatch(/LF.*single-line.*CR.*native verification/u);
  expect(issues[2]?.message).toMatch(/LF.*two-line/u);
  expect(issues[3]?.message).toMatch(/CR.*native verification/u);
  expect(issues[3]?.message).not.toContain("two-line");
  expect(issues.every(({ level }) => level === "warning")).toBe(true);
  const battle = troopEvent({ troopId: 1, pages: [battlePage({ commands: commands.slice(7) })] });
  const battleIssues = validateDslOwnedDeclarations([battle], options).issues;
  expect(battleIssues).toMatchObject([
    { code: "MV-E303-BATTLE", nativePath: "pages[0].list[0]", dslPath: "pages[0].commands[0]", message: expect.stringMatching(/battle.*skips.*Name/u) },
    { code: "MV-E323-BATTLE", nativePath: "pages[0].list[1]", dslPath: "pages[0].commands[1]", message: expect.stringMatching(/map vehicle object.*visibility/u) },
  ]);
});

it("evaluates canonical Actor presentation source against independent complete saved vectors", async () => {
  const { commands: expected } = JSON.parse(await readFile(new URL("./fixtures/mv-evidence/actor-presentation-cases.json", import.meta.url), "utf8"));
  const rendered = renderDecompiledCommandList(readRawCommandList(expected));
  expect(rendered.source).not.toContain("rawDslCommand");
  const bindings = { actorRef, imageAsset, nameInputProcessing, changeName, changeNickname, changeProfile, changeActorImages, changeVehicleImage };
  const commands = new Function(...Object.keys(bindings), `return [${rendered.source}];`)(...Object.values(bindings)) as DslCommand[];
  const declaration = commonEvent({ id: 1, name: "Presentation vectors", trigger: "none", commands });
  const graph = buildStagedDataGraph({ declarations: [declaration], snapshotReferences: { actors: [{ id: 1, name: "Mira" }] } });
  expect(commands).toHaveLength(19);
  expect(compileCommonEvent(declaration, { nextId: 1, resolver: graph.resolver }).list).toStrictEqual(expected);
  const long = "ÖÐÎÄ\r\n".repeat(1025) + "Î²\n";
  const longEvent = commonEvent({ id: 1, name: "No text cap", trigger: "none", commands: [changeName({ actor: actorRef({ id: 1 }), name: long }), changeNickname({ actor: actorRef({ id: 1 }), nickname: long }), changeProfile({ actor: actorRef({ id: 1 }), profile: long })] });
  expect(compileCommonEvent(longEvent, { nextId: 1, resolver: graph.resolver }).list).toStrictEqual([
    { code: 320, indent: 0, parameters: [1, long] }, { code: 324, indent: 0, parameters: [1, long] }, { code: 325, indent: 0, parameters: [1, long] }, { code: 0, indent: 0, parameters: [] },
  ]);
});
