import { Session } from "node:inspector/promises";
import { readFile, writeFile } from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import ts from "typescript";

// A test-owned observer of the actual runtime evaluator. It never changes product
// source, Definition Source, ASTs, inputs, or exported functions.
const [workspaceRoot, apiEntry, reportPath] = process.argv.slice(2);
const session = new Session();
const scripts = [];
const pauses = [];
const report = { workspaceRoot, apiEntry, node: process.version, phases: [] };
const counterKey = `__assetEvaluation_${randomUUID().replaceAll("-", "")}`;
let breakpointId;
function count() {
  const value = globalThis[counterKey];
  if (!Number.isSafeInteger(value) || value < 0)
    throw new Error("Observer counter is absent or invalid");
  return value;
}
function hash(value) {
  return createHash("sha256").update(value).digest("hex");
}
try {
  session.connect();
  session.on("Debugger.scriptParsed", ({ params }) => scripts.push(params));
  session.on("Debugger.paused", ({ params }) => {
    pauses.push(params.reason);
    void session.post("Debugger.resume");
  });
  await session.post("Debugger.enable");
  const api = await import(apiEntry);
  await api.compileWorkspace({ workspaceRoot, check: false });
  report.phases.push({ operation: "warm Compile", observed: false });
  const candidates = [];
  for (const script of scripts) {
    if (
      !script.url.startsWith("file:") ||
      !/[/\\](?:src[/\\]workspace[/\\]definitions\.ts|dist[/\\][^/\\]+\.mjs)$/u.test(
        fileURLToPath(script.url),
      )
    )
      continue;
    const { scriptSource } = await session.post("Debugger.getScriptSource", {
      scriptId: script.scriptId,
    });
    const parsed = ts.createSourceFile(
      "runtime.js",
      scriptSource,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.JS,
    );
    function visit(node) {
      if (ts.isFunctionDeclaration(node) && node.name?.text === "evaluateModule") {
        const first = node.body?.statements[0];
        if (!first) throw new Error("Evaluator has no first executable statement");
        candidates.push({ script, scriptSource, parsed, node, first });
      }
      ts.forEachChild(node, visit);
    }
    visit(parsed);
  }
  if (candidates.length !== 1)
    throw new Error(`Expected one actual evaluator; found ${candidates.length}`);
  const { script, scriptSource, parsed, node, first } = candidates[0];
  const position = (offset) => {
    const { line, character } = parsed.getLineAndCharacterOfPosition(offset);
    return { scriptId: script.scriptId, lineNumber: line, columnNumber: character };
  };
  const start = position(first.getStart(parsed)),
    end = position(first.end);
  const possible = await session.post("Debugger.getPossibleBreakpoints", {
    start,
    end,
    restrictToFunction: true,
  });
  if (!possible.locations.length)
    throw new Error("No executable evaluator entry location resolved");
  globalThis[counterKey] = 0;
  const selected = possible.locations[0];
  const installed = await session.post("Debugger.setBreakpointByUrl", {
    url: script.url,
    lineNumber: selected.lineNumber,
    columnNumber: selected.columnNumber,
    condition: `((globalThis[${JSON.stringify(counterKey)}] += 1), false)`,
  });
  breakpointId = installed.breakpointId;
  if (installed.locations.length !== 1 || installed.locations[0].scriptId !== script.scriptId)
    throw new Error("Evaluator breakpoint must resolve uniquely in the selected runtime script");
  const resolved = installed.locations[0];
  const offset = parsed.getPositionOfLineAndCharacter(resolved.lineNumber, resolved.columnNumber);
  if (offset < first.getStart(parsed) || offset >= first.end)
    throw new Error("Breakpoint is outside the mandatory first evaluator statement");
  report.observer = {
    counterKey,
    url: script.url,
    scriptId: script.scriptId,
    runtimeSha256: hash(scriptSource),
    diskSha256: hash(await readFile(fileURLToPath(script.url))),
    functionRange: [node.getStart(parsed), node.end],
    firstStatementRange: [first.getStart(parsed), first.end],
    selected,
    resolved,
    breakpointId,
  };
  await api.compileWorkspace({ workspaceRoot, check: false });
  report.phases.push({ operation: "Compile positive control", count: count() });
  if (count() <= 0) throw new Error("Actual Compile did not hit the installed evaluator observer");
  globalThis[counterKey] = 0;
  if (count() !== 0) throw new Error("Counter reset failed");
  await api.pushWorkspace({ workspaceRoot, allowDestructive: false });
  report.phases.push({ operation: "Push", count: count() });
  if (count() !== 0) throw new Error("Push reevaluated Definition Source");
  await api.compileWorkspace({ workspaceRoot, check: true });
  report.phases.push({ operation: "unchanged-source Check positive control", count: count() });
  if (count() <= 0) throw new Error("Post-Push Check did not hit the same observer");
  if (pauses.length) throw new Error("False-condition observer unexpectedly paused execution");
  report.ok = true;
} catch (error) {
  report.ok = false;
  report.error = error.stack;
  process.exitCode = 1;
} finally {
  report.pauses = pauses;
  if (breakpointId) await session.post("Debugger.removeBreakpoint", { breakpointId });
  await session.post("Debugger.disable");
  session.disconnect();
  delete globalThis[counterKey];
  await writeFile(reportPath, JSON.stringify(report, null, 2) + "\n");
}
