# MV Schema Catalogue and Canonical Type Shapes

## Purpose

This document freezes the first-version RPG Maker MV schema contract for the event DSL and compiler work that follows.
It records the canonical output shapes, the TypeScript input optionality rules, the first-version command catalogue,
and the MV runtime evidence used to justify those decisions.

The scope is intentionally narrow:

- define the MV shapes that the first version must emit
- define which DSL fields may be omitted in TypeScript input
- define which fields must be complete in MV output
- define the first-version raw command families
- define the output invariants later slices must preserve

It does not implement parsing, validation, compilation, or CLI behavior.

## Evidence Base

The catalogue is anchored in the following sources:

- `references/rpg-maker-mv-corescript/js/json_docs.js`
- `references/rpg-maker-mv-corescript/js/rpg_objects/Game_Event.js`
- `references/rpg-maker-mv-corescript/js/rpg_objects/Game_CommonEvent.js`
- `references/rpg-maker-mv-corescript/js/rpg_objects/Game_Map.js`
- `references/rpg-maker-mv-corescript/js/rpg_objects/Game_Interpreter.js`
- `references/rpg-maker-mv-corescript/js/rpg_managers/DataManager.js`
- `references/rmmv-local-runtime-1.6.1/data/CommonEvents.json`
- `references/rmmv-local-runtime-1.6.1/data/Map001.json`

### Evidence Summary

| Area | Evidence | Decision |
| --- | --- | --- |
| Map data loading | `DataManager.loadMapData()` loads `Map%1.json` and `DataManager.onLoad()` treats `events` as the event array. | Map output must match the MV map JSON shape exactly. |
| Common event loading | `DataManager._databaseFiles` includes `CommonEvents.json`, and `Game_CommonEvent` reads `event.list`. | Common event output must match the MV common event JSON shape exactly. |
| Map event paging | `Game_Event.findProperPageIndex()` scans pages from last to first and `meetsConditions()` checks fixed slots. | Map events require a non-empty page list and fixed condition slots. |
| Common event triggering | `Game_CommonEvent.isActive()` uses `trigger === 2` and `switchId`; `Game_Map.setupAutorunCommonEvent()` uses `trigger === 1`. | Common events support `none`, `autorun`, and `parallel` with explicit switch binding for active triggers. |
| Command execution | `Game_Interpreter.executeCommand()` dispatches by `command.code`. | The first version must freeze a command catalogue by raw code family. |
| Continuation behavior | `command101`, `command105`, `command108`, `command355`, `command302`, and `command301` consume continuation codes internally. | Continuation codes are compiler internals, not public DSL nodes. |
| MV samples | `CommonEvents.json` and `Map001.json` use nullable arrays and include explicit end markers. | Output must preserve MV array semantics, including null holes and terminal end commands. |

## Canonical Output Shapes

The first version should treat the following shapes as the MV output contract.

### Map Data File

```ts
type RmmvMapData = {
  autoplayBgm: boolean;
  autoplayBgs: boolean;
  battleback1Name: string;
  battleback2Name: string;
  bgm: RmmvAudioFile;
  bgs: RmmvAudioFile;
  disableDashing: boolean;
  displayName: string;
  encounterList: RmmvMapEncounter[];
  encounterStep: number;
  height: number;
  note: string;
  parallaxLoopX: boolean;
  parallaxLoopY: boolean;
  parallaxName: string;
  parallaxShow: boolean;
  parallaxSx: number;
  parallaxSy: number;
  scrollType: number;
  specifyBattleback: boolean;
  tilesetId: number;
  width: number;
  data: number[];
  events: Array<RmmvMapEvent | null>;
};
```

### Common Event File Entry

```ts
type RmmvCommonEvent = {
  id: number;
  name: string;
  trigger: number;
  switchId: number;
  list: RmmvEventCommand[];
};
```

### Map Event Entry

```ts
type RmmvMapEvent = {
  id: number;
  name: string;
  note: string;
  x: number;
  y: number;
  pages: RmmvEventPage[];
};
```

### Event Page

```ts
type RmmvEventPage = {
  conditions: RmmvEventPageConditions;
  image: RmmvEventPageImage;
  moveType: number;
  moveSpeed: number;
  moveFrequency: number;
  moveRoute: RmmvMoveRoute;
  walkAnime: boolean;
  stepAnime: boolean;
  directionFix: boolean;
  through: boolean;
  priorityType: number;
  trigger: number;
  list: RmmvEventCommand[];
};
```

### Page Conditions

```ts
type RmmvEventPageConditions = {
  switch1Valid: boolean;
  switch2Valid: boolean;
  variableValid: boolean;
  selfSwitchValid: boolean;
  itemValid: boolean;
  actorValid: boolean;
  switch1Id: number;
  switch2Id: number;
  variableId: number;
  variableValue: number;
  selfSwitchCh: string;
  itemId: number;
  actorId: number;
};
```

### Event Image

```ts
type RmmvEventPageImage = {
  tileId: number;
  characterName: string;
  characterIndex: number;
  direction: number;
  pattern: number;
};
```

### Movement Route

```ts
type RmmvMoveRoute = {
  repeat: boolean;
  skippable: boolean;
  wait: boolean;
  list: RmmvMoveCommand[];
};

type RmmvMoveCommand = {
  code: number;
  parameters: unknown[];
};
```

### Raw Event Command

```ts
type RmmvEventCommand = {
  code: number;
  indent: number;
  parameters: unknown[];
};
```

## TypeScript Input Versus MV Output

The first version uses schema-first TypeScript input.
That input may omit fields that the compiler can complete with documented defaults, but MV output must always be complete and runtime-valid.

### Top-Level Input Rules

| DSL area | Input rule | Compiler default | MV output rule |
| --- | --- | --- | --- |
| `mapEvent` | `name`, `x`, `y`, and `pages` are required | none | output entry is complete |
| `mapEvent.note` | optional | `""` | output `note` is always present |
| `commonEvent` | `name`, `trigger`, `switchId`, and `commands` are required | none | output entry is complete |
| `page` | object-shaped input with named fields | documented per field | output page is complete |
| `page.commands` | required, but may be empty | `[]` is allowed | output list must exist and end with `code: 0` |
| `page.conditions` | optional input object | all flags false, IDs neutral | output `conditions` is always complete |
| `page.image` | optional input object | empty image shape | output `image` is always complete |
| `page.moveRoute` | optional input object | repeat/skippable/wait defaults with empty list | output `moveRoute` is always complete |

### Canonical Optionality Decisions

- Map events require at least one page.
- Common events may have an empty command list.
- Map page command lists may be empty.
- Empty command lists compile to the MV terminal end marker only.
- Page condition slots are fixed and combined with AND semantics.
- Common events with `autorun` or `parallel` require an explicit switch reference.
- Compiler defaults are built in and documented; they are not project configuration.
- Replace operations must not inherit missing fields from the overwritten entry.

## Canonical Enum and Literal Mappings

The DSL may use readable string literals, but the compiler must map them to MV numeric values.

### Map Page Trigger

| DSL value | MV value | Notes |
| --- | --- | --- |
| `action` | `0` | default, retained as MV runtime/editor convention |
| `playerTouch` | `1` | MV runtime/editor convention |
| `eventTouch` | `2` | confirmed by `Game_Event.checkEventTriggerTouch()` |
| `autorun` | `3` | confirmed by `Game_Event.checkEventTriggerAuto()` |
| `parallel` | `4` | confirmed by `Game_Event.setupPageSettings()` |

### Common Event Trigger

| DSL value | MV value | Notes |
| --- | --- | --- |
| `none` | `0` | no runtime trigger, MV runtime/editor convention |
| `autorun` | `1` | confirmed by `Game_Map.setupAutorunCommonEvent()` |
| `parallel` | `2` | confirmed by `Game_CommonEvent.isActive()` |

### Priority Type

| DSL value | MV value |
| --- | --- |
| `belowCharacters` | `0` |
| `sameAsCharacters` | `1` |
| `aboveCharacters` | `2` |

The numeric values above are MV runtime conventions used by event page rendering and are retained as the first-version contract.

### Direction

| DSL value | MV value |
| --- | --- |
| `retain` | `0` |
| `down` | `2` |
| `left` | `4` |
| `right` | `6` |
| `up` | `8` |

These values are the MV direction codes used by character and event page image handling.

### Fade Type

| DSL value | MV value |
| --- | --- |
| `black` | `0` |
| `white` | `1` |
| `none` | `2` |

These are the MV message fade codes used by the interpreter and message window.

### Self Switch

| DSL value |
| --- |
| `A` |
| `B` |
| `C` |
| `D` |

## Page Condition Slots

Page conditions are fixed MV slots and must remain object-shaped.
They are not arbitrary predicates and they are not a boolean expression tree.

The canonical slots are:

- `switch1`
- `switch2`
- `variable`
- `selfSwitch`
- `item`
- `actor`

Each slot has a companion validity flag in MV output.
The compiler must emit both the `...Valid` flag and the paired value fields whenever a slot is enabled.

## First-Version Command Catalogue

The first version fixes the command set at the level needed for DSL and compiler implementation.
Public DSL helpers may be object-shaped and readable, but the raw command catalogue is the MV code set below.

### Core Catalogue

| DSL helper family | Raw MV codes | Continuation codes | Public input style | Status |
| --- | --- | --- | --- | --- |
| show text | `101`, `401` | `401` internal only | schema object | fixed |
| show choices | `102`, `402`, `403` | `402`, `403` internal only | schema object | fixed |
| comment | `108`, `408` | `408` internal only | schema object | fixed |
| conditional branch | `111`, `411` | `411` internal only | schema object | fixed |
| loop | `112`, `413` | `413` internal only | schema object | fixed |
| break loop | `113` | none | schema object | fixed |
| exit event processing | `115` | none | schema object | fixed |
| common event | `117` | none | schema object | fixed |
| label | `118` | none | schema object | fixed |
| jump to label | `119` | none | schema object | fixed |
| control switches | `121` | none | schema object | fixed |
| control variables | `122` | none | schema object | fixed |
| control self switch | `123` | none | schema object | fixed |
| change gold | `125` | none | schema object | fixed |
| change items | `126` | none | schema object | fixed |
| transfer player | `201` | none | schema object | fixed |
| set event location | `203` | none | schema object | fixed |
| set movement route | `205` | none | schema object | fixed |
| erase event | `214` | none | schema object | fixed |
| wait | `230` | none | schema object | fixed |
| battle processing | `301`, `601`, `602`, `603` | branch codes internal | schema object | family fixed, sample-confirmed detail pending |
| shop processing | `302`, `605` | `605` internal only | schema object | family fixed, sample-confirmed detail pending |
| script | `355`, `655` | `655` internal only | schema object | fixed with config gate |
| plugin command | `356` | none | schema object | fixed |

### Command Catalogue Rules

- Continuation commands are compiler internals only.
- The public DSL must not expose `indent`.
- The public DSL must not expose raw end-of-list commands.
- Empty command lists are valid and compile to the MV terminal command only.
- Script commands require explicit configuration enablement.
- Plugin commands do not require a runtime registry in the first version.
- Battle and shop command families are included in the first version, but their most complex parameter encodings must be confirmed against editor-generated golden samples before the implementation is treated as complete.

The command family table fixes the first-version surface.
For battle and shop processing, the family boundary is fixed now and the exact parameter-level schema remains sample-confirmed work for Slice 08.

## Output Invariants

The compiler and writer slices must preserve the following invariants.

- Every raw event command has `code`, `indent`, and `parameters`.
- Every raw event command list ends with `{ code: 0, indent: 0, parameters: [] }`.
- Continuation commands appear only in compiler-approved positions.
- Indentation must never become negative.
- Map event output must preserve the full MV page object shape.
- Common event output must preserve the full MV common event object shape.
- Null holes in MV arrays remain untouched.
- Create appends a new ID at the end of the array.
- Replace overwrites exactly one matched existing entry.
- Replace must not silently inherit from the overwritten entry.
- Output files must remain readable by the MV runtime readers that consume `Map###.json` and `CommonEvents.json`.

## Deferred Details

The following details are deliberately not frozen by this slice:

- parser implementation strategy
- runtime validation implementation
- CLI command shape
- exact module boundaries for the implementation package
- battle and shop parameter shapes beyond the family-level contract

Those details belong to later implementation or verification slices.
