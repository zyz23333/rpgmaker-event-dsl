import { describe, expect, it } from "vitest";

import {
  collectEventDefinitions,
  commonEvent,
  commonEventCall,
  commonEventRef,
  mapEvent,
  page,
  showText,
  switchRef,
} from "../src/index.js";

describe("collectEventDefinitions", () => {
  it("collects named Event Definitions", () => {
    const definitions = collectEventDefinitions({
      alpha: mapEvent({
        name: "Alpha",
        x: 1,
        y: 2,
        pages: [
          page({
            commands: [showText(["Hello"])],
          }),
        ],
      }),
      beta: commonEvent({
        name: "Beta",
        trigger: "none",
        switch: switchRef({ id: 1 }),
        commands: [commonEventCall(commonEventRef({ name: "SomeCommonEvent" }))],
      }),
    });

    expect(definitions).toHaveLength(2);
    expect(definitions.map((definition) => definition.name)).toEqual(["Alpha", "Beta"]);
  });

  it("rejects default exports", () => {
    expect(() =>
      collectEventDefinitions({
        default: mapEvent({
          name: "Ignored",
          x: 0,
          y: 0,
          pages: [
            page({
              commands: [],
            }),
          ],
        }),
      }),
    ).toThrow("Default export is not allowed for Event Definitions.");
  });
});
