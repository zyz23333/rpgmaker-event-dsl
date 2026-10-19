'use strict';
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const base = require('./mv33-r1-route-waits-delivery-v1.cjs');
const { runPair } = require('./mv33-native-pair-delivery-v1.cjs');
const extraExpected = { singleSlotScriptInBothEntrances: true, scriptThisBinding: true, noneImageKeepsIndex: true, noneSeKeepsBufferPlaying: true, realAudioSignalBeforeAfterNone: true, routeSavedStateFlags: true };
const expected = { ...base.expected, ...extraExpected };
const fullScript = ' \t\r\n' + '// movement33 single-slot retained\n'.repeat(14) + 'window.movement33ScriptTrace.push({eventId:this._eventId,correctThis:this===$gameMap.event(this._eventId),characterName:this.characterName(),characterIndex:this.characterIndex(),literal:"  \\r\\ntrailing \\t"});\r\n \t';
const script = code => ({ code: 45, parameters: [code] });
const extraForced = [
  { code: 14, parameters: [0, 0] }, { code: 29, parameters: [6] }, { code: 30, parameters: [1] },
  { code: 31 }, { code: 32 }, { code: 33 }, { code: 34 }, { code: 35 }, { code: 36 },
  { code: 37 }, { code: 38 }, { code: 39 }, { code: 40 },
  { code: 27, parameters: [6] }, { code: 28, parameters: [6] },
  { code: 42, parameters: [1] }, { code: 42, parameters: [255] },
  { code: 43, parameters: [3] }, { code: 43, parameters: [0] },
  { code: 41, parameters: ['Actor1', 7] },
  { code: 44, parameters: [{ name: 'Movement33LongControl', volume: 80, pitch: 100, pan: 0 }] },
  { code: 15, parameters: [30] },
  script('window.movement33BeforeNoneBuffer=AudioManager._seBuffers[0];window.movement33AudioPhase="before-none";'),
  { code: 15, parameters: [15] },
  { code: 41, parameters: ['', 7] },
  { code: 44, parameters: [{ name: '', volume: 17, pitch: 73, pan: -41 }] },
  script('window.movement33State={name:this.characterName(),index:this.characterIndex(),sameBuffer:AudioManager._seBuffers.length===1&&AudioManager._seBuffers[0]===window.movement33BeforeNoneBuffer,playing:window.movement33BeforeNoneBuffer&&window.movement33BeforeNoneBuffer.isPlaying(),walk:this.hasWalkAnime(),step:this.hasStepAnime(),fix:this.isDirectionFixed(),through:this.isThrough(),transparent:this.isTransparent(),opacity:this.opacity(),blend:this.blendMode(),speed:this.moveSpeed(),frequency:this.moveFrequency(),switch6:$gameSwitches.value(6)};window.movement33AudioPhase="after-none";'),
  { code: 15, parameters: [15] }, script(''), script(' \t '), script(fullScript),
];
let observer = base.observer.replace(JSON.stringify(base.expected), JSON.stringify(expected)).replace("window.nativeRouteTrace=[];", "window.nativeRouteTrace=[];window.movement33ScriptTrace=[];window.movement33AudioSamples={};var movement33Analyser=null;");
const actualExtra = `
actual.singleSlotScriptInBothEntrances=window.movement33ScriptTrace.length===2&&window.movement33ScriptTrace[0].eventId===3&&window.movement33ScriptTrace[1].eventId===2&&window.movement33ScriptTrace.every(function(t){return t.literal==="  \\r\\ntrailing \\t";});
actual.scriptThisBinding=window.movement33ScriptTrace.length===2&&window.movement33ScriptTrace.every(function(t){return t.correctThis===true;});
var m=window.movement33State||{},samples=window.movement33AudioSamples;
actual.noneImageKeepsIndex=m.name===''&&m.index===7&&window.movement33ScriptTrace[0].characterName===''&&window.movement33ScriptTrace[0].characterIndex===7;
actual.noneSeKeepsBufferPlaying=m.sameBuffer===true&&m.playing===true;
actual.realAudioSignalBeforeAfterNone=!!samples['before-none']&&!!samples['after-none']&&samples['before-none'].rms>0.00001&&samples['after-none'].rms>0.00001;
actual.routeSavedStateFlags=m.walk===false&&m.step===false&&m.fix===false&&m.through===false&&m.transparent===false&&m.opacity===255&&m.blend===0&&m.speed===6&&m.frequency===1&&m.switch6===false;
`;
assert.ok(observer.includes('}catch(assertionError)'));
observer = observer.replace('}catch(assertionError)', actualExtra + '}catch(assertionError)').replace("purpose:'Ticket33 allocated R1 route-wait delivery; not final49–54 acceptance'", "purpose:'Ticket33 allocated R6/R7 movement None/full single-slot delivery; not final49–54 acceptance'").replace('trace:tr,error:error', 'trace:tr,movement33:{scriptTrace:window.movement33ScriptTrace,state:window.movement33State,audioSamples:window.movement33AudioSamples},error:error');
const observeAudio = `
if(typeof WebAudio!=='undefined'&&WebAudio._context&&WebAudio._masterGainNode&&!movement33Analyser){movement33Analyser=WebAudio._context.createAnalyser();movement33Analyser.fftSize=2048;var sink=WebAudio._context.createGain();sink.gain.value=0;WebAudio._masterGainNode.connect(movement33Analyser);movement33Analyser.connect(sink);sink.connect(WebAudio._context.destination);}
var audioPhase=window.movement33AudioPhase;if(audioPhase&&movement33Analyser&&!window.movement33AudioSamples[audioPhase]){var values=new Float32Array(2048);movement33Analyser.getFloatTimeDomainData(values);var total=0,peak=0;for(var k=0;k<values.length;k++){total+=values[k]*values[k];peak=Math.max(peak,Math.abs(values[k]));}var bytes=Buffer.from(values.buffer);fs.writeFileSync(path.join(process.cwd(),'movement33-'+audioPhase+'.f32le'),bytes,{flag:'wx'});window.movement33AudioSamples[audioPhase]={frame:Graphics.frameCount,rms:Math.sqrt(total/values.length),peak:peak,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),samples:values.length};}
`;
observer = observer.replace("var timer=setInterval(function(){try{var scene=SceneManager._scene;", "var timer=setInterval(function(){try{var scene=SceneManager._scene;" + observeAudio);
const scenario = { ...base.scenario, slug: 'mv33-r6-r7-movement-delivery-v2', scriptPath: __filename, observer,
  plan: { expected, entry: 'Unchanged original normal-Scene R1 control plus explicit saved movement instructions', scope: 'M41 image None retains index7 on autonomous and forced routes; M44 None preserves an already-playing long SE buffer and actual mixed signal; empty/whitespace/CRLF/>12line M45 stays one string and executes natively with this binding in both entrances. Autonomous None captured in its actual M45 before the normal completion command disables that page; v1 final-page-state premise preserved as failed. Original13 R1 checks retained; no full45 runtime claim.', changes: 'Adds finite movement instructions and own passive trace/sample oracle. Passive analyser adds a zero-gain side branch while retaining original audio graph. No engine command/interpreter/Scene/RNG/wait/loader replacement.' },
  async fixture(seed) {
    const result = await base.scenario.fixture(seed);
    const map = result.carriers['Map001.json'];
    const main = map.events[1].pages[0].list;
    const forcedIndex = main.findIndex(item => item.code === 205 && item.parameters[1].wait === true);
    assert.ok(forcedIndex > 0);
    const forced = main[forcedIndex].parameters[1];
    const oldLength = forced.list.length - 1;
    forced.list.splice(forced.list.length - 2, 0, ...structuredClone(extraForced));
    main.splice(forcedIndex + 1, oldLength, ...forced.list.slice(0, -1).map(item => ({ code: 505, indent: 0, parameters: [item] })));
    const autonomous = map.events[3].pages[0].moveRoute;
    autonomous.list.splice(autonomous.list.length - 2, 0, { code: 41, parameters: ['', 7] }, { code: 44, parameters: [{ name: '', volume: 17, pitch: 73, pan: -41 }] }, script(fullScript));
    result.expected = expected;
    result.loadedCarriers = structuredClone(result.carriers);
    result.loadedCarriers['Map001.json'].meta = {};
    for (const event of result.loadedCarriers['Map001.json'].events) if (event) event.meta = {};
    result.provenance += ' Separately versioned ticket33 enrichment with independent finite expected predicates and identified private long-control SE asset.';
    return result;
  }
};
async function run() {
  const seed = JSON.parse(await fs.readFile(path.join(__dirname, 'mv33-native-seed-v1.json'), 'utf8'));
  const options = { ...base.options, seedRoot: seed.seedRoot };
  const literal = process.argv.includes('--mode=literal');
  return (literal ? require('./mv-native-literal-support-v4.cjs').runLiteral : runPair)(options, scenario);
}
if (require.main === module) run().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
module.exports = { scenario, expected, run };
