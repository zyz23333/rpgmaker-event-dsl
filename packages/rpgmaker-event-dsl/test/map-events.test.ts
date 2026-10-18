import { rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { cloneWorkspace, compileWorkspace, inspectWorkspaceMap } from "../src/workspace-api.js";
import {
  compileMapWorkspace,
  createMapWorkspace,
  mapFixture,
  readWorkspaceFiles,
} from "./map-observation-fixture.js";

describe("event Map Inspection", () => {
  it("reports event pages, conditions, triggers, images, and compact command summaries without image files", async () => {
    const { workspaceRoot } = await createMapWorkspace();
    const snapshot = join(workspaceRoot, ".rpgmaker-event-dsl", "project-data-snapshot");
    try {
      const map = {
        ...mapFixture(),
        events: [
          null,
          {
            id: 1,
            name: "Entrance",
            note: "Interaction",
            x: 2,
            y: 1,
            pages: [
              {
                conditions: { switch1Valid: false },
                trigger: 0,
                image: {
                  characterName: "Actor1",
                  characterIndex: 2,
                  direction: 4,
                  pattern: 1,
                  tileId: 0,
                },
                list: [
                  { code: 101, indent: 0, parameters: ["", 0, 0, 2] },
                  { code: 401, indent: 0, parameters: ["Welcome to town"] },
                  { code: 0, indent: 0, parameters: [] },
                ],
              },
              {
                conditions: {
                  switch1Valid: true,
                  switch1Id: 1,
                  variableValid: true,
                  variableId: 1,
                  variableValue: 3,
                },
                trigger: 4,
                image: {
                  characterName: "",
                  characterIndex: 0,
                  direction: 2,
                  pattern: 0,
                  tileId: 0,
                },
                list: [
                  { code: 117, indent: 0, parameters: [2] },
                  { code: 0, indent: 0, parameters: [] },
                ],
              },
            ],
          },
        ],
      };
      await writeFile(join(snapshot, "Map001.json"), JSON.stringify(map));
      await writeFile(
        join(snapshot, "System.json"),
        JSON.stringify({ switches: ["", "Gate Open"], variables: ["", "Visit Count"] }),
      );
      await writeFile(
        join(snapshot, "CommonEvents.json"),
        JSON.stringify([null, null, { id: 2, name: "Greeting", list: [] }]),
      );
      const before = await readWorkspaceFiles(workspaceRoot);
      const result = await inspectWorkspaceMap({
        workspaceRoot,
        mapId: 1,
        selector: { kind: "event", eventId: 1 },
      });
      expect(result).toMatchObject({
        schemaVersion: 1,
        kind: "map-event",
        source: "snapshot",
        map: { id: 1 },
        event: {
          id: 1,
          name: "Entrance",
          note: "Interaction",
          x: 2,
          y: 1,
          pages: [
            {
              page: 1,
              conditions: { switch1Valid: false },
              trigger: 0,
              triggerName: "action",
              image: {
                characterName: "Actor1",
                characterIndex: 2,
                direction: 4,
                pattern: 1,
                tileId: 0,
              },
              commandSummary: {
                recordCount: 3,
                operations: [
                  {
                    index: 0,
                    code: 101,
                    recordCount: 2,
                    status: "recognized",
                    helpers: expect.arrayContaining(["showText"]),
                  },
                ],
              },
            },
            {
              page: 2,
              trigger: 4,
              triggerName: "parallel",
              conditions: { variableValue: 3 },
              references: [
                { scope: "switch", id: 1, name: "Gate Open", status: "resolved" },
                { scope: "variable", id: 1, name: "Visit Count", status: "resolved" },
                { scope: "commonEvent", id: 2, name: "Greeting", status: "resolved" },
              ],
            },
          ],
        },
      });
      expect(result.event.pages[0]).not.toHaveProperty("commands");
      expect(result.event.pages[0]).not.toHaveProperty("active");
      expect(result.dataInputs.map(({ relativePath }) => relativePath)).toEqual([
        "MapInfos.json",
        "Map001.json",
        "Tilesets.json",
        "System.json",
        "CommonEvents.json",
      ]);
      expect(await readWorkspaceFiles(workspaceRoot)).toEqual(before);
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it("preserves requested raw commands and identifies unsupported shapes without executing scripts", async () => {
    const { workspaceRoot } = await createMapWorkspace();
    try {
      const records = [
        {
          code: 355,
          indent: 0,
          parameters: ["throw new Error('never execute stored script');"],
          pluginMetadata: { keep: true },
        },
        { code: 9999, indent: 0, parameters: [{ plugin: "mystery" }], extension: "preserve" },
        { code: 117, indent: 0, parameters: ["invalid ID"] },
        { code: "plugin-shaped-record", custom: [1, 2] },
        { code: 0, indent: 0, parameters: [] },
      ];
      const map = mapFixture();
      const event = map.events[1]!;
      await writeFile(
        join(workspaceRoot, ".rpgmaker-event-dsl", "project-data-snapshot", "Map001.json"),
        JSON.stringify({
          ...map,
          events: [null, { ...event, pages: [{ ...event.pages[0], list: records }] }],
        }),
      );
      const before = await readWorkspaceFiles(workspaceRoot);
      const summary = await inspectWorkspaceMap({
        workspaceRoot,
        mapId: 1,
        selector: { kind: "event", eventId: 1 },
      });
      const detail = await inspectWorkspaceMap({
        workspaceRoot,
        mapId: 1,
        selector: { kind: "event", eventId: 1, commands: true },
      });
      expect(summary.event.pages[0]).not.toHaveProperty("commands");
      expect(detail.event.pages[0]?.commands).toEqual(records);
      expect(detail.event.pages[0]?.commandSummary.operations).toMatchObject([
        { index: 0, code: 355, status: "recognized" },
        { index: 1, code: 9999, status: "unsupported", helpers: [] },
        { index: 2, code: 117, status: "unsupported", helpers: [] },
        { index: 3, code: null, status: "unsupported", helpers: [] },
      ]);
      expect(detail.warnings).toHaveLength(3);
      expect(detail.warnings.every(({ code }) => code === "unsupported-command-shape")).toBe(true);
      expect(await readWorkspaceFiles(workspaceRoot)).toEqual(before);
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it("uses generated conditions, common events and images without borrowing removed snapshot content", async () => {
    const { workspaceRoot, dataDirectory } = await createMapWorkspace();
    try {
      const map = mapFixture();
      const event = map.events[1]!;
      await writeFile(
        join(dataDirectory, "Map001.json"),
        JSON.stringify({
          ...map,
          events: [
            null,
            {
              ...event,
              pages: [
                {
                  ...event.pages[0],
                  image: { ...event.pages[0]!.image, characterName: "SnapshotCharacter" },
                },
              ],
            },
          ],
        }),
      );
      await cloneWorkspace({ workspaceRoot });
      await compileMapWorkspace(workspaceRoot);
      await writeFile(
        join(workspaceRoot, "src", "entrance.events.ts"),
        `
export const entrance = {
  kind: "mapEvent", mapId: 1, id: 2, name: "Generated Entrance", x: 0, y: 0,
  pages: [{ conditions: { switch1: { kind: "switch", id: 1 }, variable: { ref: { kind: "variable", id: 1 }, operator: "ge", value: 3 } }, trigger: "action", commands: [{ kind: "commonEvent", ref: { kind: "commonEvent", id: 2 } }] }],
};
export const switchDefinition = { kind: "switchDefinition", id: 1, name: "Generated Switch" };
export const variableDefinition = { kind: "variableDefinition", id: 1, name: "Generated Variable" };
export const common = { kind: "commonEvent", id: 2, name: "Generated Common", trigger: "none", commands: [] };
`,
      );
      await compileWorkspace({ workspaceRoot, check: false });
      const before = await readWorkspaceFiles(workspaceRoot);
      const result = await inspectWorkspaceMap({
        workspaceRoot,
        source: "generated",
        mapId: 1,
        selector: { kind: "event", eventId: 2 },
      });
      expect(result.event.pages[0]).toMatchObject({
        image: { characterName: "", tileId: 0 },
        references: [
          { scope: "switch", id: 1, name: "Generated Switch", status: "resolved" },
          { scope: "variable", id: 1, name: "Generated Variable", status: "resolved" },
          { scope: "commonEvent", id: 2, name: "Generated Common", status: "resolved" },
        ],
      });
      expect(
        result.dataInputs.map(({ source, relativePath }) => ({ source, relativePath })),
      ).toEqual([
        { source: "snapshot", relativePath: "MapInfos.json" },
        { source: "generated", relativePath: "Map001.json" },
        { source: "snapshot", relativePath: "Tilesets.json" },
        { source: "generated", relativePath: "System.json" },
        { source: "generated", relativePath: "CommonEvents.json" },
      ]);
      await expect(
        inspectWorkspaceMap({
          workspaceRoot,
          source: "generated",
          mapId: 1,
          selector: { kind: "event", eventId: 1 },
        }),
      ).rejects.toThrow(/Event 1 does not exist/u);
      expect(await readWorkspaceFiles(workspaceRoot)).toEqual(before);
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it("rejects invalid and nonexistent event identities", async () => {
    const { workspaceRoot } = await createMapWorkspace();
    try {
      const before = await readWorkspaceFiles(workspaceRoot);
      for (const eventId of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
        await expect(
          inspectWorkspaceMap({ workspaceRoot, mapId: 1, selector: { kind: "event", eventId } }),
        ).rejects.toThrow(/positive integer event ID/u);
      }
      await expect(
        inspectWorkspaceMap({ workspaceRoot, mapId: 1, selector: { kind: "event", eventId: 2 } }),
      ).rejects.toThrow(/Event 2 does not exist/u);
      expect(await readWorkspaceFiles(workspaceRoot)).toEqual(before);
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it.each([
    { conditions: null },
    { image: null },
    { list: null },
    { trigger: 5 },
    { conditions: { switch1Valid: true, switch1Id: 0 } },
    { conditions: { variableValid: true, variableId: 1 } },
    { conditions: { selfSwitchValid: true } },
  ])("rejects malformed page data %j instead of inventing defaults", async (damage) => {
    const { workspaceRoot } = await createMapWorkspace();
    try {
      const map = mapFixture();
      const event = map.events[1]!;
      await writeFile(
        join(workspaceRoot, ".rpgmaker-event-dsl", "project-data-snapshot", "Map001.json"),
        JSON.stringify({
          ...map,
          events: [null, { ...event, pages: [{ ...event.pages[0], ...damage }] }],
        }),
      );
      const before = await readWorkspaceFiles(workspaceRoot);
      await expect(
        inspectWorkspaceMap({ workspaceRoot, mapId: 1, selector: { kind: "event", eventId: 1 } }),
      ).rejects.toThrow(/Malformed event 1 page 1/u);
      expect(await readWorkspaceFiles(workspaceRoot)).toEqual(before);
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });
});
