import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, it } from "vitest";
import { createMinimalProject, runCli, withWindowsSandbox } from "./support/windows-sandbox.js";
import { workspaceApiEntry } from "./support/workspace-operation-process.js";
const api: typeof import("../src/workspace-api.js") = await import(workspaceApiEntry);
const imports =
  'import {commonEvent,callCommonEvent,commonEventRef,showPicture,imageAsset} from "rpgmaker-event-dsl";\n';
const common = (id: number, commands: string) =>
  `export const event${id}=commonEvent({id:${id},name:"Event ${id}",trigger:"none",commands:[${commands}]});\n`;
const call = (id: number) => `callCommonEvent({commonEvent:commonEventRef({id:${id}})})`;
const picture =
  'showPicture({pictureId:1,image:imageAsset({folder:"pictures",name:"CalledPoster"}),origin:"upperLeft",position:{kind:"direct",x:0,y:0},scaleX:100,scaleY:100,opacity:255,blendMode:"normal"})';
async function prepare(root: string, source: string) {
  await createMinimalProject(root);
  await api.initWorkspace({ workspaceRoot: root, projectRoot: "./Game" });
  await api.cloneWorkspace({ workspaceRoot: root });
  await writeFile(join(root, "src/calls.events.ts"), imports + source);
  await mkdir(join(root, "Game/img/pictures"), { recursive: true });
}
it("an uncalled Common Event checks its own picture", async () => {
  await withWindowsSandbox("asset-common-independent", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    await prepare(root, common(10, "") + common(11, picture));
    const error = await api
      .compileWorkspace({ workspaceRoot: root, check: true })
      .then(() => "", String);
    expect(error).toContain("MV-ASSET-MISSING-FILE");
    expect(error).toContain("commonEvent:11 CommonEvents.json[11].list[0].parameters[1]");
    await writeFile(join(root, "Game/img/pictures/CalledPoster.png"), "");
    await api.compileWorkspace({ workspaceRoot: root, check: true });
    await api.compileWorkspace({ workspaceRoot: root, check: false });
    const generated = JSON.parse(
      await readFile(
        join(root, ".rpgmaker-event-dsl/generated-project-data/CommonEvents.json"),
        "utf8",
      ),
    );
    expect(generated[10].list).toEqual([{ code: 0, indent: 0, parameters: [] }]);
    expect(generated[11].list[0].parameters[1]).toBe("CalledPoster");
  });
});
for (const [branch, definitions] of [
  ["self-cycle", common(11, `${call(11)},${picture}`)],
  ["mutual-cycle", common(10, call(11)) + common(11, `${call(10)},${picture}`)],
  [
    "shared-callers",
    common(10, call(11)) + common(11, `${call(10)},${picture}`) + common(12, call(11)),
  ],
] as const)
  it(`Common Event calls do not expand asset uses (${branch})`, async () => {
    await withWindowsSandbox(`asset-common-${branch}`, async (sandbox) => {
      const root = sandbox.workspaceRoot;
      await prepare(root, definitions);
      const result = await runCli(sandbox, ["compile", "--check"], { allowFailure: true });
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("MV-ASSET-MISSING-FILE");
      expect(result.stderr).toContain("commonEvent:11 CommonEvents.json[11].list[");
      expect(result.stderr).not.toContain("MV-ASSET-DYNAMIC-STOP");
      expect(result.stderr).not.toContain("call cycle");
      expect(result.stderr).not.toContain(" -> commonEvent:");
      expect(result.stderr).not.toContain("commonEvent:10 CommonEvents.json[10].list");
      expect(result.stderr).not.toContain("commonEvent:12 CommonEvents.json[12].list");
      await writeFile(join(root, "Game/img/pictures/CalledPoster.png"), "");
      const passing = await runCli(sandbox, ["compile", "--check"]);
      expect(passing.exitCode).toBe(0);
      expect(passing.stderr).not.toContain("MV-ASSET-");
    });
  });
it("two call sites do not duplicate a Common Event's defining asset use", async () => {
  await withWindowsSandbox("asset-common-two-callers", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    await prepare(root, common(10, call(11)) + common(11, picture) + common(12, call(11)));
    const result = await runCli(sandbox, ["compile", "--check"], { allowFailure: true });
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("MV-ASSET-MISSING-FILE");
    expect(
      result.stderr.match(
        /^\s*- error commonEvent:11 CommonEvents\.json\[11\]\.list\[0\]\.parameters\[1\]/gmu,
      ),
    ).toHaveLength(1);
    expect(result.stderr).not.toContain(" -> commonEvent:");
    expect(result.stderr).not.toContain("commonEvent:10 CommonEvents.json[10].list");
    expect(result.stderr).not.toContain("commonEvent:12 CommonEvents.json[12].list");
    await writeFile(join(root, "Game/img/pictures/CalledPoster.png"), "");
    const passing = await runCli(sandbox, ["compile", "--check"]);
    expect(passing.exitCode).toBe(0);
    expect(passing.stderr).not.toContain("MV-ASSET-");
  });
});
