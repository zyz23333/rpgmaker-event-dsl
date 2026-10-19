const {pathToFileURL}=require('node:url');
import(pathToFileURL(require('node:path').join(__dirname,'e2-built-comparison-v2.mjs')).href).catch(error=>{console.error(error);process.exitCode=1});
