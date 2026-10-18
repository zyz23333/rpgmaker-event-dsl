# Issue tracker: Local Markdown

Issues and specs for this repo live as Markdown files in `.scratch/`.

## Conventions

- One feature or change per directory: `.scratch/<feature-slug>/`.
- New specs live at `.scratch/<feature-slug>/<feature-slug>-spec.md`.
- New implementation tickets are one file per ticket at `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01` in dependency order, with blockers first.
- Record triage state as a `Status:` line near the top of each implementation ticket. Use the role strings in `triage-labels.md`; treat bold metadata such as `**Status:**` equivalently.
- When triaging an implementation ticket, record its category as `Category: bug` or `Category: enhancement`.
- Record dependencies in a `Blocked by:` line using ticket numbers and titles, or `None`. A ticket is unblocked when all its blockers are resolved or closed.
- Append discussion under a `## Comments` heading. Keep acceptance criteria and verification results with the ticket.
- `.scratch/` is local planning space and is ignored by Git in this repo.

## When a skill says "publish to the issue tracker"

Create or update the relevant spec or ticket file under `.scratch/<feature-slug>/`, creating the directory if needed. Publish implementation tickets as separate files.

## When a skill says "fetch the relevant ticket"

Read the referenced file, including its comments. For a bare ticket number, resolve it within the referenced feature or map; ask when multiple packages could match.

## When a skill says "resolve" or "close" work

For completed implementation work, record verification results, check completed acceptance criteria, and set `Status: resolved`. For rejected work, use `Status: wontfix` and record the reason. Both states remove the ticket from the open frontier. `resolved` records completion; it is not an additional triage role. Update a parent spec only when the invoked workflow calls for it.

## Wayfinding operations

Used by `/wayfinder`. The map is a file with one child file per decision ticket.

- **Map**: `.scratch/<effort>/map.md`, holding Destination / Notes / Decisions so far / Not yet specified / Out of scope. The map indexes decisions and links to ticket details.
- **Child ticket**: `.scratch/<effort>/issues/<NN>-<slug>.md`, numbered from `01`, with the question in the body. Record `Type: research`, `prototype`, `grilling`, or `task`, and start with `Status: open`. Wayfinder tickets use their own lifecycle rather than triage roles.
- **Blocking**: record `Blocked by: NN, NN` near the top, or `None`. A ticket is unblocked when every listed blocker has `Status: resolved`.
- **Frontier**: scan the map's `issues/` directory for open, unblocked, unclaimed decision tickets; first by number wins.
- **Claim**: set `Status: claimed` and save before starting work.
- **Resolve**: append the answer under an `## Answer` heading, set `Status: resolved`, then append a context pointer (gist + link) to the map's Decisions so far section.
- **Close as out of scope**: record the reason, set `Status: resolved`, and add the ticket's link and scope rationale to the map's Out of scope section.
