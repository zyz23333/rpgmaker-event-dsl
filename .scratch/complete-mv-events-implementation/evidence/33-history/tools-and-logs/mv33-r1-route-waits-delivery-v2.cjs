'use strict';
const bound = require('./mv33-bound-native-scenarios-v1.cjs');
const scenario = bound.createScenario('r1', __filename);
if (require.main === module) bound.run('r1', __filename).catch(error => { console.error(error.stack || error); process.exitCode = 1; });
module.exports = scenario;
