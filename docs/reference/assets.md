# Assets and file validation

[Documentation](../README.md)

Read this reference for asset naming, file-check coverage, diagnostics and temporary exceptions. Asset Reference constructors preserve filename stems without reading files; Workspace Compile, Check and Push check the selected Event Asset Uses against the bound Project Root.

- [File contract](#file-contract)
- [Direct image uses](#direct-image-uses)
- [Audio and movies](#audio-and-movies)
- [Selected project-data relationships](#selected-project-data-relationships)
- [File failures and inactive settings](#file-failures-and-inactive-settings)
- [Workflow boundaries](#workflow-boundaries)
- [Asset Check Exceptions](#asset-check-exceptions)
- [Diagnostics and freshness](#diagnostics-and-freshness)

## File contract

Named images require `.png`, audio requires `.ogg`, and movies require `.webm` at their exact native paths and case. Helpers preserve the original names. Existence checks inspect ordinary-file metadata; they do not validate size, dimensions, media decoding or playback.

File matching preserves Chinese text, spaces, dots and `$`/`!` prefixes. A stem
ending in a space or dot keeps it before the appended extension.
Reserved Windows device names also cover ASCII spaces before the first dot,
including `NUL .png`. Saved names keep their original spelling. Unicode
normalization, alternative formats and a `www` resource tree do not substitute
for the exact target. Existing Project Root aliases keep their binding semantics;
symlinks and junctions below that root are refused, while ordinary hard links pass.
If enumeration or metadata cannot complete, or their observed entry types disagree
within the same query, the diagnostic is `MV-ASSET-QUERY-FAILED`. Such an inconclusive
query is distinct from an observed missing file, and safe independent checks continue.

## Direct image uses

Compile and `compile --check` check current event image files before publishing or
returning. This includes page character images, Show Text faces, Show Picture,
both Change Battleback layers, Change Parallax, Change Actor Images, Change Vehicle
Image and Change Image in both movement route containers. Each supported saved name is used
exactly as written, with `.png` appended in its native `img` folder in the bound
Project Root. Image names containing `%` or `#`, including text such as `%20`, are
unsupported and are rejected before file lookup; names are never URL-decoded or
repaired. Ordinary uses error, while explicitly inactive saved settings warn with
unchecked coverage. Asset Check Exceptions cannot waive
unsupported names. Audio retains literal `%` and `#` support; movies exclude both.
The helpers still preserve these saved values. An existing suffix is retained,
and every directory, filename and extension must have the exact case.
Formal commands and recognized raw records use
the same rules in every current Map Event, Common Event and Troop Event, including
nested branches and uncalled Common Events. A 205 route and its 505 mirror are one
logical use, with both native positions retained; independent commands remain
independent uses.

## Audio and movies

Compile and `compile --check` require each current named audio file at its exact
`audio/<folder>/<saved name>.ogg` path under Project Root. M4A and encrypted editing
suffixes cannot substitute for OGG. Literal `%` and `#` remain part of audio names.
Formal and recognized raw commands use the same rules; a route 44 and its 505
mirror are one logical use with both native positions. Saved SE in a fixed, random
or approach Autonomous Movement route remains checked with its inactive warning
policy. Only used audio makes `System.json.hasEncryptedAudio` relevant; true means
ordinary editing files cannot be checked, and a present non-Boolean value is invalid.
None omits the file lookup while retaining its independent controls. Checks observe
file metadata without decoding audio or modifying the media tree.

Movie requires a movies Asset Reference or explicit `null`. None emits the
empty native filename and continues without a video wait. `movieAsset` takes
only a nonempty filename stem, such as `"Ending"`. Compile and `compile --check`
require the exact `movies/<saved name>.webm` ordinary file under Project Root;
MP4 cannot substitute. Movie names containing `%` or `#` are unsupported and
remain unchecked with an error for ordinary uses. Image and audio encryption
flags do not apply to movies. Existence checking does not guarantee a playable
file or codec.

## Selected project-data relationships

Show Animation and Show Battle Animation follow the selected Snapshot Animation's
two image names in `img/animations` and every timing SE name in `audio/se`.
Change Tileset follows every named `tilesetNames` slot in `img/tilesets`, including
slots unused by the current map. Repeated names keep each slot's own origin.
Diagnostics show the defining event, selected database entry and complete field
chain. Image preloading and timing SE execution have separate conditions; these
saved dependencies do not guarantee that an animation frame will execute.

Force Action follows its fixed Snapshot Skill. A positive `animationId` selects
that Animation's image sheets and timing SE; zero closes only the animation path.
Negative `animationId` takes the runtime default-attack path and is reported as
unchecked; the first release does not infer a weapon, Animation 1 or System attack
SE. Malformed necessary Skill or Animation fields remain errors. Fixed Transfer
Player destinations retain their existing Map reference validation, but their
initial Tileset, parallax and audio files are not asset-check dependencies. A Map
Event Page tile does not infer its host Map's initial Tileset; its saved character
image remains an independently checked inactive setting.

Game Over follows `System.gameoverMe.name`; Return to Title follows both saved
title images and `titleBgm.name`. Battle Processing does not infer System battle
audio or host Map backgrounds. A dynamic Troop selector records its unchecked
enemy relationship. Direct Change Battle BGM, Change Victory ME, Change Defeat ME
and Change Battleback saved names remain checked. Hardcoded GameOver/title UI,
terrain-derived backgrounds and System Battle Test backgrounds are outside this
selected relationship coverage.

Fixed Battle Processing follows every Troop member's Enemy battler image,
including hidden and repeated members. Enemy Transform follows the saved new
Enemy even when its runtime target may be absent. `System.optSideView` selects
exactly `img/enemies` or `img/sv_enemies`; a non-boolean required mode is an input
error. A Troop Event's identity alone does not select its host members' images,
and Enemy AI skills are outside these relationships.

Adding an Actor does not infer its initial character, face or side-view battler
names. Direct Change Actor Images saved names remain checked. Initial equipment,
party removal/reordering and HP side effects are outside this relationship scope.

Only selected necessary fields are interpreted. Empty native names mean None;
missing or invalid necessary names produce `MV-ASSET-INVALID-DATA` while safe
independent fields continue checking. External data comes from the same captured
Snapshot as compilation. Newer live database fields and unrelated entries do not
replace that view or become asset roots, and external fields stay read-only.

Each current Common Event is an independent root, including one with no callers.
The first release does not collect direct or transitive Common Event callers or
follow Skill Common Event effects for asset reporting. Existing fixed reference
and structure validation still applies. Repeated or cyclic calls do not multiply
another definition's asset uses or produce an asset-call cycle report.

## File failures and inactive settings

The check observes ordinary-file metadata only: empty files pass, and no image
decoding or layout guarantee is made. None needs no file. Missing directories or
files, wrong types, unsupported Windows names, links below the resolved Project
Root and image encryption block these ordinary uses with an `MV-ASSET-` diagnostic
and every defining native position. It preserves saved names; Decompilation can
still expose an unsupported name so it can be repaired. Check leaves generated
data, the Snapshot and synchronization metadata unchanged. Asset observations are
transient and do not enter Compile Baseline.

Saved Autonomous Movement images remain checked when the movement type is fixed,
random or approach. A tile page's saved character name also remains checked.
Confirmed file problems in these explicitly inactive settings warn; unsupported
names, links and encryption warn with unchecked coverage. Invalid necessary data
and failed metadata queries remain errors. A shared filename keeps every origin
and its own level, and its strongest level determines whether the command fails.
Page conditions and branch reachability do not reduce ordinary image errors.
None omits the file lookup while retaining independent image indices, and script
strings do not create guessed image references or bypass the Script Command Gate.

## Workflow boundaries

Compile and Check make one asset-check pass after validating the complete candidate.
Check preserves initial, fresh and stale output authority on success, warnings and
failure. Compile checks before publishing generated data; it retains its existing
source, type-dependency, configuration, Snapshot and binding consistency checks at
publication and Manifest commit. Deleting media after the asset pass does not add
another scan or prevent otherwise valid publication. Each new command queries
current files, so a later Check can fail even while generated data remains fresh.
Media content, size, timestamps, identity and unrelated entries do not become
compilation inputs. Clone, Pull, Decompilation and Diff add no asset-file gate.

Push checks current assets once before pending state or the first replacement, including a no-write Push. Recovery can record already-completed data writes before the following asset check. See [Push and recovery](../workflow.md#asset-checks-during-push-and-recovery).

## Asset Check Exceptions

An optional Workspace Config `assetCheckExceptions` array can retain a temporary
authoring gap with a reason. New workspaces write `[]`; omitting the field has the
same live policy. Every entry contains exactly `category`, `folder`, `name` and
`reason`, for example:

```json
{
  "category": "image",
  "folder": "pictures",
  "name": "Chapter 2 Poster",
  "reason": "Final artwork is being commissioned."
}
```

Category and folder must be a supported asset namespace. Name matching preserves
case, spaces, suffixes and literal encoding; the reason must contain non-whitespace
text. Duplicate exact keys and extra fields fail configuration validation. Only
confirmed missing paths, name mismatches and wrong types can downgrade an ordinary
error to warning. Unsupported names, links, encrypted modes, required fields,
query failures, fixed references, structure checks and the Script Command Gate keep
their own policy. Images and movies containing `%` or `#` remain unsupported even
if an exception accurately names them. Audio retains its literal-name support.

## Diagnostics and freshness

Compile and Check display each finding's stable code, every native origin, event-local
dependency chain, conditions, base/effective levels and the reason for an actual
exception downgrade. Reliable captured authored locations add a DSL path and
one-based source line/column; otherwise native positions remain available.
Grouped findings retain every origin and their strongest effective severity.
Legal exceptions that do not downgrade an error produce no additional warning.
Early validation failures say that asset checking did not run. Any effective
error fails the command; warning and informational reports can succeed with an
explicit unchecked-coverage result.

The exact exception policy is part of Compile Baseline. After changing it, run a
successful Compile before Push; Check cannot refresh previously generated output.
Live file observations and source-coordinate correspondence remain transient.
