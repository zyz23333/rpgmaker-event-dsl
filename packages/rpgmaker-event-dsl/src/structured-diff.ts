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

type DomainEntryInput = {
  generated: unknown;
  identity: string;
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

export function renderStructuredDiffReport(report: StructuredDiffReport): string {
  const lines = ["Structured Diff Report"];

  for (const domain of report.domains) {
    const visibleEntries = domain.entries.filter(
      (entry) => entry.change !== "unchanged" && entry.change !== "non-owned-carried",
    );

    if (visibleEntries.length === 0) {
      continue;
    }

    lines.push("", domain.domain);
    for (const entry of visibleEntries) {
      const destructiveSuffix = entry.destructive ? " (destructive)" : "";
      lines.push(`- [${entry.change}] ${entry.identity}${destructiveSuffix}: ${entry.detail}`);
    }
  }

  lines.push("", `Destructive Changes: ${report.hasDestructiveChanges ? "yes" : "no"}`);

  return lines.join("\n");
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
      });
    } else {
      entries.push({
        change: "changed",
        destructive: false,
        detail: "Non-owned carrier data differs from Project Data Snapshot.",
        identity: relativePath,
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
    };
  }

  if (!generatedPresent && snapshotPresent) {
    return {
      change: "snapshot-only",
      destructive: true,
      detail: "Entry exists only in Project Data Snapshot.",
      identity: input.identity,
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
