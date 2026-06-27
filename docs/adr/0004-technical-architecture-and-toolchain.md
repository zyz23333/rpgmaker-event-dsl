---
status: accepted
---

# Technical architecture and toolchain

We decided that the first implementation uses Node.js 22 LTS as the runtime compatibility baseline, TypeScript strict mode, ESM with NodeNext resolution, pnpm workspaces, commander for the CLI, zod for runtime schemas and validation, tsx for TypeScript Event Definition loading, tsdown for builds, vitest for tests, oxlint for linting, and oxfmt for formatting.

The implementation lives in `packages/rmmv-event-dsl` so later slices can add DSL, compiler, validation, project loading, safety checks, and output writing behind a stable package boundary. The initial CLI command surface is limited to `lint`, `create`, and `replace`; those commands are placeholders until the workflow slices implement their behavior.

Consequences:

- Later slices can assume Node.js 22, TypeScript strict mode, ESM / NodeNext, and pnpm.
- Later slices can use commander, zod, tsx, tsdown, vitest, oxlint, and oxfmt without reopening the core stack decision.
- `oxlint` and `oxfmt` are the default lint and format tools for the workspace.
- The package boundary is established without implementing Event DSL semantics, project-aware validation, command compilation, or MV JSON writing in this decision slice.
