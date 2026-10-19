import { expect, it } from "vitest";
import {
  commonEvent,
  controlSwitches,
  controlSelfSwitch,
  loop,
  rawDslCommand,
  switchRef,
} from "../src/index.js";
import { compileCommonEvent } from "../src/compiler/events.js";
import { renderDecompiledCommandList } from "../src/decompiler/dispatch.js";
import {
  buildStagedDataGraph,
  validateDslOwnedDeclarations,
} from "../src/validation/staged-graph.js";
import * as dsl from "../src/index.js";
import { recordEvidence } from "./support/mv-evidence.js";

function evidenceIt(name: string, verify: () => void) {
  it(name, async () => {
    const startedAt = new Date().toISOString();
    let failure: unknown;
    try {
      verify();
    } catch (error) {
      failure = error;
      throw error;
    } finally {
      await recordEvidence({
        requirementId: "MV-S3-INPUT-001",
        startedAt,
        stages: [
          "Public helper / native Decompile / known raw / staged validation / compile command seams",
        ],
        expected: name,
        actual: { assertionsCompleted: failure === undefined },
        ...(failure === undefined ? {} : { error: failure }),
      });
    }
  });
}

evidenceIt(
  "rejects symbolic switch negative zero before Decompile or known raw mapping and retains positive zero controls",
  () => {
    const snapshotReferences = { switchCapacity: 1 };
    const resolver = buildStagedDataGraph({ declarations: [], snapshotReferences }).resolver;
    for (const [code, parameters, slot] of [
      [121, [1, 1, -0], 2],
      [123, ["A", -0], 1],
    ] as const) {
      const list = [
        { code, indent: 0, parameters: [...parameters] },
        { code: 0, indent: 0, parameters: [] },
      ];
      expect(() => renderDecompiledCommandList(list)).toThrow(`MV-E${code}-VALUE`);
      expect(() => renderDecompiledCommandList(list)).toThrow(`parameters[${slot}]`);
      expect(() => renderDecompiledCommandList(list)).toThrow("-0");
      const event = commonEvent({
        id: 1,
        name: "Categorical negative zero",
        trigger: "none",
        commands: [rawDslCommand({ code, parameters })],
      });
      const issues = validateDslOwnedDeclarations([event], {
        scriptEnabled: false,
        snapshotReferences,
      }).issues;
      expect(issues).toContainEqual(
        expect.objectContaining({
          code: `MV-E${code}-VALUE`,
          dslPath: `commands[0].parameters[${slot}]`,
          actual: expect.stringContaining("-0"),
        }),
      );
      expect(() => compileCommonEvent(event, { nextId: 1, resolver })).toThrow("-0");
      const controlParameters = code === 121 ? [1, 1, 0] : ["A", 0];
      const control = commonEvent({
        id: 1,
        name: "Positive zero control",
        trigger: "none",
        commands: [rawDslCommand({ code, parameters: controlParameters })],
      });
      expect(
        validateDslOwnedDeclarations([control], {
          scriptEnabled: false,
          snapshotReferences,
        }).issues.filter((i) => i.level === "error"),
      ).toEqual([]);
      expect(compileCommonEvent(control, { nextId: 1, resolver }).list).toEqual([
        { code, indent: 0, parameters: controlParameters },
        { code: 0, indent: 0, parameters: [] },
      ]);
      expect(
        renderDecompiledCommandList([
          { code, indent: 0, parameters: controlParameters },
          { code: 0, indent: 0, parameters: [] },
        ]).source,
      ).toContain("value: true");
    }
  },
);

evidenceIt(
  "all reference helpers refuse unknown fields and id-name ambiguity without inventing a numeric domain",
  () => {
    const helpers = [
      dsl.actorRef,
      dsl.animationRef,
      dsl.armorRef,
      dsl.classRef,
      dsl.commonEventRef,
      dsl.enemyRef,
      dsl.itemRef,
      dsl.mapRef,
      dsl.skillRef,
      dsl.stateRef,
      dsl.switchRef,
      dsl.tilesetRef,
      dsl.troopRef,
      dsl.variableRef,
      dsl.weaponRef,
    ];
    for (const helper of helpers) {
      const extra = { id: 1, unexpected: "must refuse" };
      const ambiguous = { id: 1, name: "must not discard" };
      expect(() => helper(extra)).toThrow("MV-DSL-SHAPE");
      expect(() => helper(ambiguous)).toThrow("MV-REFERENCE-INPUT");
      expect(() => helper({} as never)).toThrow("MV-REFERENCE-INPUT");
      expect(() => helper({ id: undefined } as never)).toThrow("MV-REFERENCE-INPUT");
      expect(helper({ name: "" })).toMatchObject({ name: "" });
      expect(helper({ id: 0 })).toMatchObject({ id: 0 });
      expect(Object.is((helper({ id: -0 }) as { id: number }).id, -0)).toBe(true);
    }
  },
);

evidenceIt("rejects helper input fields before switch, self-switch or Loop projection", () => {
  const switchInput = { switch: switchRef({ id: 1 }), value: true, unexpected: "must refuse" };
  const selfSwitchInput = { selfSwitch: "A" as const, value: true, unexpected: "must refuse" };
  const loopInput = { body: { commands: [] }, unexpected: "must refuse" };
  expect(() => controlSwitches(switchInput)).toThrow(/MV-DSL-SHAPE.*controlSwitches/u);
  expect(() => controlSelfSwitch({ ...selfSwitchInput })).toThrow(
    /MV-DSL-SHAPE.*controlSelfSwitch/u,
  );
  expect(() => loop(loopInput)).toThrow(/MV-DSL-SHAPE.*loop/u);
});

evidenceIt(
  "rejects direct switch fields at their DSL paths and retains the existing direct Loop rejection",
  () => {
    for (const node of [
      {
        kind: "controlSwitches",
        switch: switchRef({ id: 1 }),
        value: true,
        unexpected: "must refuse",
      },
      { kind: "controlSelfSwitch", selfSwitch: "A", value: true, unexpected: "must refuse" },
      { kind: "loop", body: { commands: [] }, unexpected: "must refuse" },
    ]) {
      const event = commonEvent({
        id: 1,
        name: "Direct unknown field",
        trigger: "none",
        commands: [node as never],
      });
      const options = { scriptEnabled: false, snapshotReferences: { switchCapacity: 1 } };
      const errors = validateDslOwnedDeclarations([event], options).issues.filter(
        (i) => i.level === "error",
      );
      expect(errors).toContainEqual(
        expect.objectContaining({
          code: node.kind === "loop" ? "MV-CHILD-BODY" : "MV-DSL-SHAPE",
          dslPath: "commands[0]",
        }),
      );
      const resolver = buildStagedDataGraph({
        declarations: [event],
        snapshotReferences: options.snapshotReferences,
      }).resolver;
      expect(() => compileCommonEvent(event, { nextId: 1, resolver })).toThrow("commands[0]");
    }
  },
);

evidenceIt(
  "rejects direct reference, range and both endpoint shapes in helpers and direct command nodes",
  () => {
    const one = { kind: "switch", id: 1 };
    const three = { kind: "switch", id: 3 };
    const cases = [
      [{ ...one, unexpected: "must refuse" }, ".switch", "MV-DSL-SHAPE"],
      [{ ...one, name: "must not discard" }, ".switch", "MV-REFERENCE-INPUT"],
      [
        { kind: "referenceRange", from: one, to: three, unexpected: "must refuse" },
        ".switch",
        "MV-DSL-SHAPE",
      ],
      [
        { kind: "referenceRange", from: { ...one, unexpected: "must refuse" }, to: three },
        ".switch.from",
        "MV-DSL-SHAPE",
      ],
      [
        { kind: "referenceRange", from: one, to: { ...three, unexpected: "must refuse" } },
        ".switch.to",
        "MV-DSL-SHAPE",
      ],
      [
        { kind: "referenceRange", from: { kind: "variable", id: 1 }, to: three },
        ".switch.from",
        "MV-REFERENCE-INPUT",
      ],
    ] as const;
    for (const [target, suffix, code] of cases) {
      expect(() => controlSwitches({ switch: target as never, value: true })).toThrow(
        `controlSwitches${suffix}`,
      );
      const event = commonEvent({
        id: 1,
        name: "Nested unknown field",
        trigger: "none",
        commands: [{ kind: "controlSwitches", switch: target, value: true } as never],
      });
      const options = { scriptEnabled: false, snapshotReferences: { switchCapacity: 3 } };
      expect(validateDslOwnedDeclarations([event], options).issues).toContainEqual(
        expect.objectContaining({ code, dslPath: `commands[0]${suffix}` }),
      );
      const resolver = buildStagedDataGraph({
        declarations: [event],
        snapshotReferences: options.snapshotReferences,
      }).resolver;
      expect(() => compileCommonEvent(event, { nextId: 1, resolver })).toThrow(
        `commands[0]${suffix}`,
      );
    }
    const resolver = buildStagedDataGraph({
      declarations: [],
      snapshotReferences: { switchCapacity: 3 },
    }).resolver;
    const event = commonEvent({
      id: 1,
      name: "Ordered range control",
      trigger: "none",
      commands: [
        controlSwitches({
          switch: { kind: "referenceRange", from: switchRef({ id: 1 }), to: switchRef({ id: 3 }) },
          value: true,
        }),
      ],
    });
    expect(compileCommonEvent(event, { nextId: 1, resolver }).list).toEqual([
      { code: 121, indent: 0, parameters: [1, 3, 0] },
      { code: 0, indent: 0, parameters: [] },
    ]);
  },
);
