import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
const input = path.resolve('references/RPGMV/RPGMV.exe');
const out = path.join(os.homedir(), '.codex/tmp/mv-native-support-audit-20261020/editor');
fs.mkdirSync(out, { recursive: true });
const bytes = fs.readFileSync(input);
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const rows = [];
for (let offset = 0; offset < bytes.length - 16; offset++) {
  const storedLength = bytes.readUInt32BE(offset);
  if (storedLength < 40 || storedLength > 2_000_000 || offset + 4 + storedLength > bytes.length) continue;
  let decoded, encoding;
  if (bytes[offset + 8] === 0x78 && ((bytes[offset + 8] << 8 | bytes[offset + 9]) % 31) === 0) {
    const expected = bytes.readUInt32BE(offset + 4);
    if (expected < 40 || expected > 8_000_000) continue;
    try {
      const result = zlib.inflateSync(bytes.subarray(offset + 8, offset + 4 + storedLength), { info: true, maxOutputLength: 8_000_000 });
      if (result.buffer.length !== expected || result.engine.bytesWritten !== storedLength - 4) continue;
      decoded = result.buffer;
      encoding = 'qcompress';
    } catch { continue; }
  } else {
    const head = bytes.subarray(offset + 4, offset + 104).toString('utf8');
    if (!/^(?:import Qt|\.pragma library|\/\/|\/\*)/.test(head)) continue;
    decoded = bytes.subarray(offset + 4, offset + 4 + storedLength);
    encoding = 'plain';
  }
  const text = decoded.toString('utf8');
  if (text.includes('\0') || !/(?:import Qt|\.pragma library|function |onSave:|onLoad:)/.test(text)) continue;
  const ext = /import Qt/.test(text.slice(0, 3000)) ? 'qml' : 'js';
  const file = `${offset}.${ext}`;
  fs.writeFileSync(path.join(out, file), decoded);
  rows.push({ offset, storedBytes: storedLength + 4, encoding, decodedBytes: decoded.length, sha256: sha(decoded), path: path.join(out, file), heading: text.split(/\r?\n/).slice(0, 12).join('\n') });
  offset += storedLength + 3;
}
const result = { input, artifactSha256: sha(bytes), out, method: 'Read-only length-prefixed text/qCompress candidate extraction; no Qt tree or native/runtime execution', count: rows.length, resources: rows };
fs.writeFileSync(path.join(out, 'inventory.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify({ input, sha256: result.artifactSha256, out, count: rows.length }));
