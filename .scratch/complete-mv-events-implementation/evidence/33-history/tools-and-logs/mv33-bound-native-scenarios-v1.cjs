'use strict';
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const bindingRoot = 'C:/Users/Shuen/.codex/tmp/mv33-native-bound-inputs-v1-5df265bb-3672-4269-8367-dbc7565b3678';
const definitions = {
  r1: { source: 'mv33-r1-route-waits-delivery-v1.cjs', slug: 'mv33-r1-route-waits-delivery-v2', hash: '8f274066974cb47a1aedd8b286db301f14f8fcd76b7dd25f88e047c5315f2fb1' },
  'r6-r7': { source: 'mv33-r6-r7-movement-delivery-v2.cjs', slug: 'mv33-r6-r7-movement-delivery-v3', hash: '9b004a42c429b56935f0a239ee36bb426a81465b9cedd2a84a8316d099a1b0d2' },
};
function createScenario(id, scriptPath) {
  const definition = definitions[id];
  assert.ok(definition);
  const prior = require(path.join(__dirname, definition.source));
  const capture = "'System.json':copy($dataSystem)}";
  assert.equal(prior.scenario.observer.split(capture).length, 2);
  const observer = prior.scenario.observer.replace(capture, "'System.json':copy($dataSystem),'Troops.json':copy($dataTroops)}");
  const bundlePath = path.join(bindingRoot, id + '-independent-input.json');
  async function readBundle() {
    const bytes = await fs.readFile(bundlePath);
    assert.equal(sha(bytes), definition.hash, 'Frozen independent input bytes must not change');
    const bundle = JSON.parse(bytes);
    assert.equal(bundle.scenario, definition.slug);
    assert.equal(bundle.sourceAdapter.sha256, sha(await fs.readFile(path.join(__dirname, definition.source))));
    assert.deepEqual(bundle.fixture.expected, prior.expected, 'Retain every original independent behavior predicate');
    assert.deepEqual(Object.keys(bundle.fixture.carriers).sort(), ['CommonEvents.json', 'Map001.json', 'System.json', 'Troops.json']);
    assert.deepEqual(bundle.fixture.loadedCarriers['Troops.json'], bundle.fixture.carriers['Troops.json']);
    assert.equal(bundle.completeInputIdentities.length, 15);
    return bundle;
  }
  const scenario = {
    ...prior.scenario,
    slug: definition.slug,
    scriptPath,
    observer,
    plan: { ...prior.scenario.plan, inputBinding: { externalBundlePath: bundlePath, sha256: definition.hash, completeGeneratedCarriers: ['CommonEvents.json', 'Map001.json', 'System.json', 'Troops.json'], change: 'Adds complete unchanged seed Troops input/output/loaded comparison and immutable independent input binding after ticket25. All prior behavior predicates and scheduling remain unchanged.' } },
    async fixture(seed) {
      const bundle = await readBundle();
      assert.equal(path.resolve(seed).toLowerCase(), path.resolve(bundle.seedRoot).toLowerCase());
      return structuredClone(bundle.fixture);
    },
    async inputBinding() {
      const bundle = await readBundle();
      return {
        independentFixture: { path: bundlePath, sha256: definition.hash },
        completeInputIdentities: bundle.completeInputIdentities,
        expectedGeneratedCarriers: Object.keys(bundle.fixture.carriers).sort(),
        retainedBehaviorPredicates: Object.keys(prior.expected),
        additionalOriginalTools: [__filename, path.join(__dirname, definition.source)],
      };
    },
  };
  return { scenario, expected: prior.expected, options: prior.options || require('./mv33-r1-route-waits-delivery-v1.cjs').options };
}
async function run(id, scriptPath) {
  const bound = createScenario(id, scriptPath);
  const seed = JSON.parse(await fs.readFile(path.join(__dirname, 'mv33-native-seed-v1.json'), 'utf8'));
  const options = { ...bound.options, seedRoot: seed.seedRoot };
  return require('./mv33-native-pair-delivery-v2.cjs').runPair(options, bound.scenario);
}
module.exports = { createScenario, run };
