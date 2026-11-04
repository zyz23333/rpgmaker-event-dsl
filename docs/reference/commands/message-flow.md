# Messages and flow control

[Documentation](../../README.md)

Examples use helpers from `rpgmaker-event-dsl`; short fragments omit imports and containing event declarations. See [events and references](../events.md) for enclosing types and [asset validation](../assets.md) for file checks.

- [Message Commands](#message-commands)
- [Choices](#choices)
- [Conditional and child bodies](#conditional-and-child-bodies)
- [Loop and event processing](#loop-and-event-processing)
- [Labels and jumps](#labels-and-jumps)

## Message Commands

Message helpers use complete named settings:

```ts
showText({
  lines: ["Welcome.\r", ""],
  face: { image: null, index: 11 },
  background: "window",
  position: "bottom",
});
inputNumber({ variable: variableRef({ id: 2 }), digits: 8 });
selectItem({ variable: variableRef({ id: 2 }), itemType: "hiddenB" });
showScrollingText({ lines: ["Credits", ""], speed: 2, noFastForward: false });
comment({ lines: ["Quest state", ""] });
```

All shown message fields are required. Each line is one physical saved record:
CR, whitespace and trailing empty strings are preserved, while embedded LF fails.
Show Text has 1–4 lines, Comment 1–6, and Scrolling Text at least one. Author
multiple Show Text calls for longer dialogue. Background is window/dim/transparent;
position is top/middle/bottom. Face image is a `faces` Asset Reference or None
(`null`), with an independent required index 0–2,147,483,647 excluding negative zero.
Non-None indices at least 8 warn about the official two-row layout. Selected face
files are checked for exact ordinary-file existence under the shared asset rules
below; image dimensions, layout and decoding remain unchecked. None preserves its
saved index without that warning.
Digits and scrolling speed are integers 1–8; `noFastForward` is an explicit Boolean.
Select Item types are regular/key/hiddenA/hiddenB, and its variable is the result
destination, resolved using final System capacity. Valid message records are
available with the Script Command Gate disabled.

## Choices

```ts
import { showChoices, showText } from "rpgmaker-event-dsl";

const commands = [
  showChoices({
    choices: [
      {
        text: "Ask about the ruins",
        commands: [
          showText({
            lines: ["Follow the river."],
            face: { image: null, index: 0 },
            background: "window",
            position: "bottom",
          }),
        ],
      },
      { text: "Leave", commands: [] },
    ],
    defaultChoice: { kind: "none" },
    cancel: {
      kind: "branch",
      commands: [
        showText({
          lines: ["Another time, then."],
          face: { image: null, index: 0 },
          background: "window",
          position: "bottom",
        }),
      ],
    },
    position: "right",
    background: "window",
  }),
];
```

`choices` is a required dense list of 1–6 `{ text, commands, endMarker? }` objects.
Each `commands` field is required and may be empty. Choice text preserves empty
strings, whitespace, line endings, and a final empty choice.

`defaultChoice` is `{ kind: "none" }` or `{ kind: "choice", index }` and defaults
to choice 0. `cancel` is `{ kind: "disabled" }`, `{ kind: "choice", index }`, or
`{ kind: "branch", commands, endMarker? }` and defaults to choice 1. Indices are
zero-based integers 0–5; saved indices beyond the current choice count are retained
with a warning. Numeric `index: -0` retains its saved sign through Decompile and
Push. A one-item list still saves cancel choice 1. `position` accepts
`"left"`, `"center"`, or `"right"` (default); `background` accepts `"window"`
(default), `"dim"`, or `"transparent"`.

Each choice and separate cancel branch defaults `endMarker` to `"present"`.
Use `"absent"` to preserve a nonempty Child Command Body without its trailing
Body End Marker; an empty body requires the marker. The parent produces ordered
choice branches from the same text as the choice header, an optional separate
cancel branch, and its closing record. Nested body markers retain their own
ownership, and raw records cannot supply a conflicting marker for a formal body.
Every body receives ordinary reference validation and the Script Command Gate,
including bodies the saved default or cancel setting cannot reach.

## Conditional and child bodies

```ts
import { conditional, variableRef, wait } from "rpgmaker-event-dsl";

const branch = conditional({
  condition: {
    kind: "variable",
    variable: variableRef({ id: 1 }),
    operator: "ge",
    value: { kind: "constant", value: 2 },
  },
  then: { commands: [wait({ frames: 1 })] },
  else: { commands: [] },
});
```

Conditional supports all 14 MV modes and seven Actor checks. `then.commands` is
required. Omitted `else` and an explicit empty body retain different native shapes.
Each body defaults `endMarker` to `"present"`; `"absent"` preserves a nonempty
body with no saved marker. Empty bodies require a marker. Combined formal and raw
output cannot duplicate or contradict the owning marker; nested raw markers retain
their own ownership.

Variable comparisons use a constant mode as above or
`{ kind: "variable", variable: variableRef(...) }`, and the six operators are
`eq/ge/le/gt/lt/ne`. Enemy conditions require
`enemy: { kind: "runtimeSelector", scope: "enemy", target: "enemy", index }`
with index 0..7. Character conditions require a `target` Runtime Selector in the
`character` scope: player, currentEvent, or event with a positive ID. Directions
are 2/4/6/8. Weapon and Armor conditions require `includeEquipment: boolean`.

Fixed references resolve in their own category. Missing runtime positions and
inapplicable contexts warn; Common Event caller context stays unknown. Enemy
appeared uses `isAlive()` and is false while hidden or dead. Ordinary numeric
constants, timer seconds, gold amounts and enemy indices preserve negative zero;
symbolic native encodings that cannot represent its sign are rejected.

Script conditions use `script: scriptInput({ code })`. The complete string is one
saved slot, including empty input, CR/LF, trailing whitespace and long content.
CR or LF produces a reconfirmation warning independently of the Script Command
Gate. Actor name comparisons preserve exact strings without that warning.

## Loop and event processing

```ts
import { breakLoop, exitEventProcessing, loop, wait } from "rpgmaker-event-dsl";

const commands = [
  loop({ body: { commands: [wait({ frames: 1 }), breakLoop()] } }),
  exitEventProcessing(),
];
```

Each Loop requires `body.commands`, which can be empty. Its optional `endMarker`
is `"present"` by default or `"absent"` for a nonempty body whose native saved
shape has no trailing Body End Marker. Empty bodies require the marker. The
body marker, Repeat Above record, and final event-list terminator have separate
ownership; markers inside nested bodies retain their own indentation and state.
Formal and raw commands are checked together, so a raw tail marker cannot
contradict `endMarker` or duplicate it. Valid nested raw structures remain usable.

`breakLoop()` exits the enclosing Loop. Outside a Loop it remains compilable
with a warning: MV searches for a matching Repeat Above record and can skip
the remaining event commands. `exitEventProcessing()` ends the current
interpreter. When a called Common Event exits, its caller continues after the
call. Loop children receive the same Script Command Gate and reference checks
as the containing event.

Complete Workspace command lists require exact structural records, indentation,
and one final event terminator. Malformed recognized flow commands fail before
Decompile publishes source; their diagnostic identifies the event and native
list position. Internal command-family renderers also accept command fragments,
which are not complete saved event lists.

## Labels and jumps

`label({ name })` and `jumpToLabel({ name })` require a complete string, including an
explicit empty string when intended. MV searches the complete current native command
list for the first exact Label, across branch indentation. Duplicate Labels and missing
targets warn; separate event pages and Common Events have separate label scopes.
CR/LF parameter-reconfirmation warnings preserve the original string.
