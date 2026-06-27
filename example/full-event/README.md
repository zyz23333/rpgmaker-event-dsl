# Full Event Example Workspace

This directory is a repository fixture that mirrors a Workspace layout.

Usage:

1. Copy `rmmv-event-dsl.config.template.json` to `rmmv-event-dsl.config.json`.
2. Keep the live config out of git.
3. Update the live config only if your local RPG Maker MV test project moves.

The template intentionally omits a concrete local path. The live config is expected to point `projectRoot` at `../../references/rmmv-test-project` in this repository layout, or at a local equivalent if you are working from a different checkout.
