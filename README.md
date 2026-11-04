# RPG Maker Event DSL

**Make RPG Maker game development easier for AI agents.**

RPG Maker Event DSL gives agents a code-based way to understand, create and change
RPG Maker MV event logic. You describe the gameplay you want; the agent works on
readable source files, and the tool turns those changes into normal RPG Maker events.

The aim is to make it practical for an agent to take over more of the event work in
an existing game, or help build a new one: dialogue, quests, choices, treasure chests,
shops, cutscenes and battle events.

[Get started](docs/getting-started.md) · [Documentation](docs/README.md) ·
[Examples](example/shared-authoring/README.md)

## Why this project exists

RPG Maker's visual editor is designed for people. Asking an agent to operate it means
repeatedly navigating maps, opening event pages, selecting commands and filling in
dialogs. Even a small gameplay change can involve many UI interactions, and repeating
that change across a game adds more work.

Agents are much better suited to reading and editing code. This project gives them
that interface through a DSL: a readable code format for describing RPG Maker events.
An agent can search the game's event logic, change related events together, reuse
common behavior and check its work without navigating the editor for every change.

For example, you could ask an agent to add a chest that requires a key, gives a reward
only once and displays different text after it has been opened. The agent can express
those rules in source, then adapt the same pattern for other chests. You can review
what changed before applying it to the game.

This makes event development a better fit for the way coding agents work:

- **Understand existing logic.** Read and search events across the project instead
  of inspecting each event through editor windows.
- **Make coordinated changes.** Update dialogue, conditions and rewards across related
  events in one editing task.
- **Reuse working behavior.** Share recurring event patterns so later changes stay
  consistent.
- **Review the result.** Inspect source changes and generated event changes before
  writing them back to the project.

## Working with an agent

1. **Bring in your existing events.** The tool can turn supported MV event data into
   editable source, giving the agent a starting point in your current game.
2. **Describe the gameplay change.** The agent writes or updates event code based on
   your intent and the project's existing logic.
3. **Check and review.** The tool checks the event data, references and selected asset
   files, then shows what would change in the game.
4. **Apply and playtest.** Apply the reviewed changes and try them in RPG Maker MV.

You can keep using the native editor for visual map work, database editing and
playtesting. The generated events remain normal RPG Maker data. When you edit game
logic in the editor, bring those changes back into the source workflow before the
agent continues.

The game project is only written when you explicitly apply changes. Imported source
also describes the events to retain, so removing declarations can remove or reset
existing events. The [workflow guide](docs/workflow.md) explains review and recovery.

## What the agent writes

Inside an event, a message looks like this:

```ts
showText({
  lines: ["The chest is empty. You already took the reward."],
  face: { image: null, index: 0 },
  background: "window",
  position: "bottom",
});
```

Choices, conditions, movement, items and battle commands follow the same readable
style. The agent combines them into complete events and can share repeated behavior
between source files. See the [authoring guide](docs/authoring.md) for complete examples.

## Get started

The current version supports **Windows and RPG Maker MV 1.6.1**. Development is still
active, and the source format and tools may change before 1.0.

Follow the [setup guide](docs/getting-started.md) to install the tool and import an
existing game or start writing new events. It includes the Node.js 22 requirement
and the build steps for this checkout. Repository examples may use features that
have not yet been published to npm.

The [shared authoring sample](example/shared-authoring/README.md) walks through a
small complete workflow. The [full-event example](example/full-event/README.md)
shows a broader set of event commands and requires matching game data and assets.

## Agent Event Authoring Skill

The included [rpgmaker-event-authoring skill](skills/rpgmaker-event-authoring/SKILL.md)
teaches an agent how to turn gameplay requests into event code, work with an existing
project, check changes and prepare them for review.

Install it for your agent with:

```powershell
npx skills add https://github.com/zyz23333/rpgmaker-event-dsl/skills --skill rpgmaker-event-authoring
```

The skill provides instructions; the DSL tool itself is installed separately using
the setup guide above.

## Learn more

- [Documentation index](docs/README.md): setup, authoring, workflow and reference guides.
- [Command reference](docs/reference/commands/README.md): supported event commands and their options.
- [Changelog](CHANGELOG.md): recent changes and release history.
- [Project maintenance](docs/README.md#project-maintenance): development checks and design decisions.

## License

The repository's original source and the published package use the MIT License.
See [LICENSE](LICENSE) and the [package license](packages/rpgmaker-event-dsl/LICENSE).
