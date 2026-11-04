# Map character commands

Use the named cardinal direction in
`scrollMap({ direction: "down", distance: 0, speed: 4 })`. Directions are down,
left, right and up; distance is an integer 0–100, speed is 1–6. Zero distance is
valid. An earlier scroll delays the next scroll's start; the command does not wait
for its newly started scroll and accepts no wait field. Battle skips scrolling.

Use `showAnimation({ target, animation: animationRef(...), wait: false })` and
`showBalloonIcon({ target, balloon: "question", wait: true })`. Both require an
explicit boolean wait. Targets are character Runtime Selectors:

```ts
{ kind: "runtimeSelector", scope: "character", target: "player" }
{ kind: "runtimeSelector", scope: "character", target: "currentEvent" }
{ kind: "runtimeSelector", scope: "character", target: "event", id: 2 }
```

Animations require an existing Animations entry. Balloon values are the named
icons exclamation, question, musicNote, heart, anger, sweat, cobweb, silence,
lightBulb, zzz and userDefined1–5. The user-defined slots require no asset scan.
Neither animation nor balloon has a None choice. Numeric balloon aliases are not
accepted. A valid selector may miss; contextual warnings retain it, and a missing
character starts no animation or balloon wait. Battle has no map character target.

`changeTransparency({ transparent: true })` and
`changePlayerFollowers({ visible: true })` require explicit booleans. Follower
visibility also refreshes the player. These operations can affect retained
map-player state during battle.

`getOnOffVehicle()`, `eraseEvent()` and `gatherFollowers()` accept no arguments.
Boarding/disembark success depends on current player state, terrain and location.
Erase acts only on the interpreter's calling event when on the current map with a
positive event ID. A Common Event can inherit that context; its definition alone
does not establish one. Gathering starts a map wait until followers reach the
player, so blocked movement can keep the wait active; battle skips it.

Keep all owned fields explicit. Unknown helper or direct-node fields are errors,
including untyped values and spreads. Check warnings against the intended caller
and flow, then compile and inspect Diff before an authorized Push.
