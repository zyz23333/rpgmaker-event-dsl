---
status: accepted
---

# Workspace compile and push model

We decided to use a workspace-level `clone` / `pull` / `decompile` / `compile` / `diff` / `push` model. The Event DSL produces complete Compile Output for DSL-Owned Project Data inside Workspace Data State, and Project Root writes happen only through Push after Generated Freshness and Project Drift checks pass.

`create`, `replace`, and standalone `lint` are not primary user-facing operation modes. Any create, update, or removal classification is derived from differences between Generated Project Data and the Project Data Snapshot, and check-only compilation is the validation path.

Consequences:

- **Clone** captures the first Project Data Snapshot.
- **Pull** refreshes an existing Project Data Snapshot and does not run Diff.
- **DSL Decompilation** creates Decompiled Source from a Project Data Snapshot non-destructively. [ADR 0012](0012-event-saved-state-roundtrip-boundary.md) tightens the former best-effort contract within the supported native event scope: unchanged source must reconstruct saved event structure and values when configuration, reference, and synchronization requirements are satisfied. Unsupported data is explicitly preserved under the agreed unknown-command rules or rejected; failed decompilation must not expose partial new source as a complete takeover.
- **Compile** validates the Staged Data Graph and writes Generated Project Data, but it does not mutate the Project Data Snapshot or Project Root.
- **Diff** compares Generated Project Data with the Project Data Snapshot and emits a Structured Diff Report.
- **Push** writes Generated Project Data to the bound Project Root only when Generated Freshness and Project Drift checks pass. [ADR 0013](0013-bind-generated-data-to-compilation-assumptions.md) extends drift protection to the complete Standard Project Data Snapshot file set, including no-op Push, while actual writes remain limited to Affected Project Data Files; it also defines Compile Contract Version, validation dependencies, target binding, and operation concurrency boundaries.
- A successful Push refreshes the affected Project Data Snapshot and Sync Manifest.
- **Destructive Push** is allowed only through an explicit destructive option and still does not bypass Generated Freshness or Project Drift checks.
- Project Data Snapshots and Generated Project Data may store whole MV data files, but DSL ownership is still defined by Data Domain rather than by file.
- [ADR 0010](0010-troop-event-ownership-and-reset.md) extends Destructive Change to a Troop Event Reset: a nonblank event becomes a Blank Troop Event while its containing troop remains external project data. The same synchronization and destructive Push gates apply.
- [ADR 0014](0014-publish-decompiled-source-as-a-complete-directory.md) specifies the publication boundary required by ADR 0012: validate a complete isolated candidate batch, verify full source discovery and identity compatibility, then publish one previously absent directory without overwriting existing source. This is an accepted design, not a claim of implemented behavior.
