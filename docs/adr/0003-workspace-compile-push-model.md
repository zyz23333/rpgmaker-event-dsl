---
status: accepted
---

# Workspace compile and push model

We decided to use a workspace-level `clone` / `pull` / `decompile` / `compile` / `diff` / `push` model. The Event DSL produces complete Compile Output for DSL-Owned Project Data inside Workspace Data State, and Project Root writes happen only through Push after Generated Freshness and Project Drift checks pass.

`create`, `replace`, and standalone `lint` are not primary user-facing operation modes. Any create, update, or removal classification is derived from differences between Generated Project Data and the Project Data Snapshot, and check-only compilation is the validation path.

Consequences:

- **Clone** captures the first Project Data Snapshot.
- **Pull** refreshes an existing Project Data Snapshot and does not run Diff.
- **DSL Decompilation** creates Decompiled Source from a Project Data Snapshot as a non-destructive, best-effort starting point.
- **Compile** validates the Staged Data Graph and writes Generated Project Data, but it does not mutate the Project Data Snapshot or Project Root.
- **Diff** compares Generated Project Data with the Project Data Snapshot and emits a Structured Diff Report.
- **Push** writes Generated Project Data to the Project Root only when Generated Freshness and Project Drift checks pass.
- A successful Push refreshes the affected Project Data Snapshot and Sync Manifest.
- **Destructive Push** is allowed only through an explicit destructive option and still does not bypass Generated Freshness or Project Drift checks.
- Project Data Snapshots and Generated Project Data may store whole MV data files, but DSL ownership is still defined by Data Domain rather than by file.
