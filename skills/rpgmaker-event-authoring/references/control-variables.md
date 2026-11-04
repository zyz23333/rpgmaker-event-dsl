# Control Variables

Use `controlVariables({ variable, operation, value })`. Keep all three fields
explicit. `variable` is `variableRef({ id })`, a unique named reference, or
`{ kind: "referenceRange", from: variableRef(...), to: variableRef(...) }`.
Both endpoints must resolve and remain ordered. The range includes unnamed System
Variable Slots within its capacity.

Choose `set`, `add`, `sub`, `mul`, `div` or `mod`. Select one complete value mode:

```ts
{ kind: "constant", value: 1 }
{ kind: "variable", variable: variableRef({ id: 2 }) }
{ kind: "random", from: -10, to: 10 }
{ kind: "gameData", source: "actor", actor: actorRef({ id: 1 }), value: "hp" }
{ kind: "script", script: scriptInput({ code: "$gameParty.gold()" }) }
```

Constant and random fields are integers −99,999,999..99,999,999. Random endpoints
are ordered. Numeric negative zero remains expressible. Values read from a
variable, Game Data or Script are runtime values and keep native behavior;
literal bounds and clamping do not apply. Random samples once for each target.
Every other operand is evaluated once before the target loop. Keep this native
encoding for self-aliasing ranges and side-effecting scripts.

Game Data uses eight distinct sources:

| source                | Required fields and accepted values                                                           |
| --------------------- | --------------------------------------------------------------------------------------------- |
| item / weapon / armor | matching item / weapon / armor reference; counts exclude equipment                            |
| actor                 | fixed actorRef; value level/exp/hp/mp/mhp/mmp/atk/def/mat/mdf/agi/luk                         |
| enemy                 | enemy selector; value hp/mp/mhp/mmp/atk/def/mat/mdf/agi/luk                                   |
| character             | target selector; value mapX/mapY/direction/screenX/screenY                                    |
| party                 | member selector                                                                               |
| other                 | value mapId/partyMembers/gold/steps/playTime/timer/saveCount/battleCount/winCount/escapeCount |

Enemy selectors are `{ kind: "runtimeSelector", scope: "enemy", target: "enemy",
index }`. Party selectors are `{ kind: "runtimeSelector", scope: "party", target:
"member", index }`. Each index is 0..7 and may preserve numeric negative zero.
Character targets share `{ kind: "runtimeSelector", scope: "character", target }`:
player, currentEvent, or event with a positive `id`. Fixed project references must
resolve. A runtime position can be absent and return 0; review contextual warnings
without rewriting the value. Common Events inherit their caller's context.
Missing Enemy entries are skipped when MV constructs runtime Troop members, so a
saved position can select a later raw member or return 0. Keep the saved position
and review the contextual warning. Hidden members still provide Game Data values.

Script Input preserves its complete single-slot string, including empty text,
whitespace, CR/LF/CRLF and trailing characters, without a product character or line
limit. LF warns about the editor's single-line control; CR warns that preservation
on parameter reconfirmation needs native verification. Keep the original text and
enable the Workspace Script Command Gate only for intended Script Inputs. Empty,
nested and unreachable saved scripts are gated too.
