import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { PNG } from "pngjs";
import { describe, expect, it } from "vitest";

import {
  cloneWorkspace,
  compileWorkspace,
  diffWorkspace,
  inspectWorkspaceMap,
  listWorkspaceMaps,
  renderWorkspaceMap,
} from "../src/workspace-api.js";
import { createMapWorkspace, mapFixture, readWorkspaceFiles } from "./map-observation-fixture.js";

function paint(image: PNG, x: number, y: number, width: number, height: number, color: number[]) {
  for (let row = y; row < y + height; row++)
    for (let column = x; column < x + width; column++)
      image.data.set(color, (row * image.width + column) * 4);
}

function pixel(image: PNG, x: number, y: number) {
  return [...image.data.subarray((y * image.width + x) * 4, (y * image.width + x) * 4 + 4)];
}

async function createEntranceWorkspace() {
  const fixture = await createMapWorkspace({ clone: false });
  const map = { ...mapFixture(), width: 7, height: 6 };
  map.data = Array<number>(7 * 6 * 6).fill(0);
  map.data.fill(1, 0, 42);
  // A gold path from the southern edge ends at a blue entrance at (3,1).
  for (const index of [17, 24, 31, 38]) map.data[index] = 2;
  map.data[10] = 3;
  map.data[5 * 42 + 17] = 9;
  const guard = map.events[1]!;
  guard.name = "Entrance guard";
  guard.x = 2;
  guard.y = 2;
  guard.pages[0]!.image.characterName = "!$Guide";
  await writeFile(join(fixture.dataDirectory, "Map001.json"), JSON.stringify(map));
  const tilesetsPath = join(fixture.dataDirectory, "Tilesets.json");
  const tilesets = JSON.parse(await readFile(tilesetsPath, "utf8"));
  tilesets[1].tilesetNames[5] = "Entrance_B";
  tilesets[1].flags[2] = 2 << 12;
  await writeFile(tilesetsPath, JSON.stringify(tilesets));
  const tiles = new PNG({ width: 768, height: 768 });
  paint(tiles, 48, 0, 48, 48, [40, 120, 60, 255]);
  paint(tiles, 96, 0, 48, 48, [200, 160, 80, 255]);
  paint(tiles, 144, 0, 48, 48, [40, 60, 180, 255]);
  const guide = new PNG({ width: 144, height: 192 });
  paint(guide, 48, 0, 48, 48, [180, 40, 80, 255]);
  for (const [category, name, image] of [
    ["tilesets", "Entrance_B", tiles],
    ["characters", "!$Guide", guide],
  ] as const) {
    const directory = join(fixture.projectRoot, "img", category);
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, `${name}.png`), PNG.sync.write(image));
  }
  await cloneWorkspace({ workspaceRoot: fixture.workspaceRoot });
  return fixture;
}

describe("agent Map Event placement workflow", () => {
  it("finds an entrance, authors at its original coordinate, and reviews compiled placement and Diff before Push", async () => {
    const { workspaceRoot, projectRoot } = await createEntranceWorkspace();
    try {
      const originalProject = await readWorkspaceFiles(projectRoot);
      const snapshotDirectory = join(workspaceRoot, ".rpgmaker-event-dsl", "project-data-snapshot");
      const originalSnapshot = await readWorkspaceFiles(snapshotDirectory);
      const directory = await listWorkspaceMaps({ workspaceRoot });
      expect(directory.maps).toEqual([
        { id: 1, name: "Town", parentId: 0 },
        { id: 2, name: "Town", parentId: 1 },
      ]);
      const summary = await inspectWorkspaceMap({ workspaceRoot, mapId: 1 });
      expect(summary).toMatchObject({ source: "snapshot", width: 7, height: 6 });
      expect(summary.events).toEqual([{ id: 1, name: "Entrance guard", x: 2, y: 2 }]);
      const overview = await renderWorkspaceMap({ workspaceRoot, mapId: 1 });
      expect(overview).toMatchObject({
        source: "snapshot",
        complete: true,
        bounds: { x: 0, y: 0, width: 7, height: 6 },
        overlays: { grid: true, events: true },
      });
      const bounds = { x: 2, y: 1, width: 3, height: 3 };
      const crop = await renderWorkspaceMap({ workspaceRoot, mapId: 1, crop: bounds });
      expect(crop.transform).toEqual({ scaleX: 48, scaleY: 48, offsetX: -68, offsetY: -28 });
      const image = PNG.sync.read(await readFile(crop.artifacts.png));
      // Native B-sheet tiles1/2/3 start at x48/96/144. The ! $ sprite has
      // a bottom-center anchor and no six-pixel shift (native MV Sprite_Character).
      expect([
        pixel(image, 100, 44), // entrance at original (3,1)
        pixel(image, 100, 92), // path immediately below, original (3,2)
        pixel(image, 52, 92), // guide at original (2,2), retaining crop margins
        pixel(image, 148, 92), // grass beside the path
      ]).toEqual([
        [40, 60, 180, 255],
        [200, 160, 80, 255],
        [180, 40, 80, 255],
        [40, 120, 60, 255],
      ]);
      const area = await inspectWorkspaceMap({
        workspaceRoot,
        mapId: 1,
        selector: { kind: "area", ...bounds },
      });
      expect(area.events).toEqual(summary.events);
      const candidate = await inspectWorkspaceMap({
        workspaceRoot,
        mapId: 1,
        selector: { kind: "cell", x: 3, y: 2 },
      });
      expect(candidate.cell).toMatchObject({ x: 3, y: 2, regionId: 9, terrainTag: 2 });
      expect(candidate.cell.layers[0]).toMatchObject({ tileId: 2, rawFlags: 8192 });
      const guard = await inspectWorkspaceMap({
        workspaceRoot,
        mapId: 1,
        selector: { kind: "event", eventId: 1 },
      });
      expect(guard.event.pages[0]).toMatchObject({
        page: 1,
        triggerName: "action",
        image: { characterName: "!$Guide" },
      });

      await writeFile(
        join(workspaceRoot, "src", "entrance.events.ts"),
        `export const entrance = {
  kind: "mapEvent", mapId: 1, id: 2, name: "South Entrance", x: 3, y: 2,
  pages: [{ conditions: {}, trigger: "playerTouch", commands: [] }],
};
`,
      );
      const beforeCheck = await readWorkspaceFiles(workspaceRoot);
      await compileWorkspace({ workspaceRoot, check: true });
      expect(await readWorkspaceFiles(workspaceRoot)).toEqual(beforeCheck);
      await compileWorkspace({ workspaceRoot, check: false });
      const generated = await inspectWorkspaceMap({ workspaceRoot, mapId: 1, source: "generated" });
      expect(generated.events).toEqual([{ id: 2, name: "South Entrance", x: 3, y: 2 }]);
      const generatedEvent = await inspectWorkspaceMap({
        workspaceRoot,
        mapId: 1,
        source: "generated",
        selector: { kind: "event", eventId: 2 },
      });
      expect(generatedEvent.event.pages[0]).toMatchObject({
        triggerName: "playerTouch",
        image: { characterName: "", tileId: 0 },
      });
      const generatedCrop = await renderWorkspaceMap({
        workspaceRoot,
        mapId: 1,
        source: "generated",
        crop: bounds,
      });
      expect(generatedCrop.previewPages).toEqual([{ eventId: 2, page: 1 }]);
      expect(
        generatedCrop.dataInputs.map(({ relativePath, source }) => ({ relativePath, source })),
      ).toEqual([
        { relativePath: "MapInfos.json", source: "snapshot" },
        { relativePath: "Map001.json", source: "generated" },
        { relativePath: "Tilesets.json", source: "snapshot" },
      ]);
      expect(generatedCrop.imageInputs.map(({ relativePath }) => relativePath)).toEqual([
        "img/tilesets/Entrance_B.png",
      ]);
      const generatedImage = PNG.sync.read(await readFile(generatedCrop.artifacts.png));
      expect(pixel(generatedImage, 78, 70)).toEqual([255, 208, 64, 255]);
      expect(pixel(generatedImage, 52, 92)).toEqual([40, 120, 60, 255]);
      expect(pixel(generatedImage, 100, 92)).toEqual([200, 160, 80, 255]);
      const diff = await diffWorkspace({ workspaceRoot });
      expect(diff).toContain("[generated-only] mapId 1, eventId 2");
      expect(diff).toContain("[snapshot-only] mapId 1, eventId 1 (destructive)");
      expect(diff).toContain("Map001.json");
      expect(await readWorkspaceFiles(projectRoot)).toEqual(originalProject);
      expect(await readWorkspaceFiles(snapshotDirectory)).toEqual(originalSnapshot);
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it("keeps cropped missing autotile, parallax, and event images explicit without restoring snapshot images into generated output", async () => {
    const { workspaceRoot, dataDirectory } = await createMapWorkspace({ clone: false });
    try {
      const map = { ...mapFixture(), width: 4, height: 4, parallaxName: "MissingSky" };
      map.data = Array<number>(4 * 4 * 6).fill(0);
      for (const index of [5, 9, 10]) map.data[index] = 2816;
      const tileEvent = map.events[1]!;
      tileEvent.x = 1;
      tileEvent.y = 2;
      tileEvent.pages[0]!.image.tileId = 1;
      const characterEvent = structuredClone(tileEvent);
      characterEvent.id = 2;
      characterEvent.x = 2;
      characterEvent.pages[0]!.image.tileId = 0;
      characterEvent.pages[0]!.image.characterName = "!$MissingGuide";
      map.events.push(characterEvent);
      await writeFile(join(dataDirectory, "Map001.json"), JSON.stringify(map));
      const tilesetsPath = join(dataDirectory, "Tilesets.json");
      const tilesets = JSON.parse(await readFile(tilesetsPath, "utf8"));
      tilesets[1].tilesetNames[1] = "Missing_A2";
      tilesets[1].tilesetNames[5] = "Missing_B";
      await writeFile(tilesetsPath, JSON.stringify(tilesets));
      await cloneWorkspace({ workspaceRoot });
      const options = {
        workspaceRoot,
        mapId: 1,
        crop: { x: 1, y: 1, width: 2, height: 2 },
        grid: false,
        events: false,
      };
      const beforeStrict = await readWorkspaceFiles(workspaceRoot);
      await expect(renderWorkspaceMap(options)).rejects.toThrow(/MissingSky.png/u);
      expect(await readWorkspaceFiles(workspaceRoot)).toEqual(beforeStrict);
      const inspection = await inspectWorkspaceMap({ workspaceRoot, mapId: 1 });
      expect(inspection.events.map(({ id }) => id)).toEqual([1, 2]);
      const incomplete = await renderWorkspaceMap({ ...options, allowMissingAssets: true });
      expect(incomplete).toMatchObject({
        source: "snapshot",
        complete: false,
        bounds: { x: 1, y: 1, width: 2, height: 2 },
        transform: { scaleX: 48, scaleY: 48, offsetX: -48, offsetY: -48 },
        overlays: { grid: false, events: false },
        previewPages: [
          { eventId: 1, page: 1 },
          { eventId: 2, page: 1 },
        ],
      });
      expect(incomplete.imageInputs.map(({ relativePath }) => relativePath)).toEqual([
        "img/parallaxes/MissingSky.png",
        "img/tilesets/Missing_A2.png",
        "img/tilesets/Missing_B.png",
        "img/characters/!$MissingGuide.png",
      ]);
      for (const input of incomplete.imageInputs) {
        expect(input).toMatchObject({ status: "unavailable", reason: "missing" });
        expect(input).not.toHaveProperty("hash");
      }
      expect(incomplete.warnings).toHaveLength(4);
      expect(
        incomplete.warnings.every(
          ({ code, reason }) => code === "map-image-unavailable" && reason === "missing",
        ),
      ).toBe(true);
      expect(JSON.parse(await readFile(incomplete.artifacts.metadata, "utf8"))).toEqual(incomplete);
      const image = PNG.sync.read(await readFile(incomplete.artifacts.png));
      expect([
        pixel(image, 4, 32), // A2 shape0 bottom-left quarter
        pixel(image, 12, 32),
        pixel(image, 52, 40), // parallax through the empty neighboring cell
        pixel(image, 60, 40),
        pixel(image, 4, 80), // tile event
        pixel(image, 12, 80),
        pixel(image, 52, 80), // character event
        pixel(image, 60, 80),
      ]).toEqual([
        [255, 0, 255, 255],
        [32, 0, 32, 255],
        [32, 0, 32, 255],
        [255, 0, 255, 255],
        [255, 0, 255, 255],
        [32, 0, 32, 255],
        [255, 0, 255, 255],
        [32, 0, 32, 255],
      ]);
      await writeFile(
        join(workspaceRoot, "src", "entrance.events.ts"),
        `export const entrance = { kind: "mapEvent", mapId: 1, id: 3, name: "Entrance", x: 1, y: 2,
  pages: [{ conditions: {}, trigger: "playerTouch", commands: [] }] };
`,
      );
      await compileWorkspace({ workspaceRoot, check: false });
      const generated = await renderWorkspaceMap({
        ...options,
        source: "generated",
        allowMissingAssets: true,
      });
      expect(generated.previewPages).toEqual([{ eventId: 3, page: 1 }]);
      expect(generated.imageInputs.map(({ relativePath }) => relativePath)).toEqual([
        "img/parallaxes/MissingSky.png",
        "img/tilesets/Missing_A2.png",
      ]);
      expect(generated).toMatchObject({ source: "generated", complete: false });
      expect(generated.warnings).toHaveLength(2);
      expect(generated.dataInputs.map(({ source }) => source)).toEqual([
        "snapshot",
        "generated",
        "snapshot",
      ]);
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });
});
