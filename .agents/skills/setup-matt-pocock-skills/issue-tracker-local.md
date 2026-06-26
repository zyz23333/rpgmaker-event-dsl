# Issue tracker: Local Markdown Change Packages

Tracked work for this repo lives as markdown files in `.scratch/`.

## Conventions

- One change per directory: `.scratch/<change-slug>/`
- The PRD is `.scratch/<change-slug>/<change-slug>-prd.md`
- The design is `.scratch/<change-slug>/<change-slug>-design.md`
- Executable local slices live in `.scratch/<change-slug>/slices/<NN>-<slug>.md`, numbered from `01`
- Verification notes may live in `.scratch/<change-slug>/<change-slug>-verification.md`
- If a file uses status metadata, record it as a `Status:` line near the top of the file (see `triage-labels.md` for the role strings)
- Comments and conversation history append to the bottom of the file under a `## Comments` heading when the file is actively discussed
- Legacy issue-style directories may still exist, but the slice-based change package is the default local flow

## When a skill says "publish to the issue tracker"

Create or update the relevant file under `.scratch/<change-slug>/` (creating the directory if needed).

## When a skill says "fetch the relevant ticket"

Read the file at the referenced path. The user will normally pass the path or the issue number directly.
