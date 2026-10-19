'use strict';
require('./mv33-bound-native-scenarios-v3.cjs').run('r1',__filename).catch(error=>{console.error(error.stack||error);process.exitCode=1;});
