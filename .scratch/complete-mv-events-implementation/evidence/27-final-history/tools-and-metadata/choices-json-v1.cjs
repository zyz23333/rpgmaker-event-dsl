'use strict';
// JSON data encoding with the native numeric -0 value retained as the JSON token -0.
function strictJson(value) {
  if (value === null) return 'null';
  if (typeof value === 'number') return Object.is(value, -0) ? '-0' : JSON.stringify(value);
  if (typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(function(v){var encoded=strictJson(v);return encoded===undefined?'null':encoded;}).join(',') + ']';
  if (typeof value === 'object') {var parts=[];Object.keys(value).forEach(function(k){var encoded=strictJson(value[k]);if(encoded!==undefined)parts.push(JSON.stringify(k)+':'+encoded);});return '{'+parts.join(',')+'}';}
  return undefined;
}
module.exports = {strictJson};
