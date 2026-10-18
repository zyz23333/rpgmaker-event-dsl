import { mkdir, mkdtemp, readdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { cloneWorkspace } from "../src/workspace-api.js";

export function mapFixture() {
  return {
    autoplayBgm: false,
    autoplayBgs: false,
    battleback1Name: "",
    battleback2Name: "",
    bgm: { name: "", pan: 0, pitch: 100, volume: 90 },
    bgs: { name: "", pan: 0, pitch: 100, volume: 90 },
    disableDashing: false,
    displayName: "Town Square",
    encounterList: [],
    encounterStep: 30,
    height: 2,
    note: "Town layout",
    parallaxLoopX: false,
    parallaxLoopY: false,
    parallaxName: "",
    parallaxShow: true,
    parallaxSx: 0,
    parallaxSy: 0,
    scrollType: 0,
    specifyBattleback: false,
    tilesetId: 1,
    width: 3,
    data: Array<number>(36).fill(0),
    events: [
      null,
      {
        id: 1,
        name: "Entrance",
        note: "",
        x: 2,
        y: 1,
        pages: [
          {
            conditions: { switch1Valid: false },
            image: { characterName: "", characterIndex: 0, direction: 2, pattern: 1, tileId: 0 },
            trigger: 0,
            list: [{ code: 0, indent: 0, parameters: [] }],
          },
        ],
      },
    ],
  };
}

export async function createMapWorkspace(options: { clone?: boolean } = {}) {
  const workspaceRoot = await mkdtemp(join(tmpdir(), "rpgmaker-map-observation-"));
  const projectRoot = join(workspaceRoot, "Game");
  const dataDirectory = join(projectRoot, "data");
  await mkdir(dataDirectory, { recursive: true });
  await mkdir(join(workspaceRoot, "src"));
  await writeFile(join(projectRoot, "Game.rpgproject"), "RPGMV 1.6.2");
  await writeFile(
    join(workspaceRoot, "rpgmaker-event-dsl.config.json"),
    JSON.stringify({
      projectRoot: "./Game",
      scriptEnabled: false,
      sourceRoot: "src",
      sourceInclude: ["**/*.events.ts"],
      sourceExclude: [],
    }),
  );
  for (const name of [
    "Actors",
    "Animations",
    "Armors",
    "Classes",
    "CommonEvents",
    "Enemies",
    "Items",
    "Skills",
    "States",
    "Troops",
    "Weapons",
  ]) {
    await writeFile(join(dataDirectory, `${name}.json`), "[null]");
  }
  await writeFile(
    join(dataDirectory, "System.json"),
    JSON.stringify({ switches: [""], variables: [""] }),
  );
  await writeFile(
    join(dataDirectory, "MapInfos.json"),
    JSON.stringify([
      null,
      { id: 1, name: "Town", parentId: 0 },
      { id: 2, name: "Town", parentId: 1 },
    ]),
  );
  await writeFile(
    join(dataDirectory, "Tilesets.json"),
    JSON.stringify([
      null,
      {
        id: 1,
        name: "Outside",
        mode: 1,
        flags: Array<number>(8192).fill(0),
        tilesetNames: ["", "", "", "", "", "", "", "", ""],
      },
    ]),
  );
  await writeFile(join(dataDirectory, "Map001.json"), JSON.stringify(mapFixture()));
  await writeFile(
    join(dataDirectory, "Map002.json"),
    JSON.stringify({ ...mapFixture(), events: [null] }),
  );
  if (options.clone !== false) {
    await cloneWorkspace({ workspaceRoot });
  }
  return { workspaceRoot, projectRoot, dataDirectory };
}

export async function readWorkspaceFiles(directory: string): Promise<Record<string, string>> {
  const files: Record<string, string> = {};
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      const children = await readWorkspaceFiles(path);
      for (const [name, content] of Object.entries(children)) {
        files[`${entry.name}/${name}`] = content;
      }
    } else {
      files[entry.name] = (await readFile(path)).toString("base64");
    }
  }
  return files;
}
