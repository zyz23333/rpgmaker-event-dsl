# Issue tracker: Local Markdown

Issues and specs for this repo live as Markdown files in `.scratch/`.

## Conventions

- One feature per directory: `.scratch/<feature-slug>/`.
- The spec is `.scratch/<feature-slug>/<feature-slug>-spec.md`.
- Implementation tickets are one file per ticket at `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01` in dependency order.
- Triage state is recorded as a `Status:` line near the top of each spec or ticket file (see `triage-labels.md` for the role strings).
- Implementation tickets declare dependencies in a `Blocked by: NN, NN` line near the top. A ticket is unblocked when every listed ticket is resolved.
- Comments and conversation history append to the bottom of the file under a `## Comments` heading.
- To close a spec or ticket, record the outcome and verification, then set `Status: resolved`. This is a completion state, separate from the five triage roles.

## When a skill says "publish to the issue tracker"

Create or update the spec or individual ticket at its conventional path above, creating the directory if needed.

## When a skill says "fetch the relevant ticket"

Read the referenced file and its comments. Resolve a local ticket number within its feature's `issues/` directory.

## Wayfinding operations

Used by `/wayfinder`. The map is a file with one child file per decision ticket.

- **Map**: `.scratch/<effort>/map.md` (the Destination / Notes / Decisions-so-far / Fog body).
- **Child ticket**: `.scratch/<effort>/issues/NN-<slug>.md`, numbered from `01`, with the question in the body. A `Type:` line records the ticket type (`research`/`prototype`/`grilling`/`task`).
- **Blocking**: a `Blocked by: NN, NN` line near the top. A ticket is unblocked when every file it lists has `Status: resolved`.
- **Frontier**: scan `.scratch/<effort>/issues/` for unresolved, unblocked, unclaimed tickets; first by number wins.
- **Claim**: set `Status: claimed` and save before any work.
- **Resolve**: append the answer under an `## Answer` heading, set `Status: resolved`, then append a context pointer (gist + link) to the map's Decisions-so-far in `map.md`.

For wayfinding tickets, `claimed` and `resolved` record execution state; they are separate from the five triage roles.
