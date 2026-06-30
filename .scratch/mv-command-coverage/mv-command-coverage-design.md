# MV Command Coverage Design

## Status

Draft

## Change Slug

`mv-command-coverage`

## Context

The Event DSL currently supports a small subset of RPG Maker MV event command families through schema-first TypeScript helpers, while unsupported commands rely on `rawDslCommand(...)` or decompile back to raw escape hatches. The requested change is to make the current project support the complete RPG Maker MV 1.6.1 editor event command surface as **Supported Event Commands**.

Relevant domain terms have been clarified in `CONTEXT.md`: **Supported Event Command** means an RPG Maker MV editor event command family, **Continuation Event Commands** are represented by their parent command helper, **MV-Aligned Command Helper Names** follow the editor command family names, **Asset References** are not **Project Data References**, and all JavaScript-bearing **Script Inputs** remain behind the **Script Command Gate**.

Relevant ADRs:

- ADR 0001 keeps the DSL schema-first with named object fields and function-style command helpers.
- ADR 0002 keeps implementation inside `packages/rpgmaker-event-dsl`, using TypeScript strict mode, Vitest, oxlint, and oxfmt.
- ADR 0005 allows breaking public surface cleanup before the first public release and does not require old compatibility aliases.

The RPG Maker MV 1.6.1 command source of truth for this design is `references/rpg-maker-mv-corescript/js/rpg_objects/Game_Interpreter.js`, cross-checkable with `references/rmmv-local-runtime-1.6.1/js/rpg_objects.js`.

## Problem

The project does not yet provide a complete, readable, schema-first authoring surface for RPG Maker MV event commands. Existing gaps cause three practical problems:

- Developers must use `rawDslCommand(...)` for many ordinary MV editor commands.
- DSL Decompilation preserves unsupported commands as raw output, so brownfield projects remain hard to maintain.
- Existing helper names and shapes are not fully MV-aligned, especially `controlSwitch` and `controlVariable`, whose MV command families are plural and support ranges.

## Goals

- Define complete RPG Maker MV 1.6.1 editor command family coverage for the Event DSL.
- Include compile and decompile expectations in coverage, not just helper existence.
- Preserve schema-first, MV-aligned helper names and object inputs.
- Treat continuation and branch raw commands as implementation details of parent helpers.
- Include `Set Movement Route` subcommands as a nested coverage area.
- Introduce opaque no-scan **Asset References** using category helpers.
- Keep all JavaScript-bearing **Script Inputs** gated by the **Script Command Gate**.
- Record a design that can be used by `to-slices` for implementation planning.

## Non-Goals

- Do not implement command helpers in this design step.
- Do not create executable slice files in this design step.
- Do not add RPG Maker MZ support.
- Do not support plugin-specific command semantics beyond MV's native `Plugin Command`.
- Do not scan or validate asset files on disk.
- Do not add an Asset Snapshot, Asset Validation workflow, or asset ownership model.
- Do not change `rawDslCommand(...)` gate behavior in this change.
- Do not add compatibility aliases for renamed pre-release helpers.

## Scope

### In

- Public DSL command helper names, types, command `kind` values, and input shapes.
- Compiler behavior from **DSL Commands** to **Raw Event Commands**.
- DSL Decompilation from raw MV command lists into helpers where supported.
- Project-aware validation for Project Data References and Script Inputs.
- README, examples, and Agent Event Authoring Skill guidance needed to describe the command surface.
- Complete coverage matrix for top-level MV 1.6.1 editor command families.
- Nested coverage matrix for `Set Movement Route` move route subcommands.

### Out

- Runtime plugin command registry requirements.
- Plugin-specific command schemas.
- File-system scanning for assets.
- Raw command semantic validation beyond existing behavior.
- RPG Maker MZ command differences.
- Any issue tracker publication.

## Canonical References

- `CONTEXT.md`
- `docs/adr/0001-schema-first-dsl-entry-model.md`
- `docs/adr/0002-technical-architecture-and-toolchain.md`
- `docs/adr/0005-rename-project-surface-to-rpg-maker-event-dsl.md`
- `packages/rpgmaker-event-dsl/src/dsl.ts`
- `packages/rpgmaker-event-dsl/src/events.ts`
- `packages/rpgmaker-event-dsl/src/decompiler.ts`
- `packages/rpgmaker-event-dsl/src/staged-graph.ts`
- `packages/rpgmaker-event-dsl/test/events.test.ts`
- `packages/rpgmaker-event-dsl/test/dsl.test.ts`
- `packages/rpgmaker-event-dsl/test/workflow.test.ts`
- `packages/rpgmaker-event-dsl/test/staged-graph.test.ts`
- `references/rpg-maker-mv-corescript/js/rpg_objects/Game_Interpreter.js`
- `references/rmmv-local-runtime-1.6.1/js/rpg_objects.js`

## Current Behavior

Current public helpers include `showText`, `showChoices`, `conditional`, `loop`, `breakLoop`, `exitEvent`, `callCommonEvent`, `label`, `jumpToLabel`, `comment`, `script`, `pluginCommand`, `transferPlayer`, `controlSwitch`, `controlVariable`, `controlSelfSwitch`, `changeGold`, `changeItem`, `wait`, `eraseEvent`, `battleProcessing`, `shopProcessing`, and `rawDslCommand`.

Current coverage is partial:

- `showText` only covers message lines and emits fixed face/background/position parameters.
- `showChoices` covers basic choices and branches.
- `conditional` accepts `PageConditions`, but compilation currently emits a fixed switch condition shape rather than the full condition taxonomy.
- `controlSwitch` and `controlVariable` only model single targets and a subset of operands.
- Many MV editor command families have no helper.
- Decompilation renders a smaller subset of helpers than the compiler supports, and falls back to `rawDslCommand(...)` for unsupported commands.
- `script(...)` is gated by `scriptEnabled`, but other JavaScript-bearing command inputs do not yet exist.
- Asset parameters are currently raw strings or raw command parameters.

## Target Behavior

The Event DSL should expose one schema-first **Function-Style Command Helper** per RPG Maker MV 1.6.1 editor command family, with names aligned to the editor command family in camelCase. Helpers compile to stable MV raw command lists, and DSL Decompilation renders supported raw command shapes back into helpers rather than raw escape hatches.

Continuation commands are not public top-level helpers. Examples:

- `401` text data belongs to `showText`.
- `405` scrolling text data belongs to `showScrollingText`.
- `402` and `403` belong to `showChoices`.
- `411` belongs to `conditional`.
- `413` belongs to `loop`.
- `601`, `602`, and `603` belong to `battleProcessing`.
- `605` belongs to `shopProcessing`.
- `655` belongs to `script`.

Asset-bearing command helpers should use **Asset Category Helpers**:

- `audioAsset({ folder, name })`, where folder is one of MV's `audio` namespaces such as `bgm`, `bgs`, `me`, or `se`.
- `imageAsset({ folder, name })`, where folder is one of MV's `img` namespaces such as `pictures`, `characters`, `faces`, `sv_actors`, `sv_enemies`, `battlebacks1`, `battlebacks2`, `parallaxes`, or `tilesets`.
- `movieAsset({ name })`, using MV's fixed `movies` namespace.

Asset References are opaque in this change: they compile to the filename stem required by MV and do not scan, validate, resolve IDs, or enter the Staged Data Graph.

### Reference Scope Boundary

**Project Data Reference Scopes** cover only RPG Maker MV project data entries that can be resolved by ID or unique display name from DSL-owned declarations or the Standard Project Data Snapshot. They do not cover assets, runtime object selectors, command-local enums, or temporary numeric slots.

Expected Project Data Reference Scopes for MV command coverage include:

- Current scopes: actor, armor, common event, item, map, switch, troop, variable, and weapon.
- Additional read-only External Project Data Reference scopes added when first required by a command slice: class, skill, state, animation, enemy, and tileset.

Asset-bearing command inputs use **Asset References**, not Project Data References. For example, `tilesetRef(...)` identifies a `Tilesets.json` database entry for `Change Tileset`, while `imageAsset({ folder: "tilesets", name })` identifies an `img/tilesets` filename stem and does not prove that any tileset database entry exists.

Runtime command targets use **Runtime Selectors**, not Project Data References. Examples include player/current-event character targets, troop enemy indexes, all-enemies targets, actor command target modes such as entire party or actor ID from variable, battler selectors, vehicle selectors, and picture slots.

## Requirements / Behavior Changes

| ID | Current | Target | Acceptance |
| --- | --- | --- | --- |
| REQ-01 | Supported command coverage is partial and ad hoc. | Coverage is defined against RPG Maker MV 1.6.1 editor command families. | The design matrix lists every MV 1.6.1 editor command family with raw codes, helper target, and coverage state. |
| REQ-02 | Continuation commands can appear only as raw commands during decompile fallback. | Continuation commands are owned by parent helpers. | No continuation command is proposed as a standalone public helper. |
| REQ-03 | `controlSwitch` and `controlVariable` use singular names for plural MV command families. | They become `controlSwitches` and `controlVariables` with no old alias. | Public exports, type names, `kind` values, decompiler output, docs, examples, and tests use the renamed helpers. |
| REQ-04 | Some commands compile but do not decompile to helpers. | Supported status requires decompile rendering. | A command family is not marked complete unless helper, compile, decompile, validation, tests, and docs are accounted for. |
| REQ-05 | Asset command parameters are not modeled as references. | Asset command parameters use opaque Asset References. | Asset helpers compile to MV filename stems or AudioFile objects without file-system scanning. |
| REQ-06 | Only `script(...)` is currently gated. | Every JavaScript-bearing Script Input is gated. | Script command, Conditional Branch script condition, Control Variables script operand, and Move Route script subcommands are rejected when `scriptEnabled` is false. |
| REQ-07 | `rawDslCommand(...)` bypasses semantic validation. | Raw command behavior remains unchanged but documented as a security follow-up. | The design records raw JS detection as deferred and does not block command coverage on it. |
| REQ-08 | Set Movement Route is a raw object shape when needed. | Move route subcommands have their own nested coverage model. | The matrix includes move route subcommands separately from top-level Event Commands. |
| REQ-09 | Plugin Command is supported only as a raw command string wrapper. | Plugin Command remains schema-first but does not require plugin registry validation. | `pluginCommand` covers MV code `356`; plugin-specific semantics stay out of scope. |
| REQ-10 | Runtime target-like parameters and database references can be confused. | Project Data Reference Scopes, Asset References, and Runtime Selectors stay separate in public helper inputs. | New scopes resolve through the Staged Data Graph; Runtime Selectors do not; Asset References remain no-scan filename stems. |

## Locked Decisions

- Coverage target is RPG Maker MV 1.6.1 editor event command families.
- The source-of-truth command list comes from the local MV corescript/runtime under `references/`.
- Continuation and branch commands are not standalone public helpers.
- Coverage includes decompile rendering.
- The design file lives at `.scratch/mv-command-coverage/mv-command-coverage-design.md`.
- Helpers use MV-aligned camelCase names.
- Existing plural MV command families should use plural helper names.
- `controlSwitch` and `controlVariable` are breaking-renamed to `controlSwitches` and `controlVariables`.
- No compatibility aliases are kept for those pre-release names.
- Asset parameters use `audioAsset`, `imageAsset`, and `movieAsset` category helpers with explicit namespaces.
- Asset References are no-scan and do not participate in Project Data Reference resolution.
- Project Data Reference Scopes are limited to resolvable RPG Maker MV project data entries.
- New read-only External Project Data Reference scopes are added only when required by a command slice, and each new scope must include helper exports, snapshot extraction, validation, tests, and decompiler import handling.
- Runtime Selectors are separate schema-first inputs and are not represented as Project Data References.
- Move Route subcommands are included as a nested matrix under `Set Movement Route`.
- Script and Plugin coverage is limited to MV native commands, not plugin-specific APIs.
- All JavaScript-bearing Script Inputs use the existing Script Command Gate.
- Raw DSL Commands keep their current gate bypass behavior in this change.
- The MV-aligned helper rename foundation must happen before broader command family additions.

## Agent Discretion

- Exact object field names may be chosen during implementation when they remain schema-first, MV-aligned, and readable.
- Helper input types may use discriminated unions when MV commands have direct-vs-variable or actor-vs-party targeting modes.
- Runtime Selector field names may be chosen during implementation, but they must not use `xxxRef` helper names or `ReferenceValue` shapes.
- Decompiler rendering may fall back to `rawDslCommand(...)` for malformed, incomplete, or non-editor-shaped raw command parameters.
- Documentation examples may use representative commands rather than exhaustively showing every helper.
- Tests may use focused raw command assertions rather than full generated map files when that is the highest practical seam.

## Invariants

- **Raw Event Commands** always compile with MV-compatible `code`, `indent`, and `parameters`.
- Supported command helpers remain schema-first and do not use positional argument builders for complex commands.
- Continuation command indentation is derived from the parent command structure.
- Empty command lists still compile to the MV end marker.
- Project Data References continue to resolve through the Staged Data Graph and Project Data Snapshot rules.
- Asset References never resolve to project data entry IDs.
- Runtime Selectors never resolve through the Staged Data Graph.
- Script Input is gated regardless of which MV command family carries the JavaScript.
- `rawDslCommand(...)` remains an escape hatch and is not treated as ordinary supported helper coverage.

## Design

### Coverage Model

Each MV editor command family receives a row in the coverage matrix. Completion is tracked by capability, not by a single boolean:

- `Helper`: public function, DSL command type, exported type, and stable `kind`.
- `Compile`: MV raw command output, including continuation command generation where applicable.
- `Decompile`: supported raw command shapes render to helper source and import the correct helpers.
- `Validation`: Project Data References, Script Inputs, branch shape, range shape, and no-scan asset shape are validated where applicable.
- `Tests`: focused behavior tests cover helper shape, compile output, decompile output, and validation boundaries.
- `Docs`: README, examples, and Agent Event Authoring Skill guidance are updated where the command family affects authoring.

Matrix status values:

- `complete`: current behavior already satisfies the target.
- `partial`: a helper exists but does not cover the full MV command family target.
- `missing`: no supported helper exists.
- `rename`: existing helper must be renamed before it can be considered final.
- `nested`: covered in a nested matrix rather than as a standalone top-level helper.

### Top-Level Event Command Coverage Matrix

#### Message

| MV Command Family | Codes | Current | Target Helper | Notes |
| --- | --- | --- | --- | --- |
| Show Text | `101`, `401` | partial | `showText` | Expand to face image, background, position, and message-adjacent input/choice compatibility where MV permits. |
| Show Choices | `102`, `402`, `403` | partial | `showChoices` | Owns choice branches and cancel branch continuation commands. |
| Input Number | `103` | missing | `inputNumber` | Stores result in a variable with digit count. |
| Select Item | `104` | missing | `selectItem` | Stores selected item ID in a variable, includes item type. |
| Show Scrolling Text | `105`, `405` | missing | `showScrollingText` | Owns scrolling text continuation lines. |

#### Flow Control

| MV Command Family | Codes | Current | Target Helper | Notes |
| --- | --- | --- | --- | --- |
| Comment | `108`, `408` | complete | `comment` | Keep multi-line continuation rendering. |
| Conditional Branch | `111`, `411` | partial | `conditional` | Replace PageConditions-shaped input with full MV condition taxonomy or a compatible discriminated condition model. Script condition is Script Input. |
| Loop | `112`, `413` | complete | `loop` | `413` remains continuation/end marker owned by loop. |
| Break Loop | `113` | complete | `breakLoop` | No parameter changes expected. |
| Exit Event Processing | `115` | complete | `exitEvent` | No parameter changes expected. |
| Common Event | `117` | complete | `callCommonEvent` | Uses Project Data Reference. |
| Label | `118` | complete | `label` | No parameter changes expected. |
| Jump to Label | `119` | complete | `jumpToLabel` | No parameter changes expected. |

#### Game Progression

| MV Command Family | Codes | Current | Target Helper | Notes |
| --- | --- | --- | --- | --- |
| Control Switches | `121` | rename | `controlSwitches` | Must support single switch and switch range. |
| Control Variables | `122` | rename | `controlVariables` | Must support single variable, variable range, constants, variable operand, random, game data, and Script Input operand. |
| Control Self Switch | `123` | complete | `controlSelfSwitch` | Name remains singular because MV command is singular. |
| Control Timer | `124` | missing | `controlTimer` | Start/stop with seconds for start. |

#### Party

| MV Command Family | Codes | Current | Target Helper | Notes |
| --- | --- | --- | --- | --- |
| Change Gold | `125` | partial | `changeGold` | Existing helper supports constant only; MV supports constant and variable operand. |
| Change Items | `126` | partial | `changeItems` | Rename to MV plural family and support constant/variable amount. |
| Change Weapons | `127` | missing | `changeWeapons` | Include include-equipment flag. |
| Change Armors | `128` | missing | `changeArmors` | Include include-equipment flag. |
| Change Party Member | `129` | missing | `changePartyMember` | Add/remove actor and initialize option. |

#### System Settings

| MV Command Family | Codes | Current | Target Helper | Notes |
| --- | --- | --- | --- | --- |
| Change Battle BGM | `132` | missing | `changeBattleBgm` | Uses `audioAsset({ folder: "bgm", name })`. |
| Change Victory ME | `133` | missing | `changeVictoryMe` | Uses `audioAsset({ folder: "me", name })`. |
| Change Save Access | `134` | missing | `changeSaveAccess` | Enable/disable. |
| Change Menu Access | `135` | missing | `changeMenuAccess` | Enable/disable. |
| Change Encounter Disable | `136` | missing | `changeEncounterDisable` | Enable/disable encounter behavior. |
| Change Formation Access | `137` | missing | `changeFormationAccess` | Enable/disable. |
| Change Window Color | `138` | missing | `changeWindowColor` | Tone array or named tone object. |
| Change Defeat ME | `139` | missing | `changeDefeatMe` | Uses `audioAsset({ folder: "me", name })`. |
| Change Vehicle BGM | `140` | missing | `changeVehicleBgm` | Vehicle target plus `audioAsset({ folder: "bgm", name })`. |

#### Movement

| MV Command Family | Codes | Current | Target Helper | Notes |
| --- | --- | --- | --- | --- |
| Transfer Player | `201` | partial | `transferPlayer` | Existing variable-map target shape is incorrect because MV variable mode uses variable IDs for map, x, and y. Must resolve through variable references, not map references. |
| Set Vehicle Location | `202` | missing | `setVehicleLocation` | Direct and variable designation. |
| Set Event Location | `203` | missing | `setEventLocation` | Direct, variable, and exchange modes; character target is a Runtime Selector, not a Project Data Reference. |
| Scroll Map | `204` | missing | `scrollMap` | Direction, distance, speed. |
| Set Movement Route | `205` | missing | `setMovementRoute` | Top-level helper owns nested move route subcommands. |
| Getting On and Off Vehicles | `206` | missing | `getOnOffVehicle` | No parameters. |

#### Character

| MV Command Family | Codes | Current | Target Helper | Notes |
| --- | --- | --- | --- | --- |
| Change Transparency | `211` | missing | `changeTransparency` | Player transparency on/off. |
| Show Animation | `212` | missing | `showAnimation` | Character target, animation reference, wait. |
| Show Balloon Icon | `213` | missing | `showBalloonIcon` | Character target, balloon ID/name enum, wait. |
| Erase Event | `214` | complete | `eraseEvent` | No parameter changes expected. |
| Change Player Followers | `216` | missing | `changePlayerFollowers` | Show/hide followers. |
| Gather Followers | `217` | missing | `gatherFollowers` | No parameters. |

#### Screen

| MV Command Family | Codes | Current | Target Helper | Notes |
| --- | --- | --- | --- | --- |
| Fadeout Screen | `221` | missing | `fadeoutScreen` | No parameters. |
| Fadein Screen | `222` | missing | `fadeinScreen` | No parameters. |
| Tint Screen | `223` | missing | `tintScreen` | Tone, duration, wait. |
| Flash Screen | `224` | missing | `flashScreen` | Color, duration, wait. |
| Shake Screen | `225` | missing | `shakeScreen` | Power, speed, duration, wait. |
| Wait | `230` | complete | `wait` | Existing helper is sufficient. |
| Show Picture | `231` | missing | `showPicture` | Uses `imageAsset({ folder: "pictures", name })`; direct and variable position. |
| Move Picture | `232` | missing | `movePicture` | Direct and variable position, duration, wait. |
| Rotate Picture | `233` | missing | `rotatePicture` | Picture ID and speed. |
| Tint Picture | `234` | missing | `tintPicture` | Picture ID, tone, duration, wait. |
| Erase Picture | `235` | missing | `erasePicture` | Picture ID. |
| Set Weather Effect | `236` | missing | `setWeatherEffect` | Type, power, duration, wait. |

#### Audio & Video

| MV Command Family | Codes | Current | Target Helper | Notes |
| --- | --- | --- | --- | --- |
| Play BGM | `241` | missing | `playBgm` | Uses AudioFile object with `audioAsset({ folder: "bgm", name })`. |
| Fadeout BGM | `242` | missing | `fadeoutBgm` | Duration. |
| Save BGM | `243` | missing | `saveBgm` | No parameters. |
| Resume BGM | `244` | missing | `resumeBgm` | No parameters. |
| Play BGS | `245` | missing | `playBgs` | Uses `audioAsset({ folder: "bgs", name })`. |
| Fadeout BGS | `246` | missing | `fadeoutBgs` | Duration. |
| Play ME | `249` | missing | `playMe` | Uses `audioAsset({ folder: "me", name })`. |
| Play SE | `250` | missing | `playSe` | Uses `audioAsset({ folder: "se", name })`. |
| Stop SE | `251` | missing | `stopSe` | No parameters. |
| Play Movie | `261` | missing | `playMovie` | Uses `movieAsset({ name })`. |

#### Map

| MV Command Family | Codes | Current | Target Helper | Notes |
| --- | --- | --- | --- | --- |
| Change Map Name Display | `281` | missing | `changeMapNameDisplay` | Enable/disable. |
| Change Tileset | `282` | missing | `changeTileset` | Uses `tilesetRef(...)` for a `Tilesets.json` Project Data Reference Scope, not `imageAsset({ folder: "tilesets" })`. |
| Change Battle Back | `283` | missing | `changeBattleBack` | Uses `imageAsset({ folder: "battlebacks1" })` and `imageAsset({ folder: "battlebacks2" })`. |
| Change Parallax | `284` | missing | `changeParallax` | Uses `imageAsset({ folder: "parallaxes" })`; loop/speed options. |
| Get Location Info | `285` | missing | `getLocationInfo` | Variable target, info type, direct or variable coordinates. |

#### Scene Control

| MV Command Family | Codes | Current | Target Helper | Notes |
| --- | --- | --- | --- | --- |
| Battle Processing | `301`, `601`, `602`, `603` | partial | `battleProcessing` | Existing helper lacks variable troop and branch command lists for win/escape/lose. |
| Shop Processing | `302`, `605` | partial | `shopProcessing` | Existing goods shape is raw tuple-like; target should model goods entries and continuation goods. |
| Name Input Processing | `303` | missing | `nameInputProcessing` | Fixed actor database reference and max characters. |

#### Actor

| MV Command Family | Codes | Current | Target Helper | Notes |
| --- | --- | --- | --- | --- |
| Change HP | `311` | missing | `changeHp` | Actor command target is a Runtime Selector; operand and allow death are command inputs. |
| Change MP | `312` | missing | `changeMp` | Actor command target is a Runtime Selector; operand is a shared operate-value input. |
| Change State | `313` | missing | `changeState` | Actor command target is a Runtime Selector; state uses `stateRef(...)`. |
| Recover All | `314` | missing | `recoverAll` | Actor command target is a Runtime Selector. |
| Change EXP | `315` | missing | `changeExp` | Actor command target is a Runtime Selector; operand and show level up are command inputs. |
| Change Level | `316` | missing | `changeLevel` | Actor command target is a Runtime Selector; operand and show level up are command inputs. |
| Change Parameter | `317` | missing | `changeParameter` | Actor command target is a Runtime Selector; parameter is a command enum, not a Project Data Reference Scope. |
| Change Skill | `318` | missing | `changeSkill` | Actor command target is a Runtime Selector; skill uses `skillRef(...)`. |
| Change Equipment | `319` | missing | `changeEquipment` | Actor uses a fixed `actorRef(...)`; equip slot is a command enum/id, not a Project Data Reference Scope; item is weapon/armor/none. |
| Change Name | `320` | missing | `changeName` | Fixed actor database reference and name. |
| Change Class | `321` | missing | `changeClass` | Fixed actor database reference, `classRef(...)`, and keep EXP. |
| Change Actor Images | `322` | missing | `changeActorImages` | Uses `imageAsset` for characters/faces/sv_actors and index fields where MV requires them. |
| Change Vehicle Image | `323` | missing | `changeVehicleImage` | Vehicle target, character image reference, index. |
| Change Nickname | `324` | missing | `changeNickname` | Fixed actor database reference and nickname. |
| Change Profile | `325` | missing | `changeProfile` | Fixed actor database reference and profile text. |
| Change TP | `326` | missing | `changeTp` | Actor command target is a Runtime Selector; operand is a shared operate-value input. |

#### Enemy

| MV Command Family | Codes | Current | Target Helper | Notes |
| --- | --- | --- | --- | --- |
| Change Enemy HP | `331` | missing | `changeEnemyHp` | Enemy troop member target is a Runtime Selector; operand and allow death are command inputs. |
| Change Enemy MP | `332` | missing | `changeEnemyMp` | Enemy troop member target is a Runtime Selector; operand is a shared operate-value input. |
| Change Enemy State | `333` | missing | `changeEnemyState` | Enemy troop member target is a Runtime Selector; state uses `stateRef(...)`. |
| Enemy Recover All | `334` | missing | `enemyRecoverAll` | Enemy troop member target is a Runtime Selector. |
| Enemy Appear | `335` | missing | `enemyAppear` | Enemy troop member target is a Runtime Selector. |
| Enemy Transform | `336` | missing | `enemyTransform` | Enemy troop member target is a Runtime Selector; transformed enemy uses `enemyRef(...)`. |
| Show Battle Animation | `337` | missing | `showBattleAnimation` | Enemy troop member target or all-enemies Runtime Selector; animation uses `animationRef(...)`. |
| Force Action | `339` | missing | `forceAction` | Actor/enemy battler target is a Runtime Selector; skill uses `skillRef(...)`; target index is command-local. |
| Abort Battle | `340` | missing | `abortBattle` | No parameters. |
| Change Enemy TP | `342` | missing | `changeEnemyTp` | Enemy target and operand. |

#### Advanced

| MV Command Family | Codes | Current | Target Helper | Notes |
| --- | --- | --- | --- | --- |
| Open Menu Screen | `351` | missing | `openMenuScreen` | No parameters. |
| Open Save Screen | `352` | missing | `openSaveScreen` | No parameters. |
| Game Over | `353` | missing | `gameOver` | No parameters. |
| Return to Title Screen | `354` | missing | `returnToTitleScreen` | No parameters. |
| Script | `355`, `655` | partial | `script` | Existing helper is tuple-array shaped; target should be schema-first Script Input and remain gate-controlled. |
| Plugin Command | `356` | partial | `pluginCommand` | Covers MV native plugin command string; plugin-specific validation is out of scope. |

### Move Route Subcommand Coverage Matrix

`Set Movement Route` owns a nested move route model. Move route commands are not top-level Event Commands and should not be mixed into `DslCommand`.

| Move Route Subcommand Family | MV Route Codes | Target Helper / Shape | Notes |
| --- | --- | --- | --- |
| Movement steps | `1`-`13` | route step discriminants such as `moveDown`, `moveUpperLeft`, `moveForward`, `moveRandom`, `moveTowardPlayer` | Use MV route command names in camelCase where practical. |
| Jump | `14` | `jump({ x, y })` | Route-local jump offset. |
| Wait | `15` | `routeWait({ frames })` or route-local `wait` shape | Avoid collision ambiguity with event-level `wait` in imports if using helper functions. |
| Turn commands | `16`-`26` | turn discriminants such as `turnDown`, `turnRandom`, `turnTowardPlayer` | Keep route-local namespace clear. |
| Switch on/off | `27`, `28` | route command with switch reference | Project Data Reference validation required. |
| Speed/frequency/walk/step/direction/through/transparent/image/blend | `29`-`41` | route command discriminants with typed parameters | `Change Image` uses `imageAsset({ folder: "characters", name })` plus index. |
| Play SE | `44` | route command with `audioAsset({ folder: "se", name })` | AudioFile object shape. |
| Script | `45` | route Script Input | Must be blocked by Script Command Gate when disabled. |

Exact route helper surface may be a nested object array rather than exported function per route command, as long as it is schema-first, readable, decompilable, and gate-aware.

## Conditional Modules

### UX / Product Behavior

Users should be able to author ordinary RPG Maker MV 1.6.1 editor commands without dropping into raw command objects. Decompile output should become progressively readable as command families become supported. Unsupported malformed raw shapes may still render as `rawDslCommand(...)`.

### Domain Model

This change extends the **Supported Event Command** boundary and introduces **Asset References** as a distinct domain concept from **Project Data References**. It also clarifies that **Script Input** is broader than the top-level `Script` event command.

### API / Contract Changes

The public `rpgmaker-event-dsl` export surface changes:

- `controlSwitch` is removed and replaced with `controlSwitches`.
- `controlVariable` is removed and replaced with `controlVariables`.
- Related types and `kind` values use plural names.
- New helper exports are added for missing MV command families.
- Asset category helpers `audioAsset`, `imageAsset`, and `movieAsset` are added.
- `script` should move toward schema-first input with a `code` field, matching the glossary; compatibility aliasing is not required before first public release.

The compiler and decompiler must share the same command model. A helper is not considered complete if it only compiles.

### Data Model / Persistence

Generated MV project data remains the same carrier format: JSON files containing `Raw Event Commands`. No new persisted workspace state is required for command coverage itself. Asset References do not add asset persistence, snapshots, or ownership.

### Security / Privacy / Money

The Script Command Gate applies to all JavaScript-bearing Script Inputs:

- Top-level Script command.
- Conditional Branch script condition.
- Control Variables script operand.
- Set Movement Route script subcommand.

`rawDslCommand(...)` remains outside semantic script detection for this change. That behavior is intentionally documented as deferred security work rather than silently treated as safe.

### Research / Dependency Findings

RPG Maker MV 1.6.1 runtime dispatches event commands through `Game_Interpreter.prototype.commandXXX`. The editor command family names and continuation relationships can be verified in `references/rpg-maker-mv-corescript/js/rpg_objects/Game_Interpreter.js`. Important continuation relationships include:

- `Show Text` consumes `401` and may be followed by `102`, `103`, or `104`.
- `Show Scrolling Text` consumes `405`.
- `Comment` consumes `408`.
- `Conditional Branch` uses `411` for else.
- `Loop` uses `413` for repeat above.
- `Battle Processing` uses `601`, `602`, and `603` branch continuations.
- `Shop Processing` consumes `605`.
- `Script` consumes `655`.

### Rollout / Migration / Cleanup

The first implementation work should establish the MV-aligned helper rename foundation before adding broad new command families. This is a sequencing constraint, not an executable slice plan:

- Rename plural MV command family helpers and update internal `kind` values.
- Update compiler, decompiler, validation, tests, examples, README, and skill guidance to the final names.
- Do not keep old alias exports.
- After the foundation is in place, additional command family coverage can be added against the matrix.

## Phase Slices

| Phase | Goal | Depends On | Requirements | Success Criteria | Slice Candidates |
| --- | --- | --- | --- | --- | --- |
| 1 | Establish the final public naming foundation before broad coverage work. | None | REQ-03 | Old singular control helper names are gone; plural helpers compile, validate, decompile, and are documented. | Slice 01 |
| 2 | Add shared command primitives and decompiler planning seams used by multiple command families. | Phase 1 | REQ-04, REQ-05, REQ-06 | Asset References, Script Input detection, reusable targets/operands, and decompiler harness seams are available. | Slices 02-03 |
| 3 | Complete core authoring commands that shape nested command-list behavior. | Phase 2 | REQ-01, REQ-02, REQ-04, REQ-06 | Message, flow control, game progression, and party commands compile and decompile with required validation. | Slices 04-06 |
| 4 | Complete map-event movement behavior and route subcommands. | Phase 2, Phase 3 where shared primitives are needed | REQ-01, REQ-08 | Movement commands and nested Move Route subcommands are supported without becoming raw command escapes. | Slices 07-08 |
| 5 | Complete presentation, asset, map/system, battle, actor, enemy, and advanced command families. | Phase 2 | REQ-01, REQ-04, REQ-05, REQ-06, REQ-09 | Remaining MV editor command families have helpers, compile behavior, decompile behavior, validation, and tests. | Slices 09-11 |
| 6 | Refresh user-facing guidance and verify the full coverage contract. | Phases 1-5 | DOC-02, DOC-03, Observable Truths, Required Design Outcomes | Docs/examples match the final API, checks pass, and coverage status matches the design matrix. | Slices 12-13 |

## Completion Contract

### Observable Truths

- [ ] OT-01: A downstream agent can identify every RPG Maker MV 1.6.1 editor event command family in the coverage matrix.
- [ ] OT-02: A downstream agent can distinguish top-level Event Commands from Continuation Event Commands.
- [ ] OT-03: A downstream agent can identify that decompile rendering is required for a command family to be complete.
- [ ] OT-04: A downstream agent can identify that Move Route subcommands are nested under `Set Movement Route`.
- [ ] OT-05: A downstream agent can identify that Asset References are no-scan and separate from Project Data References.
- [ ] OT-06: A downstream agent can identify that all JavaScript-bearing Script Inputs are gated.

### Required Design Outcomes

- [ ] OUT-01: The design locks RPG Maker MV 1.6.1 editor command families as the coverage target.
- [ ] OUT-02: The design locks breaking rename behavior for plural MV command family helpers.
- [ ] OUT-03: The design locks asset helper granularity as `audioAsset`, `imageAsset`, and `movieAsset`.
- [ ] OUT-04: The design records raw command script-gate bypass as deferred security work.
- [ ] OUT-05: The design reserves implementation sequencing and executable slice work for `to-slices`.

### Required Canonical Updates

- [ ] DOC-01: `CONTEXT.md` includes the resolved glossary boundaries for Supported Event Command, Continuation Event Command, MV-Aligned Command Helper Name, Asset Reference, Asset Category Helper, and Script Input.
- [ ] DOC-02: Future implementation must update README examples and Agent Event Authoring Skill guidance when public helpers are renamed or added.
- [ ] DOC-03: Future implementation must update decompile documentation or examples when raw fallback behavior changes.

## Test Strategy

Use the highest practical seams already present in the project:

- DSL helper shape tests in `dsl.test.ts` for public helper return values, `kind` names, and reference helper values.
- Compiler behavior tests in `events.test.ts` for raw command code, indent, and parameter output.
- Validation tests in `staged-graph.test.ts` and workflow compile tests for Project Data Reference errors and Script Command Gate failures.
- Decompile behavior tests in `workflow.test.ts` or a focused decompiler test seam for rendering helper source and imports from MV raw command lists.
- Example workspace tests where broad integration behavior must prove compile/decompile/diff still works.

Important behaviors to cover:

- Plural helper rename removes old `controlSwitch` and `controlVariable` exports.
- Switch and variable range compilation emits MV start/end IDs.
- Malformed raw command shapes decompile to `rawDslCommand(...)`.
- Continuation command blocks decompile into parent helpers.
- Script Inputs are blocked when `scriptEnabled` is false, including nested conditional, variable, and move route script inputs.
- `rawDslCommand(...)` remains outside Script Command Gate detection for this change.
- Asset References compile to MV filename stem payloads and do not attempt file-system validation.
- Move Route subcommands compile inside `code: 205` move route objects and do not become top-level `DslCommand` values.

Tests should not assert implementation-private helper functions when public helper output, compile output, decompile output, or workflow validation can express the behavior.

## Deferred Ideas

- Asset file scanning and Asset Validation.
- Asset Snapshot or asset ownership model.
- Plugin Command Registry validation for plugin-specific argument schemas.
- Raw DSL Command semantic validation for script-bearing raw command codes.
- RPG Maker MZ command coverage.
- Compatibility aliases for old helper names.
- A generated command coverage report derived from tests or runtime metadata.

## Open Questions

None. Further implementation breakdown should proceed through `to-slices`.
