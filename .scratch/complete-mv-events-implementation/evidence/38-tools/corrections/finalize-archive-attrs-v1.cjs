const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const temp='M:/Shuen/Codex/mv-events-implementation-20261020/ticket38-temp',root='.scratch/complete-mv-events-implementation/evidence/38-tools',manifestPath=root+'/archive-manifest.json',sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const before=fs.readFileSync(manifestPath),manifest=JSON.parse(before),attrPath=root+'/.gitattributes',oldAttr=fs.readFileSync(attrPath),captures=manifest.files.filter(f=>/^merge(?:888b|73504ec)-conflict-.*\.txt$/u.test(path.basename(f.path)));
assert.equal(captures.length,6);assert.equal(manifest.files.length,204);
for(const capture of captures)assert.equal(sha(fs.readFileSync(capture.path)),capture.sha256);
const additions=captures.map(f=>path.basename(f.path)+' -diff').sort().join('\n')+'\n';
fs.writeFileSync(attrPath,Buffer.concat([oldAttr,Buffer.from(additions)]));
manifest.files.find(f=>f.path===attrPath).sha256=sha(fs.readFileSync(attrPath));
function add(bytes,to,original){const destination=root+'/'+to;assert.ok(!fs.existsSync(destination));fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination,bytes);manifest.files.push({path:destination,sha256:sha(bytes),original});}
add(before,'corrections/archive-manifest-before-attrs-v1.json',manifestPath+' before finite raw-conflict diff attributes');
add(fs.readFileSync('.scratch/complete-mv-events-implementation/evidence/38-staged-verification.json'),'corrections/staged-verification-before-attrs-v1.json','original successful204-entry staged-byte receipt');
add(fs.readFileSync(__filename),'corrections/finalize-archive-attrs-v1.cjs',__filename);
const receipt={createdAt:new Date().toISOString(),reason:'Preserved raw merge-conflict evidence deliberately contains original conflict markers; render only these exact six archive files as opaque diffs without changing any capture bytes.',beforeManifestSha256:sha(before),beforeAttributeSha256:sha(oldAttr),afterAttributeSha256:sha(fs.readFileSync(attrPath)),exactOpaquePaths:captures.map(f=>f.path),captureBytesUnchanged:true,oldArchiveEntries:204,newArchiveEntries:208};
add(Buffer.from(JSON.stringify(receipt,null,2)+'\n'),'corrections/raw-conflict-attribute-receipt-v1.json','self-authored finite archive-attribute correction receipt');
manifest.createdAt=new Date().toISOString();manifest.purpose+=' Only six exact original raw-conflict captures use opaque Git diffs; their bytes remain hash-verified.';
fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({files:manifest.files.length,manifestSha256:sha(fs.readFileSync(manifestPath)),exactOpaquePaths:receipt.exactOpaquePaths,captureBytesUnchanged:true}));
