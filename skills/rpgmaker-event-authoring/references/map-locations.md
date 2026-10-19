# Map locations

Use the named helpers below for saved MV position commands. Each selected mode
requires all its fields. Direct `x` and `y` are integers `0..2147483647`, excluding
negative zero. Coordinates beyond a map's current dimensions remain saved and
produce a warning; they are not clamped. Variable modes validate Project Data
References without imposing these limits on future runtime values.

```ts
transferPlayer({
  destination: { kind: "direct", map: mapRef({ id: 1 }), x: 4, y: 5 },
  direction: "left",
  fade: "white",
});
setVehicleLocation({
  vehicle: "airship",
  destination: {
    kind: "variables",
    map: variableRef({ id: 1 }), x: variableRef({ id: 2 }), y: variableRef({ id: 3 }),
  },
});
setEventLocation({
  target: { kind: "runtimeSelector", scope: "character", target: "currentEvent" },
  destination: {
    kind: "exchange",
    target: { kind: "runtimeSelector", scope: "character", target: "event", id: 2 },
  },
});
getLocationInfo({
  variable: variableRef({ id: 4 }),
  info: "tileLayer4",
  location: { kind: "direct", x: 4, y: 5 },
});
```

Transfer and vehicle destinations accept `direct` with a `mapRef`, `x`, and `y`,
or `variables` with three `variableRef` values named `map`, `x`, and `y`. Vehicle
is explicitly `boat`, `ship`, or `airship`. Transfer direction is
`retain/down/left/right/up` and fade is `black/white/none`; the only omitted
defaults are `retain` and `black`.

Event Location accepts `direct` with numeric `x/y`, `variables` with variable
references `x/y`, or `exchange` with another event `target`. Its outer target and
exchange target each accept `currentEvent` or `event` with a positive `id` in
the character Runtime Selector scope. Its direction uses the same five named
values, with omitted default `retain`. A missing runtime event can warn and
remain saved. Player is outside this command's selector subset.

Location Info requires an output `variableRef`, one of
`terrainTag/eventId/tileLayer1/tileLayer2/tileLayer3/tileLayer4/regionId`, and
`location` in `direct` or `variables` mode. An unnamed System Variable Slot is
valid when its explicit ID is within the final capacity.

Fixed destination maps must resolve. Their Snapshot dimensions supply bounds
warnings. For Event Location and Location Info in a Map Event, bounds warnings
are conditional on executing on that containing map. A Common Event's unknown
running map supplies no bounds warning by itself. Transfer executed in battle
may stall its interpreter.

Location Info's out-of-bounds results differ: terrain and region return zero;
tile layers use a data-array index that can alias another tile; event lookup
matches exact current coordinates and can find an event outside map dimensions.
Use these warnings to review gameplay intent while preserving the saved values.
