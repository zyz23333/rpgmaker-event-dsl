---
status: accepted
---

# Publish decompiled source as a complete directory

Decompile constructs and validates its entire candidate source batch in an isolation area that Definition Source Discovery always excludes, then publishes the complete batch in one directory operation to `sourceRoot/decompiled/`. The entire destination must be absent, even if an existing directory is empty. We choose this stricter boundary over merging files or creating numbered batches because partial discovery of a failed takeover could otherwise look like intentional removal or reset of omitted owned events. Temporary naming and user exclude patterns alone are not isolation guarantees; path aliases must not make a partial batch discoverable.

Before publication, the actual Discovery rules must include every candidate file, and candidate Entry Identities must not collide with existing discovered declarations. If existing source cannot be parsed or evaluated sufficiently to identify declarations, publication fails with a diagnostic. This check does not use existing definitions to repair candidate references or run full validation of existing events; in particular, a closed Script Command Gate does not prohibit accurate decompilation. Candidate expressibility and determinable fixed references still follow ADR 0012.

Validation uses the candidate's final publication location for dependency resolution. Relevant inputs and Discovery configuration are captured consistently and rechecked before publication; observed changes fail without automatic retry. Same-Workspace commands are mutually exclusive, and the final publication must still refuse a destination created by an external actor after the initial absence check. If the filesystem or path arrangement cannot guarantee isolation and a single complete publication, Decompile fails before publishing instead of falling back to a file-by-file copy.

Failure preserves original user source and Snapshot. Isolated remnants remain undiscoverable and only positively identified tool-owned temporary content may be cleaned. If the complete directory was published before the process failed to report success, a retry reports the existing destination rather than removing or merging it. We accept explicit user handling of an existing destination instead of introducing overwrite, append, or publication-recovery modes.

The complete contract was confirmed on 2026-10-18 in [the Workspace integration decision](../../.scratch/complete-mv-events/issues/07-workspace-domain-integration.md#answer). This supplies the publication mechanism required by ADR 0012 without claiming that it has been implemented or fault-tested.
