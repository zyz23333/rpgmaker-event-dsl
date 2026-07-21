import { describe, expect, it } from "vitest";

import {
  buildStructuredDiffReport,
  deriveAffectedProjectDataFiles,
  renderStructuredDiffReport,
} from "../src/project-data/structured-diff.js";

describe("buildStructuredDiffReport", () => {
  it("classifies owned event and system entries by domain and identity", () => {
    const report = buildStructuredDiffReport({
      generated: new Map<string, unknown>([
        [
          "Map001.json",
          {
            id: 1,
            events: [
              null,
              { id: 1, name: "Changed Gate", x: 1, y: 2, pages: [] },
              { id: 2, name: "Generated Only", x: 3, y: 4, pages: [] },
              null,
            ],
            note: "same",
          },
        ],
        [
          "CommonEvents.json",
          [null, { id: 1, name: "Same", trigger: 0, switchId: 1, list: [] }, null],
        ],
        [
          "System.json",
          {
            gameTitle: "Fixture Game",
            switches: ["", "Same Switch", ""],
            variables: ["", "Changed Variable", "Generated Only Variable"],
          },
        ],
      ]),
      snapshot: new Map<string, unknown>([
        [
          "Map001.json",
          {
            id: 1,
            events: [
              null,
              { id: 1, name: "Snapshot Gate", x: 1, y: 2, pages: [] },
              null,
              { id: 3, name: "Snapshot Only", x: 5, y: 6, pages: [] },
            ],
            note: "same",
          },
        ],
        [
          "CommonEvents.json",
          [
            null,
            { id: 1, name: "Same", trigger: 0, switchId: 1, list: [] },
            { id: 2, name: "Snapshot Only Common", trigger: 0, switchId: 1, list: [] },
          ],
        ],
        [
          "System.json",
          {
            gameTitle: "Fixture Game",
            switches: ["", "Same Switch", "Snapshot Only Switch"],
            variables: ["", "Snapshot Variable", ""],
          },
        ],
      ]),
    });

    expect(report.domains).toEqual([
      {
        domain: "Map Event",
        entries: [
          {
            change: "changed",
            detail: "Generated entry differs from snapshot entry.",
            destructive: false,
            identity: "mapId 1, eventId 1",
            projectDataFile: "Map001.json",
          },
          {
            change: "generated-only",
            detail: "Entry exists only in Generated Project Data.",
            destructive: false,
            identity: "mapId 1, eventId 2",
            projectDataFile: "Map001.json",
          },
          {
            change: "snapshot-only",
            detail: "Entry exists only in Project Data Snapshot.",
            destructive: true,
            identity: "mapId 1, eventId 3",
            projectDataFile: "Map001.json",
          },
        ],
      },
      {
        domain: "Common Event",
        entries: [
          {
            change: "unchanged",
            detail: "Generated entry matches snapshot entry.",
            destructive: false,
            identity: "commonEventId 1",
            projectDataFile: "CommonEvents.json",
          },
          {
            change: "snapshot-only",
            detail: "Entry exists only in Project Data Snapshot.",
            destructive: true,
            identity: "commonEventId 2",
            projectDataFile: "CommonEvents.json",
          },
        ],
      },
      {
        domain: "Switch",
        entries: [
          {
            change: "unchanged",
            detail: "Generated entry matches snapshot entry.",
            destructive: false,
            identity: "switchId 1",
            projectDataFile: "System.json",
          },
          {
            change: "snapshot-only",
            detail: "Entry exists only in Project Data Snapshot.",
            destructive: true,
            identity: "switchId 2",
            projectDataFile: "System.json",
          },
        ],
      },
      {
        domain: "Variable",
        entries: [
          {
            change: "changed",
            detail: "Generated entry differs from snapshot entry.",
            destructive: false,
            identity: "variableId 1",
            projectDataFile: "System.json",
          },
          {
            change: "generated-only",
            detail: "Entry exists only in Generated Project Data.",
            destructive: false,
            identity: "variableId 2",
            projectDataFile: "System.json",
          },
        ],
      },
      {
        domain: "Carrier File",
        entries: [
          {
            change: "non-owned-carried",
            detail: "Non-owned carrier data matches Project Data Snapshot.",
            destructive: false,
            identity: "Map001.json",
            projectDataFile: "Map001.json",
          },
          {
            change: "non-owned-carried",
            detail: "Non-owned carrier data matches Project Data Snapshot.",
            destructive: false,
            identity: "System.json",
            projectDataFile: "System.json",
          },
        ],
      },
    ]);
    expect(report.hasDestructiveChanges).toBe(true);
  });
});

describe("renderStructuredDiffReport", () => {
  it("renders stable human-readable output and omits unchanged entries by default", () => {
    const output = renderStructuredDiffReport(
      {
        domains: [
          {
            domain: "Common Event",
            entries: [
              {
                change: "unchanged",
                detail: "Generated entry matches snapshot entry.",
                destructive: false,
                identity: "commonEventId 1",
                projectDataFile: "CommonEvents.json",
              },
              {
                change: "snapshot-only",
                detail: "Entry exists only in Project Data Snapshot.",
                destructive: true,
                identity: "commonEventId 2",
                projectDataFile: "CommonEvents.json",
              },
            ],
          },
        ],
        hasDestructiveChanges: true,
      },
      { affectedFiles: ["CommonEvents.json"] },
    );

    expect(output).toBe(
      [
        "Structured Diff Report",
        "",
        "Common Event",
        "- [snapshot-only] commonEventId 2 (destructive): Entry exists only in Project Data Snapshot.",
        "",
        "Affected Project Data Files:",
        "- CommonEvents.json",
        "",
        "Destructive Changes: yes",
      ].join("\n"),
    );
  });

  it("renders a summary with affected Project Data Files", () => {
    const output = renderStructuredDiffReport(
      {
        domains: [
          {
            domain: "Map Event",
            entries: [
              {
                change: "changed",
                detail: "Generated entry differs from snapshot entry.",
                destructive: false,
                identity: "mapId 1, eventId 1",
                projectDataFile: "Map001.json",
              },
              {
                change: "generated-only",
                detail: "Entry exists only in Generated Project Data.",
                destructive: false,
                identity: "mapId 1, eventId 2",
                projectDataFile: "Map001.json",
              },
            ],
          },
          {
            domain: "Switch",
            entries: [
              {
                change: "snapshot-only",
                detail: "Entry exists only in Project Data Snapshot.",
                destructive: true,
                identity: "switchId 2",
                projectDataFile: "System.json",
              },
            ],
          },
        ],
        hasDestructiveChanges: true,
      },
      { affectedFiles: ["Map001.json", "System.json"], short: true },
    );

    expect(output).toBe(
      [
        "Structured Diff Summary",
        "",
        "Map Event: 1 changed, 1 generated-only",
        "Switch: 1 snapshot-only",
        "",
        "Affected Project Data Files:",
        "- Map001.json",
        "- System.json",
        "",
        "Destructive Changes: yes",
      ].join("\n"),
    );
  });

  it("renders a file-filtered view with filtered and overall destructive status", () => {
    const output = renderStructuredDiffReport(
      {
        domains: [
          {
            domain: "Map Event",
            entries: [
              {
                change: "changed",
                detail: "Generated entry differs from snapshot entry.",
                destructive: false,
                identity: "mapId 1, eventId 1",
                projectDataFile: "Map001.json",
              },
            ],
          },
          {
            domain: "Switch",
            entries: [
              {
                change: "snapshot-only",
                detail: "Entry exists only in Project Data Snapshot.",
                destructive: true,
                identity: "switchId 2",
                projectDataFile: "System.json",
              },
            ],
          },
        ],
        hasDestructiveChanges: true,
      },
      { affectedFiles: ["Map001.json", "System.json"], file: "Map001.json" },
    );

    expect(output).toBe(
      [
        "Structured Diff Report",
        "Filter: Project Data File Map001.json",
        "",
        "Map Event",
        "- [changed] mapId 1, eventId 1: Generated entry differs from snapshot entry.",
        "",
        "Affected Project Data Files:",
        "- Map001.json",
        "- System.json",
        "",
        "Destructive Changes In Filter: no",
        "Destructive Changes Overall: yes",
      ].join("\n"),
    );
  });

  it("renders an empty file-filtered result", () => {
    const output = renderStructuredDiffReport(
      {
        domains: [
          {
            domain: "Map Event",
            entries: [
              {
                change: "changed",
                detail: "Generated entry differs from snapshot entry.",
                destructive: false,
                identity: "mapId 1, eventId 1",
                projectDataFile: "Map001.json",
              },
            ],
          },
        ],
        hasDestructiveChanges: false,
      },
      { affectedFiles: ["Map001.json"], file: "Map002.json" },
    );

    expect(output).toBe(
      [
        "Structured Diff Report",
        "Filter: Project Data File Map002.json",
        "",
        "No changes for selected Project Data File.",
        "",
        "Affected Project Data Files:",
        "- Map001.json",
        "",
        "Destructive Changes In Filter: no",
        "Destructive Changes Overall: no",
      ].join("\n"),
    );
  });
});

describe("deriveAffectedProjectDataFiles", () => {
  it("derives files from carrier-level generated and snapshot differences", () => {
    expect(
      deriveAffectedProjectDataFiles({
        generated: new Map<string, unknown>([
          ["Map001.json", { id: 1, events: [null, { id: 1 }] }],
          ["System.json", { switches: ["", "Same"] }],
        ]),
        snapshot: new Map<string, unknown>([
          ["Map001.json", { id: 1, events: [null] }],
          ["System.json", { switches: ["", "Same"] }],
        ]),
      }),
    ).toEqual(["Map001.json"]);
  });
});
