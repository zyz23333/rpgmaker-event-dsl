# Domain Docs

How engineering skills consume this repo's domain documentation.

## Before exploring, read these

- **`GLOSSARY.md`** at the repo root: canonical Event DSL, Workspace, Map Inspection, and Map Preview vocabulary, together with the existing domain relationships and constraints.
- **`docs/adr/`**: read the ADRs relevant to the area being explored.

If a domain document does not exist, proceed silently. The `/domain-modeling` skill, also used by `/grill-with-docs` and `/improve-codebase-architecture`, creates glossary entries and ADRs when terms or decisions are resolved.

## File structure

This repo uses a **single-context** layout. Its product package and example Workspace share one glossary and the root ADR directory.

```text
/
|-- GLOSSARY.md
|-- docs/adr/
|-- packages/rpgmaker-event-dsl/src/
`-- example/full-event/
```

## Use the glossary's vocabulary

When naming a domain concept in an issue, proposal, hypothesis, test, or implementation, use its definition in `GLOSSARY.md`, including the synonyms its `_Avoid_` notes rule out.

If a needed concept is missing, reconsider whether it belongs to the project's language. Record a real vocabulary gap for `/domain-modeling`.

Maintain domain vocabulary and its existing supporting relationships in `GLOSSARY.md`.

## Flag ADR conflicts

Surface a contradiction with an existing ADR explicitly, with the ADR's number, title, and the reason to reconsider its decision.
