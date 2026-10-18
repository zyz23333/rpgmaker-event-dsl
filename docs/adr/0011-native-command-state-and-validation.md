---
status: accepted
---

# Preserve native command state while separating validation from execution guarantees

The formal Event DSL models native command parameters and saved structures, including empty branches, significant plugin-command whitespace, and saved choice positions that exceed the current number of choices. Parent commands own their continuation records and editor mirrors. Compilation preserves explicitly authored state and uses documented fixed defaults; it does not imitate editing actions that trim, replace, or discard saved values. This makes the command contract suitable for both deliberate authoring and native data takeover.

We distinguish malformed command input and unresolved Project Data References from uncertain runtime behavior. Invalid shapes, mutually exclusive parameters, confirmed value-range violations, missing project targets, and disallowed Script Input fail validation. Supported native commands remain expressible when their visible context suggests they will do nothing, select no object, or stall; those cases produce specific warnings. We do not require Common Event context declarations or whole-program call analysis, because definition location does not determine every later runtime context. The stricter enabled Battle Page Condition rules in ADR 0010 remain page-condition rules, not implicit restrictions on all command selectors.

An unnamed System Variable Slot or System Switch Slot remains addressable by explicit ID within the generated system capacity. A reference does not create a slot or restore a snapshot name. This clarifies ADR 0004's name-removal behavior without changing Definition identity or domain ownership.

Native absence is represented at the command parameter that supports it, with a field-specific encoding and with independent saved settings retained. It is not an empty-named Asset Reference, a universal stop or erase operation, or permission for unresolved project references. Change Equipment uses a Runtime Selector for its equipment ID because the actor's slot determines the database category at execution time; freezing that category from initial project data would change the native command's meaning.

This choice preserves state that a cleaner authoring-only model might discard, while accepting that validation cannot prove execution will succeed. Formal authoring still has explicit parameter ranges and structural requirements; runtime tolerance alone does not establish support. The full command inventory requires a [parameter evidence table](../../.scratch/complete-mv-events/issues/11-native-command-parameter-evidence.md) before the implementation specification is complete, and representative editor and game checks remain separate evidence.

The detailed decisions are recorded in [原生指令的完整参数与结构应如何表达和校验](../../.scratch/complete-mv-events/issues/05-native-command-contract.md#answer). The user confirmed the complete contract and its completion boundary on 2026-10-18. This decision does not settle [语义无损往返与未知数据处理的精确契约是什么](../../.scratch/complete-mv-events/issues/06-semantic-roundtrip-policy.md)'s treatment of unknown or noncanonical input, nor does it claim that the product or native-editor checks have been completed. Implementation retains ADR 0008's command-family ownership.
