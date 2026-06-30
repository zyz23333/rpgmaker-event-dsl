import { describe, expect, it } from "vitest";

import {
  battleProcessing,
  callCommonEvent,
  buildSnapshotReferenceInput,
  changeItems,
  audioAsset,
  classRef,
  commonEvent,
  commonEventRef,
  conditional,
  controlSwitches,
  controlVariables,
  imageAsset,
  inspectCommandInputPrimitives,
  itemRef,
  mapEvent,
  page,
  scriptInput,
  rawDslCommand,
  setEventLocation,
  setVehicleLocation,
  switchDefinition,
  switchRef,
  transferPlayer,
  troopRef,
  validateDslOwnedDeclarations,
  variableDefinition,
  variableRef,
} from "../src/index.js";

describe("validateDslOwnedDeclarations", () => {
  it("rejects duplicate Common Event, Switch, and Variable ids", () => {
    const result = validateDslOwnedDeclarations(
      [
        commonEvent({ id: 1, name: "Alarm A", trigger: "none", commands: [] }),
        commonEvent({ id: 1, name: "Alarm B", trigger: "none", commands: [] }),
        switchDefinition({ id: 2, name: "Gate A" }),
        switchDefinition({ id: 2, name: "Gate B" }),
        variableDefinition({ id: 3, name: "Count A" }),
        variableDefinition({ id: 3, name: "Count B" }),
      ],
      { scriptEnabled: false },
    );

    expect(result.issues.map((issue) => issue.message)).toEqual(
      expect.arrayContaining([
        "Duplicate Common Event id: 1.",
        "Duplicate Switch id: 2.",
        "Duplicate Variable id: 3.",
      ]),
    );
  });

  it("rejects duplicate Map Event identity only within the same map", () => {
    const validResult = validateDslOwnedDeclarations(
      [
        createMapEvent({ mapId: 1, id: 1, name: "Gate A" }),
        createMapEvent({ mapId: 2, id: 1, name: "Gate B" }),
      ],
      { scriptEnabled: false },
    );

    const invalidResult = validateDslOwnedDeclarations(
      [
        createMapEvent({ mapId: 1, id: 1, name: "Gate A" }),
        createMapEvent({ mapId: 1, id: 1, name: "Gate B" }),
      ],
      { scriptEnabled: false },
    );

    expect(validResult.issues).toEqual([]);
    expect(invalidResult.issues.map((issue) => issue.message)).toContain(
      "Duplicate Map Event identity: mapId 1, eventId 1.",
    );
  });

  it("allows duplicate Display Names when they are not referenced by name", () => {
    const result = validateDslOwnedDeclarations(
      [
        commonEvent({ id: 1, name: "Shared", trigger: "none", commands: [] }),
        commonEvent({ id: 2, name: "Shared", trigger: "none", commands: [] }),
        switchDefinition({ id: 1, name: "Shared Switch" }),
        switchDefinition({ id: 2, name: "Shared Switch" }),
        variableDefinition({ id: 1, name: "Shared Variable" }),
        variableDefinition({ id: 2, name: "Shared Variable" }),
      ],
      { scriptEnabled: false },
    );

    expect(result.issues).toEqual([]);
  });

  it("rejects missing and ambiguous name-based references in the visible scope", () => {
    const missingResult = validateDslOwnedDeclarations(
      [
        commonEvent({
          id: 1,
          name: "Caller",
          trigger: "none",
          commands: [callCommonEvent(commonEventRef({ name: "Missing" }))],
        }),
      ],
      { scriptEnabled: false },
    );

    const ambiguousResult = validateDslOwnedDeclarations(
      [
        commonEvent({ id: 1, name: "Shared", trigger: "none", commands: [] }),
        commonEvent({ id: 2, name: "Shared", trigger: "none", commands: [] }),
        commonEvent({
          id: 3,
          name: "Caller",
          trigger: "none",
          commands: [callCommonEvent(commonEventRef({ name: "Shared" }))],
        }),
      ],
      { scriptEnabled: false },
    );

    expect(missingResult.issues.map((issue) => issue.message)).toContain(
      "Unknown commonEvent reference: Missing",
    );
    expect(ambiguousResult.issues.map((issue) => issue.message)).toContain(
      "Ambiguous commonEvent reference: Shared",
    );
  });

  it("rejects explicit id references that are absent from the visible scope", () => {
    const result = validateDslOwnedDeclarations(
      [
        commonEvent({
          id: 1,
          name: "Caller",
          trigger: "none",
          commands: [callCommonEvent(commonEventRef({ id: 99 }))],
        }),
      ],
      { scriptEnabled: false },
    );

    expect(result.issues.map((issue) => issue.message)).toContain(
      "Unknown commonEvent reference id: 99",
    );
  });

  it("does not fall back to snapshot entries for DSL-owned domains", () => {
    const result = validateDslOwnedDeclarations(
      [
        commonEvent({
          id: 1,
          name: "Caller",
          trigger: "none",
          commands: [
            callCommonEvent(commonEventRef({ name: "Snapshot Common" })),
            controlSwitches({ switch: switchRef({ name: "Snapshot Switch" }), value: true }),
            controlVariables({
              variable: variableRef({ name: "Snapshot Variable" }),
              operation: "set",
              value: 1,
            }),
          ],
        }),
      ],
      {
        scriptEnabled: false,
        snapshotReferences: {
          commonEvents: [{ id: 7, name: "Snapshot Common" }],
          switches: [{ id: 8, name: "Snapshot Switch" }],
          variables: [{ id: 9, name: "Snapshot Variable" }],
        },
      },
    );

    expect(result.issues.map((issue) => issue.message)).toEqual(
      expect.arrayContaining([
        "Unknown commonEvent reference: Snapshot Common",
        "Unknown switch reference: Snapshot Switch",
        "Unknown variable reference: Snapshot Variable",
      ]),
    );
  });

  it("resolves external references against the snapshot indexes", () => {
    const result = validateDslOwnedDeclarations(
      [
        switchDefinition({ id: 1, name: "Gate" }),
        variableDefinition({ id: 1, name: "Count" }),
        createMapEvent({
          mapId: 1,
          id: 1,
          name: "Gate",
          commands: [
            changeItems({ item: itemRef({ name: "Potion" }), operation: "gain", amount: 1 }),
          ],
        }),
      ],
      {
        scriptEnabled: false,
        snapshotReferences: {
          items: [{ id: 1, name: "Potion" }],
        },
      },
    );

    expect(result.issues).toEqual([]);
  });

  it("rejects ambiguous external name references from snapshot indexes", () => {
    const result = validateDslOwnedDeclarations(
      [
        createMapEvent({
          mapId: 1,
          id: 1,
          name: "Gate",
          commands: [
            changeItems({ item: itemRef({ name: "Potion" }), operation: "gain", amount: 1 }),
          ],
        }),
      ],
      {
        scriptEnabled: false,
        snapshotReferences: buildSnapshotReferenceInput({
          items: [
            { id: 1, name: "Potion" },
            { id: 2, name: "Potion" },
          ],
        }),
      },
    );

    expect(result.issues.map((issue) => issue.message)).toContain(
      "Ambiguous item reference: Potion",
    );
  });

  it("does not inspect Raw DSL Command parameters as project references", () => {
    const result = validateDslOwnedDeclarations(
      [
        createMapEvent({
          mapId: 1,
          id: 1,
          name: "Raw",
          commands: [rawDslCommand({ code: 117, parameters: [999] })],
        }),
      ],
      { scriptEnabled: false },
    );

    expect(result.issues).toEqual([]);
  });

  it("does not treat random variable operands as variable references", () => {
    const result = validateDslOwnedDeclarations(
      [
        variableDefinition({ id: 1, name: "Count" }),
        createMapEvent({
          mapId: 1,
          id: 1,
          name: "Random Count",
          commands: [
            controlVariables({
              variable: variableRef({ id: 1 }),
              operation: "add",
              value: {
                kind: "random",
                from: 1,
                to: 3,
              },
            }),
          ],
        }),
      ],
      { scriptEnabled: false },
    );

    expect(result.issues).toEqual([]);
  });

  it("rejects Control Variables script operands when scripts are disabled", () => {
    const result = validateDslOwnedDeclarations(
      [
        variableDefinition({ id: 1, name: "Count" }),
        createMapEvent({
          mapId: 1,
          id: 1,
          name: "Script Count",
          commands: [
            controlVariables({
              variable: variableRef({ id: 1 }),
              operation: "set",
              value: {
                kind: "script",
                script: scriptInput({ code: "$gameParty.gold()" }),
              },
            }),
          ],
        }),
      ],
      { scriptEnabled: false },
    );

    expect(result.issues.map((issue) => issue.message)).toContain(
      "Control Variables script operands require explicit config enablement.",
    );
  });

  it("inspects command input primitives recursively without conflating categories", () => {
    const inspection = inspectCommandInputPrimitives([
      {
        source: audioAsset({ folder: "bgm", name: "Theme" }),
        image: imageAsset({ folder: "pictures", name: "Poster" }),
        selector: { kind: "runtimeSelector", scope: "player", target: "current" } as const,
        script: scriptInput({ code: "console.log(1);" }),
        nested: {
          ref: switchRef({ id: 1 }),
        },
      },
    ]);

    expect(inspection.assetReferences).toHaveLength(2);
    expect(inspection.runtimeSelectors).toHaveLength(1);
    expect(inspection.scriptInputs).toHaveLength(1);
    expect(inspection.projectDataReferences).toHaveLength(1);
    expect(inspection.projectDataReferences[0]).toEqual(switchRef({ id: 1 }));
  });

  it("validates Movement command references without resolving runtime selectors", () => {
    const result = validateDslOwnedDeclarations(
      [
        variableDefinition({ id: 1, name: "Map Var" }),
        variableDefinition({ id: 2, name: "X Var" }),
        variableDefinition({ id: 3, name: "Y Var" }),
        createMapEvent({
          mapId: 1,
          id: 1,
          name: "Mover",
          commands: [
            transferPlayer({
              destination: {
                kind: "variables",
                map: variableRef({ id: 1 }),
                x: variableRef({ id: 2 }),
                y: variableRef({ id: 3 }),
              },
            }),
            setVehicleLocation({
              vehicle: "boat",
              destination: { kind: "direct", map: { kind: "map", id: 1 }, x: 4, y: 5 },
            }),
            setEventLocation({
              character: { kind: "runtimeSelector", scope: "character", target: "event", id: 99 },
              destination: {
                kind: "variables",
                x: variableRef({ id: 2 }),
                y: variableRef({ id: 3 }),
              },
            }),
          ],
        }),
      ],
      {
        scriptEnabled: false,
        snapshotReferences: {
          maps: [{ id: 1, name: "Town" }],
        },
      },
    );

    expect(result.issues).toEqual([]);
  });

  it("rejects invalid Set Event Location character runtime selectors", () => {
    const result = validateDslOwnedDeclarations(
      [
        variableDefinition({ id: 1, name: "X Var" }),
        variableDefinition({ id: 2, name: "Y Var" }),
        createMapEvent({
          mapId: 1,
          id: 1,
          name: "Bad Runtime Selectors",
          commands: [
            setEventLocation({
              character: {
                kind: "runtimeSelector",
                scope: "player",
                target: "current",
              } as never,
              destination: { kind: "direct", x: 1, y: 2 },
            }),
            setEventLocation({
              character: {
                kind: "runtimeSelector",
                scope: "character",
                target: "event",
              } as never,
              destination: {
                kind: "variables",
                x: variableRef({ id: 1 }),
                y: variableRef({ id: 2 }),
              },
            }),
            setEventLocation({
              character: { kind: "runtimeSelector", scope: "character", target: "currentEvent" },
              destination: {
                kind: "exchange",
                character: {
                  kind: "runtimeSelector",
                  scope: "character",
                  target: "follower",
                } as never,
              },
            }),
          ],
        }),
      ],
      { scriptEnabled: false },
    );

    expect(result.issues.map((issue) => issue.message)).toEqual(
      expect.arrayContaining([
        "Set Event Location character must use the character runtime selector scope.",
        "Set Event Location character event id must be a positive integer.",
        "Set Event Location exchange character target must be player, currentEvent, or event.",
      ]),
    );
  });

  it("rejects missing variable references in Movement variable destinations", () => {
    const result = validateDslOwnedDeclarations(
      [
        createMapEvent({
          mapId: 1,
          id: 1,
          name: "Bad Mover",
          commands: [
            transferPlayer({
              destination: {
                kind: "variables",
                map: variableRef({ id: 98 }),
                x: variableRef({ id: 99 }),
                y: variableRef({ id: 100 }),
              },
            }),
          ],
        }),
      ],
      { scriptEnabled: false },
    );

    expect(result.issues.map((issue) => issue.message)).toEqual(
      expect.arrayContaining([
        "Unknown variable reference id: 98",
        "Unknown variable reference id: 99",
        "Unknown variable reference id: 100",
      ]),
    );
  });

  it("validates troop references without treating random encounters as references", () => {
    const randomEncounterResult = validateDslOwnedDeclarations(
      [
        createMapEvent({
          mapId: 1,
          id: 1,
          name: "Random Battle",
          commands: [
            battleProcessing({
              troop: {
                kind: "troop",
                useRandomEncounter: true,
              },
            }),
          ],
        }),
      ],
      { scriptEnabled: false },
    );
    const missingTroopResult = validateDslOwnedDeclarations(
      [
        createMapEvent({
          mapId: 1,
          id: 1,
          name: "Fixed Battle",
          commands: [battleProcessing({ troop: troopRef({ id: 99 }) })],
        }),
      ],
      { scriptEnabled: false },
    );

    expect(randomEncounterResult.issues).toEqual([]);
    expect(missingTroopResult.issues.map((issue) => issue.message)).toContain(
      "Unknown troop reference id: 99",
    );
  });

  it("rejects Conditional Branch script conditions when scripts are disabled", () => {
    const result = validateDslOwnedDeclarations(
      [
        createMapEvent({
          mapId: 1,
          id: 1,
          name: "Scripted Branch",
          commands: [
            conditional({
              condition: {
                kind: "script",
                script: scriptInput({ code: "$gameSwitches.value(1)" }),
              },
              then: [],
            }),
          ],
        }),
      ],
      { scriptEnabled: false },
    );

    expect(result.issues.map((issue) => issue.message)).toContain(
      "Conditional Branch script conditions require explicit config enablement.",
    );
  });

  it("validates Project Data References inside Conditional Branch conditions", () => {
    const result = validateDslOwnedDeclarations(
      [
        createMapEvent({
          mapId: 1,
          id: 1,
          name: "Referenced Branch",
          commands: [
            conditional({
              condition: {
                kind: "actor",
                actor: { kind: "actor", id: 1 },
                check: { kind: "class", class: classRef({ id: 99 }) },
              },
              then: [],
            }),
            conditional({
              condition: {
                kind: "variable",
                variable: variableRef({ id: 99 }),
                operator: "eq",
                value: variableRef({ id: 100 }),
              },
              then: [],
            }),
          ],
        }),
      ],
      {
        scriptEnabled: false,
        snapshotReferences: {
          actors: [{ id: 1, name: "Hero" }],
        },
      },
    );

    expect(result.issues.map((issue) => issue.message)).toEqual(
      expect.arrayContaining([
        "Unknown class reference id: 99",
        "Unknown variable reference id: 99",
        "Unknown variable reference id: 100",
      ]),
    );
  });

  it("resolves new Conditional Branch external reference scopes from snapshot input", () => {
    const result = validateDslOwnedDeclarations(
      [
        createMapEvent({
          mapId: 1,
          id: 1,
          name: "Class Branch",
          commands: [
            conditional({
              condition: {
                kind: "actor",
                actor: { kind: "actor", id: 1 },
                check: { kind: "class", class: classRef({ name: "Warrior" }) },
              },
              then: [],
            }),
          ],
        }),
      ],
      {
        scriptEnabled: false,
        snapshotReferences: {
          actors: [{ id: 1, name: "Hero" }],
          classes: [{ id: 1, name: "Warrior" }],
        },
      },
    );

    expect(result.issues).toEqual([]);
  });
});

function createMapEvent(input: {
  mapId: number;
  id: number;
  name: string;
  commands?: Parameters<typeof page>[0]["commands"];
}) {
  return mapEvent({
    mapId: input.mapId,
    id: input.id,
    name: input.name,
    x: 0,
    y: 0,
    pages: [
      page({
        commands: input.commands ?? [],
      }),
    ],
  });
}
