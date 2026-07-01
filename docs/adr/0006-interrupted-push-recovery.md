---
status: accepted
---

# Interrupted Push recovery

We decided to treat an incomplete Project Root write during Push as an Interrupted Push instead of ordinary Project Drift. Push creates pending recovery state before replacing affected Project data files, including the affected file list, snapshot and generated hashes, and a snapshot-derived backup that is valid because Project Drift checks have already proven the affected Project Root files match the Project Data Snapshot.

Only Push may resolve a pending Interrupted Push. Non-Push workspace workflow commands stop while an Interrupted Push is pending, even when the Project Root currently matches either the generated state or the snapshot state, because completing or abandoning a Push is part of Push semantics and read-only commands must not hide Workspace Data State mutations. When Push observes all affected Project Root files in the generated state, it completes the interrupted synchronization by refreshing the affected Project Data Snapshot and Sync Manifest; when Push observes all affected files in the snapshot state, it abandons the interrupted synchronization and continues normal Push processing. Mixed, missing, or unknown Project Root file states are unrecoverable automatically in the first version and stop all workspace workflow commands until explicit restoration.

We rejected a separate recovery command for the first version because it would expand the public workflow surface before there is enough evidence that users need a manual recovery mode. We also rejected trusting per-file write progress in the pending state; recovery decisions are based on observed Project Root file contents so a crash between writing a file and recording progress cannot mislead the tool.
