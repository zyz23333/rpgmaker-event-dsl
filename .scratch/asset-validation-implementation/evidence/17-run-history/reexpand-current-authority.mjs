import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

// Independent, manually transcribed authority tables. No product module,
// collector, fixture, test registration, or execution receipt is imported.
const root = process.cwd();
const out = path.join(root, '.scratch/asset-validation-implementation/evidence/17-raw');
const priorDirectory = process.env.ASSET_VALIDATION_PRIOR_PLAN_ROOT ?? 'M:/Shuen/Codex/asset-validation-notes';
const revision = process.env.ASSET_VALIDATION_EXECUTION_FREEZE ?? '11e52e3cbc93fe5200cb51d0c2882a9cec222765';
const I = '.scratch/asset-validation/implementation-acceptance-cases.md';
const M = '.scratch/asset-validation/acceptance-matrix.md';
const S = '.scratch/asset-validation/asset-validation-spec.md';
const O = '.scratch/asset-validation-implementation/ticket-breakdown-draft.md';
const docs = new Map();
const sha = x => createHash('sha256').update(x).digest('hex');
function doc(p) {
  if (!docs.has(p)) {
    const bytes = execFileSync('git', ['show', `${revision}:${p}`], { cwd: root, maxBuffer: 20_000_000 });
    docs.set(p, { path:p, revision, sha256:sha(bytes), byteLength:bytes.length, lines:bytes.toString('utf8').split(/\r?\n/) });
  }
  return docs.get(p);
}
function ref(p, line, endLine=line) {
  const d=doc(p);
  return {path:p,line,endLine,revision,sha256:d.sha256,quote:d.lines.slice(line-1,endLine).join('\n')};
}
function tableRef(p,family) {
  const line=doc(p).lines.findIndex(x=>x.startsWith(`| ${family} |`))+1;
  if(!line)throw new Error(`Missing authority row ${p} ${family}`);
  return ref(p,line);
}
const issueNames = {
  '01':'native-media-locations','02':'picture-compile-check','03':'exact-file-observation',
  '04':'direct-image-uses','05':'direct-audio-and-movie-uses','06':'animation-and-tileset-dependencies',
  '07':'transfer-and-page-tile-dependencies','08':'enemy-and-actor-candidates','09':'system-and-battle-defaults',
  '10':'common-event-dependency-chains','11':'forced-action-dependencies','12':'exceptions-and-complete-diagnostics',
  '13':'compile-check-consistency','14':'push-generated-asset-preflight','15':'push-postwrite-consistency',
  '16':'recovery-and-current-asset-policy'
};
const issuePath = n => `.scratch/asset-validation-implementation/issues/${n}-${issueNames[n]}.md`;
function ownerRef(n,family) { return tableRef(issuePath(n),family); }
const familyMeta={};
function family(f,primaryTickets,extraRefs=[]) {
  const authority=[tableRef(I,f),tableRef(M,f),...extraRefs];
  familyMeta[f]={family:f,primaryTickets,authority};
  return familyMeta[f];
}
const cases=[];
function add(f,b='base',r='native',field='case',result='expected',owners,extra={}) {
  const fm=familyMeta[f];
  const primaryTickets=owners??fm.primaryTickets;
  const supportingTickets=extra.supportingTickets??[];
  const role=extra.ownerFamily??f;
  const ownershipAuthority=[...primaryTickets.map(n=>ownerRef(n,role)),...(extra.ownerSources??[])];
  const supportingOwnershipAuthority=supportingTickets.map(n=>({ticket:n,
    authority:f==='D09'&&n==='10'?[ref(I,157)]:f==='W12'&&n==='14'?[ownerRef('13','W12')]:f==='W16'&&n==='12'?[ref(issuePath('12'),16),ownerRef('16','W16')]:[ownerRef(n,role)],
    conditional: f==='C05'||(f==='C11'&&b==='recognized-raw')||f==='W12'||(f==='W19'&&b==='push-success')}));
  const authority=[...fm.authority,...(extra.authority??[])];
  let requiredMethods=['workspace-api'];
  let suiteRequirements=['representative actual CLI coverage; no per-ID CLI expansion prescribed','independent semantic assertions where applicable'];
  let receiptEntries=['source','built'];
  let environment=['Windows','Node.js 22','real temporary Workspace and ordinary MV editing Project Root with Chinese and spaces'];
  if(f.startsWith('N')) {
    requiredMethods=['native-runtime-observation'];suiteRequirements=[];receiptEntries=['native-run'];
    environment=['Windows','RPG Maker MV 1.6.1','record actual NW.js/host version','valid self-created media'];
  } else if(f.startsWith('W')) {
    requiredMethods=[r==='cli'?'actual-cli':'workspace-api'];suiteRequirements=['real operation subprocess and exact file/synchronization-state assertions'];
  } else if(f==='D10') { requiredMethods=['actual-cli'];suiteRequirements=['full CLI diagnostics and exit behavior']; }
  else if(f==='D06'&&b==='same-file-two-groups') { requiredMethods=['independent-internal-aggregation-input'];suiteRequirements=['do not label as CLI, native, or impossible real disk state'];environment=['Windows','Node.js 22','independent internal semantic input; no impossible disk state fabricated']; }
  if(f==='F06'&&['image-percent','image-hash','literal-percent20'].includes(b)) requiredMethods=['workspace-api','actual-cli'];
  const candidate=Boolean(extra.semanticSuffix);
  cases.push({id:`AV.${f}.${b}.${r}.${field}.${result}`,family:f,branch:b,representation:r,field,result,
    semanticKey:extra.semanticKey??{family:f,branch:b,representation:r,field,result},
    idSpellingStatus:candidate?'plan-encoding-only-17-must-map-existing-spelling-one-to-one':'authority-token-or-fixed-default',
    primaryTickets,supportingTickets,
    requiredEntryAxes:{receiptEntries,requiredMethods,suiteRequirements,environment,canonicalRepresentation:r,sourceBuiltMultipliesCanonicalIds:false,
      authority:[ref(S,262,266),ref(S,296),...(f.startsWith('W')?[ref(I,161,163)]:[]),...(f==='D10'?[ref(I,132),ref(I,153)]:[]),...(f.startsWith('N')?[ref(I,192),ref(M,153)]:[]),...(f==='F06'&&['image-percent','image-hash','literal-percent20'].includes(b)?[ref(I,126)]:[])]},
    expected:extra.expected??fm.authority[0].quote,
    expectedSampleAxes:extra.samples??[],
    authority,ownershipAuthority,supportingOwnershipAuthority,
    executionStatus:'not-audited-by-this-plan',
    notes:extra.notes??[]});
}
function simple(f,branches,owners,rep='formal',extra={}) { for(const b of branches) add(f,b,rep,'case','expected',owners,extra); }
const split=s=>s.split(',');
const seq=(prefix,n)=>Array.from({length:n},(_,i)=>`${prefix}${i}`);

// A: every listed field; route branch/representation pairs are deliberately not Cartesian.
const aRows=[
 ['A01','04','characterName','page'],['A02','04','p0'],['A03','05','p0-name'],['A04','05','p0-name'],['A05','05','p0-name'],
 ['A06','05','p1-name'],['A07','02','p1'],['A08','05','p0-name'],['A09','05','p0-name'],['A10','05','p0-name'],
 ['A11','05','p0-name'],['A12','05','p0'],['A13','04','p0,p1'],['A14','04','p0'],['A15','04','p1,p3,p5'],['A16','04','p1']
];
const directFields=[];
for(const [f,owner,fields,representation] of aRows) {
  family(f,[owner],[ref(I,22,24),ref(I,29)]);
  for(const field of split(fields)) {
    directFields.push({family:f,branch:'base',field,owner});
    for(const rep of representation?[representation]:['formal','raw']) for(const result of ['present','missing']) add(f,'base',rep,field,result);
  }
}
for(const [f,owner,field] of [['A17','04','p0'],['A18','05','p0-name']]) {
  family(f,[owner],[ref(I,22,24),ref(I,29)]);
  for(const [b,reps] of [['autonomous',['page']],['set-route',['formal','raw']]]) {
    directFields.push({family:f,branch:b,field,owner});
    for(const rep of reps) for(const result of ['present','missing']) add(f,b,rep,field,result);
  }
}

// B: finite reached fields, independently transcribed from the B table.
const bRows=[
 ['B01','06','show-animation,show-battle-animation','image1,image2,se0,se1'],
 ['B02','06','change-tileset',seq('slot',9).join(',')],
 ['B03','08','front,side','member0-battler,member1-battler'],['B04','08','front,side','transformed-battler'],
 ['B05','11','positive-animation','image1,image2,se0,se1'],['B06','11','actor-default','image1,image2,se0,se1'],
 ['B07','11','enemy-default','sound9'],['B08','07','transfer-fixed',[...seq('slot',9),'parallax','bgm','bgs'].join(',')],
 ['B09','07','tile-b,tile-c,tile-d,tile-e','selected-slot','page'],['B10','08','add-actor','character,battler'],
 ['B11','09','game-over','gameover-me'],['B12','09','return-title','title1,title2,title-bgm'],
 ['B13','09','battle-system','battle-bgm,victory-me,defeat-me,start-se'],['B14','09','map-battle-background','battleback1,battleback2'],
 ['B15','10','call-common','called-picture'],['B16','11','skill-common-effects','effect0-picture,effect1-picture']
];
const reachedFields=[];
for(const [f,owner,branches,fields,representation] of bRows) {
  family(f,[owner],[ref(I,22,24),ref(I,54),ref(I,75)]);
  for(const b of split(branches))for(const field of split(fields)) {
    reachedFields.push({family:f,branch:b,field,owner,fieldToken:`${f}-${b}-${field}`,
      fixedTargetApplicable:!['B07','B11','B12','B13','B14'].includes(f)});
    for(const rep of representation?[representation]:['formal','raw'])for(const result of ['present','missing'])add(f,b,rep,field,result);
  }
}

// C: general cases and the complete A/B-mapped None/necessary-field cases.
const cRows={
 C01:'map-pages,common-uncalled,troop-pages,nested-choice,nested-loop',C02:'removed-map,removed-common,reset-troop',
 C03:'route-mirror,independent-command,repeated-command',C04:'two-callers,common-independent-root,repeated-enemy,repeated-tileset-name,repeated-common-effect',
 C05:'self-cycle,mutual-cycle,long-acyclic,shared-dag,dynamic-target,known-sibling',C06:'none-direct,none-indirect,default-page-image,default-page-route,saved-audio-controls,saved-image-index',
 C07:'target-missing,field-missing,field-wrong-type,field-empty,file-missing',C08:'route-fixed,route-random,route-approach,tile-with-character,autoplay-bgm-off,autoplay-bgs-off,battleback-off,false-page-condition,unreached-branch',
 C09:'actor-hp,vehicle-position',C10:'unrelated-actor,unrelated-animation,unrelated-field,troop-host-only',C11:'script-command,route-script,plugin-command,unknown-raw,recognized-raw',
 C12:'plugin-declaration,enemy-ai,initial-equipment,transfer-network,hardcoded-system,terrain-background,battle-test-background',C13:'check-success,check-failure,push-success'};
for(const f of Object.keys(cRows))family(f,[],[ref(I,79),...(f==='C06'||f==='C07'?[ref(I,97)]:[])]);
simple('C01',split(cRows.C01),['02']);simple('C02',split(cRows.C02),['02']);
for(const b of split(cRows.C03))for(const field of ['image','se'])add('C03',b,'formal',field,'expected',[b==='repeated-command'?'13':field==='image'?'04':'05']);
for(const [b,owner] of [['two-callers','10'],['common-independent-root','10'],['repeated-enemy','08'],['repeated-tileset-name','06'],['repeated-common-effect','11']])simple('C04',[b],[owner]);
simple('C05',['self-cycle','mutual-cycle','long-acyclic','shared-dag'],['10'],'formal',{supportingTickets:['11'],notes:['11 has a supporting graph-scenario responsibility; no extra canonical graph ID is invented.']});
simple('C05',['dynamic-target','known-sibling'],['09','11']);
for(const q of directFields)add('C06','none-direct','formal',`${q.family}-${q.branch}-${q.field}`,'expected',[q.owner],{authority:[tableRef(I,q.family),tableRef(M,q.family)],notes:['Formal-only legal None; the source field/container remains the one named by A.']});
for(const q of reachedFields) {
  const extra={authority:[tableRef(I,q.family),tableRef(M,q.family)],notes:['Keep necessary enclosing records/relations legal; only the stated reached field changes. A/B representations do not multiply C cases.']};
  add('C06','none-indirect','formal',q.fieldToken,'expected',[q.owner],extra);
  for(const b of ['field-missing','field-wrong-type','field-empty','file-missing',...(q.fixedTargetApplicable?['target-missing']:[])])add('C07',b,'formal',q.fieldToken,'expected',[q.owner],extra);
}
simple('C06',['default-page-image','default-page-route','saved-image-index'],['04']);simple('C06',['saved-audio-controls'],['05']);
simple('C08',['route-fixed','route-random','route-approach'],['04','05']);simple('C08',['tile-with-character'],['04']);
simple('C08',['autoplay-bgm-off','autoplay-bgs-off'],['07']);simple('C08',['battleback-off'],['09']);simple('C08',['false-page-condition','unreached-branch'],['02']);
simple('C09',split(cRows.C09),['08']);simple('C10',['unrelated-animation','unrelated-field'],['06']);simple('C10',['unrelated-actor','troop-host-only'],['08']);
simple('C11',['script-command'],['02','12']);simple('C11',['route-script'],['04','12']);simple('C11',['plugin-command','unknown-raw'],['02']);
simple('C11',['recognized-raw'],['02','05'],'raw',{supportingTickets:['12'],notes:['12 may prove non-bypass of malformed recognized structure here or in its dedicated D02.structure-error; do not require an extra registration.']});
simple('C12',['plugin-declaration'],['02']);simple('C12',['enemy-ai'],['08']);simple('C12',['initial-equipment'],['11']);simple('C12',['transfer-network'],['07']);simple('C12',['hardcoded-system','terrain-background','battle-test-background'],['09']);
simple('C13',['check-success','check-failure'],['13']);simple('C13',['push-success'],['14']);

// F: all bounded facts. The F07 suffix notation below is this plan's encoding,
// while semanticKey is the authority-derived identity, independent of spelling.
const fRows={F01:'image,bgm,bgs,me,se,movie',F02:'audio-m4a-only,movie-mp4-only,image-encrypted-only,audio-encrypted-only,other-only,exact-plus-alternative',
 F03:'top-directory-case,category-directory-case,stem-case,extension-case,exact-plus-case-variant,multiple-case-variants',
 F04:'chinese,space,whitespace-only,dot,dollar,bang,trailing-space-stem,trailing-dot-stem',F05:'double-extension,unicode-distinct',
 F06:'image-percent,image-hash,audio-percent,audio-hash,literal-percent20,movie-percent,movie-hash',
 F07:'slash,backslash,absolute,drive-relative,parent-traversal,forbidden-character,control-character,device-name,device-name-extension,device-name-case',
 F08:'missing-category,missing-file,directory-is-file,file-is-directory',F09:'root-alias,top-symlink,category-junction,file-symlink,link-in-root,link-outside-root,dangling-link',
 F10:'hard-link,zero-byte,metadata-only',F11:'enumerate-denied,metadata-denied,io-failure',F12:'disappears-after-enumeration,type-changes-during-query',
 F13:'images-absent,images-false,images-true,images-null,images-number,images-string,audio-absent,audio-false,audio-true,audio-null,audio-number,audio-string',
 F14:'no-images-use,no-audio-use,movie-only,no-www-fallback,no-other-root'};
for(const f of Object.keys(fRows))family(f,[],[ref(I,101),...(f==='F07'?[ref(I,120),ref('.scratch/asset-validation/issues/03-asset-file-existence-contract.md',179)]:[])]);
for(const b of split(fRows.F01))simple('F01',[b],[b==='image'?'02':'05'],'filesystem');
for(const b of split(fRows.F02))simple('F02',[b],[['image-encrypted-only','other-only','exact-plus-alternative'].includes(b)?'03':'05'],'filesystem');
for(const f of ['F03','F04','F05'])simple(f,split(fRows[f]),['03'],'filesystem');
for(const b of split(fRows.F06))simple('F06',[b],[['image-percent','image-hash','literal-percent20'].includes(b)?'03':'05'],b.startsWith('audio-')?'filesystem':'input',{authority:[ref(I,124,128)]});
simple('F07',['slash','backslash','absolute','drive-relative','parent-traversal'],['03'],'input');
const forbidden=[0x003c,0x003e,0x003a,0x0022,0x002f,0x005c,0x007c,0x003f,0x002a];
const controls=Array.from({length:32},(_,i)=>i);
const devices=['CON','PRN','AUX','NUL',...Array.from({length:9},(_,i)=>`COM${i+1}`),...Array.from({length:9},(_,i)=>`LPT${i+1}`),'COM¹','COM²','COM³','LPT¹','LPT²','LPT³'];
for(const [b,points] of [['forbidden-character',forbidden],['control-character',controls]])for(const cp of points) {
  const codepoint=`U+${cp.toString(16).toUpperCase().padStart(4,'0')}`;
  add('F07',b,'input',`case-u${cp.toString(16).padStart(4,'0')}`,'expected',['03'],{semanticSuffix:true,semanticKey:{family:'F07',branch:b,representation:'input',codepoint,result:'expected'},notes:['Suffix uses this plan-only case-uXXXX lower-hex convention. Authority fixes the codepoint, but does not fix separators/case. Ticket17 must map to the existing spelling without aliases or new tests.']});
}
for(const b of ['device-name','device-name-extension','device-name-case'])for(const device of devices)add('F07',b,'input',`case-${device}`,'expected',['03'],{semanticSuffix:true,semanticKey:{family:'F07',branch:b,representation:'input',deviceLiteral:device,result:'expected'},notes:['Suffix uses this plan-only case-<literal-device> convention. Branch encodes plain/extension/case variant; exact input casing/extension remains a sample choice preserving the listed device semantic key. Ticket17 must map the existing spelling one-to-one.']});
simple('F08',split(fRows.F08),['02'],'filesystem');simple('F09',split(fRows.F09),['03'],'filesystem');
simple('F10',['hard-link','zero-byte'],['03'],'filesystem');simple('F10',['metadata-only'],['03'],'injected');simple('F11',split(fRows.F11),['03'],'injected');simple('F12',split(fRows.F12),['03'],'injected');
for(const b of split(fRows.F13))simple('F13',[b],[b.startsWith('images-')?'02':'05'],'input');
simple('F14',['no-images-use'],['02'],'input');simple('F14',['no-audio-use','movie-only'],['05'],'input');simple('F14',['no-www-fallback','no-other-root'],['03'],'filesystem');

// D: representation native is a canonical token, not a native runtime claim.
const dRows={D01:'ordinary,candidate,inactive',D02:'ordinary,candidate,inactive,exception',D03:'eligible,exact-namespace,case-distinct,space-distinct,suffix-distinct,encoding-distinct',
 D04:'invalid-category,invalid-folder,category-folder-mismatch,empty-name,missing-name,missing-reason,blank-reason,duplicate,unknown-field',
 D05:'repaired,unused,warning-only,incomplete',D06:'mixed-levels,multiple-files,same-file-two-groups',D07:'shared-directory-failure,shared-field-failure,invalid-target',
 D08:'independent-results,early-config,early-structure,early-reference',D09:'map-page,nested-body,route,common-definition,shared-callers,reliable-source,unknown-source',
 D10:'cli-error,cli-warning,cli-exception,cli-dynamic,cli-cycle-relations,cli-unchecked-warning,cli-query-failure'};
for(const f of Object.keys(dRows))family(f,['12'],[ref(I,132),ref(I,153,157)]);
for(const [b,reps] of [['ordinary',['direct-formal','direct-raw','indirect-formal','indirect-raw']],['candidate',['indirect-formal','indirect-raw']],['inactive',['page','indirect-formal','indirect-raw']]])for(const r of reps)for(const field of ['missing','name-mismatch','wrong-type'])add('D01',b,r,field,'expected',undefined,{authority:[ref(I,149)]});
for(const b of split(dRows.D02))for(const field of ['unsupported-name','unsupported-link','encrypted','required-field','unqueryable','inconsistent'])add('D02',b,'native',field,'expected');
simple('D02',['reference-error','structure-error','script-gate'],undefined,'native');
for(const field of ['missing','name-mismatch','wrong-type'])add('D03','eligible','native',field,'expected');
simple('D03',['exact-namespace','case-distinct','space-distinct','suffix-distinct','encoding-distinct'],undefined,'native');
for(const f of ['D04','D05','D06','D07','D08','D10'])simple(f,split(dRows[f]),undefined,'native');
for(const b of split(dRows.D09))simple('D09',[b],undefined,'native',{supportingTickets:['common-definition','shared-callers','unknown-source'].includes(b)?['10']:[],notes:['common-definition','shared-callers','unknown-source'].includes(b)?['12 extends the existing sole callback and migrates historical formal spelling once; keep prior assertions and historical receipts.']:[]});

// W: explicit api/cli dimensions; no fourth W11 asset gate is created.
const wRows={W01:'initial,fresh,stale',W02:'delete-before-gate,repair-before-gate,delete-after-check,stable-warning',W03:'error-at-gate,repair-before-gate',
 W04:'delete-after-check-before-manifest,publication-io-failure',W05:'error-after-staging,repair-after-staging',W06:'delete-after-writes,type-change-after-writes',
 W07:'no-diff-asset-error,no-diff-data-drift',W08:'delete-diff-push-repair',W09:'animation-rename-unpulled,tileset-rename-unpulled,after-pull-recompile',
 W10:'content,size,mtime,file-identity,unrelated-directory-entry',W11:'presence,case-match,path-type,path-link,queryability,failure-location,improvement',
 W12:'same-pass-reuse,next-command-fresh',W13:'source,validation-dependency,config,exception,snapshot,generated,binding',
 W14:'exception-change,pull,rebind,contract-change,check-does-not-refresh',W15:'all-generated-missing-asset,all-snapshot,mixed,missing,unknown',
 W16:'stale-original-basis,changed-current-config',W17:'clone,pull,decompile,diff',W18:'concurrent-workspace,pending-non-push,pending-rebind',
 W19:'compile-success,compile-failure,push-success,push-failure,recovery',W20:'generated-roots-and-relations,no-dsl-reevaluation,no-historical-report'};
const wOwner={W01:'13',W02:'13',W03:'13',W04:'13',W05:'14',W06:'15',W07:'14',W08:'14',W09:'13',W10:'13',W12:'13',W15:'16',W16:'16',W17:'13',W18:'16',W20:'14'};
for(const f of Object.keys(wRows))family(f,wOwner[f]?[wOwner[f]]:[],[ref(I,161,163),ref(I,188)]);
for(const state of split(wRows.W01))for(const result of ['success','error','warning'])for(const rep of ['api','cli'])add('W01',`${state}-${result}`,rep,'case','expected');
for(const f of Object.keys(wOwner).filter(f=>f!=='W01')) {
  const branches=split(wRows[f]);
  for(const b of branches)simple(f,[b],undefined,'api',{supportingTickets:f==='W12'&&b==='next-command-fresh'?['14']:f==='W16'?['12']:[],notes:f==='W12'&&b==='next-command-fresh'?['14 must also prove a fresh Push command, either here by extension or in W20. No duplicate canonical registration.']:f==='W16'?['12 supplies historical-format/hash compatibility only;16 owns actual recovery execution and both canonical W16 scenarios. This support reference does not claim12 registered or executed W16.']:[]});
  if(['W02','W03','W04','W05','W06','W07','W08','W15','W20'].includes(f))simple(f,[branches[0]],undefined,'cli');
}
for(const b of split(wRows.W11))for(const gate of ['check-gate','compile-gate','push-gate'])add('W11',b,'api',gate,'expected',[gate==='push-gate'?'14':'13']);
for(const b of split(wRows.W13))for(const phase of ['prewrite','postwrite'])for(const rep of b==='source'?['api','cli']:['api'])add('W13',b,rep,phase,'expected',[phase==='prewrite'?'14':'15']);
for(const b of split(wRows.W14))simple('W14',[b],[b==='exception-change'?'12':'13'],'api');
for(const b of split(wRows.W19))simple('W19',[b],b.startsWith('compile-')?['13']:b==='recovery'?['16']:b==='push-failure'?['14','15']:['14'],'api',{supportingTickets:b==='push-success'?['15']:[],notes:b==='push-failure'?['One canonical ID includes 14 prewrite and 15 genuine postwrite compilation-input/data-evidence failure scenarios. Postwrite asset-only changes belong to successful W06; field remains case.']:[]});

// N: samples are subordinate obligations and never multiply canonical identities.
const nRows={N01:['01',['image-png','audio-ogg','movie-webm']],N02:['01',['chinese','space','audio-percent','audio-hash']],
 N03:['06',['animation-images','animation-timing-se']],N04:['07',['change-tileset','page-tile']],N05:['08',['enemy-front','enemy-side']],N06:['08',['runtime-overrides-initial-candidate']]};
for(const [f,[owner,branches]] of Object.entries(nRows)) {
  family(f,[owner],[ref(I,192),ref(M,153),...(f==='N02'?[ref(I,203),ref(M,164)]:[])]);
  for(const b of branches) {
    const samples=f==='N02'&&['chinese','space'].includes(b)?['image','audio','movie']:f==='N02'&&b==='audio-percent'?['ordinary literal percent','literal percent20 encoded-looking name']:f==='N04'&&b==='page-tile'?['legal B tileId','legal C tileId','legal D tileId','legal E tileId']:f==='N03'&&b==='animation-images'?['image1','image2']:f==='N03'&&b==='animation-timing-se'?['at least timing SE0','at least timing SE1']:[];
    add(f,b,'native-run','case','observed',undefined,{samples,notes:['The observed result token prescribes the evidence kind; this plan does not assert that execution has occurred.']});
  }
}

cases.sort((a,b)=>a.id.localeCompare(b.id,'en'));
const ids=new Set(cases.map(x=>x.id));
if(ids.size!==cases.length)throw new Error('Duplicate planned ID');
const expectedCounts={A01:2,A02:4,A03:4,A04:4,A05:4,A06:4,A07:4,A08:4,A09:4,A10:4,A11:4,A12:4,A13:8,A14:4,A15:12,A16:4,A17:6,A18:6,
 B01:32,B02:36,B03:16,B04:8,B05:16,B06:16,B07:4,B08:48,B09:8,B10:8,B11:4,B12:12,B13:16,B14:8,B15:4,B16:8,
 C01:5,C02:3,C03:6,C04:5,C05:6,C06:90,C07:304,C08:9,C09:2,C10:4,C11:5,C12:7,C13:3,
 F01:6,F02:6,F03:6,F04:8,F05:2,F06:7,F07:130,F08:4,F09:7,F10:3,F11:3,F12:2,F13:12,F14:5,
 D01:27,D02:27,D03:8,D04:9,D05:4,D06:3,D07:3,D08:4,D09:7,D10:7,
 W01:18,W02:5,W03:3,W04:3,W05:3,W06:3,W07:3,W08:2,W09:3,W10:5,W11:21,W12:2,W13:16,W14:5,W15:6,W16:2,W17:4,W18:3,W19:5,W20:4,N01:3,N02:4,N03:2,N04:2,N05:2,N06:1};
const perFamily=Object.fromEntries(Object.keys(expectedCounts).map(f=>[f,cases.filter(c=>c.family===f).length]));
for(const [f,n] of Object.entries(expectedCounts))if(perFamily[f]!==n)throw new Error(`${f}: ${perFamily[f]} != ${n}`);
if(cases.length!==1209||Object.keys(perFamily).length!==97||directFields.length!==23||reachedFields.length!==63)throw new Error('Independent dimension sanity check failed');
const perGroup=Object.fromEntries(['A','B','C','F','D','W','N'].map(g=>[g,cases.filter(c=>c.family.startsWith(g)).length]));
const priorFiles=['planned-acceptance-ids-06-11.json','planned-acceptance-ids-12-16.json'];
const comparisons=[];
for(const file of priorFiles) {
  const bytes=readFileSync(path.join(priorDirectory,file));const prior=JSON.parse(bytes);
  const oldRows=prior.cases;const oldIds=new Set(oldRows.map(x=>x.id));
  comparisons.push({file,sha256:sha(bytes),comparisonScope:'Every prior catalog row, not full-plan difference outside that earlier scope',priorCatalogRows:oldRows.length,
    matchedCurrentIds:oldRows.filter(x=>ids.has(x.id)).length,priorIdsAbsentFromCurrentPlan:[...oldIds].filter(id=>!ids.has(id)),
    currentPrimaryRowsOutsidePriorCatalog:cases.filter(c=>!oldIds.has(c.id)).length,
    priorUnresolvedCandidates:(prior.unresolvedCases??[]).map(x=>({id:x.id,previousStatus:x.status,currentDisposition:'N/A: current root host carrier is not an independently deletable fixed database-target relationship; excluded from current canonical obligations'})),
    caveat:'This compares independent planning documents only; it does not inspect test registration, execution receipts, actual coverage, or completion.'});
}
const retiredHistory=[
 ...['image-percent','image-hash','literal-percent20'].map(b=>({id:`AV.F06.${b}.filesystem.case.expected`,disposition:'retired-history-only',replacementId:`AV.F06.${b}.input.case.expected`,owner:'03',authority:[ref(I,124,126)],preservation:'Keep the six source/built not-executed-policy-pending historical receipts unchanged; no alias or retroactive pass.'})),
 ...['image-percent','image-hash'].map(b=>({id:`AV.N02.${b}.native-run.case.observed`,disposition:'retired-history-only',replacementId:null,owner:'01',authority:[ref(I,203),ref(M,164)],preservation:'Keep original 15 samples: 13 successes, 2 counterexamples, ordinary-percent image success, and causal controls. These excluded images are not current native-success obligations.'})),
 ...['common-definition','shared-callers','unknown-source'].map(b=>({id:`AV.D09.${b}.formal.case.expected`,disposition:'historical-id-spelling-migrated-once',replacementId:`AV.D09.${b}.native.case.expected`,owner:'12',authority:[ref(I,153,157)],preservation:'Preserve historical receipts and prior assertions; do not register a formal/native alias pair.'}))
];
const notApplicable=['battleback1','battleback2'].map(field=>({id:`AV.C07.target-missing.formal.B14-map-battle-background-${field}.expected`,disposition:'N/A-not-a-canonical-obligation',authority:[ref(I,71),ref(I,89),ref(M,64)],reason:'B14 follows the current Map Event host carrier, not an independently selected fixed database target; removing the carrier fails an earlier existing host/reference prerequisite. No asset-target missing pass is fabricated.',resolutionPointer:'M:/Shuen/Codex/asset-validation-notes/09-host-target-applicability.md'}));
const supplemental=[...['image-candidate','image-inactive'].map(b=>({id:`AV.F06.${b}.input.case.expected`,owner:'03',status:'declared-supplementary-not-in-1209',authority:[ref(I,128)]}))];
const discrepancies=[
 {kind:'identity-spelling-gap',scope:'F07 125 suffix-expanded cases (9 forbidden,32 controls,84 devices); five standalone path-form IDs have exact authority tokens',finding:'Authority requires a concrete Unicode/device suffix but does not prescribe separator, Unicode marker, or case. This plan serializes case-uXXXX (lower hex) and case-<uppercase literal device> only as its own notation.',action:'17 must build an injective/surjective mapping from each existing canonical spelling to the independent semanticKey, preserving every literal codepoint/device and all three device branches. Pure spelling differences are not behavior gaps. Do not create aliases, edit authority, or rename existing registrations now.'},
 {kind:'historical-pending-to-N/A',scope:'Prior06–11 unresolvedCases (2 B14 host-target IDs)',finding:'Prior plan already excluded them from its 644 primary and647 catalog rows. Current disposition is N/A, leaving counts unchanged.',action:'Keep the provisional candidates in the notApplicable table; do not demand or invent missing-asset passes.'},
 ...[[244,'repeated-command','C03 repeated-command'],[289,'无额外素材门槛','W11 prewrite gate and postwrite no-scan proof'],[290,'same-pass-reuse／next-command-fresh','W12 same-pass reuse / next-command fresh']].map(([line,accepted,label])=>({kind:doc(O).lines[line-1].includes(accepted)?'ownership-summary-aligned':'outdated-ownership-summary',scope:`${O}:${line}`,finding:doc(O).lines[line-1],action:`Preserve ${label}; do not restore withdrawn checkpoint IDs or add a postwrite asset gate.`})),
 {kind:'prior-source-pointer-drift',scope:'Prior independent06–11 and12–16 plans',finding:'Their stored source hashes and line numbers retain older documentation snapshots; each source attached to this plan is read at its explicit authorityRevision.',action:'Use this plan’s SHA256 and line pointers for the requested execution freeze; audit execution separately.'}
];
const ownerMembershipComparison=[];
for(const [file,scope] of [['planned-acceptance-ids-06-11.json',['06','07','08','09','10','11']],['planned-acceptance-ids-12-16.json',['12','13','14','15','16']]]) {
 const old=JSON.parse(readFileSync(path.join(priorDirectory,file),'utf8')); const oldSet=new Set(old.cases.map(c=>c.id));
 for(const ticket of scope)for(const [key,property] of [['primaryIds','primaryTickets'],['supportingIds','supportingTickets']]) {
  const previous=new Set(old.tickets[ticket][key]??[]);const current=new Set(cases.filter(c=>oldSet.has(c.id)&&c[property].includes(ticket)).map(c=>c.id));
  ownerMembershipComparison.push({file,ticket,role:key,previousCount:previous.size,currentCount:current.size,priorIdsAbsentFromCurrentRole:[...previous].filter(id=>!current.has(id)),currentIdsAbsentFromPriorRole:[...current].filter(id=>!previous.has(id))});
 }
}
const priorDimensionPlanComparison=[
 {file:'planned-acceptance-a-f-dimensions.md',sha256:sha(readFileSync(path.join(priorDirectory,'planned-acceptance-a-f-dimensions.md'))),priorManuallyReadCounts:{A:86,F:201},independentlyExpandedCurrentCounts:{A:perGroup.A,F:perGroup.F},countDiscrepancies:[]},
 {file:'planned-full-family-counts.md',sha256:sha(readFileSync(path.join(priorDirectory,'planned-full-family-counts.md'))),priorManuallyReadCounts:{A:86,B:244,C:449,F:201,D:99,W:116,N:14,total:1209},independentlyExpandedCurrentCounts:{...perGroup,total:cases.length},countDiscrepancies:[]}
];
const perTicket=Object.fromEntries(Object.keys(issueNames).map(n=>[n,{primaryIds:cases.filter(c=>c.primaryTickets.includes(n)).map(c=>c.id),supportingIds:cases.filter(c=>c.supportingTickets.includes(n)).map(c=>c.id)}]));
const plan={schemaVersion:1,title:'Final independent full-family canonical identity plan',preparedAt:'2026-11-02',authorityRevision:revision,
 status:'authority-reexpansion-only-not-execution-verdict',purpose:'Independently transcribe all finite obligations at the explicit execution freeze; supply owners, required entry axes and source pointers to ticket17 execution and semantic audits.',
 boundaries:{productOrTestFilesEditedByThisProgram:false,productTestsRunByThisProgram:false,productCollectorsOrConstantsUsedForExpectations:false,testNamesOrReceiptsUsedAsSpecification:false,existingExecutionEvidenceInspectedByThisProgram:false,previousPlansComparedOnlyAfterIndependentExpansion:true,outputDirectory:'.scratch/asset-validation-implementation/evidence/17-raw',ticket17StateAndExecutionAuditedSeparately:true},
 counts:{families:97,independentSemanticObligations:1209,automated:1195,native:14,sourceBuiltIsReceiptAxis:true,exactAuthorityTokenIds:1084,planEncodedF07SuffixIdsRequiringOneToOneSpellingMap:125,perGroup,perFamily},
 identityRules:{format:'AV.<family>.<branch>.<representation>.<field>.<result>',defaults:['base','native','case','expected'],cartesianRule:'Expand only explicitly paired factors; do not create raw page/autonomous representations.',f07PlanEncoding:'case-uXXXX with lower hexadecimal for Unicode cases; case-<uppercase literal device> for device branches. This is a plan notation, not an assertion about existing canonical spelling.',f07RequiredSemanticMapping:'125 complete semantic keys must each map to one and only one existing canonical spelling at17; aliases and missing/repeated codepoints/devices are invalid.',receiptRule:'source/built never changes a canonical ID. N samples, two animation images/SE timings, B–E page-tile samples and owner scenarios do not multiply IDs.',ownershipRule:'primaryTickets are required behavioral owners; supportingTickets record explicit cooperation without multiplying IDs or introducing unconditional extra scenarios. Optional proof alternatives are explained on the row.'},
 executionAuditNextSteps:[`Use final authoritative matrix/index and ticket ownership at the explicit freeze ${revision}; this plan alone is not an execution audit.`,'Map every expected semantic ID to registered tests and source/built/native receipts using independent expectations.','Resolve F07 spelling one-to-one independently of behavior; never infer completeness from family/total counts.','Check hashes, environment, required entry methods, exact assertions and all samples before assessing actual status.','Separate pass/failure/not-executed/capability limits and historical/supplementary records; no product acceptance is claimed here.'],
 reachedFieldMappings:reachedFields,directNoneFieldMappings:directFields,families:Object.values(familyMeta),cases,perTicket,retiredHistory,notApplicable,supplementaryDeclaredByCurrentIndex:supplemental,
 priorIndependentPlanComparison:comparisons,ownerMembershipComparison,priorDimensionPlanComparison,discrepancies,
 authoritySources:[...docs.values()].map(({lines,...rest})=>rest)};
const jsonPath=path.join(out,'final-canonical-id-plan.json');
writeFileSync(jsonPath,JSON.stringify(plan,null,2)+'\n','utf8');
const sourceLabel=r=>`${r.path}:${r.line}${r.endLine!==r.line?`–${r.endLine}`:''}`;
const md=[];
md.push('# 全量 canonical ID 独立计划与差异报告','',`权威快照：\`${revision}\`。本程序逐项独立转录当前验收矩阵／子用例索引与责任票，不导入产品／测试、不运行产品命令、不读取执行回执。所有实际状态均为 **未在本计划中审计**，票17的领取状态和已执行命令由独立验收工件记录。JSON 是逐项机器可读目录，本文件也逐项列出1209个计划身份；这不是产品完成或验收通过声明。`,'',
 '**身份拼写限制：** 1209项语义义务完整，其中1084项的ID由权威token及固定默认值直接确定。F07另125项由权威明确到具体字符／设备名，但未规定后缀分隔及大小写；本计划使用 `case-uXXXX` 小写十六进制和 `case-<大写设备名原文>`，仅为计划编码。票17将既有canonical spelling与JSON中独立semanticKey逐项一对一映射。纯拼写差异不能当行为缺口，也不能注册别名或跳过逐字符核验。F07五个独立路径形式分支不存在此后缀歧义。','',
 'source／built 是回执轴，不增加ID。N组媒体、B–E图块、多timing样本和共享票场景都不能扩大或替代canonical身份。D02–D10的native仅是表示token，D10仍须实际CLI。','',
 '## 数量与责任','', '| 组 | 族数 | 独立ID／语义义务 |','| --- | ---: | ---: |');
for(const g of ['A','B','C','F','D','W','N'])md.push(`| ${g} | ${Object.keys(perFamily).filter(f=>f.startsWith(g)).length} | ${perGroup[g]} |`);
md.push('| 合计 | 97 | 1209 |','','自动化1195，原生14。A86；B244；C449（C06=90，C07=304）；F201（F07=130）；D99；W116。直接None映射23，间接到达字段63。C07四类字段／文件变体各63，再加52个适用固定目标；System直接字段9和B14宿主字段2不生成target-missing。','',
 '| 责任票 | 主责身份数 | 协作身份数 |','| --- | ---: | ---: |');
for(const [n,v]of Object.entries(perTicket).sort(([a],[b])=>a.localeCompare(b)))md.push(`| ${n} | ${v.primaryIds.length} | ${v.supportingIds.length} |`);
md.push('','多票共享身份只计一次；主责票数相加不等于1209。协作项是同一callback的责任引用，不能另注册同ID测试。C11 recognized-raw的12结构不可绕过义务可由D02结构分支证明，不无条件要求重复场景。','',
 '## 独立旧计划对账','', '| 旧计划 | 旧目录项 | 在当前计划中逐ID命中 | 不在当前计划中的旧ID |','| --- | ---: | ---: | ---: |');
for(const c of comparisons)md.push(`| ${c.file} | ${c.priorCatalogRows} | ${c.matchedCurrentIds} | ${c.priorIdsAbsentFromCurrentPlan.length} |`);
md.push('','06–11的644主责身份与3个D09协作引用构成647项旧目录，均逐ID命中；12–16的215项也全部命中。在各旧计划所覆盖目录内，06–16逐票的主责／协作身份集合也一致，JSON列出22个责任集合对账。W16两个ID保留12的历史格式／hash兼容支持引用，恢复执行仍全归16；未把该支持写成12执行W16。两个B14旧未决候选原本未计入644／647，现明确N/A；该处不减少当前义务数量。A/F维度旧计划的86／201、全族计数旧计划的1209也与独立展开一致。此对账只比较计划，不比较测试或回执。','',
 '## 差异与17独立核验','');
for(const d of discrepancies)md.push(`- **${d.kind}**（${d.scope}）：${d.finding} ${d.action}`);
md.push('','## 已退役／历史身份','', '| 历史ID | 当前处置／替代 |','| --- | --- |');
for(const h of retiredHistory)md.push(`| \`${h.id}\` | ${h.disposition}${h.replacementId?`; → \`${h.replacementId}\``:''}；${h.preservation} |`);
md.push('','历史F06三个filesystem身份的六条待决回执须原样保留；新input ID单独验证。N02两个旧图片身份不再要求支持域成功，原始成功、反例及因果对照事实均保留。D09三个formal旧名只迁移一次到native，不能并存别名。','',
 '## 不适用候选与补充回归','');
for(const n of notApplicable)md.push(`- \`${n.id}\`：N/A。${n.reason}`);
for(const n of supplemental)md.push(`- \`${n.id}\`：当前索引128行声明的补充回归，责任03，单列而不计入1209。`);
md.push('','## 每项必需入口轴','',
 '下表入口以 `source+built` 表示两个回执变体，身份不翻倍。普通A/B/C/F/D要求真实Workspace API及独立语义断言，实际CLI在套件层提供代表覆盖；权威没有要求所有这些ID各自再扩出CLI身份。F06三个新图片input身份明确要求每项同时经公共API与实际CLI。D10每项实际CLI；D06同目标双组为内部独立聚合输入。W的api／cli表示按索引明确展开，只有指定分支重复CLI；N用有效媒体记录原生请求及文件定位，不设source／built变体。JSON逐项附有入口规则出处、完整语义键、原文引用及SHA256。','',
 '## 逐项计划目录','');
for(const f of Object.keys(expectedCounts)) {
  md.push(`### ${f}（${perFamily[f]}项）`,'',`行为权威：${sourceLabel(tableRef(I,f))}；规范：${sourceLabel(tableRef(M,f))}。`,'','| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |','| --- | --- | --- | --- |');
  for(const c of cases.filter(c=>c.family===f))md.push(`| \`${c.id}\` | ${c.primaryTickets.join(',')}${c.supportingTickets.length?`／${c.supportingTickets.join(',')}`:''} | ${c.requiredEntryAxes.receiptEntries.join('+')}；${c.requiredEntryAxes.requiredMethods.join('+')} | ${c.idSpellingStatus.startsWith('plan-')?'计划编码，按semanticKey核验':'权威token／默认值'} |`);
  md.push('');
}
md.push('## 权威文件指纹','', '| 文件 | SHA256 | 字节数 |','| --- | --- | ---: |');
for(const d of plan.authoritySources)md.push(`| ${d.path} | \`${d.sha256}\` | ${d.byteLength} |`);
md.push('','## 后续使用边界','');
for(const s of plan.executionAuditNextSteps)md.push(`- ${s}`);
md.push('','此计划的结构核验仅检查独立展开、唯一性、97族和计数一致，以及与旧独立计划逐ID对账；未执行任何产品／原生测试，未检查实际覆盖或回执真伪。');
const mdPath=path.join(out,'final-canonical-id-plan.md');writeFileSync(mdPath,md.join('\n')+'\n','utf8');
console.log(JSON.stringify({revision,counts:plan.counts,comparison:comparisons.map(({file,priorCatalogRows,matchedCurrentIds,priorIdsAbsentFromCurrentPlan})=>({file,priorCatalogRows,matchedCurrentIds,priorIdsAbsentFromCurrentPlan})),outputs:[{path:jsonPath,bytes:readFileSync(jsonPath).length,sha256:sha(readFileSync(jsonPath))},{path:mdPath,bytes:readFileSync(mdPath).length,sha256:sha(readFileSync(mdPath))}]},null,2));
