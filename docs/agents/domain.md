# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Layout

Single-context: one `GLOSSARY.md` and the shared `docs/adr/` directory at the repo root.

## Before exploring, read these

- **`GLOSSARY.md`** at the repo root for domain terms.
- **`docs/adr/`** for decisions that touch the area you're about to work in.

If either is absent, proceed silently. The `/domain-modeling` skill, reached via `/grill-with-docs` and `/improve-codebase-architecture`, creates domain documents lazily when terms or decisions are resolved.

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term defined in `GLOSSARY.md` and respect its avoided synonyms.

If a needed concept is absent, reconsider whether it fits the project language, or note the gap for `/domain-modeling`.

## Flag ADR conflicts

If your output contradicts an existing ADR, surface the conflict explicitly with the ADR number and the reason to reopen the decision.
