---
status: accepted
---

# Preserve native saved state in the Map Event Page model

The Map Event Page model treats saved native configuration as part of the authored state, including disabled condition settings, routes retained outside custom Autonomous Movement, and image fields retained while another image mode is displayed. We chose independently expressible saved fields over an active-mode-only representation because removing inactive values changes later editing behavior and can lose observable event state; Compile must reconstruct them from DSL rather than inherit them from an old event.

Compiler Defaults are fixed values based on the native empty page. Compilation does not imitate editor interactions such as changing priority when a character image is selected, and decompilation may omit a field only when those fixed defaults reconstruct its saved value exactly.

Disabled Page Condition Slots may retain a nonnegative explicit saved ID without an existing target; name-based selections must still resolve uniquely. This narrow exception lets disabled selections outlive their targets and prevents empty-page placeholders from requiring unrelated declarations. Movement Routes remain reusable instruction objects and receive full reference validation and Script Command Gate checks even when saved outside custom Autonomous Movement.

The detailed schema and validation boundaries are recorded in [decision ticket 03](../../.scratch/complete-mv-events/issues/03-map-event-page-model.md). This decision covers the Map Event Page model; it does not settle the cross-domain unknown-data policy or supersede ADR 0003's decompilation contract, which [decision ticket 06](../../.scratch/complete-mv-events/issues/06-semantic-roundtrip-policy.md) must revisit separately.
