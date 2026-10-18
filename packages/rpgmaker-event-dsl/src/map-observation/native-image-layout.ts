// Adapted from RPG Maker MV CoreScript Tilemap.js and ImageManager.js (MIT).
// Copyright (c) 2015 KADOKAWA CORPORATION./YOJI OJIMA.
// Full license: distributed THIRD_PARTY_NOTICES.md.

/** Ordinary A5/B-E tiles share native atlas coordinates in map and event images. */
export function ordinaryTileAtlasLayout(tileId: number) {
  return {
    slot: tileId >= 1536 ? 4 : 5 + Math.floor(tileId / 256),
    sx: ((Math.floor(tileId / 128) % 2) * 8 + (tileId % 8)) * 48,
    sy: (Math.floor((tileId % 256) / 8) % 16) * 48,
  };
}

/** Only the initial run of !/$ characters selects native character layout/anchoring. */
export function nativeCharacterImageFlags(name: string) {
  const prefix = /^[!$]+/u.exec(name)?.[0] ?? "";
  return { big: prefix.includes("$"), object: prefix.includes("!") };
}
