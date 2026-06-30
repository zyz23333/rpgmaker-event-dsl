# Event Patterns

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

Shopkeepers use `shopProcessing(...)`. Event-driven battles use `battleProcessing(...)` and record outcomes only when later events depend on them.

## DSL Command Selection

Use supported helpers for text, choices, conditionals, loops, labels, comments, common event calls, transfers, switches, variables, self switches, gold, items, waits, erase event, battle processing, and shop processing.

Use reference helpers instead of bare numeric IDs when referring to project data. Prefer `{ id: number }` when identity is known; use `{ name: string }` only when the Display Name resolves unambiguously.

Use `script(...)` for short RPG Maker MV JavaScript only when the Workspace Script Command Gate allows it and ordinary event commands are not enough.

Use `pluginCommand(...)` only when the plugin command is grounded in user intent, existing project usage, or plugin documentation.

Use `rawDslCommand(...)` only when no supported helper can express confirmed RPG Maker MV behavior. Confirm the command code, parameters, and indentation from project data, decompiled source, nearby examples, or reliable MV command mapping. Do not invent raw command shapes.
