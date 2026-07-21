import { describe, expect, it } from "vitest";

import {
  buildProjectIndex,
  parseCommonEvents,
  parseMapInfos,
} from "../src/project-data/project.js";

describe("project loading helpers", () => {
  it("parses map infos into a name index", () => {
    const mapInfos = parseMapInfos(JSON.stringify([null, { id: 1, name: "MAP001", parentId: 0 }]));

    expect(mapInfos).toEqual([{ id: 1, name: "MAP001", parentId: 0 }]);

    const index = buildProjectIndex({
      actors: [{ id: 1, name: "Hero" }],
      armors: [{ id: 1, name: "Leather" }],
      commonEvents: parseCommonEvents(JSON.stringify([null, { id: 1, name: "Common" }])),
      items: [{ id: 1, name: "Potion" }],
      mapInfos,
      system: {
        switches: ["", "Gate"],
        variables: ["", "Count"],
      },
      weapons: [{ id: 1, name: "Sword" }],
    });

    expect(index.mapsByName.get("MAP001")).toBe(1);
    expect(index.commonEventsByName.get("Common")).toBe(1);
    expect(index.itemsByName.get("Potion")).toBe(1);
    expect(index.actorsByName.get("Hero")).toBe(1);
    expect(index.switchesByName.get("Gate")).toBe(1);
    expect(index.variablesByName.get("Count")).toBe(1);
  });
});
