import { audioAsset, imageAsset, scriptInput, switchRef } from "../../src/index.js";
import type { MoveRouteCommand } from "../../src/index.js";

// Independent pairs transcribed from the accepted M1–M45 parameter table. Neither side
// is produced by the compiler or decompiler; complete carriers add only their envelopes.
export type MovementInstructionCase = {
  label: string;
  authored: MoveRouteCommand;
  native: { code: number; parameters?: unknown[] };
};
export const movementInstructions: MovementInstructionCase[] = [
  { label: "M1", authored: { kind: "moveDown" }, native: { code: 1 } },
  { label: "M2", authored: { kind: "moveLeft" }, native: { code: 2 } },
  { label: "M3", authored: { kind: "moveRight" }, native: { code: 3 } },
  { label: "M4", authored: { kind: "moveUp" }, native: { code: 4 } },
  { label: "M5", authored: { kind: "moveLowerLeft" }, native: { code: 5 } },
  { label: "M6", authored: { kind: "moveLowerRight" }, native: { code: 6 } },
  { label: "M7", authored: { kind: "moveUpperLeft" }, native: { code: 7 } },
  { label: "M8", authored: { kind: "moveUpperRight" }, native: { code: 8 } },
  { label: "M9", authored: { kind: "moveRandom" }, native: { code: 9 } },
  { label: "M10", authored: { kind: "moveTowardPlayer" }, native: { code: 10 } },
  { label: "M11", authored: { kind: "moveAwayFromPlayer" }, native: { code: 11 } },
  { label: "M12", authored: { kind: "moveForward" }, native: { code: 12 } },
  { label: "M13", authored: { kind: "moveBackward" }, native: { code: 13 } },
  {
    label: "M14",
    authored: { kind: "jump", x: -99, y: 99 },
    native: { code: 14, parameters: [-99, 99] },
  },
  { label: "M15", authored: { kind: "wait", frames: 1 }, native: { code: 15, parameters: [1] } },
  { label: "M16", authored: { kind: "turnDown" }, native: { code: 16 } },
  { label: "M17", authored: { kind: "turnLeft" }, native: { code: 17 } },
  { label: "M18", authored: { kind: "turnRight" }, native: { code: 18 } },
  { label: "M19", authored: { kind: "turnUp" }, native: { code: 19 } },
  { label: "M20", authored: { kind: "turn90Right" }, native: { code: 20 } },
  { label: "M21", authored: { kind: "turn90Left" }, native: { code: 21 } },
  { label: "M22", authored: { kind: "turn180" }, native: { code: 22 } },
  { label: "M23", authored: { kind: "turn90RightOrLeft" }, native: { code: 23 } },
  { label: "M24", authored: { kind: "turnRandom" }, native: { code: 24 } },
  { label: "M25", authored: { kind: "turnTowardPlayer" }, native: { code: 25 } },
  { label: "M26", authored: { kind: "turnAwayFromPlayer" }, native: { code: 26 } },
  {
    label: "M27",
    authored: { kind: "switchOn", switch: switchRef({ id: 1 }) },
    native: { code: 27, parameters: [1] },
  },
  {
    label: "M28",
    authored: { kind: "switchOff", switch: switchRef({ id: 3 }) },
    native: { code: 28, parameters: [3] },
  },
  {
    label: "M29",
    authored: { kind: "changeSpeed", speed: 1 },
    native: { code: 29, parameters: [1] },
  },
  {
    label: "M30",
    authored: { kind: "changeFrequency", frequency: 1 },
    native: { code: 30, parameters: [1] },
  },
  { label: "M31", authored: { kind: "walkAnimation", enabled: true }, native: { code: 31 } },
  { label: "M32", authored: { kind: "walkAnimation", enabled: false }, native: { code: 32 } },
  { label: "M33", authored: { kind: "stepAnimation", enabled: true }, native: { code: 33 } },
  { label: "M34", authored: { kind: "stepAnimation", enabled: false }, native: { code: 34 } },
  { label: "M35", authored: { kind: "directionFix", enabled: true }, native: { code: 35 } },
  { label: "M36", authored: { kind: "directionFix", enabled: false }, native: { code: 36 } },
  { label: "M37", authored: { kind: "through", enabled: true }, native: { code: 37 } },
  { label: "M38", authored: { kind: "through", enabled: false }, native: { code: 38 } },
  { label: "M39", authored: { kind: "transparent", enabled: true }, native: { code: 39 } },
  { label: "M40", authored: { kind: "transparent", enabled: false }, native: { code: 40 } },
  {
    label: "M41",
    authored: { kind: "changeImage", character: null, characterIndex: 7 },
    native: { code: 41, parameters: ["", 7] },
  },
  {
    label: "M42",
    authored: { kind: "changeOpacity", opacity: 0 },
    native: { code: 42, parameters: [0] },
  },
  {
    label: "M43",
    authored: { kind: "changeBlendMode", blendMode: "normal" },
    native: { code: 43, parameters: [0] },
  },
  {
    label: "M44",
    authored: { kind: "playSe", audio: { asset: null, volume: 17, pitch: 73, pan: -41 } },
    native: { code: 44, parameters: [{ name: "", volume: 17, pitch: 73, pan: -41 }] },
  },
  {
    label: "M45",
    authored: { kind: "script", script: scriptInput({ code: "" }) },
    native: { code: 45, parameters: [""] },
  },
];

export const movementParameterCases: MovementInstructionCase[] = [
  {
    label: "M14 opposite endpoints",
    authored: { kind: "jump", x: 99, y: -99 },
    native: { code: 14, parameters: [99, -99] },
  },
  {
    label: "M14 zero",
    authored: { kind: "jump", x: 0, y: 0 },
    native: { code: 14, parameters: [0, 0] },
  },
  {
    label: "M15 maximum",
    authored: { kind: "wait", frames: 999 },
    native: { code: 15, parameters: [999] },
  },
  {
    label: "M29 speed2",
    authored: { kind: "changeSpeed", speed: 2 },
    native: { code: 29, parameters: [2] },
  },
  {
    label: "M29 speed3",
    authored: { kind: "changeSpeed", speed: 3 },
    native: { code: 29, parameters: [3] },
  },
  {
    label: "M29 speed4",
    authored: { kind: "changeSpeed", speed: 4 },
    native: { code: 29, parameters: [4] },
  },
  {
    label: "M29 speed5",
    authored: { kind: "changeSpeed", speed: 5 },
    native: { code: 29, parameters: [5] },
  },
  {
    label: "M29 speed6",
    authored: { kind: "changeSpeed", speed: 6 },
    native: { code: 29, parameters: [6] },
  },
  {
    label: "M30 frequency2",
    authored: { kind: "changeFrequency", frequency: 2 },
    native: { code: 30, parameters: [2] },
  },
  {
    label: "M30 frequency3",
    authored: { kind: "changeFrequency", frequency: 3 },
    native: { code: 30, parameters: [3] },
  },
  {
    label: "M30 frequency4",
    authored: { kind: "changeFrequency", frequency: 4 },
    native: { code: 30, parameters: [4] },
  },
  {
    label: "M30 frequency5",
    authored: { kind: "changeFrequency", frequency: 5 },
    native: { code: 30, parameters: [5] },
  },
  {
    label: "M41 None index0",
    authored: { kind: "changeImage", character: null, characterIndex: 0 },
    native: { code: 41, parameters: ["", 0] },
  },
  {
    label: "M41 normal index0",
    authored: {
      kind: "changeImage",
      character: imageAsset({ folder: "characters", name: "People1" }),
      characterIndex: 0,
    },
    native: { code: 41, parameters: ["People1", 0] },
  },
  {
    label: "M41 normal index7",
    authored: {
      kind: "changeImage",
      character: imageAsset({ folder: "characters", name: "People1" }),
      characterIndex: 7,
    },
    native: { code: 41, parameters: ["People1", 7] },
  },
  {
    label: "M41 big index7",
    authored: {
      kind: "changeImage",
      character: imageAsset({ folder: "characters", name: "!$Huge" }),
      characterIndex: 7,
    },
    native: { code: 41, parameters: ["!$Huge", 7] },
  },
  {
    label: "M42 one",
    authored: { kind: "changeOpacity", opacity: 1 },
    native: { code: 42, parameters: [1] },
  },
  {
    label: "M42 upper adjacent",
    authored: { kind: "changeOpacity", opacity: 254 },
    native: { code: 42, parameters: [254] },
  },
  {
    label: "M42 maximum",
    authored: { kind: "changeOpacity", opacity: 255 },
    native: { code: 42, parameters: [255] },
  },
  {
    label: "M43 additive",
    authored: { kind: "changeBlendMode", blendMode: "additive" },
    native: { code: 43, parameters: [1] },
  },
  {
    label: "M43 multiply",
    authored: { kind: "changeBlendMode", blendMode: "multiply" },
    native: { code: 43, parameters: [2] },
  },
  {
    label: "M43 screen",
    authored: { kind: "changeBlendMode", blendMode: "screen" },
    native: { code: 43, parameters: [3] },
  },
  {
    label: "M44 lower",
    authored: { kind: "playSe", audio: { asset: null, volume: 0, pitch: 50, pan: -100 } },
    native: { code: 44, parameters: [{ name: "", volume: 0, pitch: 50, pan: -100 }] },
  },
  {
    label: "M44 upper",
    authored: {
      kind: "playSe",
      audio: {
        asset: audioAsset({ folder: "se", name: "Cursor1" }),
        volume: 100,
        pitch: 150,
        pan: 100,
      },
    },
    native: { code: 44, parameters: [{ name: "Cursor1", volume: 100, pitch: 150, pan: 100 }] },
  },
  {
    label: "M44 explicit initial values",
    authored: { kind: "playSe", audio: { asset: null, volume: 90, pitch: 100, pan: 0 } },
    native: { code: 44, parameters: [{ name: "", volume: 90, pitch: 100, pan: 0 }] },
  },
  {
    label: "M45 whitespace",
    authored: { kind: "script", script: scriptInput({ code: " \t " }) },
    native: { code: 45, parameters: [" \t "] },
  },
  {
    label: "M45 CR",
    authored: { kind: "script", script: scriptInput({ code: "a\rb  " }) },
    native: { code: 45, parameters: ["a\rb  "] },
  },
  {
    label: "M45 LF",
    authored: { kind: "script", script: scriptInput({ code: "a\nb\n" }) },
    native: { code: 45, parameters: ["a\nb\n"] },
  },
  {
    label: "M45 CRLF",
    authored: { kind: "script", script: scriptInput({ code: "a\r\nb \t" }) },
    native: { code: 45, parameters: ["a\r\nb \t"] },
  },
  {
    label: "M45 beyond twelve lines",
    authored: {
      kind: "script",
      script: scriptInput({ code: "1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11\n12\n13\n14\n" }),
    },
    native: { code: 45, parameters: ["1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11\n12\n13\n14\n"] },
  },
];
