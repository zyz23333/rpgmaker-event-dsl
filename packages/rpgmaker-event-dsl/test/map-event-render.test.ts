import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { PNG } from "pngjs";
import { describe, expect, it } from "vitest";

import { cloneWorkspace, renderWorkspaceMap } from "../src/workspace-api.js";
import { createMapWorkspace, mapFixture, readWorkspaceFiles } from "./map-observation-fixture.js";

type Image = NonNullable<ReturnType<typeof mapFixture>["events"][number]>["pages"][number]["image"];

function event(id: number, x: number, y: number, image: Partial<Image>, priorityType = 1) {
  const template = mapFixture().events[1]!;
  return {
    ...template, id, name: `Event ${id}`, x, y,
    pages: [{ ...template.pages[0]!, priorityType, image: { ...template.pages[0]!.image, ...image } }],
  };
}

function paint(image: PNG, x: number, y: number, width: number, height: number, color: number[]) {
  for (let row = y; row < y + height; row++)
    for (let column = x; column < x + width; column++)
      image.data.set(color, (row * image.width + column) * 4);
}

function pixel(image: PNG, x: number, y: number) {
  return [...image.data.subarray((y * image.width + x) * 4, (y * image.width + x) * 4 + 4)];
}

async function createEventWorkspace(
  configure: (map: ReturnType<typeof mapFixture>) => void,
  assets: readonly { category: "characters" | "tilesets"; name: string; image: PNG }[],
  configureTileset?: (tileset: { tilesetNames: string[]; flags: number[] }) => void,
) {
  const fixture = await createMapWorkspace({ clone: false });
  const map = mapFixture();
  map.events = [null];
  configure(map);
  await writeFile(join(fixture.dataDirectory, "Map001.json"), JSON.stringify(map));
  if (configureTileset !== undefined) {
    const path = join(fixture.dataDirectory, "Tilesets.json");
    const tilesets = JSON.parse(await readFile(path, "utf8"));
    configureTileset(tilesets[1]);
    await writeFile(path, JSON.stringify(tilesets));
  }
  for (const { category, name, image } of assets) {
    const directory = join(fixture.projectRoot, "img", category);
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, `${name}.png`), PNG.sync.write(image));
  }
  await cloneWorkspace({ workspaceRoot: fixture.workspaceRoot });
  return fixture;
}

describe("native Map Preview event appearance", () => {
  it.each([
    [{ eventId: 1, page: 1 }, { eventId: 1, page: 1 }],
    [{ eventId: 99, page: 1 }], [{ eventId: 0, page: 1 }],
    [{ eventId: 1.5, page: 1 }], [{ eventId: 1, page: 0 }],
    [{ eventId: 1, page: 2 }], [{ eventId: 1, page: 1.5 }],
  ])("rejects invalid or duplicate Preview Page choices before artifact publication (%j)", async (...choices) => {
    const { workspaceRoot } = await createMapWorkspace();
    try {
      const before = await readWorkspaceFiles(workspaceRoot);
      await expect(renderWorkspaceMap({ workspaceRoot, mapId: 1, eventPages: choices })).rejects.toThrow(/Preview Page/u);
      expect(await readWorkspaceFiles(workspaceRoot)).toEqual(before);
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it("defaults to page one and applies repeated explicit Preview Pages without evaluating conditions", async () => {
    const states = new PNG({ width: 144, height: 192 });
    paint(states, 0, 0, 48, 48, [180, 20, 40, 255]);
    paint(states, 48, 0, 48, 48, [20, 40, 180, 255]);
    const { workspaceRoot } = await createEventWorkspace((map) => {
      const first = event(1, 0, 1, { characterName: "!$States", pattern: 0 });
      first.pages.push({ ...first.pages[0]!, conditions: { switch1Valid: true },
        image: { ...first.pages[0]!.image, pattern: 1 } });
      const second = event(2, 2, 1, {});
      second.pages.push({ ...second.pages[0]!, image: { ...second.pages[0]!.image, characterName: "!$States", pattern: 0 } });
      map.events.push(first, second);
    }, [{ category: "characters", name: "!$States", image: states }]);
    try {
      const defaults = await renderWorkspaceMap({ workspaceRoot, mapId: 1, events: false });
      expect(defaults.previewPages).toEqual([{ eventId: 1, page: 1 }, { eventId: 2, page: 1 }]);
      const defaultImage = PNG.sync.read(await readFile(defaults.artifacts.png));
      expect(pixel(defaultImage, 24, 60)).toEqual([180, 20, 40, 255]);
      expect(pixel(defaultImage, 120, 60)).toEqual([0, 0, 0, 0]);
      const selected = await renderWorkspaceMap({ workspaceRoot, mapId: 1, events: false,
        eventPages: [{ eventId: 2, page: 2 }, { eventId: 1, page: 2 }] });
      expect(selected.previewPages).toEqual([{ eventId: 1, page: 2 }, { eventId: 2, page: 2 }]);
      const selectedImage = PNG.sync.read(await readFile(selected.artifacts.png));
      expect(pixel(selectedImage, 24, 60)).toEqual([20, 40, 180, 255]);
      expect(pixel(selectedImage, 120, 60)).toEqual([180, 20, 40, 255]);
      expect(JSON.parse(await readFile(selected.artifacts.metadata, "utf8")).previewPages).toEqual(selected.previewPages);
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it("applies native bush opacity only to the bottom twelve pixels of normal non-object characters", async () => {
    const actor = new PNG({ width: 144, height: 192 });
    paint(actor, 0, 0, 144, 192, [200, 0, 0, 255]);
    const tiles = new PNG({ width: 96, height: 48 });
    paint(tiles, 48, 0, 48, 48, [20, 40, 60, 255]);
    const { workspaceRoot } = await createEventWorkspace((map) => {
      map.data.fill(1, 18, 24);
      map.events.push(event(1, 0, 1, { characterName: "$Actor" }));
      map.events.push(event(2, 1, 1, { characterName: "!$Actor" }));
      map.events.push(event(3, 2, 1, { characterName: "$Actor" }, 0));
    }, [
      { category: "characters", name: "$Actor", image: actor },
      { category: "characters", name: "!$Actor", image: actor },
      { category: "tilesets", name: "Bush", image: tiles },
    ], (tileset) => {
      tileset.tilesetNames[5] = "Bush";
      tileset.flags[1] = 0x40;
    });
    try {
      const result = await renderWorkspaceMap({ workspaceRoot, mapId: 1, events: false });
      const image = PNG.sync.read(await readFile(result.artifacts.png));
      expect(pixel(image, 12, 77)).toEqual([200, 0, 0, 255]);
      expect(pixel(image, 12, 78)).toEqual([110, 20, 30, 255]);
      expect(pixel(image, 12, 89)).toEqual([110, 20, 30, 255]);
      expect(pixel(image, 60, 84)).toEqual([200, 0, 0, 255]);
      expect(pixel(image, 108, 84)).toEqual([200, 0, 0, 255]);
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it.each([
    { secondName: "$Blue", expected: [180, 20, 40, 255] },
    { secondName: "!$Blue", expected: [20, 40, 180, 255] },
  ])("sorts overlapping event sprites by native bottom Y then creation order ($secondName)", async ({ secondName, expected }) => {
    const red = new PNG({ width: 288, height: 384 });
    const blue = new PNG({ width: 288, height: 384 });
    paint(red, 0, 0, 288, 384, [180, 20, 40, 255]);
    paint(blue, 0, 0, 288, 384, [20, 40, 180, 255]);
    const { workspaceRoot } = await createEventWorkspace((map) => {
      map.events.push(event(1, 1, 1, { characterName: "!$Red" }));
      map.events.push(event(2, 1, 1, { characterName: secondName }));
    }, [
      { category: "characters", name: "!$Red", image: red },
      { category: "characters", name: secondName, image: blue },
    ]);
    try {
      const result = await renderWorkspaceMap({ workspaceRoot, mapId: 1, events: false });
      expect(pixel(PNG.sync.read(await readFile(result.artifacts.png)), 72, 24)).toEqual(expected);
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it("places event priorities z1/z3 above lower tiles and below starred tiles, with z5 above both", async () => {
    const actor = new PNG({ width: 144, height: 192 });
    paint(actor, 0, 0, 144, 192, [20, 40, 210, 255]);
    const tiles = new PNG({ width: 144, height: 48 });
    paint(tiles, 48, 0, 48, 48, [200, 100, 0, 255]);
    paint(tiles, 96, 0, 24, 48, [0, 180, 0, 255]);
    const { workspaceRoot } = await createEventWorkspace((map) => {
      map.data.fill(1, 0, 6);
      map.data.fill(2, 6, 12);
      map.events.push(event(1, 0, 1, { characterName: "!$Actor" }, 0));
      map.events.push(event(2, 1, 1, { characterName: "!$Actor" }, 1));
      map.events.push(event(3, 2, 1, { characterName: "!$Actor" }, 2));
    }, [
      { category: "characters", name: "!$Actor", image: actor },
      { category: "tilesets", name: "Layers", image: tiles },
    ], (tileset) => {
      tileset.tilesetNames[5] = "Layers";
      tileset.flags[2] = 0x10;
    });
    try {
      const result = await renderWorkspaceMap({ workspaceRoot, mapId: 1, events: false });
      const image = PNG.sync.read(await readFile(result.artifacts.png));
      expect(pixel(image, 12, 60)).toEqual([0, 180, 0, 255]);
      expect(pixel(image, 36, 60)).toEqual([20, 40, 210, 255]);
      expect(pixel(image, 60, 60)).toEqual([0, 180, 0, 255]);
      expect(pixel(image, 84, 60)).toEqual([20, 40, 210, 255]);
      expect(pixel(image, 108, 60)).toEqual([20, 40, 210, 255]);
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it.each([
    { name: "!Object", atlas: [576, 384], source: [144, 48, 48, 48], index: 1, pattern: 0, direction: 4, top: 48, bottom: 96 },
    { name: "$Giant", atlas: [216, 288], source: [144, 216, 72, 72], index: 7, pattern: 2, direction: 8, top: 18, bottom: 90 },
    { name: "!$Gate", atlas: [216, 288], source: [72, 72, 72, 72], index: 5, pattern: 1, direction: 4, top: 24, bottom: 96 },
    { name: "$!Gate", atlas: [216, 288], source: [72, 72, 72, 72], index: 5, pattern: 1, direction: 4, top: 24, bottom: 96 },
    { name: "Middle!$", atlas: [576, 384], source: [480, 192, 48, 48], index: 7, pattern: 1, direction: 2, top: 42, bottom: 90 },
  ])("applies only leading native character prefixes for $name", async ({ name, atlas, source, index, pattern, direction, top, bottom }) => {
    const actor = new PNG({ width: atlas[0]!, height: atlas[1]! });
    paint(actor, 0, 0, actor.width, actor.height, [10, 20, 30, 255]);
    paint(actor, source[0]!, source[1]!, source[2]!, source[3]!, [20, 140, 80, 255]);
    const { workspaceRoot } = await createEventWorkspace((map) => {
      map.events.push(event(1, 1, 1, { characterName: name, characterIndex: index, pattern, direction }));
    }, [{ category: "characters", name, image: actor }]);
    try {
      const result = await renderWorkspaceMap({ workspaceRoot, mapId: 1, events: false });
      const image = PNG.sync.read(await readFile(result.artifacts.png));
      expect(pixel(image, 72, top)).toEqual([20, 140, 80, 255]);
      expect(pixel(image, 72, top - 1)).toEqual([0, 0, 0, 0]);
      expect(pixel(image, 72, bottom - 1)).toEqual([20, 140, 80, 255]);
      if (bottom < image.height) expect(pixel(image, 72, bottom)).toEqual([0, 0, 0, 0]);
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it("draws tile event graphics from the native B-E atlas with no character shift", async () => {
    const tiles = new PNG({ width: 768, height: 48 });
    paint(tiles, 384, 0, 48, 48, [210, 150, 40, 255]);
    const { workspaceRoot } = await createEventWorkspace((map) => {
      map.events.push(event(1, 1, 1, { tileId: 128, characterName: "MustNotReadCharacter" }, 0));
    }, [{ category: "tilesets", name: "Events", image: tiles }], (tileset) => {
      tileset.tilesetNames[5] = "Events";
    });
    try {
      const result = await renderWorkspaceMap({ workspaceRoot, mapId: 1, events: false });
      const image = PNG.sync.read(await readFile(result.artifacts.png));
      expect(pixel(image, 72, 47)).toEqual([0, 0, 0, 0]);
      expect(pixel(image, 72, 48)).toEqual([210, 150, 40, 255]);
      expect(pixel(image, 72, 95)).toEqual([210, 150, 40, 255]);
      expect(result.imageInputs.map(({ relativePath }) => relativePath)).toEqual(["img/tilesets/Events.png"]);
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it("draws the selected ordinary character frame bottom-centered with the native six-pixel shift", async () => {
    const actor = new PNG({ width: 576, height: 384 });
    paint(actor, 0, 0, 576, 384, [10, 20, 30, 255]);
    // Native Sprite_Character: index5 block(3,4) + pattern2/direction6 row2.
    // The independent selected source is x240,y288,width48,height48.
    paint(actor, 240, 288, 48, 48, [180, 30, 60, 255]);
    const { workspaceRoot, projectRoot } = await createEventWorkspace((map) => {
      map.events.push(event(1, 1, 1, { characterName: "Actors", characterIndex: 5, pattern: 2, direction: 6 }));
    }, [{ category: "characters", name: "Actors", image: actor }]);
    try {
      const before = await readWorkspaceFiles(workspaceRoot);
      const result = await renderWorkspaceMap({ workspaceRoot, mapId: 1, events: false });
      const image = PNG.sync.read(await readFile(result.artifacts.png));
      expect(pixel(image, 72, 48)).toEqual([180, 30, 60, 255]);
      expect(pixel(image, 72, 41)).toEqual([0, 0, 0, 0]);
      expect(pixel(image, 72, 89)).toEqual([180, 30, 60, 255]);
      expect(pixel(image, 72, 90)).toEqual([0, 0, 0, 0]);
      expect(result.previewPages).toEqual([{ eventId: 1, page: 1 }]);
      const path = join(projectRoot, "img", "characters", "Actors.png");
      expect(result.imageInputs).toContainEqual({
        relativePath: "img/characters/Actors.png", path, status: "available",
        hash: createHash("sha256").update(await readFile(path)).digest("hex"),
      });
      const after = await readWorkspaceFiles(workspaceRoot);
      for (const [path, bytes] of Object.entries(before)) expect(after[path]).toBe(bytes);
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });
});
