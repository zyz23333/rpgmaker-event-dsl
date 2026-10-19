// Original read-only verifier. Target-derived text stays outside the repository.
const fs=require('node:fs');
const path=require('node:path');
const zlib=require('node:zlib');
const crypto=require('node:crypto');
const assert=require('node:assert/strict');
const base='C:/Users/Shuen/.codex/tmp';
const metadataPath=path.join(base,'mv-e1-editor-container-identities.json');
const previous=JSON.parse(fs.readFileSync(metadataPath,'utf8'));
const output=path.join(base,'mv23-e1-recheck-v3-'+crypto.randomUUID());
fs.mkdirSync(output);
const hash=v=>crypto.createHash('sha256').update(v).digest('hex');
const image=fs.readFileSync(previous.target.path);
assert.equal(hash(image),previous.target.sha256);
assert.equal(image.length,previous.target.bytes);
const report={purpose:'Ticket23 E1 Common container identity and read-only code recheck; not editor UI or native game execution',startedAt:new Date().toISOString(),node:process.version,target:previous.target,metadata:{path:metadataPath,sha256:hash(fs.readFileSync(metadataPath))},output,resources:[],extra:[],script:{path:__filename,sha256:hash(fs.readFileSync(__filename))}};
for(const record of previous.resources){
  const stored=image.subarray(record.offset,record.offset+record.storedBytes);
  assert.equal(stored.length,record.storedBytes);
  assert.equal(stored.readUInt32BE(0)+4,stored.length);
  assert.equal(hash(stored),record.storedSha256);
  let decoded=stored.subarray(4);
  if(record.encoding==='zlib'){
    const result=zlib.inflateSync(decoded.subarray(4),{info:true});
    assert.equal(result.buffer.length,decoded.readUInt32BE(0));
    assert.equal(result.engine.bytesWritten,decoded.length-4);
    decoded=result.buffer;
  }
  assert.equal(decoded.length,record.decodedBytes);
  assert.equal(hash(decoded),record.decodedSha256);
  assert.equal(hash(fs.readFileSync(record.destination)),record.decodedSha256);
  report.resources.push({role:record.role,offset:record.offset,storedBytes:record.storedBytes,storedSha256:record.storedSha256,encoding:record.encoding,decodedBytes:decoded.length,decodedSha256:hash(decoded),matchesRetainedText:true});
}
for(const [role,offset] of [['E117-dialog',710524],['object-picker',607446]]){
  const length=image.readUInt32BE(offset)+4;
  assert.ok(length>=8&&length<100000&&offset+length<=image.length);
  const stored=image.subarray(offset,offset+length),payload=stored.subarray(4);
  let decoded=payload,encoding='plain';
  if(!payload.toString('utf8').startsWith('import ')){
    const result=zlib.inflateSync(payload.subarray(4),{info:true});
    assert.equal(result.buffer.length,payload.readUInt32BE(0));assert.equal(result.engine.bytesWritten,payload.length-4);
    decoded=result.buffer;encoding='zlib';
  }
  const target=path.join(output,role+'.txt');fs.writeFileSync(target,decoded,{flag:'wx'});
  report.extra.push({role,offset,storedBytes:length,storedSha256:hash(stored),encoding,decodedBytes:decoded.length,decodedSha256:hash(decoded),retainedPath:target});
}
const version=image.subarray(19562144,19562144+540);
assert.equal(hash(version),'114811b8d1898d08021e8997cdfac45190149bf96fbe45acb28ea86cf9bca426');
const versionText=version.toString('utf16le');assert.ok(versionText.includes('1.6.1'));
const fixedOffset=version.indexOf(Buffer.from([0xbd,0x04,0xef,0xfe]));assert.ok(fixedOffset>=0);
const fileMS=version.readUInt32LE(fixedOffset+8),fileLS=version.readUInt32LE(fixedOffset+12);
const fixedFileVersion=[fileMS>>>16,fileMS&65535,fileLS>>>16,fileLS&65535].join('.');assert.equal(fixedFileVersion,'1.6.1.0');
report.version={selfReportedProduct:'1.6.1',selfReportedFile:'1.6.1.0',bytes:540,offset:19562144,sha256:hash(version),authority:'Static version payload read at independently inventoried REA PE resource range; does not authenticate distribution'};
report.completedAt=new Date().toISOString();report.passed=true;
fs.writeFileSync(path.join(output,'identity-recheck.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({output,passed:true,resources:report.resources.length,extra:report.extra,reportSha256:hash(fs.readFileSync(path.join(output,'identity-recheck.json')))}));
