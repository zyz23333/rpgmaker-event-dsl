import { execFile } from "node:child_process";
import { link, mkdir, readFile, readdir, rm, stat, symlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { promisify } from "node:util";
import { expect } from "vitest";
import { createAssetTest, recordAssetInput } from "./support/asset-evidence.js";
import { createMinimalProject, runCli, withWindowsSandbox } from "./support/windows-sandbox.js";
import {
  startWorkspaceOperation,
  workspaceApiEntry,
} from "./support/workspace-operation-process.js";

const api: typeof import("../src/workspace-api.js") = await import(workspaceApiEntry);
const it = createAssetTest({ ownerTicket: "03", testSource: import.meta.url });

async function prepare(
  root: string,
  names: string[] = ["Poster"],
  configuration: { source?: string; projectFiles?: Record<string, unknown> } = {},
) {
  const source =
    configuration.source ??
    `import {commonEvent,rawDslCommand} from "rpgmaker-event-dsl";
export const event=commonEvent({id:10,name:"Files",trigger:"none",commands:[${names.map((name, index) => `rawDslCommand({code:231,indent:0,parameters:${JSON.stringify([index + 1, name, 0, 0, 0, 0, 100, 100, 255, 0])}})`).join(",")}]});`;
  recordAssetInput({
    names,
    source,
    contract: "exact selected PNG metadata in the bound Project Root",
  });
  await createMinimalProject(root);
  for (const [file, data] of Object.entries(configuration.projectFiles ?? {}))
    await writeFile(join(root, "Game/data", file), JSON.stringify(data));
  recordAssetInput({ projectOverrides: configuration.projectFiles });
  await api.initWorkspace({ workspaceRoot: root, projectRoot: "./Game" });
  await api.cloneWorkspace({ workspaceRoot: root });
  await mkdir(join(root, "src"), { recursive: true });
  await writeFile(join(root, "src/files.events.ts"), source);
}

async function png(root: string, relative = "img/pictures/Poster.png") {
  const path = join(root, "Game", relative);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, "");
  recordAssetInput({
    file: relative,
    contents: "ordinary zero-byte file",
    timing: "before asset gate",
  });
  return path;
}

async function localState(root: string) {
  const state = join(root, ".rpgmaker-event-dsl");
  return {
    manifest: await readFile(join(state, "sync-manifest.json"), "utf8"),
    generated: await readdir(join(state, "generated-project-data")).catch(() => null),
    pending: await readdir(join(state, "pending-push")).catch(() => null),
  };
}

function unsupportedImageNameCase(branch: string, name: string, alternative: string) {
  it(`AV.F06.${branch}.input.case.expected: image percent and hash names are rejected before any category lookup without changing the saved value`, async () => {
    for (const representation of ["formal", "raw"] as const)
      await withWindowsSandbox(`asset-image-${branch}-${representation}`, async (sandbox) => {
        const root = sandbox.workspaceRoot;
        await prepare(root, [name]);
        if (representation === "formal") {
          const source = `import {commonEvent,showPicture,imageAsset} from "rpgmaker-event-dsl";
export const event=commonEvent({id:10,name:"Files",trigger:"none",commands:[showPicture({pictureId:1,image:imageAsset({folder:"pictures",name:${JSON.stringify(name)}}),origin:"upperLeft",position:{kind:"direct",x:0,y:0},scaleX:100,scaleY:100,opacity:255,blendMode:"normal"})]});`;
          await writeFile(join(root, "src/files.events.ts"), source);
          recordAssetInput({ representation, source });
        }
        await png(root, `img/pictures/${name}.png`);
        await png(root, `img/pictures/${alternative}`);
        const before = await localState(root);
        for (const check of [true, false]) {
          const failure = await api
            .compileWorkspace({ workspaceRoot: root, check })
            .then(() => "", String);
          expect(failure).toContain("error MV-ASSET-UNSUPPORTED-NAME");
          expect(failure).toContain(JSON.stringify(name));
          expect(failure).toContain("CommonEvents.json[10].list[0].parameters[1]");
          expect(failure).toContain("this use is unchecked");
          expect(failure).not.toContain("; target:");
          expect(failure).not.toContain("; failed at:");
          expect(failure).not.toContain("MV-ASSET-MISSING");
          expect(await localState(root)).toEqual(before);
        }
        const child = startWorkspaceOperation(sandbox, {
          operation: "check",
          mode: "cli",
          boundary: "asset-link-guard",
          assetPath: "img",
        });
        try {
          expect((await child.ended).exitCode).toBe(1);
          expect(
            child.messages.some((message) => message.kind === "asset-link-follow-attempt"),
          ).toBe(false);
          const cli = sandbox.processes.at(-1)!;
          expect(cli.stderr).toContain("error MV-ASSET-UNSUPPORTED-NAME");
          expect(cli.stderr).toContain(JSON.stringify(name));
          expect(cli.stderr).not.toContain("; target:");
          expect(cli.stderr).not.toContain("MV-ASSET-QUERY-FAILED");
          recordAssetInput({
            representation,
            actualCli: cli,
            guard: "no descent into img; exact and URL-interpreted files both exist",
          });
        } finally {
          await child.stop();
        }
        const cli = await runCli(sandbox, ["compile"], { allowFailure: true });
        expect(cli.exitCode).toBe(1);
        expect(cli.stderr).toContain("error MV-ASSET-UNSUPPORTED-NAME");
        expect(cli.stderr).toContain(JSON.stringify(name));
        expect(cli.stderr).not.toContain("; target:");
        recordAssetInput({ representation, actualCompileCli: cli });
        expect(await localState(root)).toEqual(before);
        expect((await readdir(join(root, "Game/img/pictures"))).sort()).toEqual(
          [`${name}.png`, alternative].sort(),
        );
      });
  });
}

unsupportedImageNameCase("image-percent", "image%percent", "imagepercent.png");
unsupportedImageNameCase("image-hash", "image#hash", "image");
unsupportedImageNameCase("literal-percent20", "literal%20image", "literal image.png");

for (const [branch, name] of [
  ["candidate", "Candidate%20#Image"],
  ["inactive", "Inactive%20#Image"],
] as const)
  it(`AV.F06.image-${branch}.input.case.expected: unsupported saved image names warn with unchecked coverage and preserve their candidate or inactive origin`, async () => {
    await withWindowsSandbox(`asset-image-${branch}`, async (sandbox) => {
      const root = sandbox.workspaceRoot;
      const authored =
        branch === "candidate"
          ? `import {commonEvent,changePartyMember,actorRef} from "rpgmaker-event-dsl";export const event=commonEvent({id:10,name:"Files",trigger:"none",commands:[changePartyMember({actor:actorRef({id:1}),operation:"add",initialize:false})]});`
          : `import {mapEvent,imageAsset} from "rpgmaker-event-dsl";export const event=mapEvent({mapId:1,id:1,name:"Files",x:0,y:0,pages:[{conditions:{},trigger:"action",commands:[],movement:{type:"fixed",route:{commands:[{kind:"changeImage",character:imageAsset({folder:"characters",name:${JSON.stringify(name)}}),characterIndex:7}]}}}]});`;
      const projectFiles =
        branch === "candidate"
          ? {
              "Actors.json": [
                null,
                { id: 1, name: "Actor", characterName: name, battlerName: name },
              ],
            }
          : {
              "MapInfos.json": [null, { id: 1, name: "Files" }],
              "Map001.json": { width: 1, height: 1, tilesetId: 1, events: [] },
              "Tilesets.json": [null, { id: 1, name: "Tiles" }],
            };
      await prepare(root, [], { source: authored, projectFiles });
      const before = await localState(root);
      await api.compileWorkspace({ workspaceRoot: root, check: true });
      expect(await localState(root)).toEqual(before);
      const child = startWorkspaceOperation(sandbox, {
        operation: "check",
        mode: "cli",
        boundary: "asset-link-guard",
        assetPath: "img",
      });
      try {
        expect((await child.ended).exitCode).toBe(0);
        expect(child.messages.some((message) => message.kind === "asset-link-follow-attempt")).toBe(
          false,
        );
        const cli = sandbox.processes.at(-1)!;
        expect(cli.stderr).toContain("warning MV-ASSET-UNSUPPORTED-NAME");
        expect(cli.stderr).toContain(JSON.stringify(name));
        expect(cli.stderr).toContain("this use is unchecked");
        expect(cli.stderr).toContain(
          branch === "candidate"
            ? "candidate: Actor initial"
            : "inactive: Autonomous Movement is fixed",
        );
        expect(cli.stderr).not.toContain("error MV-ASSET");
        expect(cli.stderr).not.toContain("; target:");
        if (branch === "candidate") {
          expect(cli.stderr).toContain("image/characters");
          expect(cli.stderr).toContain("image/sv_actors");
          expect(cli.stderr).toContain("Actors.json[1].characterName");
          expect(cli.stderr).toContain("Actors.json[1].battlerName");
        } else
          expect(cli.stderr).toContain(
            "Map001.json.events[1].pages[0].moveRoute.list[0].parameters[0]",
          );
        recordAssetInput({
          actualCli: cli,
          guard: "no image lookup, even without any img directory",
        });
      } finally {
        await child.stop();
      }
      expect(await localState(root)).toEqual(before);
      await api.compileWorkspace({ workspaceRoot: root, check: false });
      const cli = await runCli(sandbox, ["compile"]);
      expect(cli.stderr).toContain("warning MV-ASSET-UNSUPPORTED-NAME");
      recordAssetInput({ actualCompileCli: cli });
      if (branch === "inactive") {
        const map = JSON.parse(
          await readFile(
            join(root, ".rpgmaker-event-dsl/generated-project-data/Map001.json"),
            "utf8",
          ),
        );
        expect(map.events[1].pages[0].moveRoute.list[0].parameters[0]).toBe(name);
      } else {
        const actors = JSON.parse(
          await readFile(
            join(root, ".rpgmaker-event-dsl/project-data-snapshot/Actors.json"),
            "utf8",
          ),
        );
        expect(actors[1].characterName).toBe(name);
        expect(actors[1].battlerName).toBe(name);
      }
      expect(await readdir(join(root, "Game"))).not.toContain("img");
    });
  });

it("AV.F12.type-changes-during-query.injected.case.expected: an enumerated ordinary file becoming a directory is an inconclusive query", async () => {
  await withWindowsSandbox("asset-file-type-change", async (sandbox) => {
    await prepare(sandbox.workspaceRoot);
    const target = await png(sandbox.workspaceRoot);
    const before = await localState(sandbox.workspaceRoot);
    const child = startWorkspaceOperation(sandbox, {
      operation: "check",
      boundary: "asset-after-enumeration",
    });
    try {
      await child.waitFor("checkpoint");
      await rm(target);
      await mkdir(target);
      recordAssetInput({
        operation: "replace enumerated file with directory",
        timing: "after native readdir result, before lstat",
      });
      child.send("release");
      const result = await child.waitFor("result");
      expect(result.ok).toBe(false);
      expect(result.message).toContain("MV-ASSET-QUERY-FAILED");
      expect(result.message).toContain("Poster.png");
    } finally {
      await child.stop();
    }
    expect(await localState(sandbox.workspaceRoot)).toEqual(before);
  });
});

for (const [branch, actualPath, expectedPath] of [
  ["top-directory-case", "Img/pictures/Poster.png", "img"],
  ["category-directory-case", "img/Pictures/Poster.png", "pictures"],
  ["stem-case", "img/pictures/poster.png", "Poster.png"],
  ["extension-case", "img/pictures/Poster.PNG", "Poster.png"],
] as const)
  it(`AV.F03.${branch}.filesystem.case.expected: exact case is required at every level`, async () => {
    await withWindowsSandbox(`asset-${branch}`, async (sandbox) => {
      await prepare(sandbox.workspaceRoot);
      await png(sandbox.workspaceRoot, actualPath);
      const before = await localState(sandbox.workspaceRoot);
      const failure = await api
        .compileWorkspace({ workspaceRoot: sandbox.workspaceRoot, check: true })
        .then(() => "", String);
      expect(failure).toContain("MV-ASSET-NAME-MISMATCH");
      expect(failure).toContain(expectedPath);
      expect(failure).toContain("CommonEvents.json[10].list[0].parameters[1]");
      expect(await localState(sandbox.workspaceRoot)).toEqual(before);
      if (branch === "extension-case") {
        const cli = await runCli(sandbox, ["compile", "--check"], { allowFailure: true });
        expect(cli.exitCode).toBe(1);
        expect(cli.stderr).toContain("MV-ASSET-NAME-MISMATCH");
        expect(cli.stderr).toContain("Poster.png");
        expect(cli.stderr).toContain("CommonEvents.json[10].list[0].parameters[1]");
        recordAssetInput({ actualCli: cli });
      }
    });
  });

for (const branch of ["exact-plus-case-variant", "multiple-case-variants"] as const)
  it(`AV.F03.${branch}.filesystem.case.expected: real case-coexisting files never replace the exact spelling`, async () => {
    await withWindowsSandbox(`asset-${branch}`, async (sandbox) => {
      await prepare(sandbox.workspaceRoot);
      const directory = join(sandbox.workspaceRoot, "Game/img/pictures");
      await mkdir(directory, { recursive: true });
      const capability = await promisify(execFile)(
        "fsutil.exe",
        ["file", "setCaseSensitiveInfo", directory, "enable"],
        { windowsHide: true },
      );
      recordAssetInput({
        capability: "real case-sensitive NTFS directory; failure is not skipped",
        stdout: capability.stdout,
      });
      await png(sandbox.workspaceRoot, "img/pictures/poster.png");
      await png(
        sandbox.workspaceRoot,
        branch === "exact-plus-case-variant"
          ? "img/pictures/Poster.png"
          : "img/pictures/POSTER.png",
      );
      expect((await readdir(directory)).sort()).toEqual(
        branch === "exact-plus-case-variant"
          ? ["Poster.png", "poster.png"]
          : ["POSTER.png", "poster.png"],
      );
      if (branch === "exact-plus-case-variant")
        await api.compileWorkspace({ workspaceRoot: sandbox.workspaceRoot, check: true });
      else {
        const failure = await api
          .compileWorkspace({ workspaceRoot: sandbox.workspaceRoot, check: true })
          .then(() => "", String);
        expect(failure).toContain("MV-ASSET-NAME-MISMATCH");
        expect(failure).toContain("POSTER.png, poster.png");
      }
    });
  });

for (const [branch, name] of [
  ["chinese", "中文行走图"],
  ["space", "Poster With Space"],
  ["whitespace-only", "   "],
  ["dot", "Poster.Dot"],
  ["dollar", "$Poster"],
  ["bang", "!Poster"],
  ["trailing-space-stem", "Poster "],
  ["trailing-dot-stem", "Poster."],
] as const)
  it(`AV.F04.${branch}.filesystem.case.expected: the complete saved name is preserved before appending PNG`, async () => {
    await withWindowsSandbox(`asset-name-${branch}`, async (sandbox) => {
      await prepare(sandbox.workspaceRoot, [name]);
      await png(sandbox.workspaceRoot, `img/pictures/${name}.png`);
      const before = await localState(sandbox.workspaceRoot);
      await api.compileWorkspace({ workspaceRoot: sandbox.workspaceRoot, check: true });
      expect(await localState(sandbox.workspaceRoot)).toEqual(before);
      await api.compileWorkspace({ workspaceRoot: sandbox.workspaceRoot, check: false });
      const generated = JSON.parse(
        await readFile(
          join(
            sandbox.workspaceRoot,
            ".rpgmaker-event-dsl/generated-project-data/CommonEvents.json",
          ),
          "utf8",
        ),
      );
      expect(generated[10].list[0].parameters[1]).toBe(name);
      expect(await readdir(join(sandbox.workspaceRoot, "Game/img/pictures"))).toEqual([
        `${name}.png`,
      ]);
    });
  });

for (const [branch, name, alternative, exact] of [
  ["double-extension", "Forest.png", "Forest.png", "Forest.png.png"],
  ["unicode-distinct", "Café", "Cafe\u0301.png", "Café.png"],
] as const)
  it(`AV.F05.${branch}.filesystem.case.expected: suffixes and Unicode are never normalized to an alternative`, async () => {
    await withWindowsSandbox(`asset-${branch}`, async (sandbox) => {
      await prepare(sandbox.workspaceRoot, [name]);
      await png(sandbox.workspaceRoot, `img/pictures/${alternative}`);
      await expect(
        api.compileWorkspace({ workspaceRoot: sandbox.workspaceRoot, check: true }),
      ).rejects.toThrow("MV-ASSET-MISSING-FILE");
      await png(sandbox.workspaceRoot, `img/pictures/${exact}`);
      await api.compileWorkspace({ workspaceRoot: sandbox.workspaceRoot, check: true });
      expect((await readdir(join(sandbox.workspaceRoot, "Game/img/pictures"))).sort()).toEqual(
        [alternative, exact].sort(),
      );
    });
  });

for (const [branch, alternatives, present] of [
  ["image-encrypted-only", ["Poster.rpgmvp"], false],
  ["other-only", ["Poster.jpg", "Poster.webp"], false],
  ["exact-plus-alternative", ["Poster.png", "Poster.jpg", "Poster.rpgmvp"], true],
] as const)
  it(`AV.F02.${branch}.filesystem.case.expected: alternate formats do not satisfy or invalidate the exact PNG target`, async () => {
    await withWindowsSandbox(`asset-${branch}`, async (sandbox) => {
      await prepare(sandbox.workspaceRoot);
      for (const alternative of alternatives)
        await png(sandbox.workspaceRoot, `img/pictures/${alternative}`);
      if (present)
        await api.compileWorkspace({ workspaceRoot: sandbox.workspaceRoot, check: true });
      else
        await expect(
          api.compileWorkspace({ workspaceRoot: sandbox.workspaceRoot, check: true }),
        ).rejects.toThrow("MV-ASSET-MISSING-FILE");
    });
  });

for (const [branch, relative] of [
  ["no-www-fallback", "Game/www/img/pictures/Poster.png"],
  ["no-other-root", "Other/img/pictures/Poster.png"],
] as const)
  it(`AV.F14.${branch}.filesystem.case.expected: the bound Project Root is the only resource tree`, async () => {
    await withWindowsSandbox(`asset-${branch}`, async (sandbox) => {
      await prepare(sandbox.workspaceRoot);
      const alternative = join(sandbox.workspaceRoot, relative);
      await mkdir(dirname(alternative), { recursive: true });
      await writeFile(alternative, "");
      recordAssetInput({
        alternative,
        expected: "bound Game/img remains missing; no resource-tree fallback",
      });
      await expect(
        api.compileWorkspace({ workspaceRoot: sandbox.workspaceRoot, check: true }),
      ).rejects.toThrow("MV-ASSET-MISSING-DIRECTORY");
    });
  });

it("AV.F11.enumerate-denied.injected.case.expected: enumeration failures identify the actual directory and safe independent uses continue", async () => {
  await withWindowsSandbox("asset-enumerate-denied", async (sandbox) => {
    await prepare(sandbox.workspaceRoot, ["Broken", "Missing"]);
    const directory = join(sandbox.workspaceRoot, "Game/img/pictures");
    await mkdir(directory, { recursive: true });
    const child = startWorkspaceOperation(sandbox, {
      operation: "check",
      boundary: "asset-enumeration-denied",
      assetPath: "img/pictures",
    });
    try {
      const result = await child.waitFor("result");
      expect(result.ok).toBe(false);
      expect(result.message).toContain("MV-ASSET-QUERY-FAILED");
      const query = result
        .message!.split("\n")
        .find((line) => line.includes("MV-ASSET-QUERY-FAILED"))!;
      expect(query.endsWith(`; failed at: ${directory}`)).toBe(true);
      expect(result.message).toContain("MV-ASSET-MISSING-FILE");
      expect(result.message).toContain('image/pictures "Broken"');
      expect(result.message).toContain('image/pictures "Missing"');
      recordAssetInput({
        injected: "one EACCES on required directory enumeration; not a real ACL claim",
        result,
      });
    } finally {
      await child.stop();
    }
  });
});

for (const [branch, boundary, code] of [
  ["metadata-denied", "asset-metadata-denied", "EACCES"],
  ["io-failure", "asset-io-failure", "EIO"],
] as const)
  it(`AV.F11.${branch}.injected.case.expected: metadata errors remain query failures and independent missing files are retained`, async () => {
    await withWindowsSandbox(`asset-${branch}`, async (sandbox) => {
      await prepare(sandbox.workspaceRoot, ["Broken", "Missing"]);
      const target = await png(sandbox.workspaceRoot, "img/pictures/Broken.png");
      const before = await localState(sandbox.workspaceRoot);
      const child = startWorkspaceOperation(sandbox, {
        operation: "check",
        boundary,
        assetPath: "img/pictures/Broken.png",
      });
      try {
        const result = await child.waitFor("result");
        expect(result.ok).toBe(false);
        expect(result.message).toContain("MV-ASSET-QUERY-FAILED");
        const query = result
          .message!.split("\n")
          .find((line) => line.includes("MV-ASSET-QUERY-FAILED"))!;
        expect(query.endsWith(`; failed at: ${target}`)).toBe(true);
        expect(result.message).toContain("MV-ASSET-MISSING-FILE");
        expect(result.message).toContain('image/pictures "Missing"');
        recordAssetInput({ injected: `OS lstat throws ${code}; not a real ACL claim`, result });
      } finally {
        await child.stop();
      }
      expect(await localState(sandbox.workspaceRoot)).toEqual(before);
    });
  });

it("AV.F12.disappears-after-enumeration.injected.case.expected: an observed entry disappearing is not a confirmed missing file", async () => {
  await withWindowsSandbox("asset-file-disappears", async (sandbox) => {
    await prepare(sandbox.workspaceRoot);
    const target = await png(sandbox.workspaceRoot);
    const before = await localState(sandbox.workspaceRoot);
    const child = startWorkspaceOperation(sandbox, {
      operation: "compile",
      mode: "cli",
      boundary: "asset-after-enumeration",
    });
    try {
      await child.waitFor("checkpoint");
      await rm(target);
      recordAssetInput({
        operation: "remove actual file",
        timing: "after readdir before lstat; no artificial missing-file result",
      });
      child.send("release");
      expect((await child.ended).exitCode).toBe(1);
      const process = sandbox.processes.at(-1)!;
      expect(process.stderr).toContain("MV-ASSET-QUERY-FAILED");
      expect(process.stderr).not.toContain("MV-ASSET-MISSING-FILE");
      expect(process.stderr).toContain(target);
      recordAssetInput({ actualCli: process });
    } finally {
      await child.stop();
    }
    expect(await localState(sandbox.workspaceRoot)).toEqual(before);
  });
});

it("AV.F10.metadata-only.injected.case.expected: content-open rejection is irrelevant to ordinary-file existence", async () => {
  await withWindowsSandbox("asset-metadata-only", async (sandbox) => {
    await prepare(sandbox.workspaceRoot);
    await png(sandbox.workspaceRoot);
    const before = await localState(sandbox.workspaceRoot);
    const child = startWorkspaceOperation(sandbox, {
      operation: "check",
      boundary: "asset-media-read-denied",
    });
    try {
      expect((await child.waitFor("result")).ok).toBe(true);
      expect(child.messages.some((message) => message.kind === "asset-content-read-attempt")).toBe(
        false,
      );
      recordAssetInput({
        injected:
          "async/sync open/readFile reject only the media path; metadata remains real and accessible; not a real ACL claim",
      });
    } finally {
      await child.stop();
    }
    expect(await localState(sandbox.workspaceRoot)).toEqual(before);
  });
});

it("AV.F10.hard-link.filesystem.case.expected: a real ordinary hard link passes without inspecting its other name", async () => {
  await withWindowsSandbox("asset-hard-link", async (sandbox) => {
    await prepare(sandbox.workspaceRoot);
    const source = join(sandbox.root, "original.png");
    await writeFile(source, "opaque bytes; decoding is outside existence checking");
    const target = join(sandbox.workspaceRoot, "Game/img/pictures/Poster.png");
    await mkdir(dirname(target), { recursive: true });
    await link(source, target);
    expect((await stat(target)).nlink).toBeGreaterThanOrEqual(2);
    await api.compileWorkspace({ workspaceRoot: sandbox.workspaceRoot, check: true });
    expect(await readFile(target, "utf8")).toBe(
      "opaque bytes; decoding is outside existence checking",
    );
    recordAssetInput({
      source,
      target,
      operation: "real NTFS hard link",
      expected: "ordinary file passes",
    });
  });
});

it("AV.F10.zero-byte.filesystem.case.expected: zero-byte media are ordinary files and content is not validated", async () => {
  await withWindowsSandbox("asset-zero-byte", async (sandbox) => {
    await prepare(sandbox.workspaceRoot);
    const target = await png(sandbox.workspaceRoot);
    expect((await stat(target)).size).toBe(0);
    await api.compileWorkspace({ workspaceRoot: sandbox.workspaceRoot, check: true });
  });
});

it("AV.F09.root-alias.filesystem.case.expected: an existing root junction keeps normal Project Root Binding semantics", async () => {
  await withWindowsSandbox("asset-root-alias", async (sandbox) => {
    await prepare(sandbox.workspaceRoot);
    await png(sandbox.workspaceRoot);
    const alias = join(sandbox.workspaceRoot, "Game Alias");
    await symlink(join(sandbox.workspaceRoot, "Game"), alias, "junction");
    const path = join(sandbox.workspaceRoot, "rpgmaker-event-dsl.config.json");
    const config = JSON.parse(await readFile(path, "utf8"));
    config.projectRoot = "./Game Alias";
    await writeFile(path, JSON.stringify(config));
    await api.compileWorkspace({ workspaceRoot: sandbox.workspaceRoot, check: true });
    expect((await runCli(sandbox, ["compile", "--check"])).exitCode).toBe(0);
    recordAssetInput({ alias, target: "original Game root", actualCli: sandbox.processes.at(-1) });
  });
});

for (const branch of [
  "top-symlink",
  "category-junction",
  "file-symlink",
  "link-in-root",
  "link-outside-root",
  "dangling-link",
] as const)
  it(`AV.F09.${branch}.filesystem.case.expected: links below Project Root are refused without descending`, async () => {
    await withWindowsSandbox(`asset-${branch}`, async (sandbox) => {
      await prepare(sandbox.workspaceRoot);
      const root = sandbox.workspaceRoot;
      const linkRelative =
        branch === "top-symlink"
          ? "img"
          : branch === "category-junction"
            ? "img/pictures"
            : "img/pictures/Poster.png";
      const linkPath = join(root, "Game", linkRelative);
      const target =
        branch === "link-in-root"
          ? join(root, "Game/inside.png")
          : join(sandbox.root, branch === "dangling-link" ? "absent.png" : "external-media");
      const type =
        branch === "top-symlink" ? "dir" : branch === "category-junction" ? "junction" : "file";
      if (branch !== "dangling-link") {
        if (type === "file") await writeFile(target, "opaque media");
        else {
          const targetFile = join(
            target,
            branch === "top-symlink" ? "pictures/Poster.png" : "Poster.png",
          );
          await mkdir(dirname(targetFile), { recursive: true });
          await writeFile(targetFile, "opaque media");
        }
      }
      await mkdir(dirname(linkPath), { recursive: true });
      await symlink(target, linkPath, type);
      const child = startWorkspaceOperation(sandbox, {
        operation: "check",
        boundary: "asset-link-guard",
        assetPath: linkRelative,
      });
      try {
        const result = await child.waitFor("result");
        expect(result.ok).toBe(false);
        expect(result.message).toContain("MV-ASSET-UNSUPPORTED-LINK");
        expect(result.message).toContain(`failed at: ${linkPath}`);
        expect(child.messages.some((message) => message.kind === "asset-link-follow-attempt")).toBe(
          false,
        );
        recordAssetInput({
          actualLink: { linkPath, target, type },
          guard: "OS read/enumerate/realpath/descent below link rejected if attempted",
          result,
        });
      } finally {
        await child.stop();
      }
    });
  });

function unsupportedNameCase(branch: string, field: string, name: string) {
  it(`AV.F07.${branch}.input.${field}.expected: unsupported names retain the original input without a fabricated file target`, async () => {
    await withWindowsSandbox(`asset-unsupported-${branch}`, async (sandbox) => {
      await prepare(sandbox.workspaceRoot, [name]);
      const before = await localState(sandbox.workspaceRoot);
      const failure = await api
        .compileWorkspace({ workspaceRoot: sandbox.workspaceRoot, check: true })
        .then(() => "", String);
      expect(failure).toContain("MV-ASSET-UNSUPPORTED-NAME");
      expect(failure).toContain(JSON.stringify(name));
      expect(failure).toContain("CommonEvents.json[10].list[0].parameters[1]");
      expect(failure).not.toContain("; target:");
      expect(failure).not.toContain("MV-ASSET-MISSING");
      expect(await localState(sandbox.workspaceRoot)).toEqual(before);
      if (branch === "slash") {
        const child = startWorkspaceOperation(sandbox, {
          operation: "check",
          mode: "cli",
          boundary: "asset-link-guard",
          assetPath: "img",
        });
        try {
          expect((await child.ended).exitCode).toBe(1);
          expect(
            child.messages.some((message) => message.kind === "asset-link-follow-attempt"),
          ).toBe(false);
          expect(sandbox.processes.at(-1)!.stderr).toContain("MV-ASSET-UNSUPPORTED-NAME");
          recordAssetInput({
            actualCli: sandbox.processes.at(-1),
            guard: "no descent into any image category for unsupported slash name",
          });
        } finally {
          await child.stop();
        }
      }
    });
  });
}

for (const [branch, name] of [
  ["slash", "sub/Poster"],
  ["backslash", "sub\\Poster"],
  ["absolute", "C:\\outside\\Poster"],
  ["drive-relative", "C:Poster"],
  ["parent-traversal", "../Poster"],
] as const)
  unsupportedNameCase(branch, "case", name);

// Independent transcription of the accepted Windows character/device lists;
// neither expectations nor case generation import the product name validator.
for (const [token, character] of [
  ["U003C", "<"],
  ["U003E", ">"],
  ["U003A", ":"],
  ["U0022", '"'],
  ["U002F", "/"],
  ["U005C", "\\"],
  ["U007C", "|"],
  ["U003F", "?"],
  ["U002A", "*"],
] as const)
  unsupportedNameCase("forbidden-character", `case-${token}`, `Bad${character}Name`);

for (let code = 0; code <= 31; code++)
  unsupportedNameCase(
    "control-character",
    `case-U${code.toString(16).toUpperCase().padStart(4, "0")}`,
    `Bad${String.fromCharCode(code)}Name`,
  );

for (const device of [
  "CON",
  "PRN",
  "AUX",
  "NUL",
  "COM1",
  "COM2",
  "COM3",
  "COM4",
  "COM5",
  "COM6",
  "COM7",
  "COM8",
  "COM9",
  "LPT1",
  "LPT2",
  "LPT3",
  "LPT4",
  "LPT5",
  "LPT6",
  "LPT7",
  "LPT8",
  "LPT9",
  "COM¹",
  "COM²",
  "COM³",
  "LPT¹",
  "LPT²",
  "LPT³",
]) {
  unsupportedNameCase("device-name", `case-${device}`, device);
  unsupportedNameCase("device-name-extension", `case-${device}`, `${device}.extra`);
  unsupportedNameCase("device-name-case", `case-${device}`, device.toLowerCase());
}
