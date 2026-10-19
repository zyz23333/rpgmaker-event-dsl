import { describe, expect, it } from "vitest";
import {
  actorRef,
  imageAsset,
  itemRef,
  mapEvent,
  page,
  switchDefinition,
  switchRef,
  variableRef,
} from "../src/index.js";
import type { DslOwnedDeclaration, EventPage, PageConditions } from "../src/index.js";
import { compileMapEvent } from "../src/compiler/events.js";
import { buildStagedDataGraph, validateStagedDataGraph } from "../src/validation/staged-graph.js";
import { blankEvent, blankPage } from "./support/map-event-fixtures.js";

const event = (input: Parameters<typeof page>[0]) =>
  mapEvent({
    mapId: 1,
    id: 1,
    name: "Complete blank",
    note: blankEvent.note,
    x: 0,
    y: 0,
    pages: [page(input)],
  });
function graph(input: Parameters<typeof page>[0], declarations: DslOwnedDeclaration[] = []) {
  return buildStagedDataGraph({
    declarations: [event(input), ...declarations],
    snapshotReferences: {
      actors: [{ id: 1, name: "Hero" }],
      items: [{ id: 1, name: "Potion" }],
      switchCapacity: 2,
      variableCapacity: 2,
    },
    snapshotMaps: [{ id: 1, width: 17, height: 13, tilesetId: 2, eventLocations: [] }],
    snapshotTilesets: [{ id: 2, tilesetNames: [null, {}, "", 0, false, "B", "", "D", "E"] }],
  });
}
const issues = (input: Parameters<typeof page>[0], declarations: DslOwnedDeclaration[] = []) =>
  validateStagedDataGraph(graph(input, declarations), { scriptEnabled: false }).issues;

describe("complete Map Event saved state", () => {
  it("compiles omitted groups, empty groups and explicit defaults to the independent native blank", () => {
    const inputs: Parameters<typeof page>[0][] = [
      { commands: [] },
      { commands: [], conditions: {}, image: {}, movement: {}, options: {} },
      {
        commands: [],
        image: { character: null, characterIndex: 0, tileId: 0, direction: "down", pattern: 0 },
        movement: {
          type: "fixed",
          speed: 3,
          frequency: 3,
          route: { commands: [], repeat: true, skippable: false, wait: false },
        },
        priority: "below",
        options: { walkAnimation: true, stepAnimation: false, directionFix: false, through: false },
        trigger: "action",
      },
    ];
    for (const input of inputs)
      expect(
        compileMapEvent(event(input), { nextId: 1, resolver: graph(input).resolver }),
      ).toStrictEqual(blankEvent);
  });

  it.each(["$Big", "!$Big", "$!Big", "People1"])(
    "keeps character index, tile and priority independent for %s",
    (name) => {
      const input = {
        commands: [],
        image: {
          character: imageAsset({ folder: "characters", name }),
          characterIndex: 7,
          tileId: 1023,
          direction: "up" as const,
          pattern: 2,
        },
      };
      const compiled = compileMapEvent(event(input), {
        nextId: 1,
        resolver: graph(input).resolver,
      });
      expect(compiled.pages![0]).toStrictEqual({
        ...blankPage,
        image: { characterName: name, characterIndex: 7, tileId: 1023, direction: 8, pattern: 2 },
      });
    },
  );

  it.each([1, 255, 256, 511, 512, 767, 768, 1023])(
    "consumes only the selected tileset group for tile %i",
    (tileId) => {
      const result = issues({ commands: [], image: { tileId } });
      expect(result.filter((issue) => issue.level === "error")).toEqual([]);
      expect(result.some((issue) => issue.code === "MV-MAP-TILESET-EMPTY")).toBe(
        tileId === 256 || tileId === 511,
      );
    },
  );

  it("allows disabled explicit saved IDs but resolves every enabled or named condition", () => {
    const slots: PageConditions = {
      actor: { enabled: false, ref: actorRef({ id: 0 }) },
      item: { enabled: false, ref: itemRef({ id: 999 }) },
      switch1: { enabled: false, ref: switchRef({ id: 0 }) },
      switch2: { enabled: false, ref: switchRef({ id: 999 }) },
      variable: { enabled: false, ref: variableRef({ id: 999 }), atLeast: -99999999 },
      selfSwitch: { enabled: false, value: "D" },
    };
    expect(issues({ commands: [], conditions: slots })).toEqual([]);
    for (const slot of ["actor", "item", "switch1", "switch2", "variable"] as const)
      expect(
        issues({
          commands: [],
          conditions: { ...slots, [slot]: { ...slots[slot], enabled: true } },
        }).some((issue) => issue.level === "error"),
      ).toBe(true);
    expect(
      issues(
        {
          commands: [],
          conditions: { switch1: { enabled: false, ref: switchRef({ name: "Owned" }) } },
        },
        [switchDefinition({ id: 1, name: "Owned" })],
      ),
    ).toEqual([]);
    expect(
      issues({
        commands: [],
        conditions: { switch1: { enabled: false, ref: switchRef({ name: "Missing" }) } },
      }).some((issue) => issue.level === "error"),
    ).toBe(true);
    expect(
      issues(
        {
          commands: [],
          conditions: { switch1: { enabled: false, ref: switchRef({ name: "Owned" }) } },
        },
        [switchDefinition({ id: 1, name: "Owned" }), switchDefinition({ id: 2, name: "Owned" })],
      ).some((issue) => issue.level === "error"),
    ).toBe(true);
  });

  it.each([
    { conditions: null },
    { conditions: { switch1: { ref: switchRef({ id: 1 }) } } },
    { conditions: { switch1: { enabled: false, ref: itemRef({ id: 1 }) } } },
    { conditions: { switch1: { enabled: false, ref: switchRef({ id: -1 }) } } },
    {
      conditions: { variable: { enabled: false, ref: variableRef({ id: 0 }), atLeast: 100000000 } },
    },
    { conditions: { selfSwitch: { enabled: false, value: "E" } } },
    { image: null },
    { image: { character: imageAsset({ folder: "pictures", name: "Wrong" }), tileId: 1 } },
    { image: { characterIndex: 8 } },
    { image: { characterIndex: -1 } },
    { image: { characterIndex: 0.5 } },
    { image: { tileId: 1024 } },
    { image: { tileId: -1 } },
    { image: { pattern: 3 } },
    { image: { direction: "south" } },
    { priority: "middle" },
    { trigger: "none" },
    { options: null },
    { options: { walkAnimation: 1 } },
    { options: { through: null } },
    { movement: null },
    { movement: { type: "manual" } },
    { movement: { speed: 0 } },
    { movement: { speed: 7 } },
    { movement: { frequency: 0 } },
    { movement: { frequency: 6 } },
    { unknown: true },
    { conditions: { unknown: true } },
    { image: { unknown: true } },
    { options: { unknown: true } },
  ])("rejects invalid or unknown saved settings even while inactive: %j", (invalid) => {
    expect(
      issues({ commands: [], ...invalid } as unknown as Parameters<typeof page>[0]).some(
        (issue) => issue.level === "error",
      ),
    ).toBe(true);
  });

  it("warns at 21 pages and retains page order without adding a 999 event-ID limit", () => {
    for (const count of [20, 21]) {
      const definition = mapEvent({
        mapId: 1,
        id: 1001,
        name: "Many",
        x: 0,
        y: 0,
        pages: Array.from({ length: count }, () => page({ commands: [] })) as [
          EventPage,
          ...EventPage[],
        ],
      });
      const staged = buildStagedDataGraph({ declarations: [definition] });
      const result = validateStagedDataGraph(staged, { scriptEnabled: false });
      expect(result.issues.filter((issue) => issue.level === "error")).toEqual([]);
      expect(result.issues.some((issue) => issue.code === "MV-MAP-PAGE-COUNT")).toBe(count === 21);
      expect(
        compileMapEvent(definition, { nextId: 1001, resolver: staged.resolver }).pages,
      ).toStrictEqual(Array(count).fill(blankPage));
    }
  });
});
