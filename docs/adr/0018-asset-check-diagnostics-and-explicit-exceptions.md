---
status: accepted
---

# Keep asset-check findings explicit while allowing narrow authoring exceptions

Compile, Compile Check and Push apply the same asset policy. Confirmed missing paths, case mismatches and wrong types block ordinary explicit uses and warn for explicitly inactive saved configuration. Unsupported names, asset-path links and encrypted modes also warn for inactive settings with explicit unchecked coverage; ordinary uses still error. Necessary field/reference failures, inaccessible metadata and an inconclusive individual query remain errors. Existing structure validation and the Script Command Gate are unchanged. Initial/default candidate checks are deferred under [ADR 0016](0016-event-rooted-asset-use-coverage.md).

An Asset Check Exception applies to one exact namespace and original name, with a required reason, and can downgrade only confirmed missing-path, case-mismatch or wrong-type errors. It retains facts, reasons and every event-local use. Unsupported forms cannot be waived. No global off switch, global warning mode, wildcard or location-specific exception is added. Invalid or duplicate entries fail configuration validation. Legal exceptions that do not downgrade an error are accepted without an additional warning or automatic cleanup; they do not expand the scan.

Grouped presentation retains all definition locations, local dependency chains, relevant inactive/execution conditions and exception reasons. Groups take the highest effective severity; querying one file once must not erase its other origins. Exact parallel counts of problem groups, distinct files and affected uses are deferred, as are Common Event caller reports. Stable diagnostic identifiers, actionable locations and deterministic ordering remain required.

Independent safe checks continue after errors. Operation success does not certify unchecked coverage: a selected dynamic stop or unsupported-form warning identifies what was not checked. An actual query failure still blocks. An item disappearing between enumeration and metadata inspection is an inconclusive query, not proven stable absence. Compile errors prevent publication, Check is read-only, and Push checks before writing without making later asset changes a recovery condition.

On 2026-11-02 the user requested this further first-release reduction. It removes initial/default-candidate policy branches, caller reporting, three-way exact statistics and ineffective-exception warnings; malformed/duplicate exception checks and policy inclusion in Compile Baseline remain. The 2026-10-25 simplifications of unsupported inactive settings and single workflow gates remain in force. The current detailed contract is [ticket 04](https://github.com/zyz23333/rpgmaker-event-dsl/blob/98ad17b61371e349e09719009204e29264b16f1b/.scratch/asset-validation/issues/04-asset-diagnostics-and-policy.md#answer). No product implementation or executed acceptance is claimed.
