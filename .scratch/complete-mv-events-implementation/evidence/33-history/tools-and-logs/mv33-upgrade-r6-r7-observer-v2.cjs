'use strict';
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
(async () => {
  const before = await fs.readFile(path.join(__dirname, 'mv33-r6-r7-movement-delivery-v1.cjs'), 'utf8');
  assert.ok(before.includes("$gameMap.event(3).characterName()===''&&$gameMap.event(3).characterIndex()===7"));
  const after = before.replaceAll('mv33-r6-r7-movement-delivery-v1', 'mv33-r6-r7-movement-delivery-v2')
    .replace('correctThis:this===$gameMap.event(this._eventId),literal:', 'correctThis:this===$gameMap.event(this._eventId),characterName:this.characterName(),characterIndex:this.characterIndex(),literal:')
    .replace("$gameMap.event(3).characterName()===''&&$gameMap.event(3).characterIndex()===7", "window.movement33ScriptTrace[0].characterName===''&&window.movement33ScriptTrace[0].characterIndex===7")
    .replace('Original13 R1 checks retained;', 'Autonomous None captured in its actual M45 before the normal completion command disables that page; v1 final-page-state premise preserved as failed. Original13 R1 checks retained;');
  await fs.writeFile(path.join(__dirname, 'mv33-r6-r7-movement-delivery-v2.cjs'), after, { flag: 'wx' });
})().catch(error => { console.error(error); process.exitCode = 1; });
