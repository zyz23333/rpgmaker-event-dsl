const fs = require('node:fs');
const path = require('node:path');
const root = process.argv[2];
const paths = [
  'example/full-event/src/full-event.events.ts',
  'packages/rpgmaker-event-dsl/README.md',
  'packages/rpgmaker-event-dsl/test/common-event-workspace.test.ts',
  'packages/rpgmaker-event-dsl/test/decompiler.test.ts',
  'packages/rpgmaker-event-dsl/test/events.test.ts',
  'packages/rpgmaker-event-dsl/test/dsl.test.ts',
];
for (const rel of paths) {
  const file = path.join(root, rel); let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\bwait\((\d+)\)/g, 'wait({ frames: $1 })');
  content = content.replace(/tintScreen\(\{ tone: \[([^,]+),\s*([^,]+),\s*([^,]+),\s*([^\]]+)\]/g,
    (_,r,g,b,a) => `tintScreen({ tone: { red: ${r}, green: ${g}, blue: ${b}, gray: ${a} }`);
  content = content.replace(/color: \[255,\s*255,\s*255,\s*(128|160)\]/g,
    (_,a) => `color: { red: 255, green: 255, blue: 255, alpha: ${a} }`);
  content = content.replace('tone: { red: 0, green: 0, blue: 0, gray: 0 }, duration: 30 }', 'tone: { red: 0, green: 0, blue: 0, gray: 0 }, duration: 30, wait: false }');
  content = content.replace('color: { red: 255, green: 255, blue: 255, alpha: 128 }, duration: 20 }', 'color: { red: 255, green: 255, blue: 255, alpha: 128 }, duration: 20, wait: false }');
  content = content.replace('color: { red: 255, green: 255, blue: 255, alpha: 160 }, duration: 30 }', 'color: { red: 255, green: 255, blue: 255, alpha: 160 }, duration: 30, wait: false }');
  content = content.replace('shakeScreen({ power: 5, speed: 5, duration: 30 })', 'shakeScreen({ power: 5, speed: 5, duration: 30, wait: false })');
  content = content.replace('setWeatherEffect({ weather: "rain", power: 5, duration: 60 })', 'setWeatherEffect({ weather: "rain", power: 5, duration: 60, wait: false })');
  content = content.replace(/(flashScreen\(\{\s+color: \{[^}]+\},\s+duration: \d+,)(\s+\}\))/g, '$1\n                wait: false,$2');
  content = content.replace(/(setWeatherEffect\(\{\s+weather: "rain",\s+power: 2,\s+duration: 30,)(\s+\}\))/g, '$1\n          wait: false,$2');
  fs.writeFileSync(file, content);
}
const file = path.join(root,'packages/rpgmaker-event-dsl/test/screen-effects.test.ts');
let content=fs.readFileSync(file,'utf8').replace(/wait\(\{ frames: (1|999) \} as never\)/g,'wait({ frames: $1 })').replace('playMovie({ movie: null } as never)','playMovie({ movie: null })');
fs.writeFileSync(file,content);
