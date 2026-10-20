import { expect, it } from "vitest";

import { battlePage, mapEvent, page, troopEvent } from "../src/index.js";
import { validateDslOwnedDeclarations } from "../src/validation/staged-graph.js";

it("identifies each same-name Map and Troop page-count warning without rejecting saved pages", () => {
  const mapPages = Array.from({ length: 21 }, () => page({ commands: [] })) as never;
  const declarations = [
    mapEvent({ mapId: 1, id: 1, name: "Shared", x: 0, y: 0, pages: mapPages }),
    mapEvent({ mapId: 2, id: 2, name: "Shared", x: 0, y: 0, pages: mapPages }),
    troopEvent({
      troopId: 1,
      pages: Array.from({ length: 21 }, () => battlePage({ commands: [] })) as never,
    }),
  ];
  const { issues } = validateDslOwnedDeclarations(declarations, {
    scriptEnabled: false,
    snapshotMaps: [
      { id: 1, eventLocations: [] },
      { id: 2, eventLocations: [] },
    ],
    snapshotTroops: [{ id: 1, members: [] }],
  });
  expect(issues.filter((issue) => issue.level === "error")).toEqual([]);
  expect(issues.filter((issue) => issue.level === "warning")).toEqual([
    expect.objectContaining({
      code: "MV-MAP-PAGE-COUNT",
      stage: "compile",
      level: "warning",
      identity: "map:1/event:1",
      nativePath: "pages",
      dslPath: "pages",
      expected: "at most 20 editor-created pages; saved pages are preserved",
      actual: "21",
    }),
    expect.objectContaining({
      code: "MV-MAP-PAGE-COUNT",
      stage: "compile",
      level: "warning",
      identity: "map:2/event:2",
      nativePath: "pages",
      dslPath: "pages",
      expected: "at most 20 editor-created pages; saved pages are preserved",
      actual: "21",
    }),
    expect.objectContaining({
      code: "MV-BATTLE-PAGE-COUNT",
      stage: "compile",
      level: "warning",
      identity: "troop:1",
      nativePath: "pages",
      dslPath: "pages",
      expected: "at most 20 editor-created pages; saved pages are preserved",
      actual: "21",
    }),
  ]);
});
