# Pictures, audio and screen effects

[Documentation](../../README.md)

Examples use helpers from `rpgmaker-event-dsl`; short fragments omit imports and containing event declarations. See [events and references](../events.md) for enclosing types and [asset validation](../assets.md) for file checks.

- [Picture commands](#picture-commands)
- [Audio Commands](#audio-commands)
- [Screen effects, waits and movies](#screen-effects-waits-and-movies)

## Picture commands

Picture commands require complete display settings:

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
tintPicture({
  pictureId: 1,
  tone: { red: -255, green: 0, blue: 255, gray: 0 },
  duration: 30,
  wait: false,
});
```

Picture IDs 1..100 select runtime slots, including unshown slots. Show's `image`
is a `pictures` Asset Reference or explicit `null`; None retains a complete Picture.
`erasePicture({ pictureId })` erases it. Image dimensions are not scanned.
Show and Move require top-level `origin` (`upperLeft` or `center`), `position`,
`scaleX`, `scaleY`, `opacity` and named `blendMode` (`normal`, `additive`, `multiply`,
`screen`). Direct coordinates are integers −9999..9999; variables mode uses two
existing variable references. Scales are integers −2000..2000, including negative
flips; opacity is integer 0..255. Numeric saved zero retains its sign.
Move has no image field and requires duration 1..999 and explicit Boolean `wait`.
Rotate speed is integer −90..90, including zero to stop. Tint requires named RGB
integers −255..255, gray 0..255, duration 1..999 and explicit Boolean `wait`.

## Audio Commands

Give each playback or system audio helper a complete payload, including None:

```ts
playBgm({
  audio: { asset: audioAsset({ folder: "bgm", name: "Theme1" }), volume: 90, pitch: 100, pan: 0 },
});
playBgs({ audio: { asset: null, volume: 1, pitch: 51, pan: -0 } });
changeVehicleBgm({ vehicle: "boat", audio: { asset: null, volume: 0, pitch: 50, pan: -100 } });
fadeoutBgm({ duration: 2 });
saveBgm();
replayBgm();
stopSe();
```

`asset`, `volume`, `pitch` and `pan` are required. The numeric fields accept
integers in 0..100, 50..150 and -100..100 respectively, including values between
the editor's arrow steps. Numeric negative zero in volume and pan survives the
round trip. Use `null` for None; a named Audio Asset Reference requires a nonempty
exact filename stem and the matching folder. BGM playback, battle BGM and vehicle
BGM use `bgm`; BGS uses `bgs`; ME playback, victory ME and defeat ME use `me`; SE
uses `se`. Vehicle BGM requires boat, ship or airship. Values are explicit and do
not inherit current project audio settings.

BGM/BGS None stops its stream in MV. ME None first stops ME and may restore BGM.
SE None leaves existing SE playing; use `stopSe()` to stop them. None retains the
three saved numeric fields in every helper. `fadeoutBgm` and `fadeoutBgs` require
an integer duration of 1..999 seconds and return without adding a wait command.
`saveBgm()`, `replayBgm()` and `stopSe()` take no arguments.

Audio file matching and inactive saved routes follow the [asset reference](../assets.md#audio-and-movies).

## Screen effects, waits and movies

Use `fadeoutScreen()` and `fadeinScreen()` without arguments. MV owns their fade
speed and interpreter wait. Use `wait({ frames: 60 })` for an explicit wait;
`frames` is a required integer from 1 to 999.

```ts
import {
  tintScreen,
  flashScreen,
  shakeScreen,
  setWeatherEffect,
  playMovie,
  movieAsset,
} from "rpgmaker-event-dsl";

const effects = [
  tintScreen({ tone: { red: -68, green: -34, blue: 0, gray: 0 }, duration: 60, wait: true }),
  flashScreen({ color: { red: 255, green: 255, blue: 255, alpha: 0 }, duration: 1, wait: false }),
  shakeScreen({ power: 5, speed: 7, duration: 30, wait: false }),
  setWeatherEffect({ weather: "none", power: 9, duration: 60, wait: true }),
  playMovie({ movie: movieAsset({ name: "Ending" }) }),
  playMovie({ movie: null }),
];
```

Tint requires all four named tone components: integer RGB values from −255 to
255 and gray from 0 to 255. Flash requires integer RGBA components from 0 to
255, including explicit alpha zero. Both preserve numeric negative zero in
their accepted component fields. Shake power and speed are integers from 1 to 9. Tint, Flash, Shake and Weather require integer `duration` from 1 to 999 and
an explicit Boolean `wait`; their values remain saved when the visible effect
is inactive.

Weather is `"none"`, `"rain"`, `"storm"` or `"snow"`. Its power is always an
integer from 1 to 9, including None. In battle MV skips both the weather effect
and its wait, which produces a contextual warning. A Common Event's runtime
context remains unknown until it is called.

Movie requires a movies Asset Reference or explicit `null`. None emits the
empty native filename and continues without a video wait. `movieAsset` takes
only a nonempty filename stem, such as `"Ending"`. Compile and `compile --check`
require the exact `movies/<saved name>.webm` ordinary file under Project Root;
MP4 cannot substitute. Movie names containing `%` or `#` are unsupported and
remain unchecked with an error for ordinary uses. Image and audio encryption
flags do not apply to movies. Existence checking does not guarantee a playable
file or codec.
