# RPG Maker Event DSL

RPG Maker Event DSL lets you write supported RPG Maker MV game logic as TypeScript code
and compile it back into RPG Maker MV project data.

The package provides:

- A TypeScript DSL for supported switches, variables, common events, map events, pages,
  references, assets, and RPG Maker MV event commands.
- A CLI for snapshot-based workflows: `init`, `clone`, `pull`, `decompile`, `compile`,
  `diff`, and `push`.
- Safety checks for generated freshness, project drift, and reviewed destructive changes.

This project is in early development. The TypeScript API, DSL syntax, CLI workflow,
generated output, and workspace format may change before `1.0.0`.

## Install

```bash
npm install --save-dev rpgmaker-event-dsl
```

## Basic Workflow

Create a DSL workspace next to an RPG Maker MV project:

```bash
rpgmaker-event-dsl init --project-root ../Game
rpgmaker-event-dsl clone
```

If you already have event data in the RPG Maker MV project, generate starter DSL source:

```bash
rpgmaker-event-dsl decompile
```

After editing DSL source, validate, compile, review, and push:

```bash
rpgmaker-event-dsl compile --check
rpgmaker-event-dsl compile
rpgmaker-event-dsl diff
rpgmaker-event-dsl push
```

## Example

```ts
import { commonEvent, showText, switchDefinition } from "rpgmaker-event-dsl";

export const hasKey = switchDefinition({
  id: 1,
  name: "Has Key",
});

export const introCommonEvent = commonEvent({
  id: 1,
  name: "Intro",
  trigger: "none",
  commands: [showText({ lines: ["Welcome."] })],
});
```

See the repository README for the full workflow, safety model, command coverage, and
example project:

https://github.com/zyz23333/rpgmaker-event-dsl

## License

MIT
