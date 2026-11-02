/* Runs inside the unmodified MV 1.6.1 NW.js shell, not Node's VM. */
(function () {
  'use strict';
  var fs = require('fs');
  var path = require('path');
  var crypto = require('crypto');
  // NW.js serves its package from a chrome-extension: origin. The runner sets
  // cwd explicitly to the isolated on-disk project, so URL.pathname is not a
  // disk path and must not be used to locate evidence or media.
  var root = process.cwd();
  var report = {
    created: new Date().toISOString(),
    environment: {
      mv: Utils.RPGMAKER_VERSION,
      platform: process.platform,
      architecture: process.arch,
      release: require('os').release(),
      versions: process.versions,
      userAgent: navigator.userAgent
    },
    method: 'Real MV 1.6.1 ImageManager, AudioManager/WebAudio and Game_Interpreter movie operations in NW.js; wrappers record arguments and delegate unchanged.',
    requests: [],
    events: [],
    cases: [],
    counterexamples: []
  };
  var current = null;
  var requestCases = {};
  function finish(error) {
    if (error) report.error = String(error.stack || error);
    fs.writeFileSync(path.join(root, 'native-results.json'), JSON.stringify(report, null, 2));
    nw.App.quit();
  }
  window.addEventListener('error', function (event) { finish(event.error || event.message); });
  function record(kind, url) {
    requestCases[url] = requestCases[url] || current;
    report.requests.push({ caseId: requestCases[url], kind: kind, requested: url, absoluteUrl: new URL(url, location.href).href });
  }
  var normalBitmap = ImageManager.loadNormalBitmap;
  ImageManager.loadNormalBitmap = function (url) { requestCases[url] = current; record('ImageManager.loadNormalBitmap', url); return normalBitmap.apply(this, arguments); };
  var requestImage = Bitmap.prototype._requestImage;
  Bitmap.prototype._requestImage = function (url) { record('Bitmap._requestImage', url); return requestImage.apply(this, arguments); };
  var open = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url) { record('XMLHttpRequest.open', url); return open.apply(this, arguments); };
  var playVideo = Graphics._playVideo;
  Graphics._playVideo = function (url) { record('Graphics._playVideo', url); return playVideo.apply(this, arguments); };
  function deadline(promise) {
    return new Promise(function (resolve, reject) {
      var timer = setTimeout(function () { reject(new Error('Native media load deadline exceeded for ' + current)); }, 10000);
      promise.then(function (value) { clearTimeout(timer); resolve(value); }, function (error) { clearTimeout(timer); reject(error); });
    });
  }
  function disk(relative) {
    var absolute = path.join(root, relative);
    var bytes = fs.readFileSync(absolute);
    return { relative: relative, absolute: absolute, bytes: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex'), ordinaryFile: fs.statSync(absolute).isFile() };
  }
  function image(name) {
    requestCases['img/pictures/' + name + '.png'] = current;
    return deadline(new Promise(function (resolve, reject) {
      var bitmap = ImageManager.loadPicture(name);
      var caseId = current;
      bitmap._image.addEventListener('error', function () {
        report.events.push({ caseId: caseId, kind: 'native-image-error', src: bitmap._image.src, width: bitmap._image.naturalWidth });
        reject(new Error('Native Image error for ' + bitmap._image.src));
      });
      bitmap.addLoadListener(function () {
        report.events.push({ caseId: caseId, kind: 'native-image-load', src: bitmap._image.src, width: bitmap._image.naturalWidth });
        resolve({ width: bitmap.width, height: bitmap.height, pixel: bitmap.getPixel(0, 0), nativeImageSrc: bitmap._image.src });
      });
    }));
  }
  function audio(name) {
    return deadline(new Promise(function (resolve) {
      var buffer = AudioManager.createBuffer('se', name);
      buffer.addLoadListener(function () { resolve({ durationSeconds: buffer._buffer.duration, sampleRate: buffer._buffer.sampleRate, channels: buffer._buffer.numberOfChannels, nativeAudioUrl: buffer._url }); });
    }));
  }
  function movie(name) {
    return deadline(new Promise(function (resolve, reject) {
      var video = Graphics._video;
      function loaded() {
        video.removeEventListener('loadeddata', loaded);
        video.pause();
        resolve({ width: video.videoWidth, height: video.videoHeight, durationSeconds: video.duration, nativeVideoSrc: video.currentSrc || video.src });
      }
      video.addEventListener('loadeddata', loaded);
      video.addEventListener('error', function () { reject(new Error('Native video media error ' + (video.error && video.error.code))); }, { once: true });
      var interpreter = new Game_Interpreter();
      interpreter._params = [name];
      interpreter.command261();
    }));
  }
  async function run() {
    Graphics.initialize(64, 64, 'canvas');
    WebAudio.initialize();
    window.$gameMessage = new Game_Message();
    var entries = [
      ['N01.image-png', 'image', 'image-png'],
      ['N01.audio-ogg', 'audio', 'audio-ogg'],
      ['N01.movie-webm', 'movie', 'movie-webm'],
      ['N02.chinese', 'image', '中文图片'],
      ['N02.chinese', 'audio', '中文音频'],
      ['N02.chinese', 'movie', '中文影片'],
      ['N02.space', 'image', 'image with space'],
      ['N02.space', 'audio', 'audio with space'],
      ['N02.space', 'movie', 'movie with space'],
      ['N02.image-percent', 'image', 'literal%20image'],
      ['N02.image-percent', 'image', 'image%percent'],
      ['N02.image-hash', 'image', 'image#hash'],
      ['N02.audio-percent', 'audio', 'literal%20audio'],
      ['N02.audio-percent', 'audio', 'audio%percent'],
      ['N02.audio-hash', 'audio', 'audio#hash']
    ];
    for (var entry of entries) {
      var familyBranch = entry[0];
      var category = entry[1];
      var name = entry[2];
      current = 'AV.' + familyBranch + '.native-run.case.observed';
      var before = report.requests.length;
      var relative = category === 'image' ? 'img/pictures/' + name + '.png' : category === 'audio' ? 'audio/se/' + name + '.ogg' : 'movies/' + name + '.webm';
      try {
        var actual = await (category === 'image' ? image(name) : category === 'audio' ? audio(name) : movie(name));
        report.cases.push({ id: current, category: category, savedName: name, disk: disk(relative), requests: report.requests.slice(before), actual: actual, status: 'observed' });
      } catch (error) {
        report.cases.push({ id: current, category: category, savedName: name, disk: disk(relative), requests: report.requests.slice(before), error: String(error.stack || error), status: 'failed' });
      }
    }
    // Independent causal checks. Keep the failed original cases above; these
    // observations are evidence of native path interpretation, not passing N02.
    for (var names of [['literal%20image', 'literal image.png'], ['image#hash', 'image']]) {
      current = 'counterexample.native-path.' + names[0];
      var alternative = path.join(root, 'img/pictures', names[1]);
      var beforeExists = fs.existsSync(alternative);
      fs.copyFileSync(path.join(root, 'counterexample-green.png'), alternative);
      ImageManager.clear();
      var firstRequest = report.requests.length;
      var loaded = await image(names[0]);
      report.counterexamples.push({ savedName: names[0], originalExactFileRetained: disk('img/pictures/' + names[0] + '.png'), alternativeAbsentBefore: !beforeExists, addedAlternative: disk('img/pictures/' + names[1]), requests: report.requests.slice(firstRequest), actual: loaded, conclusion: 'Adding only the URL-interpreted alternative makes the unchanged native operation load its green pixels; original exact-named red file remained present.' });
    }
    finish();
  }
  run().catch(finish);
}());
