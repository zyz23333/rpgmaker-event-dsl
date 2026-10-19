# Event Patterns

Use `troopEvent({ troopId, pages })` with `battlePage({ conditions?, span?, commands })`
for an existing Snapshot troop's complete ordered battle event. Preserve all desired
pages in the declaration. `commands` is required; pages are nonempty and have no IDs.
Span is battle/turn/moment, default battle. Optional condition slots are `turnEnd`,
`turn: { enabled, a, b }`, `enemy: { enabled, index, hpAtMost }`,
`actor: { enabled, ref, hpAtMost }` and `switch: { enabled, ref }`. Each provided slot
is complete; optional `undefined` means omission. Keep inactive saved values,
including negative zero in numeric conditions. Native span is exactly 0/1/2 and
rejects negative zero. Validate A/B 0..9999 and HP 0..100, and use
raw enemy member positions including hidden members. Enabled enemy conditions check
every member's Enemy reference. Disabled explicit actor/switch IDs may retain zero
or a missing target; names and command references retain ordinary resolution.

Omitting a Troop Event declaration produces exactly one default battle page. An
explicit `battlePage({ commands: [] })` has the same result. Treat nonblank-to-Blank
as a destructive Troop Event Reset; keep troop name, members and all other carrier
data unchanged. Two default pages and inactive nondefault values are nonblank.

Read this when choosing how to structure RPG Maker MV event behavior.

## Authoring Surface

Before writing a pattern, inspect nearby Definition Source for import style and available
helpers. Import DSL helpers from `rpgmaker-event-dsl` and match the local source style.

When a helper signature or supported pattern is uncertain, check the installed package
types, exported helpers, existing Definition Source, or decompiled output before writing
new source. Do not invent helpers from memory.

## State Ownership

Use self switches for one Map Event's local state, such as opened chests, one-time cutscenes, or a door unlocked only at that event.

Use switches for shared binary game state, such as a boss defeated, bridge repaired, or area unlocked.

Use variables for multi-step state, counters, puzzle values, and quest stages. Prefer a variable over many switches when the state is ordered or numeric.

Use event pages for persistent top-level state changes. Use `conditional(...)` inside a page for momentary checks.

## Common Patterns

NPC dialogue usually uses a Map Event with an action trigger. Use pages when dialogue changes by quest or story state. Use `showChoices(...)` when the player decides.

A one-time chest usually uses two pages: unopened page gives the reward and turns self switch A on; opened page is conditioned by self switch A and shows short "empty" feedback or no commands.

A locked door usually uses an action-triggered Map Event. Use `conditional(...)` when the door looks the same; use pages when it has a persistent opened or unlocked state. Use `transferPlayer(...)` for doors that move the player.

A quest NPC usually uses a variable for quest stage when there are more than two states. Check item, switch, or variable conditions before taking resources or granting rewards.

An autorun cutscene must turn off its autorun page with a switch or self switch before finishing. Use parallel only for behavior that should continue while the player can act.

A transfer point uses `playerTouch` for automatic floor movement and `action` for doors, stairs, and interactable entrances.

Define reusable command lists with `commonEvent({ id, name, trigger, commands,
switch? })`. Keep the explicit ID and exact name, including empty or duplicate
names. Use `callCommonEvent({ commonEvent: commonEventRef({ id }) })`; a name
reference resolves only when exactly one current Common Event has that name.
Autorun and parallel require a valid Switch reference. For none, an explicit switch
preserves its independent saved value; omission or explicit `undefined` writes saved
default 1. An explicit
reference still needs an existing System Switch slot or unique staged Switch name.
Common Events inherit the caller's runtime context. Choose self switches and
current-event selectors with that caller in mind; no context annotation or static
call graph is required.

Shopkeepers use `shopProcessing(...)`. Event-driven battles use `battleProcessing(...)` and record outcomes only when later events depend on them.

## DSL Command Selection

Use `showChoices({ choices: [{ text, commands, endMarker? }], defaultChoice?, cancel?, position?, background? })`
for 1–6 choices. Keep each choice's text and required `commands` together; empty
commands and empty or whitespace text are valid. `defaultChoice` accepts
`{ kind: "none" }` or `{ kind: "choice", index }` (default index 0). `cancel`
accepts `{ kind: "disabled" }`, `{ kind: "choice", index }` (default index 1),
or `{ kind: "branch", commands, endMarker? }`. Indices are zero-based integers
0–5. Preserve out-of-count saved indices and inspect their warnings; the default
cancel index remains 1 for a one-item list. Position is left/center/right
(default right); background is window/dim/transparent (default window).
Each choice and separate cancel body owns its `endMarker`, defaulting to
`"present"`. Preserve `"absent"` only for a nonempty body. Keep nested raw markers
with their own bodies. All choice and cancel commands retain ordinary reference
validation and the Workspace Script Command Gate.

Use `loop({ body: { commands: [...] } })` for repeated work and `breakLoop()`
inside its body to finish it. `body.commands` is required. The optional
`body.endMarker` defaults to `"present"`; use `"absent"` only when preserving
that saved state for a nonempty body. Empty bodies always have a marker. Keep
each nested body's marker with its owner. Check combined formal and raw output
so raw records neither duplicate the owning marker nor contradict its declared
absence.

Use `exitEventProcessing()` to end the current event interpreter. A called
Common Event can exit while its caller continues after
`callCommonEvent({ commonEvent: commonEventRef({ id }) })`.
Treat a Break Loop warning outside a Loop as actionable: MV can skip all
remaining commands while seeking Repeat Above. Loop child commands retain
ordinary reference validation and the Workspace Script Command Gate.

Use supported helpers for RPG Maker MV editor command families. Representative groups include message commands, flow control, game progression, party changes, system settings, movement, character commands, screen commands, audio and video, map commands, scene control, actor commands, enemy commands, advanced commands, and nested Set Movement Route commands.

Continuation commands are not standalone authoring units. Keep text continuations inside `showText(...)` or `showScrollingText(...)`, choice branches inside `showChoices(...)`, battle result branches inside `battleProcessing(...)`, shop goods inside `shopProcessing(...)`, script continuations inside `script(...)`, and move route command objects inside `setMovementRoute(...)`.

Use `setMovementRoute({ target, route: { commands: [...], repeat?, skippable?, wait?, terminator? } })`.
The shared Movement Route requires `commands`, even when empty, and defaults its
flags to true/false/false. Preserve a native nonterminal indent with
`savedShape: { indent: "null" }` or `{ indent: "zero" }`; absent is the default.
Use `terminator: { parameters: "absent" }` to preserve an M0 without the parameter
key; the default is an empty array. Let the parent produce the sole M0 and exact
505 mirrors. Keep route Script Inputs intentional under the Workspace's Script
Command Gate, including recognized raw routes.

For Page Autonomous Movement, use `movement: { type?, speed?, frequency?, route? }`
inside `page(...)`. Type is fixed/random/approach/custom and defaults to fixed; speed
is integer 1..6 and frequency is integer 1..5, both defaulting to 3. The saved route
uses the shared model and defaults to empty. Preserve it even when movement is not
custom; inactive saved scripts and switch references still receive validation.

Use reference helpers instead of bare numeric IDs when referring to project data. Prefer `{ id: number }` when identity is known; use `{ name: string }` only when the Display Name resolves unambiguously.

Switch and variable names resolve only from unique DSL declarations. Use explicit IDs
for unnamed System slots within the larger of Snapshot capacity and the highest DSL
declaration ID. A reference cannot expand capacity; removing a declaration clears its
name while retaining Snapshot capacity. Existing database IDs remain valid with empty
names. Author switch ranges in ascending order, including both endpoints, and give
`controlSwitches` and `controlSelfSwitch` an explicit Boolean `value`. Self-switch
letters are A–D; a Common Event called from a Map Event inherits the caller's identity.

Resolve fixed Animation, Tileset and Enemy targets against the captured Snapshot.
Use `pull` after database changes, then validate again; use explicit IDs for existing
empty-name targets. Enemy positions and dynamic equipment candidates keep their
Runtime Selector meaning even when a fixed project target cannot be inferred.

Use Asset Reference helpers for files, not Project Data Reference helpers. `audioAsset(...)`, `imageAsset(...)`, and `movieAsset(...)` are no-scan filename-stem references; they do not validate that a file exists on disk.

Use `script(...)` and `scriptInput(...)` for short RPG Maker MV JavaScript only when the Workspace Script Command Gate allows it and ordinary event commands are not enough. The Gate also checks Conditional Branch script conditions, Control Variables script operands, Set Movement Route script subcommands and mirrors, and saved Page routes in every movement mode. Empty and unreachable scripts still count. With the Gate closed, Decompile warns while generating source; Check and Compile reject current declarations containing scripts. Remove the actual scripts or enable the Gate deliberately before compiling.

Use `pluginCommand(...)` only when the plugin command is grounded in user intent, existing project usage, or plugin documentation. The DSL models MV's native plugin command string; plugin-specific argument schemas are outside this helper's validation boundary.

Use `rawDslCommand(...)` for a genuinely unknown command with a valid record envelope
and surrounding structure. Recognized native parameters and references retain their
normal validation; report malformed known commands instead of using raw as a fallback.
Keep raw parameters as strict JSON data. Preserve CR/CRLF, negative zero, null,
empty containers and own keys exactly. Do not use undefined, array holes, non-finite
numbers, accessors, custom prototypes or extra raw envelope fields. An explicit raw
indent of zero is absolute. Let formal owners generate their continuations and mirrors;
handwritten raw records must still form a valid complete structure.
Confirm code, parameters, and indentation from project data, Decompiled Source, nearby
examples, or reliable MV command mapping.
