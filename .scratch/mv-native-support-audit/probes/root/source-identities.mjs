import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const input = path.resolve('references/RPGMV/RPGMV.exe');
const bytes = await fs.readFile(input);
const inventory = JSON.parse(await fs.readFile(path.join(os.homedir(), '.codex/tmp/mv-native-support-audit-20261020/editor/inventory.json'), 'utf8'));
const pe = JSON.parse(await fs.readFile('.scratch/mv-native-support-audit/evidence/editor-pe-resources.json', 'utf8'));
assertEqual(inventory.artifactSha256, sha(bytes));
assertEqual(pe.normalized_result.artifact.sha256, sha(bytes));
const version = pe.normalized_result.resources.find(value => value.type.id === 16);
const payload = bytes.subarray(version.payload.location.offset, version.payload.location.offset + version.payload.location.bytes);
assertEqual(sha(payload), version.payload.sha256);
const signature = payload.indexOf(Buffer.from([0xbd, 0x04, 0xef, 0xfe]));
if (signature < 0) throw new Error('No fixed version signature');
const ms = payload.readUInt32LE(signature + 8), ls = payload.readUInt32LE(signature + 12);
const fileVersion = [ms >>> 16, ms & 65535, ls >>> 16, ls & 65535].join('.');
const resources = inventory.resources.filter(value => [346222, 8672102, 909009, 8692470, 679418, 665677, 811221].includes(value.offset)).map(({heading, ...value}) => value);
const files = [];
for (const file of ['references/rmmv-local-runtime-1.6.1/js/rpg_objects.js', 'references/RPGMV/NewData/js/rpg_objects.js', 'references/RPGMV/Help/page/01_10.html']) {
  const content = await fs.readFile(file);
  files.push({ path: path.resolve(file), bytes: content.length, sha256: sha(content) });
}
const result = { artifact: { path: input, bytes: bytes.length, sha256: sha(bytes), fileVersion, versionEvidenceType: 'ordinary fixed-version byte decoding, PE resource range from REA' }, reaEvidenceId: pe.evidence_id, extraction: { matchingTextCandidates: inventory.count, completeQtResourceTree: false, firstPartySourceStoredOutsideRepository: inventory.out }, resources, files };
await fs.writeFile('.scratch/mv-native-support-audit/evidence/source-identities.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify({ artifact: result.artifact, reaEvidenceId: result.reaEvidenceId, matchingTextCandidates: inventory.count, selectedResources: resources.length, files }));
function assertEqual(actual, expected) { if (actual !== expected) throw new Error(`Identity mismatch: ${actual} != ${expected}`); }
