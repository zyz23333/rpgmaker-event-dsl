---
status: accepted
---

# Bind generated data to its compilation assumptions

Push checks live Project Drift across the complete Standard Project Data Snapshot file set, even when it would write no files. This deliberately replaces the previous affected-files-only behavior: an external Enemy, tileset, or other standard input can invalidate an event's compiled references without itself being written. We choose the fixed standard database files and all maps registered by the captured MapInfos over a precise per-reference dependency set, accepting conservative rejection of unrelated changes within those inputs. Non-standard files and unregistered maps remain outside the set. Actual writes and recovery backups still cover only Affected Project Data Files; the check does not expand DSL ownership or authorize live merging.

Compile Baseline includes the tool-maintained Compile Contract Version, the Project Root Binding, and actual source validation dependencies in addition to source, configuration, and snapshot inputs. Changes to generated semantics, validation rules, Compiler Defaults, or the tool's own DSL types invalidate old output through the contract version; changes to external type dependencies invalidate it through recorded input content. This avoids treating data compiled or checked under obsolete assumptions as fresh without expanding ordinary value imports or executing event JavaScript.

Snapshot, compilation, and pending Push state retain the normalized target Project Root path. An explicit Pull may establish a different target binding when no Interrupted Push is pending, invalidating old generated state. A pending operation must first be resolved against its original target. An understood and internally consistent pending operation may finish recording an old contract's completed writes, but recovery preserves that contract version and cannot authorize a new write under the current contract. Unknown pending formats or inconsistent recovery evidence stop explicitly; no compatibility migration is introduced.

Compile validates complete emitted data in both normal and check-only modes. Validation failure publishes nothing; publication I/O failure may invalidate local generated data and metadata, which Diff and Push must reject until a successful Compile. We do not require preservation of the last usable Compile Output through every publication failure, and this does not weaken Project Root write checks or the Interrupted Push distinction in ADR 0006.

The captured inputs used for validation, generation, and hashes must agree. An observed input-set, content, or configuration change before publication fails the operation and requires a rerun, rather than silently retrying part of it. Commands in the same Workspace are mutually exclusive, including read-only checks and Diff; contention fails immediately rather than queuing. Lock cleanup requires evidence that the owner is gone and never clears an Interrupted Push. These rules protect the local workflow without adding cross-Workspace or cross-machine coordination.

Push checks the complete standard file set before the first replacement, checks each affected file's expected old contents at replacement, and checks the complete set again before refreshing synchronization metadata. The final expected state is generated content for written files and the original snapshot content for all others. A detected change before writing prevents writes; after writing has begun it leaves an Interrupted Push instead of silently absorbing external edits or rolling back the entire project. Understood recovery may record already completed writes, after which ordinary drift and freshness checks still prohibit new writes against changed assumptions. These are explicit check points, not a guarantee that an external editor cannot save after the last check or that the project is atomically isolated throughout Push.

The complete contract was confirmed on 2026-10-18 in [the Workspace integration decision](../../.scratch/complete-mv-events/issues/07-workspace-domain-integration.md#answer). This refines ADR 0003 and ADR 0006 without claiming implementation or execution of the planned safety checks.

The implementation owns Compile Contract Version in one internal constant,
`src/workspace/type-inputs.ts`. Every later change to DSL types, validation, Compiler
Defaults or generated semantics must update that value relative to the current
integration version. Parallel tickets must reconcile their versions at integration;
two independent changes choosing the same next value cannot make old output current.
The version is tool-maintained rather than inferred from Git state or runtime source
hashes. Recorded TypeScript reads and resolution lookups supplement the version and
include missing candidates and directory sets, so unchanged previously loaded files
alone do not establish freshness.
