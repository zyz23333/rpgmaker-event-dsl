import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Usage: node run-native-media.mjs <MV runtime project> <NW Game.exe> <ffmpeg.exe> <new output directory>
const [runtime, nw, ffmpeg, outputArgument] = process.argv.slice(2);
if (!runtime || !nw || !ffmpeg || !outputArgument) throw new Error('Expected runtime, NW executable, ffmpeg and new output directory.');
const output = resolve(outputArgument);
const probe = dirname(fileURLToPath(import.meta.url));
await mkdir(output); // Never overwrite a previous run or user project.
// MV's renamed Game.exe resolves its adjacent package rather than the positional
// app argument. Isolate a copy of the shipped shell alongside this probe package.
await cp(dirname(nw), output, { recursive: true });
await cp(join(runtime, 'js'), join(output, 'js'), { recursive: true });
for (const file of ['index.html', 'native-media.js']) await cp(join(probe, file), join(output, file));
await writeFile(join(output, 'package.json'), JSON.stringify({ name: 'mv-asset-evidence', main: 'index.html', window: { show: false, width: 64, height: 64 }, 'chromium-args': '--autoplay-policy=no-user-gesture-required --disable-gpu' }));
for (const folder of ['img/pictures', 'audio/se', 'movies']) await mkdir(join(output, folder), { recursive: true });
const media = [
  ['image', ['image-png', '中文图片', 'image with space', 'literal%20image', 'image%percent', 'image#hash']],
  ['audio', ['audio-ogg', '中文音频', 'audio with space', 'literal%20audio', 'audio%percent', 'audio#hash']],
  ['movie', ['movie-webm', '中文影片', 'movie with space']]
];
const generated = [];
const green = spawnSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i', 'color=c=green:s=16x16:d=0.2', '-frames:v', '1', join(output, 'counterexample-green.png')], { windowsHide: true, encoding: 'utf8' });
if (green.status !== 0) throw new Error(green.stderr || String(green.error));
for (const [category, names] of media) {
  for (const name of names) {
    const relative = category === 'image' ? `img/pictures/${name}.png` : category === 'audio' ? `audio/se/${name}.ogg` : `movies/${name}.webm`;
    const args = category === 'image' ? ['-f', 'lavfi', '-i', 'color=c=red:s=16x16:d=0.2', '-frames:v', '1'] : category === 'audio' ? ['-f', 'lavfi', '-i', 'sine=frequency=440:duration=0.2', '-c:a', 'libvorbis'] : ['-f', 'lavfi', '-i', 'color=c=blue:s=16x16:d=0.2', '-c:v', 'libvpx', '-an'];
    const result = spawnSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', ...args, join(output, relative)], { windowsHide: true, encoding: 'utf8' });
    if (result.status !== 0) throw new Error(result.stderr || String(result.error));
    generated.push({ relative, generator: args });
  }
}
const runtimeHashes = {};
for (const file of ['rpg_core.js', 'rpg_managers.js', 'rpg_objects.js']) runtimeHashes[file] = createHash('sha256').update(await readFile(join(runtime, 'js', file))).digest('hex');
await writeFile(join(output, 'input-manifest.json'), JSON.stringify({ runtime: resolve(runtime), nw: resolve(nw), ffmpeg: resolve(ffmpeg), generatorNode: process.version, runtimeHashes, generated }, null, 2));
await new Promise((resolveRun, reject) => {
  const child = spawn(join(output, basename(nw)), [`--user-data-dir=${join(output, 'nw-profile')}`, '--enable-logging', `--log-file=${join(output, 'nw.log')}`], { cwd: output, windowsHide: true, stdio: 'ignore' });
  const timer = setTimeout(() => { child.kill(); reject(new Error('NW.js run exceeded 60 seconds.')); }, 60000);
  child.on('error', (error) => { clearTimeout(timer); reject(error); });
  child.on('exit', (code) => { clearTimeout(timer); code === 0 ? resolveRun() : reject(new Error(`NW.js exited ${code}.`)); });
});
const results = JSON.parse(await readFile(join(output, 'native-results.json'), 'utf8'));
if (results.error || results.cases.length !== 15) throw new Error(results.error || `Expected 15 native observations, got ${results.cases.length}. See ${output}.`);
const failures = results.cases.filter((item) => item.status === 'failed');
console.log(JSON.stringify({ output, environment: results.environment, observedCases: results.cases.length - failures.length, failures: failures.map((item) => ({ id: item.id, category: item.category, name: item.savedName })) }, null, 2));
if (failures.length) process.exitCode = 1;
