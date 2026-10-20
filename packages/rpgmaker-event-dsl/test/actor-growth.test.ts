import { expect, it } from "vitest";

import { actorRef, changeClass, changeExp, changeLevel, classRef } from "../src/index.js";

it("requires the independently saved growth and class flags in original helper input", () => {
  const input = {
    target: { kind: "runtimeSelector", scope: "actor", target: "entireParty" },
    operation: "lose",
    value: { kind: "constant", value: 1 },
  };
  expect(() => changeExp(input as never)).toThrow(/MV-E315.*showLevelUp/u);
  expect(() => changeLevel(input as never)).toThrow(/MV-E316.*showLevelUp/u);
  expect(() =>
    changeClass({ actor: actorRef({ id: 1 }), class: classRef({ id: 1 }) } as never),
  ).toThrow(/MV-E321.*keepExp/u);
});
