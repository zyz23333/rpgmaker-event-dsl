import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, it } from "vitest";
import { createMinimalProject, withWindowsSandbox } from "./support/windows-sandbox.js";
import { workspaceApiEntry } from "./support/workspace-operation-process.js";
const api: typeof import("../src/workspace-api.js") = await import(workspaceApiEntry);
const fields = [
  {
    family: "B05",
    branch: "positive-animation",
    token: "image1",
    category: "image",
    folder: "animations",
    name: "SelectedFirst",
    dataPath: "Animations.json[2].animation1Name",
  },
  {
    family: "B05",
    branch: "positive-animation",
    token: "image2",
    category: "image",
    folder: "animations",
    name: "SelectedSecond",
    dataPath: "Animations.json[2].animation2Name",
  },
  {
    family: "B05",
    branch: "positive-animation",
    token: "se0",
    category: "audio",
    folder: "se",
    name: "SelectedSound0",
    dataPath: "Animations.json[2].timings[0].se.name",
  },
  {
    family: "B05",
    branch: "positive-animation",
    token: "se1",
    category: "audio",
    folder: "se",
    name: "SelectedSound1",
    dataPath: "Animations.json[2].timings[1].se.name",
  },
  {
    family: "B11",
    branch: "game-over",
    token: "gameover-me",
    category: "audio",
    folder: "me",
    name: "SelectedGameOver",
    dataPath: "System.json.gameoverMe.name",
  },
  {
    family: "B12",
    branch: "return-title",
    token: "title1",
    category: "image",
    folder: "titles1",
    name: "SelectedTitleOne",
    dataPath: "System.json.title1Name",
  },
  {
    family: "B12",
    branch: "return-title",
    token: "title2",
    category: "image",
    folder: "titles2",
    name: "SelectedTitleTwo",
    dataPath: "System.json.title2Name",
  },
  {
    family: "B12",
    branch: "return-title",
    token: "title-bgm",
    category: "audio",
    folder: "bgm",
    name: "SelectedTitleMusic",
    dataPath: "System.json.titleBgm.name",
  },
] as const;
type Field = (typeof fields)[number];
type Variant =
  | "none"
  | "target-missing"
  | "field-missing"
  | "field-wrong-type"
  | "field-empty"
  | "file-missing";
const audio = (name: string) => ({ name, volume: 21, pitch: 71, pan: -31 });
function selectedAnimation() {
  return {
    id: 2,
    name: "Selected animation",
    animation1Name: "SelectedFirst",
    animation2Name: "SelectedSecond",
    timings: [
      { frame: 0, se: audio("SelectedSound0") },
      { frame: 7, se: audio("SelectedSound1") },
    ],
  };
}
function selectedSystem() {
  return {
    gameoverMe: audio("SelectedGameOver"),
    title1Name: "SelectedTitleOne",
    title2Name: "SelectedTitleTwo",
    titleBgm: audio("SelectedTitleMusic"),
  };
}
function mutateSelectedField(
  target: Record<string, unknown>,
  field: Field,
  variant: Variant,
): void {
  if (
    variant !== "none" &&
    variant !== "field-missing" &&
    variant !== "field-wrong-type" &&
    variant !== "field-empty"
  )
    return;
  const value = variant === "field-wrong-type" ? 17 : "";
  let owner: Record<string, unknown>;
  let key: string;
  switch (field.token) {
    case "image1":
    case "image2":
      owner = target;
      key = field.token === "image1" ? "animation1Name" : "animation2Name";
      break;
    case "se0":
    case "se1":
      owner = (
        target.timings as {
          se: Record<string, unknown>;
        }[]
      )[field.token === "se0" ? 0 : 1]!.se;
      key = "name";
      break;
    case "gameover-me":
      owner = target.gameoverMe as Record<string, unknown>;
      key = "name";
      break;
    case "title1":
      owner = target;
      key = "title1Name";
      break;
    case "title2":
      owner = target;
      key = "title2Name";
      break;
    case "title-bgm":
      owner = target.titleBgm as Record<string, unknown>;
      key = "name";
      break;
  }
  if (variant === "field-missing") delete owner[key];
  else owner[key] = value;
}
function authoredCommand(field: Field, missingTarget: boolean): string {
  if (field.family === "B05")
    return `forceAction({subject:{kind:"runtimeSelector",scope:"battler",target:"actor",actor:actorRef({id:1})},skill:skillRef({id:${missingTarget ? 2 : 1}}),target:{kind:"random"}})`;
  return field.family === "B11" ? "gameOver()" : "returnToTitleScreen()";
}
async function prepare(root: string, field: Field, variant: Variant) {
  const fixture = await createMinimalProject(root);
  const animation = selectedAnimation();
  const system = selectedSystem();
  mutateSelectedField(field.family === "B05" ? animation : system, field, variant);
  const project = {
    "Actors.json": [null, { id: 1, name: "Selected actor" }],
    "Skills.json": [null, { id: 1, name: "Selected skill", animationId: 2, effects: [] }],
    "Animations.json": [null, null, animation],
    "System.json": { ...fixture.projectFiles["System.json"], ...system },
  };
  const source = `import {commonEvent,forceAction,actorRef,skillRef,gameOver,returnToTitleScreen} from "rpgmaker-event-dsl";export const event=commonEvent({id:10,name:"Selected field",trigger:"none",commands:[${authoredCommand(field, variant === "target-missing")}]});`;
  for (const [file, data] of Object.entries(project))
    await writeFile(join(root, "Game/data", file), JSON.stringify(data));
  await api.initWorkspace({ workspaceRoot: root, projectRoot: "./Game" });
  await api.cloneWorkspace({ workspaceRoot: root });
  await writeFile(join(root, "src/selected-field.events.ts"), source);
  await mkdir(join(root, "Game", field.category === "image" ? "img" : "audio", field.folder), {
    recursive: true,
  });
  for (const sibling of fields)
    if (sibling.family === field.family && sibling.token !== field.token) await put(root, sibling);
  if (variant === "target-missing") await put(root, field);
}
async function put(root: string, field: Field) {
  const path = join(
    root,
    "Game",
    field.category === "image" ? "img" : "audio",
    field.folder,
    `${field.name}.${field.category === "image" ? "png" : "ogg"}`,
  );
  await mkdir(join(path, ".."), { recursive: true });
  await writeFile(path, "");
}
function failureText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
function savedName(snapshot: unknown, field: Field): unknown {
  const data =
    field.family === "B05"
      ? ((snapshot as unknown[])[2] as Record<string, unknown>)
      : (snapshot as Record<string, unknown>);
  switch (field.token) {
    case "image1":
      return data.animation1Name;
    case "image2":
      return data.animation2Name;
    case "se0":
      return (
        data.timings as {
          se: {
            name?: unknown;
          };
        }[]
      )[0]!.se.name;
    case "se1":
      return (
        data.timings as {
          se: {
            name?: unknown;
          };
        }[]
      )[1]!.se.name;
    case "gameover-me":
      return (
        data.gameoverMe as {
          name?: unknown;
        }
      ).name;
    case "title1":
      return data.title1Name;
    case "title2":
      return data.title2Name;
    case "title-bgm":
      return (
        data.titleBgm as {
          name?: unknown;
        }
      ).name;
  }
}
for (const field of fields) {
  const suffix = `${field.family}-${field.branch}-${field.token}`;
  it(`the selected empty name is None and independent reached fields remain valid (${suffix})`, async () => {
    await withWindowsSandbox(`asset-selected-none-${field.token}`, async (sandbox) => {
      const root = sandbox.workspaceRoot;
      await prepare(root, field, "none");
      await api.compileWorkspace({ workspaceRoot: root, check: true });
      await api.compileWorkspace({ workspaceRoot: root, check: false });
      const snapshot = JSON.parse(
        await readFile(
          join(
            root,
            ".rpgmaker-event-dsl/project-data-snapshot",
            field.family === "B05" ? "Animations.json" : "System.json",
          ),
          "utf8",
        ),
      );
      expect(savedName(snapshot, field)).toBe("");
      const generated = JSON.parse(
        await readFile(
          join(root, ".rpgmaker-event-dsl/generated-project-data/CommonEvents.json"),
          "utf8",
        ),
      );
      expect(generated[10].list[0].code).toBe(
        field.family === "B05" ? 339 : field.family === "B11" ? 353 : 354,
      );
    });
  });
  const variants: readonly Variant[] =
    field.family === "B05"
      ? ["target-missing", "field-missing", "field-wrong-type", "field-empty", "file-missing"]
      : ["field-missing", "field-wrong-type", "field-empty", "file-missing"];
  for (const variant of variants)
    it(`selected target, required name, None and file facts remain distinct (${variant}, ${suffix})`, async () => {
      await withWindowsSandbox(`asset-selected-${variant}-${field.token}`, async (sandbox) => {
        const root = sandbox.workspaceRoot;
        await prepare(root, field, variant);
        if (variant === "field-empty") {
          await api.compileWorkspace({ workspaceRoot: root, check: true });
          const snapshot = JSON.parse(
            await readFile(
              join(
                root,
                ".rpgmaker-event-dsl/project-data-snapshot",
                field.family === "B05" ? "Animations.json" : "System.json",
              ),
              "utf8",
            ),
          );
          expect(savedName(snapshot, field)).toBe("");
          return;
        }
        let failure = "";
        try {
          await api.compileWorkspace({ workspaceRoot: root, check: true });
        } catch (error) {
          failure = failureText(error);
        }
        expect(failure).not.toBe("");
        if (variant === "target-missing") {
          expect(failure).toMatch(/skill/iu);
          expect(failure).toMatch(/reference/iu);
          expect(failure).not.toContain("MV-ASSET-MISSING-FILE");
        } else {
          expect(failure).toContain(
            variant === "file-missing" ? "MV-ASSET-MISSING-FILE" : "MV-ASSET-INVALID-DATA",
          );
          expect(failure).toContain(field.dataPath);
          expect(failure).toContain("commonEvent:10 CommonEvents.json[10].list[0]");
          if (field.family === "B05") expect(failure).toContain("Skills.json[1].animationId");
          expect(failure).not.toContain("MV-ASSET-MISSING-DIRECTORY");
          if (variant === "file-missing") {
            expect(failure.match(/MV-ASSET-MISSING-FILE/gu)).toHaveLength(1);
            expect(failure).toContain(
              `${field.name}.${field.category === "image" ? "png" : "ogg"}`,
            );
            expect(failure).toContain("Coverage: complete");
            expect(failure).not.toContain("MV-ASSET-INVALID-DATA");
          } else {
            expect(failure).toContain("Coverage: incomplete");
            expect(failure).not.toContain("; target:");
            expect(failure).not.toContain("MV-ASSET-MISSING-FILE");
          }
        }
      });
    });
}
