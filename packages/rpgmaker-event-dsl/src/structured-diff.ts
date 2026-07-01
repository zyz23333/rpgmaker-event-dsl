import { writeStableJson } from "./writer.js";

export type StructuredDiffChangeKind =
  | "generated-only"
  | "snapshot-only"
  | "changed"
  | "unchanged"
  | "non-owned-carried";

export type StructuredDiffEntry = {
  change: StructuredDiffChangeKind;
  destructive: boolean;
  detail: string;
  identity: string;
  projectDataFile: string;
};

export type StructuredDiffDomain = {
  domain: string;
  entries: StructuredDiffEntry[];
};

export type StructuredDiffReport = {
  domains: StructuredDiffDomain[];
  hasDestructiveChanges: boolean;
};

export type BuildStructuredDiffReportOptions = {
  generated: ReadonlyMap<string, unknown>;
  snapshot: ReadonlyMap<string, unknown>;
};

export type RenderStructuredDiffReportOptions = {
  affectedFiles?: readonly string[];
  file?: string;
  short?: boolean;
};

type DomainEntryInput = {
  generated: unknown;
  identity: string;
  projectDataFile: string;
  snapshot: unknown;
};

export function buildStructuredDiffReport(
  options: BuildStructuredDiffReportOptions,
): StructuredDiffReport {
  const domains = [
    buildMapEventDomain(options),
    buildCommonEventDomain(options),
    buildSystemNameDomain(options, {
      arrayKey: "switches",
      domain: "Switch",
      identityPrefix: "switchId",
    }),
    buildSystemNameDomain(options, {
      arrayKey: "variables",
      domain: "Variable",
      identityPrefix: "variableId",
    }),
    buildCarrierFileDomain(options),
  ].filter((domain) => domain.entries.length > 0);

  return {
    domains,
    hasDestructiveChanges: domains.some((domain) =>
      domain.entries.some((entry) => entry.destructive),
    ),
  };
}

export function deriveAffectedProjectDataFiles(input: {
  generated: ReadonlyMap<string, unknown>;
  snapshot: ReadonlyMap<string, unknown>;
}): string[] {
  return [...input.generated.keys()]
    .filter(
      (relativePath) =>
        !isJsonEqual(input.generated.get(relativePath), input.snapshot.get(relativePath)),
    )
    .sort((left, right) => left.localeCompare(right));
}

export function renderStructuredDiffReport(
  report: StructuredDiffReport,
  options: RenderStructuredDiffReportOptions = {},
): string {
  const filteredReport = options.file
    ? filterReportByProjectDataFile(report, options.file)
    : report;
  const lines = [options.short ? "Structured Diff Summary" : "Structured Diff Report"];

  if (options.file) {
    lines.push(`Filter: Project Data File ${options.file}`);
  }

  if (options.short) {
    pushSummaryLines(lines, filteredReport);
  } else {
    pushDetailedLines(lines, filteredReport, options.file);
  }

  if (options.affectedFiles) {
    pushAffectedFileLines(lines, options.affectedFiles);
  }

  if (options.file) {
    lines.push(
      "",
      `Destructive Changes In Filter: ${filteredReport.hasDestructiveChanges ? "yes" : "no"}`,
      `Destructive Changes Overall: ${report.hasDestructiveChanges ? "yes" : "no"}`,
    );
  } else {
    lines.push("", `Destructive Changes: ${report.hasDestructiveChanges ? "yes" : "no"}`);
  }

  return lines.join("\n");
}

function filterReportByProjectDataFile(
  report: StructuredDiffReport,
  projectDataFile: string,
): StructuredDiffReport {
  const domains = report.domains
    .map((domain) => ({
      domain: domain.domain,
      entries: domain.entries.filter((entry) => entry.projectDataFile === projectDataFile),
    }))
    .filter((domain) => domain.entries.length > 0);

  return {
    domains,
    hasDestructiveChanges: domains.some((domain) =>
      domain.entries.some((entry) => entry.destructive),
    ),
  };
}

function pushDetailedLines(
  lines: string[],
  report: StructuredDiffReport,
  fileFilter: string | undefined,
): void {
  let visibleEntryCount = 0;

  for (const domain of report.domains) {
    const visibleEntries = domain.entries.filter(
      (entry) => entry.change !== "unchanged" && entry.change !== "non-owned-carried",
    );

    if (visibleEntries.length === 0) {
      continue;
    }

    visibleEntryCount += visibleEntries.length;
    lines.push("", domain.domain);
    for (const entry of visibleEntries) {
      const destructiveSuffix = entry.destructive ? " (destructive)" : "";
      lines.push(`- [${entry.change}] ${entry.identity}${destructiveSuffix}: ${entry.detail}`);
    }
  }

  if (visibleEntryCount === 0 && fileFilter) {
    lines.push("", "No changes for selected Project Data File.");
  }
}

function pushSummaryLines(lines: string[], report: StructuredDiffReport): void {
  const summaries = report.domains
    .map((domain) => {
      const counts = countVisibleChanges(domain.entries);
      const parts = [
        formatCount(counts.changed, "changed"),
        formatCount(counts.generatedOnly, "generated-only"),
        formatCount(counts.snapshotOnly, "snapshot-only"),
      ].filter((part): part is string => part !== null);

      return parts.length > 0 ? `${domain.domain}: ${parts.join(", ")}` : null;
    })
    .filter((line): line is string => line !== null);

  if (summaries.length === 0) {
    lines.push("", "No changes.");
    return;
  }

  lines.push("", ...summaries);
}

function countVisibleChanges(entries: readonly StructuredDiffEntry[]): {
  changed: number;
  generatedOnly: number;
  snapshotOnly: number;
} {
  return entries.reduce(
    (counts, entry) => {
      if (entry.change === "changed") {
        counts.changed += 1;
      } else if (entry.change === "generated-only") {
        counts.generatedOnly += 1;
      } else if (entry.change === "snapshot-only") {
        counts.snapshotOnly += 1;
      }

      return counts;
    },
    { changed: 0, generatedOnly: 0, snapshotOnly: 0 },
  );
}

function formatCount(count: number, label: string): string | null {
  return count > 0 ? `${count} ${label}` : null;
}

function pushAffectedFileLines(lines: string[], affectedFiles: readonly string[]): void {
  lines.push("", "Affected Project Data Files:");

  if (affectedFiles.length === 0) {
    lines.push("- none");
    return;
  }

  for (const affectedFile of affectedFiles) {
    lines.push(`- ${affectedFile}`);
  }
}

function buildMapEventDomain(options: BuildStructuredDiffReportOptions): StructuredDiffDomain {
  const entries: StructuredDiffEntry[] = [];

  for (const relativePath of sortedMapFilePaths(options)) {
    const mapId = readMapId(
      relativePath,
      options.generated.get(relativePath),
      options.snapshot.get(relativePath),
    );
    const generatedEvents = readArrayProperty(options.generated.get(relativePath), "events");
    const snapshotEvents = readArrayProperty(options.snapshot.get(relativePath), "events");
    const length = Math.max(generatedEvents.length, snapshotEvents.length);

    for (let index = 1; index < length; index += 1) {
      const entry = classifyOwnedEntry({
        generated: generatedEvents[index],
        identity: `mapId ${mapId}, eventId ${index}`,
        projectDataFile: relativePath,
        snapshot: snapshotEvents[index],
      });
      if (entry !== null) {
        entries.push(entry);
      }
    }
  }

  return {
    domain: "Map Event",
    entries,
  };
}

function buildCommonEventDomain(options: BuildStructuredDiffReportOptions): StructuredDiffDomain {
  const generated = readArray(options.generated.get("CommonEvents.json"));
  const snapshot = readArray(options.snapshot.get("CommonEvents.json"));
  const length = Math.max(generated.length, snapshot.length);
  const entries: StructuredDiffEntry[] = [];

  for (let index = 1; index < length; index += 1) {
    const entry = classifyOwnedEntry({
      generated: generated[index],
      identity: `commonEventId ${index}`,
      projectDataFile: "CommonEvents.json",
      snapshot: snapshot[index],
    });
    if (entry !== null) {
      entries.push(entry);
    }
  }

  return {
    domain: "Common Event",
    entries,
  };
}

function buildSystemNameDomain(
  options: BuildStructuredDiffReportOptions,
  input: {
    arrayKey: "switches" | "variables";
    domain: string;
    identityPrefix: string;
  },
): StructuredDiffDomain {
  const generated = readArrayProperty(options.generated.get("System.json"), input.arrayKey);
  const snapshot = readArrayProperty(options.snapshot.get("System.json"), input.arrayKey);
  const length = Math.max(generated.length, snapshot.length);
  const entries: StructuredDiffEntry[] = [];

  for (let index = 1; index < length; index += 1) {
    const entry = classifyOwnedEntry({
      generated: normalizeSystemName(generated[index]),
      identity: `${input.identityPrefix} ${index}`,
      projectDataFile: "System.json",
      snapshot: normalizeSystemName(snapshot[index]),
    });
    if (entry !== null) {
      entries.push(entry);
    }
  }

  return {
    domain: input.domain,
    entries,
  };
}

function buildCarrierFileDomain(options: BuildStructuredDiffReportOptions): StructuredDiffDomain {
  const entries: StructuredDiffEntry[] = [];

  for (const relativePath of sortedCarrierFilePaths(options)) {
    const generated = readCarrierDataWithoutOwnedDomains(
      relativePath,
      options.generated.get(relativePath),
    );
    const snapshot = readCarrierDataWithoutOwnedDomains(
      relativePath,
      options.snapshot.get(relativePath),
    );

    if (isJsonEqual(generated, snapshot)) {
      entries.push({
        change: "non-owned-carried",
        destructive: false,
        detail: "Non-owned carrier data matches Project Data Snapshot.",
        identity: relativePath,
        projectDataFile: relativePath,
      });
    } else {
      entries.push({
        change: "changed",
        destructive: false,
        detail: "Non-owned carrier data differs from Project Data Snapshot.",
        identity: relativePath,
        projectDataFile: relativePath,
      });
    }
  }

  return {
    domain: "Carrier File",
    entries,
  };
}

function classifyOwnedEntry(input: DomainEntryInput): StructuredDiffEntry | null {
  const generatedPresent = isOwnedEntryPresent(input.generated);
  const snapshotPresent = isOwnedEntryPresent(input.snapshot);

  if (generatedPresent && !snapshotPresent) {
    return {
      change: "generated-only",
      destructive: false,
      detail: "Entry exists only in Generated Project Data.",
      identity: input.identity,
      projectDataFile: input.projectDataFile,
    };
  }

  if (!generatedPresent && snapshotPresent) {
    return {
      change: "snapshot-only",
      destructive: true,
      detail: "Entry exists only in Project Data Snapshot.",
      identity: input.identity,
      projectDataFile: input.projectDataFile,
    };
  }

  if (!generatedPresent && !snapshotPresent) {
    return null;
  }

  const unchanged = isJsonEqual(input.generated, input.snapshot);

  return {
    change: unchanged ? "unchanged" : "changed",
    destructive: false,
    detail: unchanged
      ? "Generated entry matches snapshot entry."
      : "Generated entry differs from snapshot entry.",
    identity: input.identity,
    projectDataFile: input.projectDataFile,
  };
}

function sortedMapFilePaths(options: BuildStructuredDiffReportOptions): string[] {
  return [...new Set([...options.generated.keys(), ...options.snapshot.keys()])]
    .filter((relativePath) => /^Map\d{3}\.json$/u.test(relativePath))
    .sort((left, right) => left.localeCompare(right));
}

function sortedCarrierFilePaths(options: BuildStructuredDiffReportOptions): string[] {
  return [...new Set([...options.generated.keys(), ...options.snapshot.keys()])]
    .filter(
      (relativePath) => relativePath === "System.json" || /^Map\d{3}\.json$/u.test(relativePath),
    )
    .sort((left, right) => left.localeCompare(right));
}

function readMapId(relativePath: string, generated: unknown, snapshot: unknown): number {
  const generatedId = readObject(generated).id;
  if (typeof generatedId === "number" && Number.isInteger(generatedId) && generatedId > 0) {
    return generatedId;
  }

  const snapshotId = readObject(snapshot).id;
  if (typeof snapshotId === "number" && Number.isInteger(snapshotId) && snapshotId > 0) {
    return snapshotId;
  }

  const match = /^Map(?<id>\d{3})\.json$/u.exec(relativePath);
  return match?.groups?.id ? Number.parseInt(match.groups.id, 10) : 0;
}

function readCarrierDataWithoutOwnedDomains(relativePath: string, value: unknown): unknown {
  if (relativePath === "System.json") {
    const record = { ...readObject(value) };
    delete record.switches;
    delete record.variables;
    return record;
  }

  if (/^Map\d{3}\.json$/u.test(relativePath)) {
    const record = { ...readObject(value) };
    delete record.events;
    return record;
  }

  return value;
}

function readArrayProperty(value: unknown, key: string): unknown[] {
  return readArray(readObject(value)[key]);
}

function readArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function readObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function normalizeSystemName(value: unknown): unknown {
  return typeof value === "string" ? value : "";
}

function isOwnedEntryPresent(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === "string") {
    return value.length > 0;
  }

  return true;
}

function isJsonEqual(left: unknown, right: unknown): boolean {
  return writeStableJson(left) === writeStableJson(right);
}
