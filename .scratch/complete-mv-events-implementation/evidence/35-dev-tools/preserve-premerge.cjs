const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const root = process.cwd();
const out = 'M:/Shuen/Codex/mv-events-implementation-20261020/ticket35-temp/premerge-c2-freeze';
if (fs.existsSync(out)) throw Error('immutable target already exists');
fs.mkdirSync(out, { recursive: true });
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const git = args => cp.execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }).trim();
function files(dir) { return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? files(path.join(dir, e.name)) : [path.join(dir, e.name)]); }
const captured = files('M:/Shuen/Codex/mv-events-implementation-20261020/ticket35-temp/results').map(p => ({ p, r: JSON.parse(fs.readFileSync(p)) })).filter(({r}) => r.requirementId === 'MV-S6-CHARACTER-001' && r.status === 'passed').sort((a,b)=>a.r.completedAt.localeCompare(b.r.completedAt)).at(-1);
if (!captured) throw Error('no final matrix capture');
const paths = new Set(captured.r.source.files.map(f => f.path));
for (const name of [...git(['diff', '--name-only']).split('\n'), ...git(['ls-files', '--others', '--exclude-standard']).split('\n')]) if (name) paths.add(name);
const manifest = [...paths].sort().map(name => { const bytes = fs.readFileSync(path.join(root, name)); const target = path.join(out, 'files', name); fs.mkdirSync(path.dirname(target), {recursive:true}); fs.writeFileSync(target, bytes); return {path:name,sha256:hash(bytes),size:bytes.length}; });
for (const f of captured.r.source.files) { const m = manifest.find(v=>v.path===f.path); if (m.sha256!==f.sha256) throw Error('executed input differs: '+f.path); }
const report = { createdAt:new Date().toISOString(), root, revision:git(['rev-parse','HEAD']), status:git(['status','--porcelain=v1']), capturedResult:captured.p,capturedInputFingerprint:captured.r.source.fingerprint, fileCount:manifest.length,files:manifest };
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(report,null,2)+'\n');
fs.writeFileSync(path.join(out,'dirty.patch'),cp.execFileSync('git',['diff','--binary'],{cwd:root,maxBuffer:32*1024*1024}));
console.log(JSON.stringify({out,fileCount:manifest.length,capturedInputFingerprint:report.capturedInputFingerprint,manifestSha256:hash(fs.readFileSync(path.join(out,'manifest.json')))}));
