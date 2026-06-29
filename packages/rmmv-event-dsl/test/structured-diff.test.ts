import { describe, expect, it } from "vitest";

import { buildStructuredDiffReport, renderStructuredDiffReport } from "../src/structured-diff.js";

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
          },
          {
            change: "generated-only",
            detail: "Entry exists only in Generated Project Data.",
            destructive: false,
            identity: "mapId 1, eventId 2",
          },
          {
            change: "snapshot-only",
            detail: "Entry exists only in Project Data Snapshot.",
            destructive: true,
            identity: "mapId 1, eventId 3",
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
          },
          {
            change: "snapshot-only",
            detail: "Entry exists only in Project Data Snapshot.",
            destructive: true,
            identity: "commonEventId 2",
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
          },
          {
            change: "snapshot-only",
            detail: "Entry exists only in Project Data Snapshot.",
            destructive: true,
            identity: "switchId 2",
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
          },
          {
            change: "generated-only",
            detail: "Entry exists only in Generated Project Data.",
            destructive: false,
            identity: "variableId 2",
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
          },
          {
            change: "non-owned-carried",
            detail: "Non-owned carrier data matches Project Data Snapshot.",
            destructive: false,
            identity: "System.json",
          },
        ],
      },
    ]);
    expect(report.hasDestructiveChanges).toBe(true);
  });
});

describe("renderStructuredDiffReport", () => {
  it("renders stable human-readable output and omits unchanged entries by default", () => {
    const output = renderStructuredDiffReport({
      domains: [
        {
          domain: "Common Event",
          entries: [
            {
              change: "unchanged",
              detail: "Generated entry matches snapshot entry.",
              destructive: false,
              identity: "commonEventId 1",
            },
            {
              change: "snapshot-only",
              detail: "Entry exists only in Project Data Snapshot.",
              destructive: true,
              identity: "commonEventId 2",
            },
          ],
        },
      ],
      hasDestructiveChanges: true,
    });

    expect(output).toBe(
      [
        "Structured Diff Report",
        "",
        "Common Event",
        "- [snapshot-only] commonEventId 2 (destructive): Entry exists only in Project Data Snapshot.",
        "",
        "Destructive Changes: yes",
      ].join("\n"),
    );
  });
});
