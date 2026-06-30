import { describe, expect, it } from "vitest";

import {
  battleProcessing,
  callCommonEvent,
  buildSnapshotReferenceInput,
  changeItem,
  commonEvent,
  commonEventRef,
  controlSwitch,
  controlVariable,
  itemRef,
  mapEvent,
  page,
  rawDslCommand,
  switchDefinition,
  switchRef,
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
            controlSwitch({ switch: switchRef({ name: "Snapshot Switch" }), value: true }),
            controlVariable({
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
            changeItem({ item: itemRef({ name: "Potion" }), operation: "gain", amount: 1 }),
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
            changeItem({ item: itemRef({ name: "Potion" }), operation: "gain", amount: 1 }),
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
            controlVariable({
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
