'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
// Runtime report encoder follows ordinary JSON omission rules and retains numeric -0.
// Saved input is separately validated before encoding or native installation.
function strictJson(value){
 if(value===null)return'null';
 if(typeof value==='number')return Object.is(value,-0)?'-0':JSON.stringify(value);
 if(typeof value==='string'||typeof value==='boolean')return JSON.stringify(value);
 if(Array.isArray(value))return'['+value.map(function(v){var e=strictJson(v);return e===undefined?'null':e;}).join(',')+']';
 if(typeof value==='object'){var p=[];Object.keys(value).forEach(function(k){var e=strictJson(value[k]);if(e!==undefined)p.push(JSON.stringify(k)+':'+e);});return'{'+p.join(',')+'}';}
 return undefined;
}
function assertStrictInput(value,at='input',ancestors=new Set()){
 if(value===null||typeof value==='string'||typeof value==='boolean')return;
 if(typeof value==='number'){assert.ok(Number.isFinite(value),'Finite number at '+at);return;}
 assert.ok(typeof value==='object'&&value!==null,'JSON value at '+at);
 assert.ok(!ancestors.has(value),'No circular input at '+at);
 const array=Array.isArray(value),proto=Object.getPrototypeOf(value);
 assert.ok(array?proto===Array.prototype:proto===Object.prototype||proto===null,'Plain JSON object at '+at);
 ancestors.add(value);
 const descriptors=Object.getOwnPropertyDescriptors(value),keys=Reflect.ownKeys(value);
 if(array){
  assert.ok(keys.every(k=>k==='length'||typeof k==='string'&&/^(0|[1-9]\d*)$/.test(k)&&Number(k)<value.length),'No extra array keys at '+at);
  for(let i=0;i<value.length;i++){const d=descriptors[i];assert.ok(d&&'value'in d&&d.enumerable,'Dense data array at '+at+'['+i+']');assertStrictInput(d.value,at+'['+i+']',ancestors);}
 }else for(const key of keys){const d=descriptors[key];assert.ok(typeof key==='string'&&d&&'value'in d&&d.enumerable,'Own enumerable data field at '+at);assertStrictInput(d.value,at+'.'+key,ancestors);}
 ancestors.delete(value);
}
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
async function json(file,value){await fs.writeFile(file,strictJson(value)+'\n',{flag:'wx'});}
async function files(root){const result=[];async function walk(dir){for(const e of(await fs.readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){const p=path.join(dir,e.name);if(e.isDirectory())await walk(p);else if(e.isFile())result.push(p);}}await walk(root);return result;}
module.exports={files,json,sha,strictJson,assertStrictInput};
