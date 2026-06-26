---
name: to-design
description: Turn the current conversation context and local PRD into a change design document for complex or high-risk work inside .scratch/<change-slug>/<change-slug>-design.md.
---

This skill takes the current conversation context, codebase understanding, and
an optional local PRD, then produces a change design document. Do not publish
issues, plan implementation slices, or create slice files here.

If a question can be answered by exploring the codebase, explore the codebase
instead of asking the user. Only ask when a decision is genuinely unresolved.

## Process

1. Explore the repo to understand the current state of the codebase. Read the
   local PRD if present, plus `CONTEXT.md`, ADRs, and any referenced source
   files.
2. Determine or confirm the `change-slug`. The design file must live at
   `.scratch/<change-slug>/<change-slug>-design.md`.
3. Identify which conditional design modules apply for this change.
4. Identify the testing seams for the change from the local PRD if present, or
   from the current conversation and codebase context otherwise. Prefer
   existing high-level seams over new ones. If a proposed seam is not viable,
   record why and choose the highest practical alternative.
5. Write or update the design using the template below. If the file already
   exists, update it in place instead of creating a parallel version.
6. Self-review the document for missing decisions, stale terminology, internal
   contradictions, unsupported assumptions, and incomplete `Completion
   Contract`.
7. Report the path to the written design and the recommended next skill.

## Design Template

<design-template>

# <Change Name> Design

## Status

Draft | Accepted | Superseded

## Change Slug

`<change-slug>`

## Context

Current situation, relevant docs, related ADRs, existing implementation, and
why this design is being written now.

## Problem

What is wrong, missing, ambiguous, unsafe, expensive, or hard to change today.

## Goals

What this change must accomplish.

## Non-Goals

What this change explicitly will not solve.

## Scope

### In

Included areas, affected modules, affected users, and affected systems.

### Out

Excluded areas and why they are excluded.

## Canonical References

Documents, ADRs, source files, or dependency sources downstream agents must
read before planning or implementing.

## Current Behavior

How the system behaves today.

## Target Behavior

What must be true after this change.

## Requirements / Behavior Changes

| ID | Current | Target | Acceptance |
| --- | --- | --- | --- |

## Locked Decisions

Decisions already made and no longer open for agent discretion.

## Agent Discretion

Areas where implementation agents may choose details without asking again.

## Invariants

Rules that must remain true across implementation, retries, refactors, and
future changes.

## Design

The proposed shape of the change: responsibilities, boundaries, data flow,
control flow, user flow, or system flow depending on the change type.

## Conditional Modules

Only include modules that apply to this change.

### UX / Product Behavior

Use when the change affects user-visible behavior, product workflow, UI copy,
states, permissions experience, or operator experience.

### Domain Model

Use when the change affects domain terms, business entities, state machines, or
semantic boundaries.

### API / Contract Changes

Use when routes, DTOs, response envelopes, error semantics, shared types, or
public contracts change.

### Data Model / Persistence

Use when tables, columns, indexes, constraints, migrations, persisted JSON, or
data repair are affected.

### Execution / Concurrency Semantics

Use when workflow execution, queueing, transactions, replay, retries, locking,
or idempotency are affected.

### Side Effects / Integrations

Use when third-party APIs, file/object storage, payment systems, email,
webhooks, queues, analytics, or other external systems are affected.

### Frontend State / Interaction Model

Use when client state, server state, cache behavior, optimistic updates, or
multi-step frontend interaction changes.

### Security / Privacy / Money

Use when authentication, authorization, identity, user or tenant isolation,
sensitive data, billing, payments, refunds, or financial settlement are
affected.

### AI / ML / Automation Behavior

Use when model or provider selection, prompt or policy contracts, structured
outputs, evaluation, guardrails, routing, cost/latency budgets, or monitoring
are affected.

### Observability / Operations

Use when logs, metrics, diagnostics, operator repair, or admin visibility are
affected.

### Research / Dependency Findings

Use when the implementation depends on library behavior, version constraints,
or framework conventions.

### Rollout / Migration / Cleanup

Use when breaking migration, compatibility, temporary code paths, flags, or old
path removal are affected.

## Phase Slices

Reserved for `to-slices`. Do not fill this section in `to-design`.

| Phase | Goal | Depends On | Requirements | Success Criteria | Slice Candidates |
| --- | --- | --- | --- | --- | --- |

## Completion Contract

### Observable Truths

- [ ] OT-01:

### Required Design Outcomes

- [ ] OUT-01:

### Required Canonical Updates

- [ ] DOC-01:

## Test Strategy

Behavior, boundary, integration, failure-path, and regression tests required
for this change.

Include:

- The highest practical seams where the change should be tested
- Existing seams or prior tests that should be reused
- New seams required by the design, with justification
- Behavior and boundary cases that must be covered
- Integration or failure-path tests required by external systems, persistence,
  concurrency, security, or migrations
- What should deliberately not be tested at this layer

## Deferred Ideas

Ideas discussed but explicitly out of scope for this change.

## Open Questions

Only true unresolved blockers or decisions that must be made before
implementation.

</design-template>

## Output Rules

- If the target directory does not exist, create it.
- If the file already exists, read it first and preserve still-valid content.
- Keep the design authoritative and decision-rich.
- Keep `Phase Slices` present, but leave it reserved for `to-slices`.
- Do not draft implementation phases, task plans, slice candidates,
  file-by-file plans, verification commands, or executable slice files.
- Use code exploration to understand current behavior and constraints, not to
  plan execution.
- Leave implementation planning, dependency ordering, and executable slice
  creation to `to-slices`.
- Do not publish to any issue tracker.
