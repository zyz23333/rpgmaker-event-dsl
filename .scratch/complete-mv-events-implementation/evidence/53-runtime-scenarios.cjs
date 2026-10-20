"use strict";
// Independent final R4/R5 controls. Importing this file does not launch a game.
const fs = require("node:fs/promises");
const path = require("node:path");
const assert = require("node:assert/strict");
const baseRoot = "M:/Shuen/Codex/mv-events-implementation-20261020";
const oldRoot = "C:/Users/Shuen/.codex/tmp";
const { files, sha } = require(baseRoot + "/final-native-pair-support-v1.cjs");
const supplements = require(baseRoot + "/final-game-supplements.cjs");
const operands = require(oldRoot + "/mv-r4-operands-native-pair.cjs");
const equipment = require(oldRoot + "/mv-r4-equipment-normal-scene-native-control-v3.cjs");
const locations = require(oldRoot + "/mv-r5-locations-normal-scene-native-control-v1.cjs");
const forceAdapters = require(oldRoot + "/mv-r2-r4-future-pair-adapters-v4.cjs");
const originalForce = require(oldRoot + "/mv-r4-force-action-range-native.cjs");
const common = require("./53-common-context-input.cjs");
const c = (code, parameters = []) => ({ code, indent: 0, parameters });
const trace = (expression) => c(355, ["window.finalTrace.push(" + expression + ");"]);
const finish = [c(355, ["window.finalDone=true;"]), c(121, [1, 1, 1]), c(0)];
const copy = (value) => structuredClone(value);

function editOwnedSources(names, commentText, expectedEdits) {
  return async (workspace) => {
    const edits = [];
    let commentsRemoved = 0;
    for (const file of await files(path.join(workspace, "src"))) {
      if (!file.endsWith(".ts")) continue;
      const before = await fs.readFile(file, "utf8");
      let after = before;
      if (commentText) {
        // This is the final named public Comment syntax, not the historical positional API.
        const escaped = JSON.stringify(commentText);
        const pattern = new RegExp(
          "^[ \\t]*comment\\(\\{\\s*lines:\\s*\\[" + escaped + "\\]\\s*\\}\\),?\\r?\\n",
          "gm",
        );
        after = after.replace(pattern, () => {
          commentsRemoved++;
          return "";
        });
      }
      for (const name of names)
        after = after.replaceAll(JSON.stringify("PAIR-SEED " + name), JSON.stringify(name));
      if (before !== after) {
        assert.ok(!after.includes("PAIR-SEED "), "Every temporary source marker must be removed");
        await fs.writeFile(file, after);
        edits.push({
          file: path.relative(workspace, file),
          beforeSha256: sha(before),
          afterSha256: sha(after),
        });
      }
    }
    assert.equal(edits.length, expectedEdits, "Actual source edits in all affected containers");
    assert.equal(
      commentsRemoved,
      commentText ? 1 : 0,
      "Exactly the independently inserted owned comment is removed",
    );
    return edits;
  };
}
function current(scenario, slug) {
  return {
    ...scenario,
    slug,
    scriptPath: __filename,
    plan: {
      ...scenario.plan,
      finalPurpose:
        "Final53 actual independent-literal versus recorded final-built product game pair; pending until executed",
    },
  };
}
function withAcceptedHpOperand(scenario, expectedReplacements) {
  return {
    ...scenario,
    async fixture(seed) {
      // Retain the original full control/oracle. Its old kill quantity is still
      // 9999999, now expressed through the accepted native variable operand.
      const value = copy(await scenario.fixture(seed));
      const adapt = (carriers) => {
        const replacements = [];
        const visit = (node, nativePath) => {
          if (!node || typeof node !== "object") return;
          if (node.code === 311 || node.code === 331) {
            const modeIndex = node.code === 311 ? 3 : 2;
            const quantityIndex = modeIndex + 1;
            if (node.parameters[modeIndex] === 0 && node.parameters[quantityIndex] === 9999999) {
              const before = copy(node.parameters);
              node.parameters[modeIndex] = 1;
              node.parameters[quantityIndex] = 99;
              replacements.push({ nativePath, before, after: copy(node.parameters) });
            }
          }
          for (const [key, child] of Object.entries(node)) visit(child, nativePath + "/" + key);
        };
        for (const [file, carrier] of Object.entries(carriers)) visit(carrier, file);
        assert.equal(
          replacements.length,
          expectedReplacements,
          "Exact legacy HP fixture adaptations",
        );
        const callers = [];
        for (const [eventIndex, event] of carriers["Map001.json"].events.entries())
          if (event)
            for (const [pageIndex, page] of event.pages.entries())
              if (page.list.some((command) => command.code === 301)) {
                page.list.unshift(c(122, [99, 99, 0, 0, 9999999]));
                callers.push(
                  "Map001.json/events/" + eventIndex + "/pages/" + pageIndex + "/list/0",
                );
              }
        assert.equal(
          callers.length,
          1,
          "One original Map caller initializes the unchanged kill value",
        );
        const variables = carriers["System.json"].variables;
        while (variables.length < 101) variables.push("");
        variables[99] = "Independent final control HP quantity";
        return { replacements, callers };
      };
      const literal = adapt(value.carriers);
      const loaded = adapt(value.loadedCarriers);
      assert.deepEqual(
        loaded,
        literal,
        "Loaded-carrier expectation includes identical adaptations",
      );
      return {
        ...value,
        nativeOperandAdaptation: {
          reason:
            "Current HP constants accept 1..9999; native variable operand retains old 9999999 effect",
          variableId: 99,
          runtimeQuantity: 9999999,
          originalFullOracleUnchanged: true,
          ...literal,
        },
      };
    },
  };
}
function commonScenario() {
  return current(
    withAcceptedHpOperand(
      {
        ...common.scenario,
        editSources: editOwnedSources(
          ["R4 Common context caller", "R4 Common shared callee"],
          "PAIR-SEED Troop owned source proof",
          3,
        ),
      },
      1,
    ),
    "final-r4-common-complete-variable99",
  );
}
function contextOperands() {
  const scenario = commonScenario();
  const expected = {
    ...common.expected,
    contextOperands: [
      {
        eventId: 7,
        inBattle: false,
        values: [0, 0, 0, 10, 8, 1, 0, 0, 1],
        erasedAfter: true,
        scrollEffect: true,
      },
      {
        eventId: 0,
        inBattle: true,
        values: [500, 500, 0, 0, 0, 1, 0, 1, 1],
        erasedAfter: null,
        scrollEffect: true,
      },
    ],
  };
  const added = [
    c(122, [20, 20, 0, 3, 4, 0, 0]),
    c(122, [21, 21, 0, 3, 4, 1, 0]),
    c(122, [22, 22, 0, 3, 4, 7, 0]),
    c(122, [23, 23, 0, 3, 5, 0, 0]),
    c(122, [24, 24, 0, 3, 5, -1, 0]),
    c(122, [25, 25, 0, 3, 6, 0, 0]),
    c(122, [26, 26, 0, 3, 6, 7, 0]),
    c(122, [27, 27, 0, 3, 7, 7, 0]),
    c(122, [28, 28, 0, 3, 7, 0, 0]),
    c(355, ["window.finalBeforeContextScroll=$gameMap._scrollRest;"]),
    c(204, [6, 2, 4]),
    c(214),
    c(355, [
      "window.finalContextOperands.push({eventId:this._eventId,inBattle:$gameParty.inBattle(),values:[20,21,22,23,24,25,26,27,28].map(function(id){return $gameVariables.value(id);}),erasedAfter:this._eventId===7?$gameMap.event(7)._erased:null,scrollEffect:$gameParty.inBattle()?$gameMap._scrollRest===window.finalBeforeContextScroll:$gameMap._scrollRest===2});",
    ]),
  ];
  let observer = scenario.observer.replace(
    "expected=" + JSON.stringify(common.expected),
    "expected=" + JSON.stringify(expected),
  );
  const oldActual =
    "traceCounts:{map:window.commonContextMapTraces.length,common:window.commonContextTrace.length}}";
  assert.ok(observer.includes(oldActual));
  observer =
    "window.finalContextOperands=[];\n" +
    observer.replace(
      oldActual,
      oldActual.slice(0, -1) + ",contextOperands:window.finalContextOperands}",
    );
  return current(
    {
      ...scenario,
      observer,
      plan: {
        ...scenario.plan,
        expected,
        added,
        purpose:
          "Supplement original complete Common context with missing/hidden/filtered Enemy, unavailable Character and Party Game Data; original scenario is still separately mandatory",
      },
      async fixture(seed) {
        const value = await scenario.fixture(seed);
        const list = value.carriers["CommonEvents.json"][1].list;
        list.splice(list.length - 1, 0, ...copy(added));
        while (value.carriers["System.json"].variables.length < 101)
          value.carriers["System.json"].variables.push("");
        value.carriers["Troops.json"][1].members = [
          { enemyId: 999, x: 100, y: 280, hidden: false },
          { enemyId: 1, x: 300, y: 280, hidden: false },
          { enemyId: 1, x: 500, y: 280, hidden: true },
        ];
        value.carriers["Enemies.json"][1].params[0] = 500;
        value.loadedCarriers = Object.fromEntries(
          ["Map001.json", "CommonEvents.json", "System.json", "Troops.json"].map((k) => [
            k,
            copy(value.carriers[k]),
          ]),
        );
        value.loadedCarriers["Map001.json"].meta = {};
        value.loadedCarriers["Map001.json"].events[7].meta = {};
        return { ...value, expected };
      },
    },
    "final-r4-common-game-data-context-variable99",
  );
}
function operations() {
  const commands = [];
  const recordNumber = (id) =>
    trace("{case:" + JSON.stringify(id) + ",value:$gameVariables.value(10)}");
  for (const [id, operation, operand] of [
    ["set", 0, 7],
    ["add", 1, 5],
    ["subtract", 2, 20],
    ["multiply", 3, 3],
    ["divide-floor", 4, 5],
    ["negative-modulo", 5, 3],
  ]) {
    commands.push(c(122, [10, 10, operation, 0, operand]), recordNumber(id));
  }
  commands.push(c(122, [10, 10, 0, 4, "-3.1"]), recordNumber("script-storage-negative-floor"));
  commands.push(c(122, [10, 10, 0, 4, "3.9"]), recordNumber("script-storage-positive-floor"));
  commands.push(
    c(122, [10, 10, 0, 0, 99999999]),
    c(122, [10, 10, 1, 0, 1]),
    recordNumber("runtime-result-exceeds-literal-domain"),
  );
  for (const [id, initial, operation] of [
    ["divide-zero", 5, 4],
    ["zero-divide-zero", 0, 4],
    ["modulo-zero", 5, 5],
  ]) {
    commands.push(
      c(122, [10, 10, 0, 0, initial]),
      c(122, [10, 10, operation, 0, 0]),
      trace(
        "{case:" +
          JSON.stringify(id) +
          ",stored:String($gameVariables._data[10]),value:String($gameVariables.value(10))}",
      ),
    );
  }
  commands.push(
    c(126, [1, 0, 0, 3]),
    c(127, [1, 0, 0, 2, false]),
    c(128, [1, 0, 0, 1, false]),
    c(125, [0, 0, 100]),
  );
  const queries = [
    [40, 0, 1, 0],
    [41, 1, 1, 0],
    [42, 2, 1, 0],
    [43, 3, 1, 2],
    [44, 4, 7, 0],
    [45, 5, -1, 0],
    [46, 6, 7, 0],
    [47, 7, 2, 0],
  ];
  for (const [target, source, parameter, status] of queries)
    commands.push(c(122, [target, target, 0, 3, source, parameter, status]));
  commands.push(
    trace(
      '{case:"eight-game-data-sources",values:[40,41,42,43,44,45,46,47].map(function(id){return $gameVariables.value(id);})}',
    ),
    ...copy(finish),
  );
  const expected = {
    trace: [
      { case: "set", value: 7 },
      { case: "add", value: 12 },
      { case: "subtract", value: -8 },
      { case: "multiply", value: -24 },
      { case: "divide-floor", value: -5 },
      { case: "negative-modulo", value: -2 },
      { case: "script-storage-negative-floor", value: -4 },
      { case: "script-storage-positive-floor", value: 3 },
      { case: "runtime-result-exceeds-literal-domain", value: 100000000 },
      { case: "divide-zero", stored: "Infinity", value: "Infinity" },
      { case: "zero-divide-zero", stored: "NaN", value: "0" },
      { case: "modulo-zero", stored: "NaN", value: "0" },
      { case: "eight-game-data-sources", values: [3, 2, 1, 450, 0, 1, 0, 100] },
    ],
    activation: false,
    finished: true,
  };
  return current(
    supplements.makeScenario(
      "final-r4-variable-operations-game-data",
      commands,
      expected,
      (carriers) => {
        const actor = carriers["Actors.json"][1];
        actor.classId = 1;
        actor.initialLevel = 1;
        actor.equips = [0, 0, 0, 0, 0];
        actor.traits = [];
        carriers["Classes.json"][1].traits = [];
        carriers["Classes.json"][1].params[0] = carriers["Classes.json"][1].params[0].map(
          () => 450,
        );
      },
    ),
    "final-r4-variable-operations-game-data",
  );
}
function statesAndEquipability() {
  const party = (state) =>
    "$gameParty.members().map(function(a){return a.isStateAffected(" + state + ");})";
  const commands = [
    c(122, [2, 2, 0, 0, 0]),
    c(313, [1, 2, 0, 2]),
    trace('{case:"variable-actor-zero-add-state",affected:' + party(2) + "}"),
    c(313, [1, 2, 1, 2]),
    trace('{case:"variable-actor-zero-remove-state",affected:' + party(2) + "}"),
    c(313, [0, 1, 0, 2]),
    trace('{case:"fixed-actor-state",affected:' + party(2) + "}"),
    c(314, [1, 2]),
    trace('{case:"variable-actor-zero-recover-state",affected:' + party(2) + "}"),
    c(313, [0, 1, 0, 1]),
    trace(
      '{case:"death-state-only-first-actor",dead:$gameParty.members().map(function(a){return a.isDead();})}',
    ),
    c(314, [0, 1]),
    trace(
      '{case:"fixed-recovery-removes-death",dead:$gameParty.members().map(function(a){return a.isDead();})}',
    ),
    c(127, [2, 0, 0, 1, false]),
    c(319, [1, 1, 2]),
    trace(
      '{case:"unusable-candidate-returned-to-inventory",canEquip:$gameActors.actor(1).canEquip($dataWeapons[2]),equipped:$gameActors.actor(1).equips()[0],candidateInventory:$gameParty.numItems($dataWeapons[2]),previousInventory:$gameParty.numItems($dataWeapons[1])}',
    ),
    ...copy(finish),
  ];
  const expected = {
    trace: [
      { case: "variable-actor-zero-add-state", affected: [true, true, true, true] },
      { case: "variable-actor-zero-remove-state", affected: [false, false, false, false] },
      { case: "fixed-actor-state", affected: [true, false, false, false] },
      { case: "variable-actor-zero-recover-state", affected: [false, false, false, false] },
      { case: "death-state-only-first-actor", dead: [true, false, false, false] },
      { case: "fixed-recovery-removes-death", dead: [false, false, false, false] },
      {
        case: "unusable-candidate-returned-to-inventory",
        canEquip: false,
        equipped: null,
        candidateInventory: 1,
        previousInventory: 1,
      },
    ],
    activation: false,
    finished: true,
  };
  return current(
    supplements.makeScenario(
      "final-r4-states-equipment-eligibility",
      commands,
      expected,
      (carriers) => {
        carriers["System.json"].partyMembers = [1, 2, 3, 4];
        for (const id of [1, 2, 3, 4]) {
          carriers["Actors.json"][id].classId = 1;
          carriers["Actors.json"][id].traits = [];
          carriers["Actors.json"][id].equips = id === 1 ? [1, 0, 0, 0, 0] : [0, 0, 0, 0, 0];
        }
        carriers["Classes.json"][1].traits = [{ code: 51, dataId: 1, value: 1 }];
        carriers["States.json"][2].traits = [];
        carriers["States.json"][2].autoRemovalTiming = 0;
        carriers["States.json"][2].restriction = 0;
        carriers["Weapons.json"][1].wtypeId = 1;
        carriers["Weapons.json"][2].wtypeId = 2;
      },
    ),
    "final-r4-states-equipment-eligibility",
  );
}
function mapCharacterConsequences() {
  const route = (codes) => {
    const instructions = codes.map((code) => ({ code }));
    return [
      c(205, [
        -1,
        {
          repeat: false,
          skippable: false,
          wait: true,
          list: [...copy(instructions), { code: 0, parameters: [] }],
        },
      ]),
      ...instructions.map((instruction) => c(505, [copy(instruction)])),
    ];
  };
  const commands = [
    c(355, ["window.finalScrollStartedAt=Graphics.frameCount;"]),
    c(204, [6, 2, 4]),
    trace(
      '{case:"scroll-starts-without-wait",remaining:$gameMap._scrollRest,elapsed:Graphics.frameCount-window.finalScrollStartedAt}',
    ),
    c(204, [2, 1, 4]),
    trace(
      '{case:"next-scroll-waits-for-prior",waited:Graphics.frameCount-window.finalScrollStartedAt>=24,remaining:$gameMap._scrollRest,direction:$gameMap._scrollDirection}',
    ),
    c(230, [40]),
    trace('{case:"scroll-finishes",remaining:$gameMap._scrollRest}'),
    c(202, [0, 0, 1, 2, 1]),
    ...route([18]),
    c(206),
    c(230, [60]),
    trace(
      '{case:"board-adjacent-boat",inBoat:$gamePlayer.isInBoat(),player:[$gamePlayer.x,$gamePlayer.y],boat:[$gameMap.boat().x,$gameMap.boat().y]}',
    ),
    // Boarding adopts the vehicle's native facing. Explicitly face the blocked
    // right-hand landing tile before the separately observed disembark attempt.
    ...route([18]),
    c(206),
    c(230, [12]),
    trace(
      '{case:"blocked-land-keeps-boat",inBoat:$gamePlayer.isInBoat(),player:[$gamePlayer.x,$gamePlayer.y]}',
    ),
    ...route([16]),
    c(206),
    c(230, [60]),
    trace(
      '{case:"passable-land-leaves-boat",walking:!$gamePlayer.isInVehicle(),player:[$gamePlayer.x,$gamePlayer.y],boat:[$gameMap.boat().x,$gameMap.boat().y]}',
    ),
    c(216, [1]),
    trace(
      '{case:"hide-followers-refresh",visible:$gamePlayer.followers().visibleFollowers().length}',
    ),
    c(216, [0]),
    trace(
      '{case:"show-followers-refresh",visible:$gamePlayer.followers().visibleFollowers().length}',
    ),
    ...route([3, 3, 3]),
    c(355, ["window.finalGatherStartedAt=Graphics.frameCount;"]),
    trace('{case:"before-gather",apart:!$gamePlayer.followers().areGathered()}'),
    c(217),
    trace(
      '{case:"gather-waits",gathered:$gamePlayer.followers().areGathered(),waited:Graphics.frameCount>window.finalGatherStartedAt,player:[$gamePlayer.x,$gamePlayer.y],followers:$gamePlayer.followers().visibleFollowers().map(function(f){return [f.x,f.y];})}',
    ),
    c(203, [7, 0, 4, 4, 0]),
    trace('{case:"missing-event-location-no-object",absent:!$gameMap.event(7)}'),
    ...copy(finish),
  ];
  const expected = {
    trace: [
      { case: "scroll-starts-without-wait", remaining: 2, elapsed: 0 },
      { case: "next-scroll-waits-for-prior", waited: true, remaining: 1, direction: 2 },
      { case: "scroll-finishes", remaining: 0 },
      { case: "board-adjacent-boat", inBoat: true, player: [2, 1], boat: [2, 1] },
      { case: "blocked-land-keeps-boat", inBoat: true, player: [2, 1] },
      { case: "passable-land-leaves-boat", walking: true, player: [2, 2], boat: [2, 1] },
      { case: "hide-followers-refresh", visible: 0 },
      { case: "show-followers-refresh", visible: 3 },
      { case: "before-gather", apart: true },
      {
        case: "gather-waits",
        gathered: true,
        waited: true,
        player: [5, 2],
        followers: [
          [5, 2],
          [5, 2],
          [5, 2],
        ],
      },
      { case: "missing-event-location-no-object", absent: true },
    ],
    activation: false,
    finished: true,
  };
  return current(
    supplements.makeScenario(
      "final-r4-r5-map-character-consequences",
      commands,
      expected,
      (carriers) => {
        const map = carriers["Map001.json"];
        map.width = 32;
        map.height = 32;
        map.scrollType = 0;
        map.tilesetId = 1;
        map.data = Array(32 * 32 * 6).fill(0);
        for (let i = 0; i < 32 * 32; i++) map.data[i] = 2816;
        map.data[1 * 32 + 3] = 2817;
        carriers["Tilesets.json"][1].flags[2816] = 0;
        carriers["Tilesets.json"][1].flags[2817] = 15;
        carriers["System.json"].partyMembers = [1, 2, 3, 4];
        carriers["System.json"].optFollowers = true;
      },
    ),
    "final-r4-r5-map-character-consequences",
  );
}
function forceSkillScopes() {
  const definitions = [
    { id: "actor-one-friend", parameters: [1, 1, 102, 2], targetActorId: 3 },
    {
      id: "actor-all-friends",
      parameters: [1, 1, 103, 7],
      expectedHitCount: 4,
      targetActorIds: [1, 2, 3, 4],
    },
    {
      id: "actor-all-visible-enemies",
      parameters: [1, 1, 104, 7],
      expectedHitCount: 7,
      targetEnemyIndices: [0, 1, 2, 3, 4, 5, 6],
    },
    { id: "actor-self-scope-ignores-target-seven", parameters: [1, 1, 105, 7], targetActorId: 1 },
    { id: "actor-random-friend", parameters: [1, 1, 102, -1], random: "actor" },
  ];
  const scopeTrace = (id) =>
    c(355, [
      "window.r4RangeTrace.push({id:" +
        JSON.stringify(id) +
        ",frame:Graphics.frameCount,scene:SceneManager._scene.constructor.name,phase:BattleManager._phase,turn:$gameTroop.turnCount(),hitCount:window.r4RangeHits.length,party:$gameParty.members().map(function(a){return{id:a.actorId(),hp:a.hp,alive:a.isAlive(),guard:a.isGuard(),grd:a.grd};}),enemies:$gameTroop.members().map(function(e){return{index:e.index(),hp:e.hp,alive:e.isAlive(),hidden:e.isHidden(),guard:e.isGuard(),grd:e.grd};})});",
    ]);
  let observer = originalForce.observer;
  const substitutions = [
    [
      "definitions=" + JSON.stringify(originalForce.definitions),
      "definitions=" + JSON.stringify(definitions),
    ],
    [
      "hitCount:caseHits.length===(d.skip?0:1)",
      "hitCount:caseHits.length===(d.expectedHitCount||(d.skip?0:1))",
    ],
    [
      "checks.serialDelta=after.hitCount-before.hitCount===(d.skip?0:1)",
      "checks.serialDelta=after.hitCount-before.hitCount===(d.expectedHitCount||(d.skip?0:1))",
    ],
    [
      "return{id:d.id,checks:checks",
      'if(d.targetActorIds||d.targetEnemyIndices){var actorTargets=!!d.targetActorIds,expectedTargets=d.targetActorIds||d.targetEnemyIndices,observedTargets=caseHits.map(function(h){return actorTargets?h.targetActorId:h.targetEnemyIndex;}).sort(function(a,b){return a-b;});checks.completeScopeTargetSet=JSON.stringify(observedTargets)===JSON.stringify(expectedTargets);checks.everyScopeHpConsequence=caseHits.every(function(h){var key=actorTargets?"id":"index",target=actorTargets?h.targetActorId:h.targetEnemyIndex,b=(actorTargets?before.party:before.enemies).filter(function(x){return x[key]===target;})[0],a=(actorTargets?after.party:after.enemies).filter(function(x){return x[key]===target;})[0];return !!a&&!!b&&b.hp-a.hp===Math.round(5/(b.guard?2*b.grd:1));});}return{id:d.id,checks:checks',
    ],
  ];
  for (const [before, after] of substitutions) {
    assert.ok(observer.includes(before));
    observer = observer.replace(before, after);
  }
  let comparisonDetails = null;
  const scenario = {
    ...originalForce.makeFuturePairScenario(
      editOwnedSources(
        ["Force Action range normal Scene"],
        "PAIR-SEED owned harmless R4 range comment",
        2,
      ),
    ),
    observer,
    timeoutMs: 145000,
    plan: {
      definitions,
      purpose:
        "Separate actual native Force Action skill scopes: opponent/friend/all/self interpretation, complete target sets and per-target HP effects. Original full range scenario remains mandatory.",
    },
    async fixture(seed) {
      const value = await originalForce.buildFixture(seed);
      const carriers = value.carriers;
      for (const [id, scope] of [
        [102, 7],
        [103, 8],
        [104, 2],
        [105, 11],
      ])
        carriers["Skills.json"][id] = {
          ...copy(carriers["Skills.json"][101]),
          id,
          name: "Independent native skill scope " + scope,
          scope,
        };
      // Database JSON has explicit null slots, including the unused gap before
      // this independently authored high-ID skill range.
      for (let index = 0; index < carriers["Skills.json"].length; index++)
        if (!Object.hasOwn(carriers["Skills.json"], index)) carriers["Skills.json"][index] = null;
      const list = [];
      for (const definition of definitions)
        list.push(
          c(355, ["window.r4RangeCase=" + JSON.stringify(definition.id) + ";"]),
          scopeTrace("before:" + definition.id),
          c(339, definition.parameters),
          scopeTrace("after:" + definition.id),
        );
      // Keep hidden7 out of all scope observations, then reveal it before the
      // original cleanup HP command so the complete enemy-dead oracle remains.
      list.push(
        scopeTrace("before-native-finish"),
        c(335, [7]),
        c(331, [-1, 1, 0, 9999999, true]),
        c(0),
      );
      carriers["Troops.json"][1].pages[0].list = list;
      value.loadedCarriers["Troops.json"] = copy(carriers["Troops.json"]);
      value.loadedCarriers["Skills.json"] = copy(carriers["Skills.json"]);
      for (const skill of value.loadedCarriers["Skills.json"])
        if (skill) {
          skill.meta = {};
          const pattern = /<([^<>:]+)(:?)([^>]*)>/g;
          let match;
          while ((match = pattern.exec(skill.note)))
            skill.meta[match[1]] = match[2] === ":" ? match[3] : true;
        }
      return { ...value, definition: definitions };
    },
    compareNativeRuntimeResults(a, b) {
      const equal = (x, y) => {
        try {
          assert.deepEqual(x, y);
          return true;
        } catch {
          return false;
        }
      };
      const normalized = (runtime) => {
        const { waitSampleCount, ...rest } = runtime.actual;
        return rest;
      };
      const fixedIds = new Set(definitions.filter((d) => !d.random).map((d) => d.id));
      const fixedHits = (runtime) =>
        runtime.hits
          .filter((h) => fixedIds.has(h.id))
          .map(({ id, subjectActorId, subjectEnemyIndex, targetActorId, targetEnemyIndex }) => ({
            id,
            subjectActorId,
            subjectEnemyIndex,
            targetActorId,
            targetEnemyIndex,
          }));
      const checks = {
        literalValid: a.passed === true,
        compiledValid: b.passed === true,
        sameEngine: equal(a.engineFiles, b.engineFiles),
        sameCountsAndContext: equal(normalized(a), normalized(b)),
        sameDeterministicScopeTargets: equal(fixedHits(a), fixedHits(b)),
        everyPerSideScopeAndHpOracle: [a, b].every((runtime) =>
          runtime.caseResults.every((entry) => entry.passed === true),
        ),
      };
      comparisonDetails = {
        purpose:
          "Compare complete scope target sets and each side native HP; actual random friend may differ",
        checks,
        passed: Object.values(checks).every(Boolean),
      };
      return comparisonDetails.passed;
    },
    getSemanticComparisonDetails() {
      return comparisonDetails;
    },
  };
  return current(withAcceptedHpOperand(scenario, 1), "final-r4-force-skill-scopes-variable99");
}
function makeScenarios() {
  const force = current(
    withAcceptedHpOperand(
      forceAdapters.makeForceFuturePair(
        editOwnedSources(
          ["Force Action range normal Scene"],
          "PAIR-SEED owned harmless R4 range comment",
          2,
        ),
      ),
      3,
    ),
    "final-r4-force-full-range-variable99",
  );
  force.timeoutMs = 145000;
  return [
    current(operands.scenario, "final-r4-original-operands-64"),
    current(
      equipment.makeScenario(supplements.editSources("Normal Scene runtime equipment control")),
      "final-r4-original-equipment-six",
    ),
    commonScenario(),
    contextOperands(),
    force,
    current(
      locations.makeScenario(supplements.editSources("Normal Scene location control")),
      "final-r5-original-location-consequences",
    ),
    current(supplements.inventory(), "final-r4-inventory-party"),
    operations(),
    statesAndEquipability(),
    mapCharacterConsequences(),
    forceSkillScopes(),
  ];
}
module.exports = { makeScenarios, editOwnedSources, baseRoot, oldRoot };
