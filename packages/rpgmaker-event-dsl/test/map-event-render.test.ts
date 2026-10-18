import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { PNG } from "pngjs";
import { describe, expect, it } from "vitest";

import { cloneWorkspace, compileWorkspace, renderWorkspaceMap } from "../src/workspace-api.js";
import { createMapWorkspace, mapFixture, readWorkspaceFiles } from "./map-observation-fixture.js";

type Image = NonNullable<ReturnType<typeof mapFixture>["events"][number]>["pages"][number]["image"];

function event(id: number, x: number, y: number, image: Partial<Image>, priorityType = 1) {
  const template = mapFixture().events[1]!;
  return {
    ...template,
    id,
    name: `Event ${id}`,
    x,
    y,
    pages: [
      { ...template.pages[0]!, priorityType, image: { ...template.pages[0]!.image, ...image } },
    ],
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
  it("accepts repeated CLI Preview Pages and no-events while retaining selected event images", async () => {
    const actor = new PNG({ width: 144, height: 192 });
    paint(actor, 0, 0, 144, 192, [180, 20, 40, 255]);
    const { workspaceRoot } = await createEventWorkspace(
      (map) => {
        const first = event(1, 1, 1, {});
        first.pages.push({
          ...first.pages[0]!,
          image: { ...first.pages[0]!.image, characterName: "!$Actor" },
        });
        map.events.push(first, event(2, 2, 1, {}));
      },
      [{ category: "characters", name: "!$Actor", image: actor }],
    );
    try {
      const execute = promisify(execFile);
      const cli = fileURLToPath(new URL("../src/cli.ts", import.meta.url));
      const args = [
        "--import",
        import.meta.resolve("tsx"),
        cli,
        "map",
        "render",
        "--map",
        "1",
        "--json",
        "--no-grid",
        "--no-events",
      ];
      const { stdout, stderr } = await execute(
        process.execPath,
        [...args, "--event-page", "1:2", "--event-page", "2:1"],
        { cwd: workspaceRoot },
      );
      expect(stderr).toBe("");
      const result = JSON.parse(stdout);
      expect(result.previewPages).toEqual([
        { eventId: 1, page: 2 },
        { eventId: 2, page: 1 },
      ]);
      expect(result.overlays).toMatchObject({ grid: false, events: false });
      const image = PNG.sync.read(await readFile(result.artifacts.png));
      expect(pixel(image, 72, 72)).toEqual([180, 20, 40, 255]);
      expect(pixel(image, 98, 50)).toEqual([0, 0, 0, 0]);
      await expect(
        execute(process.execPath, [...args, "--event-page", "1:1", "--event-page", "1:2"], {
          cwd: workspaceRoot,
        }),
      ).rejects.toThrow(/Duplicate Preview Page/u);
      await expect(
        execute(process.execPath, [...args, "--event-page", "1,2"], { cwd: workspaceRoot }),
      ).rejects.toThrow(/Invalid --event-page/u);
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it("renders large sprites whose definition positions are outside the crop using original map coordinates", async () => {
    const gate = new PNG({ width: 432, height: 384 });
    paint(gate, 144, 0, 144, 96, [100, 140, 180, 255]);
    const { workspaceRoot } = await createEventWorkspace(
      (map) => {
        map.events.push(event(1, 0, 1, { characterName: "!$Gate" }));
      },
      [{ category: "characters", name: "!$Gate", image: gate }],
    );
    try {
      const result = await renderWorkspaceMap({
        workspaceRoot,
        mapId: 1,
        grid: false,
        crop: { x: 1, y: 0, width: 1, height: 2 },
      });
      const image = PNG.sync.read(await readFile(result.artifacts.png));
      expect(result.bounds).toEqual({ x: 1, y: 0, width: 1, height: 2 });
      expect(result.transform).toMatchObject({ scaleX: 48, scaleY: 48, offsetX: -48, offsetY: 0 });
      expect([
        pixel(image, 0, 0),
        pixel(image, 47, 0),
        pixel(image, 0, 95),
        pixel(image, 47, 95),
      ]).toEqual(Array(4).fill([100, 140, 180, 255]));
      expect(result.previewPages).toEqual([{ eventId: 1, page: 1 }]);
      expect(result.imageInputs.map(({ relativePath }) => relativePath)).toEqual([
        "img/characters/!$Gate.png",
      ]);
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it("shows only generated image-free events and their markers without borrowing snapshot appearance", async () => {
    const actor = new PNG({ width: 144, height: 192 });
    paint(actor, 0, 0, 144, 192, [180, 20, 40, 255]);
    const { workspaceRoot } = await createEventWorkspace(
      (map) => {
        map.events.push(event(1, 1, 1, { characterName: "!$Actor" }));
        map.events.push(event(2, 2, 1, {}));
      },
      [{ category: "characters", name: "!$Actor", image: actor }],
    );
    try {
      await writeFile(
        join(workspaceRoot, "src", "entrance.events.ts"),
        `
export const entrance = { kind:"mapEvent", mapId:1, id:1, name:"Generated Entrance", x:0, y:1,
  pages:[{conditions:{}, trigger:"action", commands:[]}] };
`,
      );
      await compileWorkspace({ workspaceRoot, check: false });
      const before = await readWorkspaceFiles(workspaceRoot);
      const snapshot = await renderWorkspaceMap({ workspaceRoot, mapId: 1, grid: false });
      const generated = await renderWorkspaceMap({
        workspaceRoot,
        mapId: 1,
        grid: false,
        source: "generated",
      });
      const snapshotImage = PNG.sync.read(await readFile(snapshot.artifacts.png));
      const generatedImage = PNG.sync.read(await readFile(generated.artifacts.png));
      expect(pixel(snapshotImage, 72, 72)).toEqual([180, 20, 40, 255]);
      expect(pixel(generatedImage, 72, 72)).toEqual([0, 0, 0, 0]);
      expect(pixel(generatedImage, 2, 50)).toEqual([255, 208, 64, 255]);
      expect(pixel(generatedImage, 98, 50)).toEqual([0, 0, 0, 0]);
      expect(generated.previewPages).toEqual([{ eventId: 1, page: 1 }]);
      expect(generated.imageInputs).toEqual([]);
      expect(snapshot.previewPages).toEqual([
        { eventId: 1, page: 1 },
        { eventId: 2, page: 1 },
      ]);
      const after = await readWorkspaceFiles(workspaceRoot);
      for (const [path, bytes] of Object.entries(before)) expect(after[path]).toBe(bytes);
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it.each(["missing", "undecodable"])(
    "handles %s character assets strictly or explicitly incompletely",
    async (damage) => {
      const actor = new PNG({ width: 144, height: 192 });
      const { workspaceRoot, projectRoot } = await createEventWorkspace(
        (map) => {
          map.events.push(event(1, 1, 1, { characterName: "$Actor" }));
        },
        [{ category: "characters", name: "$Actor", image: actor }],
      );
      try {
        const path = join(projectRoot, "img", "characters", "$Actor.png");
        if (damage === "missing") await rm(path);
        else await writeFile(path, "invalid character PNG");
        const before = await readWorkspaceFiles(workspaceRoot);
        await expect(
          renderWorkspaceMap({ workspaceRoot, mapId: 1, grid: false, events: false }),
        ).rejects.toThrow(/Map Image Asset img\/characters\/\$Actor.png/u);
        expect(await readWorkspaceFiles(workspaceRoot)).toEqual(before);
        const incomplete = await renderWorkspaceMap({
          workspaceRoot,
          mapId: 1,
          grid: false,
          events: false,
          allowMissingAssets: true,
        });
        expect(incomplete.complete).toBe(false);
        expect(incomplete.imageInputs).toEqual([
          {
            path,
            relativePath: "img/characters/$Actor.png",
            status: "unavailable",
            reason: damage,
          },
        ]);
        expect(incomplete.warnings).toContainEqual(
          expect.objectContaining({ code: "map-image-unavailable", reason: damage }),
        );
        expect(pixel(PNG.sync.read(await readFile(incomplete.artifacts.png)), 72, 60)[3]).toBe(255);
      } finally {
        await rm(workspaceRoot, { recursive: true, force: true });
      }
    },
  );

  it("shows event-ID markers by default and hides only markers when events is false", async () => {
    const actor = new PNG({ width: 144, height: 192 });
    paint(actor, 0, 0, 144, 192, [180, 20, 40, 255]);
    const { workspaceRoot } = await createEventWorkspace(
      (map) => {
        map.events.push(event(1, 0, 1, { characterName: "!$Actor" }));
        map.events.push(...Array<null>(10).fill(null), event(12, 2, 1, {}));
      },
      [{ category: "characters", name: "!$Actor", image: actor }],
    );
    try {
      const marked = await renderWorkspaceMap({ workspaceRoot, mapId: 1, grid: false });
      const hidden = await renderWorkspaceMap({
        workspaceRoot,
        mapId: 1,
        grid: false,
        events: false,
      });
      expect(marked.overlays.events).toBe(true);
      expect(hidden.overlays.events).toBe(false);
      const markedImage = PNG.sync.read(await readFile(marked.artifacts.png));
      const hiddenImage = PNG.sync.read(await readFile(hidden.artifacts.png));
      expect(pixel(markedImage, 98, 50)).toEqual([255, 208, 64, 255]);
      expect(pixel(hiddenImage, 98, 50)).toEqual([0, 0, 0, 0]);
      expect(pixel(markedImage, 24, 72)).toEqual([180, 20, 40, 255]);
      expect(pixel(hiddenImage, 24, 72)).toEqual([180, 20, 40, 255]);
      expect(marked.previewPages).toEqual([
        { eventId: 1, page: 1 },
        { eventId: 12, page: 1 },
      ]);
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it.each([
    [
      { eventId: 1, page: 1 },
      { eventId: 1, page: 1 },
    ],
    [{ eventId: 99, page: 1 }],
    [{ eventId: 0, page: 1 }],
    [{ eventId: 1.5, page: 1 }],
    [{ eventId: 1, page: 0 }],
    [{ eventId: 1, page: 2 }],
    [{ eventId: 1, page: 1.5 }],
  ])(
    "rejects invalid or duplicate Preview Page choices before artifact publication (%j)",
    async (...choices) => {
      const { workspaceRoot } = await createMapWorkspace();
      try {
        const before = await readWorkspaceFiles(workspaceRoot);
        await expect(
          renderWorkspaceMap({ workspaceRoot, mapId: 1, grid: false, eventPages: choices }),
        ).rejects.toThrow(/Preview Page/u);
        expect(await readWorkspaceFiles(workspaceRoot)).toEqual(before);
      } finally {
        await rm(workspaceRoot, { recursive: true, force: true });
      }
    },
  );

  it("defaults to page one and applies repeated explicit Preview Pages without evaluating conditions", async () => {
    const states = new PNG({ width: 144, height: 192 });
    paint(states, 0, 0, 48, 48, [180, 20, 40, 255]);
    paint(states, 48, 0, 48, 48, [20, 40, 180, 255]);
    const { workspaceRoot } = await createEventWorkspace(
      (map) => {
        const first = event(1, 0, 1, { characterName: "!$States", pattern: 0 });
        first.pages.push({
          ...first.pages[0]!,
          conditions: { switch1Valid: true },
          image: { ...first.pages[0]!.image, pattern: 1 },
        });
        const second = event(2, 2, 1, {});
        second.pages.push({
          ...second.pages[0]!,
          image: { ...second.pages[0]!.image, characterName: "!$States", pattern: 0 },
        });
        map.events.push(first, second);
      },
      [{ category: "characters", name: "!$States", image: states }],
    );
    try {
      const defaults = await renderWorkspaceMap({
        workspaceRoot,
        mapId: 1,
        grid: false,
        events: false,
      });
      expect(defaults.previewPages).toEqual([
        { eventId: 1, page: 1 },
        { eventId: 2, page: 1 },
      ]);
      const defaultImage = PNG.sync.read(await readFile(defaults.artifacts.png));
      expect(pixel(defaultImage, 24, 60)).toEqual([180, 20, 40, 255]);
      expect(pixel(defaultImage, 120, 60)).toEqual([0, 0, 0, 0]);
      const selected = await renderWorkspaceMap({
        workspaceRoot,
        mapId: 1,
        grid: false,
        events: false,
        eventPages: [
          { eventId: 2, page: 2 },
          { eventId: 1, page: 2 },
        ],
      });
      expect(selected.previewPages).toEqual([
        { eventId: 1, page: 2 },
        { eventId: 2, page: 2 },
      ]);
      const selectedImage = PNG.sync.read(await readFile(selected.artifacts.png));
      expect(pixel(selectedImage, 24, 60)).toEqual([20, 40, 180, 255]);
      expect(pixel(selectedImage, 120, 60)).toEqual([180, 20, 40, 255]);
      expect(JSON.parse(await readFile(selected.artifacts.metadata, "utf8")).previewPages).toEqual(
        selected.previewPages,
      );
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it("applies native bush opacity only to the bottom twelve pixels of normal non-object characters", async () => {
    const actor = new PNG({ width: 144, height: 192 });
    paint(actor, 0, 0, 144, 192, [200, 0, 0, 255]);
    const tiles = new PNG({ width: 96, height: 48 });
    paint(tiles, 48, 0, 48, 48, [20, 40, 60, 255]);
    const { workspaceRoot } = await createEventWorkspace(
      (map) => {
        map.data.fill(1, 18, 24);
        map.events.push(event(1, 0, 1, { characterName: "$Actor" }));
        map.events.push(event(2, 1, 1, { characterName: "!$Actor" }));
        map.events.push(event(3, 2, 1, { characterName: "$Actor" }, 0));
      },
      [
        { category: "characters", name: "$Actor", image: actor },
        { category: "characters", name: "!$Actor", image: actor },
        { category: "tilesets", name: "Bush", image: tiles },
      ],
      (tileset) => {
        tileset.tilesetNames[5] = "Bush";
        tileset.flags[1] = 0x40;
      },
    );
    try {
      const result = await renderWorkspaceMap({
        workspaceRoot,
        mapId: 1,
        grid: false,
        events: false,
      });
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
  ])(
    "sorts overlapping event sprites by native bottom Y then creation order ($secondName)",
    async ({ secondName, expected }) => {
      const red = new PNG({ width: 288, height: 384 });
      const blue = new PNG({ width: 288, height: 384 });
      paint(red, 0, 0, 288, 384, [180, 20, 40, 255]);
      paint(blue, 0, 0, 288, 384, [20, 40, 180, 255]);
      const { workspaceRoot } = await createEventWorkspace(
        (map) => {
          map.events.push(event(1, 1, 1, { characterName: "!$Red" }));
          map.events.push(event(2, 1, 1, { characterName: secondName }));
        },
        [
          { category: "characters", name: "!$Red", image: red },
          { category: "characters", name: secondName, image: blue },
        ],
      );
      try {
        const result = await renderWorkspaceMap({
          workspaceRoot,
          mapId: 1,
          grid: false,
          events: false,
        });
        expect(pixel(PNG.sync.read(await readFile(result.artifacts.png)), 72, 24)).toEqual(
          expected,
        );
      } finally {
        await rm(workspaceRoot, { recursive: true, force: true });
      }
    },
  );

  it("places event priorities z1/z3 above lower tiles and below starred tiles, with z5 above both", async () => {
    const actor = new PNG({ width: 144, height: 192 });
    paint(actor, 0, 0, 144, 192, [20, 40, 210, 255]);
    const tiles = new PNG({ width: 144, height: 48 });
    paint(tiles, 48, 0, 48, 48, [200, 100, 0, 255]);
    paint(tiles, 96, 0, 24, 48, [0, 180, 0, 255]);
    const { workspaceRoot } = await createEventWorkspace(
      (map) => {
        map.data.fill(1, 0, 6);
        map.data.fill(2, 6, 12);
        map.events.push(event(1, 0, 1, { characterName: "!$Actor" }, 0));
        map.events.push(event(2, 1, 1, { characterName: "!$Actor" }, 1));
        map.events.push(event(3, 2, 1, { characterName: "!$Actor" }, 2));
      },
      [
        { category: "characters", name: "!$Actor", image: actor },
        { category: "tilesets", name: "Layers", image: tiles },
      ],
      (tileset) => {
        tileset.tilesetNames[5] = "Layers";
        tileset.flags[2] = 0x10;
      },
    );
    try {
      const result = await renderWorkspaceMap({
        workspaceRoot,
        mapId: 1,
        grid: false,
        events: false,
      });
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
    {
      name: "!Object",
      atlas: [576, 384],
      source: [144, 48, 48, 48],
      index: 1,
      pattern: 0,
      direction: 4,
      top: 48,
      bottom: 96,
    },
    {
      name: "$Giant",
      atlas: [216, 288],
      source: [144, 216, 72, 72],
      index: 7,
      pattern: 2,
      direction: 8,
      top: 18,
      bottom: 90,
    },
    {
      name: "!$Gate",
      atlas: [216, 288],
      source: [72, 72, 72, 72],
      index: 5,
      pattern: 1,
      direction: 4,
      top: 24,
      bottom: 96,
    },
    {
      name: "$!Gate",
      atlas: [216, 288],
      source: [72, 72, 72, 72],
      index: 5,
      pattern: 1,
      direction: 4,
      top: 24,
      bottom: 96,
    },
    {
      name: "Middle!$",
      atlas: [576, 384],
      source: [480, 192, 48, 48],
      index: 7,
      pattern: 1,
      direction: 2,
      top: 42,
      bottom: 90,
    },
  ])(
    "applies only leading native character prefixes for $name",
    async ({ name, atlas, source, index, pattern, direction, top, bottom }) => {
      const actor = new PNG({ width: atlas[0]!, height: atlas[1]! });
      paint(actor, 0, 0, actor.width, actor.height, [10, 20, 30, 255]);
      paint(actor, source[0]!, source[1]!, source[2]!, source[3]!, [20, 140, 80, 255]);
      const { workspaceRoot } = await createEventWorkspace(
        (map) => {
          map.events.push(
            event(1, 1, 1, { characterName: name, characterIndex: index, pattern, direction }),
          );
        },
        [{ category: "characters", name, image: actor }],
      );
      try {
        const result = await renderWorkspaceMap({
          workspaceRoot,
          mapId: 1,
          grid: false,
          events: false,
        });
        const image = PNG.sync.read(await readFile(result.artifacts.png));
        expect(pixel(image, 72, top)).toEqual([20, 140, 80, 255]);
        expect(pixel(image, 72, top - 1)).toEqual([0, 0, 0, 0]);
        expect(pixel(image, 72, bottom - 1)).toEqual([20, 140, 80, 255]);
        if (bottom < image.height) expect(pixel(image, 72, bottom)).toEqual([0, 0, 0, 0]);
      } finally {
        await rm(workspaceRoot, { recursive: true, force: true });
      }
    },
  );

  it("draws tile event graphics from the native B-E atlas with no character shift", async () => {
    const tiles = new PNG({ width: 768, height: 48 });
    paint(tiles, 384, 0, 48, 48, [210, 150, 40, 255]);
    const { workspaceRoot } = await createEventWorkspace(
      (map) => {
        map.events.push(event(1, 1, 1, { tileId: 128, characterName: "MustNotReadCharacter" }, 0));
      },
      [{ category: "tilesets", name: "Events", image: tiles }],
      (tileset) => {
        tileset.tilesetNames[5] = "Events";
      },
    );
    try {
      const result = await renderWorkspaceMap({
        workspaceRoot,
        mapId: 1,
        grid: false,
        events: false,
      });
      const image = PNG.sync.read(await readFile(result.artifacts.png));
      expect(pixel(image, 72, 47)).toEqual([0, 0, 0, 0]);
      expect(pixel(image, 72, 48)).toEqual([210, 150, 40, 255]);
      expect(pixel(image, 72, 95)).toEqual([210, 150, 40, 255]);
      expect(result.imageInputs.map(({ relativePath }) => relativePath)).toEqual([
        "img/tilesets/Events.png",
      ]);
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
    const { workspaceRoot, projectRoot } = await createEventWorkspace(
      (map) => {
        map.events.push(
          event(1, 1, 1, { characterName: "Actors", characterIndex: 5, pattern: 2, direction: 6 }),
        );
      },
      [{ category: "characters", name: "Actors", image: actor }],
    );
    try {
      const before = await readWorkspaceFiles(workspaceRoot);
      const result = await renderWorkspaceMap({
        workspaceRoot,
        mapId: 1,
        grid: false,
        events: false,
      });
      const image = PNG.sync.read(await readFile(result.artifacts.png));
      expect(pixel(image, 72, 48)).toEqual([180, 30, 60, 255]);
      expect(pixel(image, 72, 41)).toEqual([0, 0, 0, 0]);
      expect(pixel(image, 72, 89)).toEqual([180, 30, 60, 255]);
      expect(pixel(image, 72, 90)).toEqual([0, 0, 0, 0]);
      expect(result.previewPages).toEqual([{ eventId: 1, page: 1 }]);
      const path = join(projectRoot, "img", "characters", "Actors.png");
      expect(result.imageInputs).toContainEqual({
        relativePath: "img/characters/Actors.png",
        path,
        status: "available",
        hash: createHash("sha256")
          .update(await readFile(path))
          .digest("hex"),
      });
      const after = await readWorkspaceFiles(workspaceRoot);
      for (const [path, bytes] of Object.entries(before)) expect(after[path]).toBe(bytes);
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });
});
