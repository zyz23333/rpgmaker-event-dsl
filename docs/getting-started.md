# Getting started

[Documentation](README.md)

This guide follows the current repository version. It requires Windows, Node.js 22,
and an RPG Maker MV project with a `.rpgproject` file and a `data/` directory.
Workspace initialization does not create the RPG Maker project itself.

- [Use the current checkout](#use-the-current-checkout)
- [Create a Workspace](#create-a-workspace)
- [Start from an existing game](#start-from-an-existing-game)
- [Start with new event logic](#start-with-new-event-logic)
- [Check, compile and review](#check-compile-and-review)
- [Using a published package](#using-a-published-package)

## Use the current checkout

In the repository root, with pnpm 10.33.0 available:

```powershell
pnpm install --frozen-lockfile
pnpm --filter rpgmaker-event-dsl build
pnpm install --frozen-lockfile
```

The second install refreshes the example packages' executable links after the CLI
is built. Record the absolute path to `packages/rpgmaker-event-dsl` in this checkout;
the installation below uses `C:/path/to/rpgmaker-event-dsl/packages/rpgmaker-event-dsl`
as a placeholder for that path.

After changing the checkout's implementation, rebuild it before using the CLI in
your game Workspace. The source version, generated declarations and CLI should agree.

## Create a Workspace

Use a separate directory for Event DSL source. For example:

```text
MyGame/
  Game/               RPG Maker MV project
  EventWorkspace/     Event DSL source, config and local generated data
```

From `MyGame`, create the Workspace and install the built local package:

```powershell
mkdir EventWorkspace
cd EventWorkspace
npm init -y
npm pkg set type=module
npm install --save-dev "C:/path/to/rpgmaker-event-dsl/packages/rpgmaker-event-dsl"
npx rpgmaker-event-dsl init --project-root ../Game
npx rpgmaker-event-dsl clone
```

Replace the package path before running the install. `init` creates
`rpgmaker-event-dsl.config.json` and the default `src/`; `clone` captures a Project
Data Snapshot without changing the game. Run subsequent commands from this Workspace.
The source package uses ESM (`"type": "module"`).

## Start from an existing game

Before adding declarations, import the project's existing owned data:

```powershell
npx rpgmaker-event-dsl decompile
```

Edit the resulting files under `src/decompiled/`. Keep the declarations you intend
to retain: compilation describes complete owned domains. Omitting an existing Map
or Common Event can request its removal; omitting a nonblank Troop Event requests
its reset. Changes to switch and variable declarations also affect their names.

Decompile publishes a new directory and does not overwrite or merge existing source.
`src/decompiled/` must be absent, including an empty directory, and existing discovered
declarations must not conflict with imported identities. For publication details,
scripts and unsupported native commands, see [Decompile publication](workflow.md#decompile-publication).

## Start with new event logic

Use this path when the project has no event logic you need to retain. After Clone,
create `src/intro.events.ts`:

```ts
import { commonEvent, showText } from "rpgmaker-event-dsl";

export const intro = commonEvent({
  id: 1,
  name: "Introduction",
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
```

This declares Common Event 1. A `none` trigger means it runs when called; it does
not automatically start on a map. Use `callCommonEvent(...)` from a Map Event or
configure the call in the MV editor to try it in the game. Choose an unused ID when
adding it to existing imported declarations.

The default source discovery includes `**/*.events.ts` and `**/*.dsl.ts` under
`src/`. See [authoring](authoring.md) for references, shared modules and functions.

## Check, compile and review

After editing source:

```powershell
npx rpgmaker-event-dsl compile --check
npx rpgmaker-event-dsl compile
npx rpgmaker-event-dsl diff
```

Check validates without publishing output. Compile writes Generated Project Data
inside the Workspace. Read Diff before applying the result:

```powershell
npx rpgmaker-event-dsl push
```

Only Push writes to the game project. It requires fresh generated data and no
Project Drift, and checks current selected assets. Review any destructive changes
before explicitly allowing them; see the [workflow guide](workflow.md).

If you edit project data in RPG Maker MV, use Pull to refresh the Snapshot, reconcile
any affected DSL declarations, then Compile and review Diff again. Pull does not
merge editor changes into source.

## Using a published package

For a released version, install from npm in an ESM Workspace:

```powershell
npm install --save-dev rpgmaker-event-dsl
npx rpgmaker-event-dsl --version
```

Follow that release's bundled README and CHANGELOG. These repository guides and
examples may use unreleased APIs; the version in a checkout's `package.json` alone
does not prove those APIs are available on npm. Use the local checkout setup above
when following this version of the guide.
