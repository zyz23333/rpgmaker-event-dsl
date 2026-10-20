import { expect, it } from "vitest";

import { commonEvent, loop } from "../src/index.js";
import { compileCommonEvent } from "../src/compiler/events.js";
import {
  buildStagedDataGraph,
  validateDslOwnedDeclarations,
} from "../src/validation/staged-graph.js";

for (const shape of [
  "inherited",
  "hidden-extra",
  "body-accessor",
  "slot-accessor",
  "kind-accessor",
])
  for (const entry of ["helper", "graph", "compiler"])
    it(`rejects the original ${shape} Loop body through ${entry} without executing getters`, () => {
      let reads = 0;
      let body: Record<string, unknown> = { commands: [] };
      const accessor = (target: object, key: string, value: unknown) => {
        Object.defineProperty(target, key, {
          enumerable: true,
          configurable: true,
          get() {
            reads++;
            Object.defineProperty(target, key, { value, enumerable: true, configurable: true });
            return value;
          },
        });
      };
      let suffix = "";
      if (shape === "inherited") body = Object.create({ commands: [] });
      if (shape === "hidden-extra") Object.defineProperty(body, "unexpected", { value: true });
      if (shape === "body-accessor") accessor(body, "commands", []);
      if (shape === "slot-accessor" || shape === "kind-accessor") {
        const command = { kind: "comment", lines: ["original child"] };
        const commands = [command];
        if (shape === "slot-accessor") accessor(commands, "0", command);
        else accessor(command, "kind", "comment");
        body = { commands };
        suffix = ".commands[0]";
      }
      if (entry === "helper") expect(() => loop({ body } as never)).toThrow("MV-CHILD-BODY");
      else {
        const event = commonEvent({
          id: 1,
          name: "Original Loop body shape",
          trigger: "none",
          commands: [{ kind: "loop", body } as never],
        });
        if (entry === "graph")
          expect(
            validateDslOwnedDeclarations([event], { scriptEnabled: false }).issues,
          ).toContainEqual(
            expect.objectContaining({
              level: "error",
              code: "MV-CHILD-BODY",
              dslPath: `commands[0].body${suffix}`,
            }),
          );
        else {
          const resolver = buildStagedDataGraph({ declarations: [] }).resolver;
          expect(() => compileCommonEvent(event, { nextId: 1, resolver })).toThrow("MV-CHILD-BODY");
        }
      }
      expect(reads).toBe(0);
    });
