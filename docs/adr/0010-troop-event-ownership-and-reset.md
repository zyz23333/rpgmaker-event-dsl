---
status: accepted
---

# Own troop event pages while preserving their containing troops

The Troop Event Data Domain is owned as a whole, with one complete ordered page list identified by the existing containing troop's explicit ID. The troop itself, its name, members, and other non-event carrier data remain external project data carried from the Project Data Snapshot; this prevents event authoring from silently acquiring ownership of troop composition and preserves [ADR 0003](0003-workspace-compile-push-model.md)'s domain boundary and [ADR 0004](0004-explicit-mv-id-entry-identity.md)'s identity principle.

We chose a single page in its exact native default saved state as the Blank Troop Event. An omitted definition and an explicit blank definition both produce this state, rather than inheriting old pages, deleting the troop, or emitting zero pages, because the native editor's normal operations retain at least one battle page and zero-page editor round trips have not been verified. Battle Event Pages have no independent IDs, so deleting individual pages preserves the remaining sequence without null holes.

A transition from a nonblank event to a Blank Troop Event is a Troop Event Reset and explicitly extends Destructive Change beyond removal of a Snapshot-Only Owned Entry. Classification depends on snapshot and generated content, so explicitly writing a blank event cannot bypass the destructive Push gate; an already blank event is unchanged, and edits that leave a nonblank event remain ordinary content changes. Reset does not bypass Generated Freshness, Project Drift, or Interrupted Push handling. ADR 0004's null-hole rule applies to Map/Common Event ID arrays, not to battle pages or their containing troops.

Saved disabled conditions remain authored state, using fixed native page defaults rather than inheritance. Empty runtime behavior is insufficient to identify a Blank Troop Event: every saved field and the command list must match the default state. The detailed schema, reference exceptions, positional member validation, decompilation rules, and follow-up boundaries are recorded in [decision ticket 04](../../.scratch/complete-mv-events/issues/04-troop-event-ownership.md#answer).

This decision does not settle the cross-domain unknown-data policy assigned to [ticket 06](../../.scratch/complete-mv-events/issues/06-semantic-roundtrip-policy.md). [Ticket 07](../../.scratch/complete-mv-events/issues/07-workspace-domain-integration.md) and [ticket 08](../../.scratch/complete-mv-events/issues/08-completion-evidence-and-sequencing.md) continue the Workspace integration and acceptance design; accepting this ADR does not claim that those features or editor/game checks have been implemented or executed.
