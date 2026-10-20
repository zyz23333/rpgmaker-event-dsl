const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const temp='M:/Shuen/Codex/mv-events-implementation-20261020/ticket35-temp',out='.scratch/complete-mv-events-implementation/evidence/35-dev-tools',sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const attempt={createdAt:new Date().toISOString(),status:'interrupted-tooling-attempt',processId:19268,purpose:'staged-byte verification only',reason:'The first verifier spawned a Git subprocess per historical blob. It was stopped without modifying product/test inputs and replaced by a batch object read. Original verifier bytes and all previously archived inputs are preserved.',productTestFailure:false};
fs.writeFileSync(path.join(temp,'verify-staged-v1-interrupted.json'),JSON.stringify(attempt,null,2)+'\n');
const files=['verify-staged-dev-v2.cjs','archive-verifier-supplement.cjs','verify-staged-v1-interrupted.json'].map(name=>{const bytes=fs.readFileSync(path.join(temp,name)),p=path.join(out,name);if(fs.existsSync(p))throw Error('immutable supplemental target exists');fs.writeFileSync(p,bytes);return {path:p.replaceAll('\\','/'),sha256:sha(bytes),origin:path.join(temp,name)};});
fs.writeFileSync(path.join(out,'supplemental-manifest-v2.json'),JSON.stringify({createdAt:new Date().toISOString(),files},null,2)+'\n');
console.log(JSON.stringify({files:files.length}));
