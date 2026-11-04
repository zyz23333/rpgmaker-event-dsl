# System access and scenes

[Documentation](../../README.md)

Examples use helpers from `rpgmaker-event-dsl`; short fragments omit imports and containing event declarations. See [events and references](../events.md) for enclosing types and [asset validation](../assets.md) for file checks.

## Access, window color and scenes

System access commands each require an explicit Boolean `enabled`:

```ts
changeSaveAccess({ enabled: false });
changeMenuAccess({ enabled: true });
changeEncounter({ enabled: false });
changeFormationAccess({ enabled: true });
changeWindowColor({ tone: { red: 12, green: -24, blue: 36, gray: 113 } });
openMenuScreen();
openSaveScreen();
gameOver();
returnToTitleScreen();
```

All four access commands encode false as native 0 and true as native 1.
Changing encounters also resets MV's encounter count. Window color requires all
four named Tone fields: RGB integers −255..255 and gray integer 0..255. Preserve
gray even though the window editor hides it, and preserve numeric negative zero
in Tone components. Color comes from the declaration; compilation does not read
`System.windowTone` as a default. The four scene commands take no inputs.
Open Menu and Open Save run on the map even when ordinary menu/save access is
disabled, and skip in battle. Game Over and Return to Title transition from both
map and battle; Game Over does not require dead actors. These commands do not
add an automatic save operation.

Game Over and Return to Title check their selected System media dependencies. See [asset relationships](../assets.md#selected-project-data-relationships).
