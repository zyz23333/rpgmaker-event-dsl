---
status: accepted
---

# Technical architecture and toolchain

We decided that the implementation uses Node.js 22 LTS as the runtime compatibility baseline, TypeScript strict mode, ESM with NodeNext resolution, pnpm workspaces, commander for the CLI, zod for runtime schemas and validation, tsx for TypeScript DSL source loading, tsdown for builds, vitest for tests, oxlint for linting, and oxfmt for formatting.

The implementation lives in `packages/rmmv-event-dsl` so later slices can add DSL, compiler, validation, project loading, synchronization checks, workspace state, and output writing behind a stable package boundary. The public workflow command surface is workspace-oriented: `init`, `clone`, `pull`, `decompile`, `compile`, `diff`, and `push`; check-only compilation is the validation path.

Consequences:

- Later slices can assume Node.js 22, TypeScript strict mode, ESM / NodeNext, and pnpm.
- Later slices can use commander, zod, tsx, tsdown, vitest, oxlint, and oxfmt without reopening the core stack decision.
- `oxlint` and `oxfmt` are the default lint and format tools for the workspace.
- CLI, workspace state, compilation, diff, and push behavior should remain inside the package boundary rather than relying on external scripts.
