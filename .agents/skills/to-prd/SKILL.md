---
name: to-prd
description: Turn the current conversation context into a local PRD inside .scratch/<change-slug>/<change-slug>-prd.md. Use when you want to capture domain and user intent before a design.
---

This skill takes the current conversation context and codebase understanding and
produces a local PRD. Do NOT interview the user - just synthesize what you
already know.

If the `change-slug` is ambiguous, infer the best candidate and ask only if it
is still unclear after checking the conversation and repository context.

## Process

1. Explore the repo to understand the current state of the codebase, if you
   haven't already. Use the project's domain glossary vocabulary throughout the
   PRD, and respect any ADRs in the area you're touching.
2. Determine the `change-slug` and target path. The file must live at
   `.scratch/<change-slug>/<change-slug>-prd.md`.
3. Sketch out the seams at which you're going to test the feature. Existing
   seams should be preferred to new ones. Use the highest seam possible. If new
   seams are needed, propose them at the highest point you can.

   Check with the user that these seams match their expectations.
4. Write or update the PRD using the template below. If the file already
   exists, read it first and preserve still-valid content.
5. Do not publish to an issue tracker and do not apply any triage label. This
   artifact is local and optional.

<prd-template>

# <Change Name> PRD

## Change Slug

`<change-slug>`

## Problem Statement

The problem that the user is facing, from the user's perspective.

## Solution

The solution to the problem, from the user's perspective.

## User Stories

A LONG, numbered list of user stories. Each user story should be in the format
of:

1. As an <actor>, I want a <feature>, so that <benefit>

This list of user stories should be extensive enough to cover the intended
product or domain behavior, but avoid padding with low-value variants.

## Implementation Decisions

A list of implementation decisions that were made. This can include:

- The modules that will be built/modified
- The interfaces of those modules that will be modified
- Technical clarifications from the developer
- Architectural decisions
- Schema changes
- API contracts
- Specific interactions

Do NOT include specific file paths or code snippets. They may end up being
outdated very quickly.

Exception: if a prototype produced a snippet that encodes a decision more
precisely than prose can (state machine, reducer, schema, type shape), inline
it within the relevant decision and note briefly that it came from a prototype.
Trim to the decision-rich parts - not a working demo, just the important bits.

## Testing Decisions

A list of testing decisions that were made. Include:

- A description of what makes a good test (only test external behavior, not
  implementation details)
- The highest practical seams where the feature should be tested
- Which modules will be tested
- Prior art for the tests (i.e. similar types of tests in the codebase)

## Out of Scope

A description of the things that are out of scope for this PRD.

## Further Notes

Any further notes about the feature.

</prd-template>

## Output Rules

- If the target directory does not exist, create it.
- If the file already exists, read it first and preserve still-valid content.
- Keep the PRD at the level of user, domain, and product intent.
- Leave implementation authority to `to-design`.
- Use concise, decision-rich prose rather than filler.
