---
status: accepted
---

# Interrupted Push recovery

We decided to treat an incomplete Project Root write during Push as an Interrupted Push instead of ordinary Project Drift. Push creates pending recovery state before replacing affected Project data files, including the affected file list, snapshot and generated hashes, and a snapshot-derived backup that is valid because Project Drift checks have already proven the affected Project Root files match the Project Data Snapshot.

Only Push may resolve a pending Interrupted Push. Non-Push workspace workflow commands stop while an Interrupted Push is pending, even when the Project Root currently matches either the generated state or the snapshot state, because completing or abandoning a Push is part of Push semantics and read-only commands must not hide Workspace Data State mutations. When Push observes all affected Project Root files in the generated state, it completes the interrupted synchronization by refreshing the affected Project Data Snapshot and Sync Manifest; when Push observes all affected files in the snapshot state, it abandons the interrupted synchronization and continues normal Push processing. Mixed, missing, or unknown Project Root file states are unrecoverable automatically in the first version and stop all workspace workflow commands until explicit restoration.

We rejected a separate recovery command for the first version because it would expand the public workflow surface before there is enough evidence that users need a manual recovery mode. We also rejected trusting per-file write progress in the pending state; recovery decisions are based on observed Project Root file contents so a crash between writing a file and recording progress cannot mislead the tool.

[ADR 0013](0013-bind-generated-data-to-compilation-assumptions.md) refines this model with a Project Root Binding, full standard-input checks before and after replacements, and same-Workspace command mutual exclusion. An understood and internally consistent pending operation may finish recording writes under an older Compile Contract Version, but recovery preserves the original source, dependency, configuration, and contract basis while recording the snapshot effects of those writes. Ordinary freshness and drift checks still run before any new write; recovery cannot turn old output into a current compilation or authorize writes against newly changed external inputs.

Wrong target bindings, unknown pending formats, and inconsistent recovery evidence stop explicitly. Clearing a provably abandoned operation lock never clears pending recovery state. Post-write detection of external changes leaves an Interrupted Push for this same content-based recovery model; the checks do not promise atomic isolation from external editors or a project-wide rollback.
