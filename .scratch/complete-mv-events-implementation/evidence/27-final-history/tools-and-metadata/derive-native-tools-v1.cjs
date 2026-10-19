const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const base=path.dirname(process.argv[1]),tmp='C:/Users/Shuen/.codex/tmp',map='M:/Shuen/Codex/mv-events-implementation-20261020/map24-final';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');const receipt={at:new Date().toISOString(),inputs:[],outputs:[],transforms:[]};
function read(p){const b=fs.readFileSync(p);receipt.inputs.push({path:p,sha256:sha(b)});return b.toString('utf8')}
function write(name,s){const p=path.join(base,name);fs.writeFileSync(p,s,{flag:'wx'});receipt.outputs.push({path:p,sha256:sha(s)})}
function replace(s,a,b){assert.equal(s.split(a).length,2,'Unique transformation '+a.slice(0,100));receipt.transforms.push(a.slice(0,100));return s.replace(a,b)}
write('choices-json-v1.cjs',read(path.join(map,'map24-json.cjs')));
write('mv33-physical-isolation-v1.cjs',read(path.join(tmp,'mv33-physical-isolation-v1.cjs')));
write('choices-independent-cases-v1.cjs',read(path.join(tmp,'mv-r3-independent-cases.cjs')));
let adapter=read(path.join(map,'map24-native-pair-delivery-v2.cjs'));
adapter=replace(adapter,"require('./map24-json.cjs')","require('./choices-json-v1.cjs')");
adapter=replace(adapter,"purpose:'Map24 current built numeric correction and R1 gameplay delivery; not final49-54 acceptance'","purpose:'Ticket27 allocated R3 actual Choices native pairs with complete original predicates and finite numeric negative zero; final52 separate'");
adapter=replace(adapter,'await isolation.copyRegularTree(options.seedRoot,project);','report.fullPhysicalCopies ||= {}; report.fullPhysicalCopies[side]=await isolation.copyRegularTree(options.seedRoot,project);');
write('choices-native-pair-adapter-v1.cjs',adapter);
let s=read(path.join(tmp,'mv-r3-complete-native-control-v2.cjs'));
s=replace(s,"const { files, sha } = require('./mv-native-pair-support-v5.cjs');","const { files, sha } = require('./choices-native-pair-adapter-v1.cjs');\nconst {strictJson}=require('./choices-json-v1.cjs');");
s=replace(s,"const { runLiteral } = require('./mv-native-literal-support-v4.cjs');",'// Historical generic literal-copy path removed; export only.');
s=replace(s,"require('./mv-r3-independent-cases.cjs')","require('./choices-independent-cases-v1.cjs')");
s=replace(s,"'mv-r3-independent-cases.cjs'","'choices-independent-cases-v1.cjs'");
s=replace(s,'async function execute(original) {','async function buildScenario(original) {');
s=replace(s,'  const observer =',"  expected.savedSigns={cancel:Object.is(test.list[0].parameters[1],-0),defaultChoice:Object.is(test.list[0].parameters[2],-0)};\n  const observer =");
s=replace(s,'test=${JSON.stringify(test)},expected=${JSON.stringify(expected)}','test=${strictJson(test)},expected=${strictJson(expected)}');
s=replace(s,'function copy(value){return JSON.parse(JSON.stringify(value));}', '${strictJson.toString()}\nfunction copy(value){return JSON.parse(strictJson(value));}');
s=replace(s,'choice:choice,waitingChecks:waitingChecks};','choice:choice,waitingChecks:waitingChecks,savedSigns:{cancel:Object.is(loaded["Map001.json"].events[1].pages[0].list[1].parameters[1],-0),defaultChoice:Object.is(loaded["Map001.json"].events[1].pages[0].list[1].parameters[2],-0)}};');
s=replace(s,"'System.json':copy($dataSystem)","'System.json':copy($dataSystem),'Troops.json':copy($dataTroops)");
s=replace(s,"'runtime-result.json'),JSON.stringify(","'runtime-result.json'),strictJson(");
s=replace(s,'JSON.stringify(actual)===JSON.stringify(expected)','strictJson(actual)===strictJson(expected)');
s=s.replaceAll('R3 complete normal-Scene literal preparation v2; no product or27/28/30/52 acceptance','Ticket27 allocated R3 actual-game observation; final52 separate');
const start=s.indexOf('  const report = await runLiteral(options, scenario);'),end=s.indexOf('\n}',start);assert(start>0&&end>start);s=s.slice(0,start)+'  return {scenario,test,expected};'+s.slice(end);
s=replace(s,"(async () => { for (const test of selected) await execute(test); })().catch(error => { console.error(error.stack || error); process.exitCode = 1; });",'module.exports={buildScenario,definitions};');
write('choices-scenario-export-v1.cjs',s);
fs.writeFileSync(path.join(base,'native-tool-derivation-v1.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(receipt.outputs));
