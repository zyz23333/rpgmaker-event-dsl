'use strict';
const bound = require('./mv33-bound-native-scenarios-v1.cjs');
const scenario = bound.createScenario('r6-r7', __filename);
if (require.main === module) bound.run('r6-r7', __filename).catch(error => { console.error(error.stack || error); process.exitCode = 1; });
module.exports = scenario;
