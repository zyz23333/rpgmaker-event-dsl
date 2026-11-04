# Map, characters and movement

[Documentation](../../README.md)

Examples use helpers from `rpgmaker-event-dsl`; short fragments omit imports and containing event declarations. See [events and references](../events.md) for enclosing types and [asset validation](../assets.md) for file checks.

- [Map appearance](#map-appearance)
- [Map characters](#map-characters)
- [Map location commands](#map-location-commands)
- [Movement Routes](#movement-routes)

## Map appearance

Map appearance commands require their complete saved configuration:

```ts
changeMapNameDisplay({ enabled: true });
changeTileset({ tileset: tilesetRef({ id: 2 }) });
changeBattleBack({
  battleback1: imageAsset({ folder: "battlebacks1", name: "Castle1" }),
  battleback2: null,
});
changeParallax({ image: null, loopX: false, loopY: true, sx: 32, sy: -32 });
```

The two battle background slots are independent. Explicit `null` means None and
compiles to an empty filename; it differs from MV's internal automatic background
state. Parallax requires all five fields. Each speed is an integer from −32 to 32,
preserves negative zero, and remains saved while its loop is disabled or its image
is None. Use the exact
`battlebacks1`, `battlebacks2` and `parallaxes` folders for each image slot; an empty
Asset Reference name is invalid. Tilesets must exist in the Snapshot and have no
None value. Compile and Check validate selected event assets against exact local
ordinary files while preserving their saved names; file existence does not
guarantee that MV can decode or display the images. Change Tileset checks all nine
named sheets. Transfer Player destinations and a Map Event Page tile do not add
asset-file dependencies in the first release; fixed Map references retain their
existing validation. A tile page's saved character image is checked as an
explicitly inactive setting.

## Map characters

Map character commands use explicit saved settings:

```ts
scrollMap({ direction: "right", distance: 0, speed: 6 });
showAnimation({ target: playerCharacter, animation: animationRef({ id: 1 }), wait: false });
showBalloonIcon({ target: playerCharacter, balloon: "userDefined5", wait: true });
changeTransparency({ transparent: false });
changePlayerFollowers({ visible: true });
getOnOffVehicle();
eraseEvent();
gatherFollowers();
```

Scroll directions are `down`/`left`/`right`/`up`, distance is an integer 0–100 and
speed is 1–6; there is no scroll wait field. Animation and balloon targets support
character selectors for player, currentEvent and positive event IDs, with required
boolean `wait`. Balloons use the fifteen named icons: exclamation, question,
musicNote, heart, anger, sweat, cobweb, silence, lightBulb, zzz and userDefined1–5.
Animations require existing database entries; missing runtime targets warn and
retain the selector. Common Event callers determine context. Boarding may fail
because of player state or terrain; erase requires a current map-event identity,
and Gather Followers waits on the map but skips battle. Context warnings also
identify retained map-player effects during battle.

## Map location commands

`transferPlayer({ destination, direction?, fade? })` and
`setVehicleLocation({ vehicle, destination })` accept a direct destination
`{ kind: "direct", map: mapRef({ id: 1 }), x: 4, y: 5 }` or variable references
`{ kind: "variables", map: variableRef({ id: 1 }), x: variableRef({ id: 2 }), y: variableRef({ id: 3 }) }`.
Vehicle is `boat`, `ship` or `airship`. Transfer direction is
`retain/down/left/right/up`, defaulting to `retain`; fade is `black/white/none`,
defaulting to `black`.

`setEventLocation({ target, destination, direction? })` uses a character Runtime
Selector for `currentEvent` or a positive `event` ID. Its destination is direct
numeric `x/y`, variable references `x/y`, or `{ kind: "exchange", target }` with
the same event selector subset. Direction defaults to `retain` and uses the same
five named values. A missing runtime event warns without becoming a missing
Project Data Reference.

`getLocationInfo({ variable, info, location })` writes to an existing Variable
Slot, including an unnamed slot addressed by ID. Info is
`terrainTag/eventId/tileLayer1/tileLayer2/tileLayer3/tileLayer4/regionId`;
location is direct numeric `x/y` or variable references `x/y`.

These four commands' direct coordinates are integers `0..2147483647`, excluding
negative zero. Fixed-map bounds warnings preserve saved coordinates; current-map
warnings are conditional on a containing Map Event. Unknown Common Event running
maps do not trigger bounds warnings by themselves. Terrain and region queries
return zero outside bounds, tile queries may alias another data-array element,
and event queries match exact coordinates even outside dimensions. Variable
references are checked without predicting their runtime values. Transfer during
battle warns that execution may stall.

## Movement Routes

```ts
import { setMovementRoute } from "rpgmaker-event-dsl";

const routeCommand = setMovementRoute({
  target: { kind: "runtimeSelector", scope: "character", target: "player" },
  route: {
    commands: [{ kind: "turnDown" }, { kind: "jump", x: 0, y: 1, savedShape: { indent: "null" } }],
    repeat: false,
    wait: true,
  },
});
```

The shared `MovementRoute` type requires `commands`, including an empty array.
Its flags default to repeat=true, skippable=false and wait=false. Each instruction's
optional `savedShape.indent` is `"absent"` by default, `"null"` for native null,
or `"zero"` for native numeric 0. Parameterless instructions omit parameters.
The route's `terminator.parameters` is `"empty"` by default or `"absent"`;
its sole final M0 has no indent and produces no 505. Empty saved descriptors and
optional undefined fields use these defaults. Set Movement Route owns all 505
continuations and validates their complete ordered objects, preserving missing keys,
null, zero and nested audio values. Conflicting mirrors, unknown movement codes,
extra fields and unsupported envelopes fail. Recognized raw routes retain switch
reference and Script Command Gate validation.

Map Event Pages use `movement: { type?, speed?, frequency?, route? }`. Type is
`"fixed"` (default), `"random"`, `"approach"` or `"custom"`; speed is integer 1..6,
frequency is integer 1..5, and both default to 3. The route shares `MovementRoute`
and defaults to `{ commands: [] }`. Its saved flags, instructions and envelope states
remain preserved and validated in every movement mode. A saved script in a fixed
Page route still requires the Script Command Gate.

All 45 native movement instructions are formal `MoveRouteCommand` objects. M1–13
use `moveDown`, `moveLeft`, `moveRight`, `moveUp`, `moveLowerLeft`, `moveLowerRight`,
`moveUpperLeft`, `moveUpperRight`, `moveRandom`, `moveTowardPlayer`, `moveAwayFromPlayer`,
`moveForward`, and `moveBackward`. M16–26 use `turnDown`, `turnLeft`, `turnRight`,
`turnUp`, `turn90Right`, `turn90Left`, `turn180`, `turn90RightOrLeft`, `turnRandom`,
`turnTowardPlayer`, and `turnAwayFromPlayer`. These objects need only `kind`.

| Native code                                                                       | Formal fields in addition to `kind`    | Accepted values                                                    |
| --------------------------------------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------ |
| M14 `jump`                                                                        | `x`, `y`                               | Independent integers −99..99                                       |
| M15 `wait`                                                                        | `frames`                               | Integer 1..999                                                     |
| M27/28 `switchOn` / `switchOff`                                                   | `switch`                               | A switch reference by existing ID or unique declared name          |
| M29 `changeSpeed`                                                                 | `speed`                                | Integer 1..6                                                       |
| M30 `changeFrequency`                                                             | `frequency`                            | Integer 1..5                                                       |
| M31–40 `walkAnimation`, `stepAnimation`, `directionFix`, `through`, `transparent` | `enabled`                              | Required boolean, with distinct on/off codes                       |
| M41 `changeImage`                                                                 | `character`, `characterIndex`          | Characters image asset or null; independent integer index 0..7     |
| M42 `changeOpacity`                                                               | `opacity`                              | Integer 0..255                                                     |
| M43 `changeBlendMode`                                                             | `blendMode`                            | `"normal"`, `"additive"`, `"multiply"`, `"screen"`                 |
| M44 `playSe`                                                                      | `audio: { asset, volume, pitch, pan }` | SE asset or null; integers 0..100, 50..150, −100..100 respectively |
| M45 `script`                                                                      | `script: scriptInput({ code })`        | One complete string under the Script Command Gate                  |

Every listed core field is required. None image preserves its independent index,
including index 7; big-character filenames also retain the chosen index. None SE
preserves all explicitly supplied volume, pitch and pan values. For example:

```ts
const instructions = [
  { kind: "wait", frames: 30 },
  { kind: "changeImage", character: null, characterIndex: 7 },
  { kind: "changeBlendMode", blendMode: "screen" },
  { kind: "playSe", audio: { asset: null, volume: 17, pitch: 73, pan: -41 } },
] satisfies import("rpgmaker-event-dsl").MoveRouteCommand[];
```

Saved numeric values retain negative zero for jump x/y, characterIndex, opacity,
and SE volume/pan. The symbolic blend code, movement code and finite indent forms
reject native negative zero because their formal symbols cannot reconstruct it.

M45 keeps empty text, whitespace, CR/LF/CRLF and trailing characters in one native
slot, including more than twelve lines. LF warns about the editor's single-line
input; CR warns that parameter reconfirmation needs verification. Warnings retain
the exact text. Empty, inactive and unreachable M45 instructions still require
`scriptEnabled: true` during Check and Compile.
