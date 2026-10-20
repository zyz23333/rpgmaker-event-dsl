import { expect, it } from "vitest";

import { battlePage, mapEvent, page, troopEvent } from "../src/index.js";

const constructors = [
  { name: "battlePage", build: battlePage, input: () => ({ commands: [] }), field: "commands" },
  {
    name: "troopEvent",
    build: troopEvent,
    input: () => ({ troopId: 1, pages: [{ commands: [] }] }),
    field: "pages",
  },
  {
    name: "mapEvent",
    build: mapEvent,
    input: () => ({
      mapId: 1,
      id: 1,
      name: "Original input",
      x: 0,
      y: 0,
      pages: [{ conditions: {}, trigger: "action", commands: [] }],
    }),
    field: "pages",
  },
  { name: "page", build: page, input: () => ({ commands: [] }), field: "commands" },
];

for (const constructor of constructors)
  for (const shape of [
    "accessor",
    "hidden-extra",
    "extra",
    "symbol",
    "inherited",
    "hidden-field",
    "kind",
  ])
    it(`rejects original ${shape} ${constructor.name} input before reading or copying it`, () => {
      let reads = 0;
      let input: Record<string, unknown> = constructor.input();
      if (shape === "accessor") {
        const value = input[constructor.field];
        Object.defineProperty(input, constructor.field, {
          enumerable: true,
          get() {
            reads++;
            return value;
          },
        });
      }
      if (shape === "hidden-extra") Object.defineProperty(input, "pluginField", { value: true });
      if (shape === "extra") input.pluginField = true;
      if (shape === "symbol") Object.defineProperty(input, Symbol("pluginField"), { value: true });
      if (shape === "inherited") input = Object.assign(Object.create({ pluginField: true }), input);
      if (shape === "hidden-field")
        Object.defineProperty(input, constructor.field, { enumerable: false });
      if (shape === "kind") input.kind = "unexpected-input-field";
      expect(() => constructor.build(input as never)).toThrow("MV-DSL-SHAPE");
      expect(reads).toBe(0);
    });
