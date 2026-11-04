# Movement routes

Use the shared route object for `page({ movement: { route } })` and
`setMovementRoute({ target, route })`. Supply `commands`, including `[]`; flags
repeat/skippable/wait default true/false/false. Preserve noncustom page routes and
all their references and scripts. Page route wait is saved state; a forced route
wait makes the event interpreter wait for native completion.

All instruction objects may use `savedShape: { indent: "absent" | "null" | "zero" }`.
The default is absent. Let the route produce its sole final M0; its
`terminator.parameters` is empty by default or absent explicitly. Let the parent
produce exact ordered 505 mirrors of complete nonterminal records.

Use these complete core fields, with no implicit parameter defaults:

| Instruction | Required fields and accepted values |
| --- | --- |
| `moveDown`, `moveLeft`, `moveRight`, `moveUp`, `moveLowerLeft`, `moveLowerRight`, `moveUpperLeft`, `moveUpperRight`, `moveRandom`, `moveTowardPlayer`, `moveAwayFromPlayer`, `moveForward`, `moveBackward` | Only `kind` |
| `jump` | `x`, `y`: independent integers −99..99 |
| `wait` | `frames`: integer 1..999 |
| `turnDown`, `turnLeft`, `turnRight`, `turnUp`, `turn90Right`, `turn90Left`, `turn180`, `turn90RightOrLeft`, `turnRandom`, `turnTowardPlayer`, `turnAwayFromPlayer` | Only `kind` |
| `switchOn`, `switchOff` | `switch: switchRef({ id })` or a unique declared name |
| `changeSpeed` | `speed`: integer 1..6 |
| `changeFrequency` | `frequency`: integer 1..5 |
| `walkAnimation`, `stepAnimation`, `directionFix`, `through`, `transparent` | `enabled`: explicit boolean |
| `changeImage` | `character`: characters `imageAsset(...)` or null; `characterIndex`: integer 0..7 |
| `changeOpacity` | `opacity`: integer 0..255 |
| `changeBlendMode` | `blendMode`: normal/additive/multiply/screen symbol |
| `playSe` | `audio: { asset, volume, pitch, pan }`: se `audioAsset(...)` or null; integers 0..100 / 50..150 / −100..100 |
| `script` | `script: scriptInput({ code })`: one complete string |

Keep character index independent for None, ordinary and big-character names.
Keep SE volume/pitch/pan independent when asset is null; supply all four fields.
Asset names are exact filename stems and are not trimmed or scanned.

M45 retains empty text, whitespace, CR/LF/CRLF and trailing characters in one slot,
with no twelve-line limit. LF and CR produce editor reconfirmation risk warnings
while retaining exact text. Every saved M45 requires the Workspace Script Command
Gate during Check/Compile, including empty strings, unreachable commands and
noncustom page routes. Use ordinary movement commands when they express intent.
