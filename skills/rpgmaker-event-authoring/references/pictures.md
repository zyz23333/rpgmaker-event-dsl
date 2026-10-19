# Picture commands

Use Picture slots 1..100 as Runtime Selectors. Move, rotate, tint and erase remain
valid even if the slot has not been shown. A variables position uses two existing
System Variable Slot references; their execution-time values are unconstrained.
Direct x and y are integers −9999..9999, independent of map dimensions.

Give Show and Move every display field: top-level `origin` is `"upperLeft"` or
`"center"`; `position` is `{ kind: "direct", x, y }` or
`{ kind: "variables", x: variableRef(...), y: variableRef(...) }`;
`scaleX` and `scaleY` are integers −2000..2000; `opacity` is integer 0..255;
`blendMode` is `"normal"`, `"additive"`, `"multiply"` or `"screen"`.
Negative scale flips a picture. Numeric coordinates, scales, opacity, speed and
Tone components preserve negative zero.

Show requires `image: imageAsset({ folder: "pictures", name })` or explicit
`image: null`. None retains a complete Picture and its independent settings.
Use `erasePicture({ pictureId })` when erasing is intended. Asset references keep
the filename stem exactly and do not scan files or image dimensions.

```ts
showPicture({
  pictureId: 1,
  image: null,
  origin: "center",
  position: { kind: "direct", x: -120, y: 90 },
  scaleX: -100,
  scaleY: 100,
  opacity: 255,
  blendMode: "normal",
});
movePicture({
  pictureId: 1,
  origin: "upperLeft",
  position: { kind: "variables", x: variableRef({ id: 1 }), y: variableRef({ id: 2 }) },
  scaleX: 100,
  scaleY: 100,
  opacity: 200,
  blendMode: "additive",
  duration: 60,
  wait: false,
});
rotatePicture({ pictureId: 1, speed: 0 });
tintPicture({
  pictureId: 1,
  tone: { red: -255, green: 0, blue: 255, gray: 0 },
  duration: 30,
  wait: true,
});
erasePicture({ pictureId: 1 });
```

Move has no image field and requires integer duration 1..999 and explicit Boolean
`wait`. Rotate speed is integer −90..90; zero stops rotation. Tint requires named
Tone components: red, green and blue are integers −255..255; gray is 0..255.
Tint also requires duration 1..999 and explicit Boolean `wait`.

Keep only supported own fields at every level, including direct DSL Commands and
reference values. Known raw and native Picture records receive the same exact
slot, range and reference validation. Move's reserved native slot is exactly
positive zero. Unsupported saved shapes fail before Decompile publishes source.
