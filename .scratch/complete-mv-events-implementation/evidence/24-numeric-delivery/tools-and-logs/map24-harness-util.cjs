'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
async function files(root){const values=[];async function walk(dir){for(const e of await fs.readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())await walk(p);else if(e.isFile())values.push(p);}}await walk(root);return values;}
module.exports={sha,files};
