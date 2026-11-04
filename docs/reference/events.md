# Events, identities and references

[Documentation](../README.md)

Use this reference for declarations and their complete saved configuration. For reusable source organization, see the [authoring guide](../authoring.md).

- [Entry Identity](#entry-identity)
- [Project Data References and System slots](#project-data-references-and-system-slots)
- [Common Events](#common-events)
- [Map Event Pages](#map-event-pages)
- [Troop Events and Battle Event Pages](#troop-events-and-battle-event-pages)

## Entry Identity

DSL-owned entries use explicit RPG Maker MV IDs. Display names are for humans and
name-based references; they are not identity. Duplicate display names are allowed, but
name-based references must resolve to exactly one visible entry.

Map Event identity is `mapId` plus event `id`. Common Events, Switch Definitions, and
Variable Definitions use their explicit `id` in their data domain.

```ts
import {
  callCommonEvent,
  commonEvent,
  commonEventRef,
  mapEvent,
  page,
  showText,
  switchDefinition,
  switchRef,
  variableDefinition,
} from "rpgmaker-event-dsl";

export const hasKey = switchDefinition({
  id: 1,
  name: "Has Key",
});

export const doorState = variableDefinition({
  id: 2,
  name: "Door State",
});

export const introCommonEvent = commonEvent({
  id: 1,
  name: "Intro",
  trigger: "none",
  commands: [
    showText({
      lines: ["Welcome."],
      face: { image: null, index: 0 },
      background: "window",
      position: "bottom",
    }),
  ],
});

export const doorEvent = mapEvent({
  mapId: 1,
  id: 3,
  name: "Door",
  x: 10,
  y: 8,
  pages: [
    page({
      conditions: {
        switch1: { enabled: true, ref: switchRef({ id: 1 }) },
      },
      commands: [
        showText({
          lines: ["The door is open."],
          face: { image: null, index: 0 },
          background: "window",
          position: "bottom",
        }),
        callCommonEvent({ commonEvent: commonEventRef({ id: 1 }) }),
      ],
    }),
  ],
});
```

## Project Data References and System slots

Project Data Reference helpers require exactly one numeric `id` or string `name`
and reject unsupported own fields before constructing the reference. The command
or page context still determines the accepted saved ID domain and target existence.

Switch and variable IDs can refer to unnamed System slots. Their final capacity is
the larger of the Snapshot capacity and the highest ID declared by
`switchDefinition(...)` or `variableDefinition(...)`. Removing a declaration clears
its name while retaining the Snapshot capacity. A numeric reference does not create
or extend a slot. Name references to switches and variables resolve only against
unique DSL declarations; Snapshot names do not provide a fallback. Other database
references can use an existing numeric ID even when that entry's name is empty.

Workspace reference validation uses the captured Snapshot, including Animations,
Tilesets and empty-name maps. `showAnimation`, `changeTileset` and `enemyTransform`
require an existing fixed target in both formal and recognized raw commands;
Decompile checks these targets before publishing source. Runtime enemy positions
and equipment candidates remain selectors rather than database references. The
Snapshot retains complete troop member order, including hidden members and missing
Enemy IDs, and the complete System equipment slot configuration for contextual
validation. Use `pull` to capture subsequent editor-side database changes.

## Common Events

Common Events require an explicit positive `id`, exact string `name`,
`trigger: "none" | "autorun" | "parallel"`, and a `commands` array, including when
empty. Names may be empty or duplicated; a name reference requires exactly one
current Common Event declaration. Call one with
`callCommonEvent({ commonEvent: commonEventRef({ id: 1 }) })`.
Autorun and parallel require `switch: switchRef(...)`. The optional switch for none
preserves its independent native saved value; omission or explicit `undefined`
writes fixed `switchId: 1`.
Every explicit reference requires a valid System Switch slot or unique staged
Switch name. Common Events inherit invocation context without map/battle
annotations. Removing one preserves its null ID hole and needs a destructive Push.

## Map Event Pages

`mapEvent({ mapId, id, name, x, y, note?, pages })` owns the complete event.
`note` defaults to `""` and preserves whitespace, CR/LF/CRLF, tags and trailing
newlines exactly. Pages retain their array order and require at least one page;
more than 20 pages produces a warning and preserves them. Event IDs have no 999
ceiling. Initial positions must fit the captured map; occupied positions warn.

`page({ conditions?, image?, movement?, priority?, options?, trigger?, commands })`
always requires `commands`, including `[]`. Optional groups accept partial objects
or `{}` and supply these fixed defaults independently:

| Field                                 | Values                                                 | Default                                         |
| ------------------------------------- | ------------------------------------------------------ | ----------------------------------------------- |
| image.character                       | characters `imageAsset(...)` or null                   | null                                            |
| image.characterIndex                  | integer 0..7                                           | 0                                               |
| image.tileId                          | integer 0..1023                                        | 0                                               |
| image.direction                       | down / left / right / up                               | down                                            |
| image.pattern                         | integer 0..2                                           | 0                                               |
| movement.type                         | fixed / random / approach / custom                     | fixed                                           |
| movement.speed / frequency            | integers 1..6 / 1..5                                   | 3 / 3                                           |
| movement.route                        | shared Movement Route                                  | empty, repeat true, skippable false, wait false |
| priority                              | below / same / above                                   | below                                           |
| options.walkAnimation / stepAnimation | boolean                                                | true / false                                    |
| options.directionFix / through        | boolean                                                | false / false                                   |
| trigger                               | action / playerTouch / eventTouch / autorun / parallel | action                                          |

Each Page Condition Slot carries `enabled` and its saved setting:

```ts
page({
  conditions: {
    switch1: { enabled: false, ref: switchRef({ id: 17 }) },
    variable: { enabled: true, ref: variableRef({ id: 1 }), atLeast: 3 },
    selfSwitch: { enabled: true, value: "A" },
  },
  image: { character: imageAsset({ folder: "characters", name: "People1" }), characterIndex: 2 },
  priority: "same",
  options: { directionFix: true },
  commands: [],
});
```

`switch1`, `switch2`, `item` and `actor` require `enabled` and the corresponding
`ref`; `variable` also requires integer `atLeast` from -99,999,999 to 99,999,999;
`selfSwitch` requires `enabled` and A–D `value`. Omitted slots are disabled with
saved ID 1, variable threshold 0 and self switch A. Enabled references must exist.
Only disabled explicit IDs may retain 0 or missing positive targets. Disabled name
references still resolve uniquely; DSL-owned names use actual declarations.

Map variable thresholds, disabled explicit condition IDs, and image `characterIndex`,
`tileId` and `pattern` preserve numeric `-0` through source generation, compilation and
Push. Decompile emits these values explicitly because the positive-zero defaults
cannot reconstruct their sign. Enabled condition IDs remain positive; native
priority, trigger and movement-type enums reject `-0` before named-symbol conversion.

Image fields remain independent. Tile selection preserves the character and index;
None and big-character names (`$`, `!$`, `$!`) preserve nonzero indexes, direction
and pattern. Selecting an image never changes priority. A nonzero tile uses the
actual Snapshot Map's `tilesetId` and corresponding Tilesets entry, with B/C/D/E
bands 1..255 / 256..511 / 512..767 / 768..1023. A missing required context errors;
an empty selected group warns and preserves the tile. Assets are filename stems.
The tile and its Snapshot Map/Tileset context are validated, but a Map Event Page
tile does not add an initial Tileset sheet to the first-release asset-file check.
The page's saved character image is checked independently as an inactive setting;
image dimensions remain unchecked.

Every saved route is validated, including fixed/random/approach pages, and route
scripts require the Script Command Gate even when empty or inactive. Decompile
emits only fields whose saved values differ from defaults and always emits commands.
Missing, mistyped or unknown owned native fields fail before source publication.
Native maps with `events: []` are supported and preserve that empty array when no
events are added. Nonempty event arrays require `null` at slot zero; existing null
holes and event IDs remain intact through Decompile, Compile and Push.
Diff reports zero-based native paths and one-based page positions. Push preserves
external Map fields and null holes; removing an event nulls its slot and uses the
existing Destructive Push guard.

## Troop Events and Battle Event Pages

`troopEvent({ troopId, pages })` replaces the complete ordered Battle Event Page array
of an existing Snapshot troop. Use `battlePage({ conditions?, span?, commands })`;
commands are required and `[]` emits the sole normal terminator. Conditions default to
the native fixed state, and span defaults to `"battle"` (`"turn"` and `"moment"` are
also supported). Every provided condition slot is complete: `turn: { enabled, a, b }`,
`enemy: { enabled, index, hpAtMost }`, `actor: { enabled, ref, hpAtMost }` or
`switch: { enabled, ref }`; `turnEnd` is a Boolean. Turn values are integers 0..9999,
HP thresholds 0..100 and enemy positions nonnegative integers. Optional fields set
to `undefined` mean omission; a supplied slot still requires all its fields. Inactive
saved numeric conditions preserve negative zero. Native span uses the exact enum
0/1/2 and rejects negative zero before source publication. Disabled explicit
actor/switch IDs may retain zero or missing targets;
this exception does not apply to names or commands. An enabled enemy condition
requires the actual member position and valid Enemy references for all raw members.

Troop declarations cannot change troop name, members, positions, hidden flags or
unknown carrier data. Decompile emits every actual troop, including empty-name,
empty-member and Blank events. Pages are nonempty and ordered, with no page IDs;
more than 20 pages warns while preserving the full array. Omission and an explicit
single default page produce the same exact Blank state. A nonblank-to-Blank change
is a destructive Troop Event Reset, visible in global Diff status even when filtered,
and requires `push --allow-destructive`. Two default pages or a disabled nondefault
condition still constitute a nonblank event.

Compilation always emits `Troops.json`. An explicit Blank declaration is
`troopEvent({ troopId, pages: [battlePage({ commands: [] })] })`. Deleting some pages
while leaving a nonblank event is an ordinary content edit. A troop itself is never
removed by this ownership model.

For the shared route schema, see [Movement Routes](commands/map.md#movement-routes). For destructive changes and applying output, see [the Workspace workflow](../workflow.md#destructive-changes).
