// Preserve the real incomplete Contract39 command attempt without relabeling it as a pass.
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, existsSync, mkdirSync, renameSync, writeFileSync } from "node:fs";
import { resolve, relative, join, sep } from "node:path";

const workspace = resolve(process.cwd());
const raw = resolve(workspace, ".scratch/asset-validation-implementation/evidence/17-raw");
const target = resolve(raw, "history/11e52e3c-contract39-canceled");
for (const path of [raw, target]) {
  const rel = relative(workspace, path);
  if (!rel || rel.startsWith(`..${sep}`) || rel === "..") throw new Error("Archive escapes workspace");
}
if (existsSync(target)) throw new Error("Canceled attempt already archived; never overwrite history");
const history = JSON.parse(readFileSync(join(raw, "command-history.json")));
if (history.frozenRevision !== "11e52e3cbc93fe5200cb51d0c2882a9cec222765") throw new Error("Unexpected execution freeze");
if (history.commands.length !== 2 || history.commands[1].command !== "pnpm check" || history.commands[1].exitCode !== 1) throw new Error("Unexpected command state");
const check = history.commands[1];
if (check.receipts.length !== 631 || check.receipts.filter((row) => row.status === "failed").length !== 1) throw new Error("Unexpected partial receipt state");
mkdirSync(target, { recursive: true });
const moved = ["command-history.json", "00-setup-build.log", "01-pnpm-check.log", "current-source-receipts"];
for (const name of moved) renameSync(join(raw, name), join(target, name));
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
function inventory(directory, prefix = "") {
  return readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name, "en")).flatMap((entry) => {
    const name = prefix + entry.name, path = join(directory, entry.name);
    if (entry.isDirectory()) return inventory(path, name + "/");
    const bytes = readFileSync(path);
    return [{ path: name, bytes: bytes.length, sha256: sha(bytes) }];
  });
}
const disposition = {
  schema: "asset-validation-canceled-final-command-attempt/v1",
  frozenRevision: history.frozenRevision,
  compileContract: 39,
  outcome: "canceled-for-product-fixes; no final full-suite summary; not acceptance",
  requestedBy: "root coordinator; original Windows reserved device name contract gap",
  reason: "The reserved device detector missed ASCII spaces between a reserved basename and dot; a new integration and execution freeze are required.",
  canceledCommand: "pnpm check",
  termination: { ownedRecorderPid: 32832, ownedCommandPid: 28372, method: "Verified sole recorder child cmd.exe /d /s /c pnpm check; taskkill /PID 28372 /T /F", completedAt: check.completedAt, remainingOwnedTestProcesses: 0 },
  commandsNotStarted: ["pnpm build (formal second command)", "pnpm --filter rpgmaker-event-dsl test:windows-baseline"],
  completedSetupBuildExitCode: history.commands[0].exitCode,
  completedCheckPhases: ["typecheck", "lint", "format:check"],
  partialReceipts: { total: check.receipts.length, passed: 630, failed: 1, sourceOnly: true, filesAreActualCompletedReceipts: true },
  independentFailureObservedBeforeCancellation: {
    id: "AV.C07.shared-system-field.formal.case.expected", ownerTicket: "09",
    receipt: "current-source-receipts/AV.C07.shared-system-field.formal.case.expected.source.json",
    assertion: "Two malformed System.gameoverMe uses should retain both independent defining commands.",
    actual: "AssertionError: expected [ 'error MV-ASSET-INVALID-DATA' ] to have a length of 2 but got 1",
    disposition: "Reported to root for owner09 diagnosis; original failure is not converted to cancellation or a pass."
  },
  originalFiles: inventory(target),
  neverCountAsFinalPass: true,
  maintainerApproval: "not requested or claimed"
};
writeFileSync(join(target, "disposition.json"), JSON.stringify(disposition, null, 2) + "\n");
console.log(JSON.stringify({ archive: relative(workspace, target), originalFiles: disposition.originalFiles.length, receipts: disposition.partialReceipts, disposition: disposition.outcome }, null, 2));
