# Map Event pages

Use `mapEvent({ mapId, id, name, x, y, note?, pages })` with existing map-scoped
identity and initial placement. Preserve note exactly, including CR/LF/CRLF, spaces,
tag order and trailing newline. Its default is `""`; persistent `meta` is derived
by MV. Pages form an ordered nonempty list; highest eligible page wins. More than
20 pages warns and remains representable. Event IDs can exceed 999.

Use `page({ conditions?, image?, movement?, priority?, options?, trigger?, commands })`.
Always supply commands, including `[]`. Optional groups allow `{}` and partial
fields. Null is accepted only for `image.character`.

Conditions are fixed saved slots:

- switch1/switch2: `{ enabled, ref: switchRef(...) }`.
- item/actor: `{ enabled, ref: itemRef(...) }` / `{ enabled, ref: actorRef(...) }`.
- variable: `{ enabled, ref: variableRef(...), atLeast }`, integer threshold
  -99,999,999..99,999,999, always >=.
- selfSwitch: `{ enabled, value: "A" | "B" | "C" | "D" }`.

Omitted slots are disabled, saved ID 1, variable threshold 0, self switch A.
Enabled references require existing targets. Disabled explicit IDs may be 0 or
missing positive targets. Disabled name references still resolve uniquely from
the proper scope; DSL-owned names come from actual declarations. Retain saved
settings while disabled and validate their structure, types, enums and ranges.

Image fields are independent: `character` is a characters `imageAsset(...)` or
null (default); characterIndex 0..7 defaults 0; tileId 0..1023 defaults 0;
direction down/left/right/up defaults down; pattern 0..2 defaults 0. Retain other
image values when using a tile, None or big-character `$`/`!$`/`$!` name. Selecting
an image leaves priority at its explicit value or fixed default below.

An active tile needs the real Snapshot Map tileset and selected B/C/D/E group:
1..255 / 256..511 / 512..767 / 768..1023. Missing needed context errors; an empty
selected group warns and retains the value. Use characters assets even when a tile
is selected. Asset references check structure and category without file/dimension
scanning.

Movement uses `{ type?, speed?, frequency?, route? }`: fixed/random/approach/custom
defaults fixed, speed 1..6 defaults 3, frequency 1..5 defaults 3. Route uses the
shared `{ commands, repeat?, skippable?, wait?, terminator? }` model and defaults
to empty / true / false / false. Preserve the saved route in every movement mode.
All route instructions, references and Script Inputs are validated recursively;
the disabled-condition ID exception stays within condition slots. Route wait=true
is retained on Autonomous Movement without making the page interpreter wait.

Priority below/same/above defaults below. Options `walkAnimation`, `stepAnimation`,
`directionFix`, `through` default true/false/false/false. Trigger
action/playerTouch/eventTouch/autorun/parallel defaults action. Author self-ending
autorun and intentional parallel behavior using normal MV flow.

Decompile emits only settings that fixed defaults can reconstruct exactly and
always emits commands. Keep nondefault disabled slots, unused image fields and
noncustom routes. Native missing/wrong/unknown owned fields cause a located error
before source publication. Review Diff's native `pages[0]` paths and human page 1
positions; page order and count are meaningful. Entry Removal nulls the event slot
and requires the existing reviewed Destructive Push authorization.
