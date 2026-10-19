/* Original acceptance observer. ES5 syntax is required by MV's bundled NW.js. */
(function () {
  var fs = require('fs');
  var path = require('path');
  var config = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'run-config.json'), 'utf8'));
  var started = Date.now();
  var stage = 'title';
  function state() {
    return {
      switches: [1, 2, 3, 4].map(function (id) { return $gameSwitches.value(id); }),
      selfSwitches: ['A', 'B', 'C', 'D'].map(function (letter) { return $gameSelfSwitches.value([1, 1, letter]); })
    };
  }
  var timer = setInterval(function () {
    try {
      if (stage === 'title' && SceneManager._scene instanceof Scene_Title) {
        DataManager.setupNewGame();
        SceneManager.goto(Scene_Map);
        stage = 'map';
      } else if (stage === 'map' && SceneManager._scene instanceof Scene_Map && $gameMap.mapId() === 1 && $gameMap.event(1)) {
        var commands = $dataCommonEvents[1].list;
        var interpreter = $gameMap._interpreter;
        var actual = { initial: state(), steps: [], final: null, isRunning: null };
        if (config.mode === 'direct') {
          interpreter.setup(commands, 1);
          for (var index = 0; index < commands.length; index++) {
            if (interpreter._index !== index) throw new Error('Unexpected interpreter index ' + interpreter._index);
            interpreter.executeCommand();
            actual.steps.push({ code: commands[index].code, state: state() });
          }
          interpreter.update();
        } else {
          interpreter.setup([{ code: 117, indent: 0, parameters: [1] }, { code: 0, indent: 0, parameters: [] }], 1);
          interpreter.update();
        }
        actual.final = state();
        actual.isRunning = interpreter.isRunning();
        var result = {
          timestamp: new Date().toISOString(), method: 'actual-native-game', origin: config.origin,
          mode: config.mode, engine: Utils.RPGMAKER_VERSION, versions: process.versions,
          scene: SceneManager._scene.constructor.name, frameCount: Graphics.frameCount,
          input: commands, expected: config.expected, actual: actual,
          passed: JSON.stringify(actual) === JSON.stringify(config.expected)
        };
        fs.writeFileSync(path.join(process.cwd(), 'runtime-result.json'), JSON.stringify(result, null, 2));
        clearInterval(timer);
        nw.App.quit();
      } else if (Date.now() - started > 30000) {
        throw new Error('Timed out at ' + stage);
      }
    } catch (error) {
      fs.writeFileSync(path.join(process.cwd(), 'runtime-failure.json'), JSON.stringify({ stage: stage, error: String(error.stack || error) }, null, 2));
      clearInterval(timer);
      nw.App.quit();
    }
  }, 100);
}());
