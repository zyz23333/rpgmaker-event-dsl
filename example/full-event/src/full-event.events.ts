import {
  abortBattle,
  actorRef,
  audioAsset,
  battleProcessing,
  breakLoop,
  callCommonEvent,
  changeBattleBack,
  changeBattleBgm,
  changeEnemyHp,
  changeGold,
  changeHp,
  changeItems,
  changeMapNameDisplay,
  changePartyMember,
  changePlayerFollowers,
  changeSaveAccess,
  changeSkill,
  changeTransparency,
  changeWindowColor,
  comment,
  commonEvent,
  commonEventRef,
  conditional,
  controlSelfSwitch,
  controlSwitches,
  controlTimer,
  controlVariables,
  eraseEvent,
  fadeoutScreen,
  fadeinScreen,
  flashScreen,
  exitEvent,
  forceAction,
  gatherFollowers,
  getLocationInfo,
  imageAsset,
  inputNumber,
  itemRef,
  jumpToLabel,
  label,
  loop,
  mapEvent,
  mapRef,
  movieAsset,
  movePicture,
  nameInputProcessing,
  openMenuScreen,
  page,
  playBgm,
  playMovie,
  playSe,
  pluginCommand,
  rawDslCommand,
  script,
  scriptInput,
  selectItem,
  setEventLocation,
  setMovementRoute,
  setWeatherEffect,
  shopProcessing,
  showBalloonIcon,
  showPicture,
  showScrollingText,
  showChoices,
  showText,
  skillRef,
  stateRef,
  switchDefinition,
  switchRef,
  transferPlayer,
  troopRef,
  variableDefinition,
  variableRef,
  wait,
} from "rpgmaker-event-dsl";

export const tourStarted = switchDefinition({
  id: 1,
  name: "Sample Tour Started",
});

export const chestOpened = switchDefinition({
  id: 2,
  name: "Sample Chest Opened",
});

export const sampleRouteComplete = switchDefinition({
  id: 3,
  name: "Sample Route Complete",
});

export const visitCount = variableDefinition({
  id: 1,
  name: "Sample Visit Count",
});

export const selectedItem = variableDefinition({
  id: 2,
  name: "Sample Selected Item",
});

export const inputDigits = variableDefinition({
  id: 3,
  name: "Sample Input Digits",
});

export const locationInfo = variableDefinition({
  id: 4,
  name: "Sample Location Info",
});

const tourStartedSwitch = switchRef({ id: 1 });
const chestOpenedSwitch = switchRef({ id: 2 });
const sampleRouteCompleteSwitch = switchRef({ id: 3 });
const visitCountVariable = variableRef({ id: 1 });
const selectedItemVariable = variableRef({ id: 2 });
const inputDigitsVariable = variableRef({ id: 3 });
const locationInfoVariable = variableRef({ id: 4 });
const potion = itemRef({ id: 1 });
const currentMap = mapRef({ id: 1 });
const sampleCommonEvent = commonEventRef({ id: 1 });
const batTroop = troopRef({ id: 1 });
const heroActor = actorRef({ id: 1 });
const attackSkill = skillRef({ id: 1 });
const poisonState = stateRef({ id: 4 });
const currentEvent = { kind: "runtimeSelector", scope: "character", target: "currentEvent" } as const;
const playerCharacter = { kind: "runtimeSelector", scope: "character", target: "player" } as const;
const entireParty = { kind: "runtimeSelector", scope: "actor", target: "entireParty" } as const;
const firstEnemy = { kind: "runtimeSelector", scope: "enemy", target: "enemy", index: 0 } as const;
const allEnemies = { kind: "runtimeSelector", scope: "enemy", target: "all" } as const;
const heroBattler = { kind: "runtimeSelector", scope: "battler", target: "actor", actorId: 1 } as const;

export const sampleCommonEventDefinition = commonEvent({
  id: 1,
  name: "Sample Common Event",
  trigger: "none",
  commands: [
    showText({ lines: ["This line came from a Common Event defined in the same DSL workspace."] }),
    controlVariables({
      variable: visitCountVariable,
      operation: "add",
      value: 1,
    }),
  ],
});

export const guideEvent = mapEvent({
  mapId: 1,
  id: 1,
  name: "DSL Guide",
  x: 8,
  y: 5,
  pages: [
    page({
      commands: [
        comment(["Visible entry point for the full-event sample workspace."]),
        showText({
          lines: ["Event DSL sample", "Talk to nearby events to try representative command families."],
          face: { image: imageAsset({ folder: "faces", name: "Actor1" }), index: 0 },
        }),
        showScrollingText({
          lines: ["The DSL helper surface covers RPG Maker MV 1.6.1 editor command families."],
          speed: 3,
        }),
        controlSwitches({
          switch: tourStartedSwitch,
          value: true,
        }),
        controlVariables({
          variable: visitCountVariable,
          operation: "add",
          value: 1,
        }),
        inputNumber({
          variable: inputDigitsVariable,
          digits: 2,
        }),
        selectItem({
          variable: selectedItemVariable,
          itemType: 1,
        }),
        conditional({
          condition: {
            kind: "switch",
            switch: chestOpenedSwitch,
            value: true,
          },
          then: [showText({ lines: ["The reward chest has already been opened."] })],
          else: [showText({ lines: ["The reward chest is still waiting."] })],
        }),
        conditional({
          condition: {
            kind: "script",
            script: scriptInput({ code: "$gameParty.gold() >= 0" }),
          },
          then: [showText({ lines: ["Script conditions are explicit Script Inputs."] })],
        }),
        showChoices({
          choices: ["Call common event", "Stop here"],
          branches: [[callCommonEvent(sampleCommonEvent)], [exitEvent()]],
          cancelBranch: [showText({ lines: ["Canceled."] })],
        }),
        wait(15),
      ],
    }),
  ],
});

export const rewardChestEvent = mapEvent({
  mapId: 1,
  id: 2,
  name: "DSL Reward Chest",
  x: 7,
  y: 6,
  pages: [
    page({
      conditions: {
        selfSwitch: "A",
      },
      commands: [showText({ lines: ["The chest is empty."] })],
    }),
    page({
      commands: [
        comment(["Reward chest demonstrates items, gold, variables, and self switches."]),
        showText({ lines: ["You found a DSL reward chest."] }),
        changeGold({
          operation: "gain",
          value: 100,
        }),
        changeItems({
          item: potion,
          operation: "gain",
          amount: 1,
        }),
        controlVariables({
          variable: visitCountVariable,
          operation: "add",
          value: {
            kind: "random",
            from: 1,
            to: 3,
          },
        }),
        controlSwitches({
          switch: {
            kind: "referenceRange",
            from: chestOpenedSwitch,
            to: sampleRouteCompleteSwitch,
          },
          value: true,
        }),
        controlSelfSwitch({
          selfSwitch: "A",
          value: true,
        }),
      ],
    }),
  ],
});

export const practiceBattleEvent = mapEvent({
  mapId: 1,
  id: 3,
  name: "DSL Practice Battle",
  x: 9,
  y: 6,
  pages: [
    page({
      commands: [
        comment(["Battle, shop, actor, enemy, plugin command, script, and raw command sample."]),
        showText({ lines: ["Practice station", "This event exercises several command families."] }),
        loop([showText({ lines: ["Loop body runs once, then breaks."] }), breakLoop()]),
        changeHp({
          target: entireParty,
          operation: "gain",
          value: 25,
        }),
        changeSkill({
          target: { kind: "runtimeSelector", scope: "actor", target: "actor", actorId: 1 },
          operation: "learn",
          skill: attackSkill,
        }),
        battleProcessing({
          troop: batTroop,
          canEscape: true,
          canLose: true,
          win: [showText({ lines: ["Battle branch: win."] })],
          escape: [showText({ lines: ["Battle branch: escape."] })],
          lose: [showText({ lines: ["Battle branch: lose."] })],
        }),
        changeEnemyHp({
          target: allEnemies,
          operation: "lose",
          value: 1,
          allowDeath: true,
        }),
        forceAction({
          subject: heroBattler,
          skill: attackSkill,
          targetIndex: -2,
        }),
        abortBattle(),
        shopProcessing({
          goods: [{ kind: "item", item: potion, price: 1 }],
          allowSelling: true,
        }),
        nameInputProcessing({
          actor: heroActor,
          maxCharacters: 8,
        }),
        openMenuScreen(),
        pluginCommand({
          command: "FullEventPlugin",
          args: ["alpha", "beta"],
        }),
        script({ code: "console.log('DSL practice station ran');" }),
        rawDslCommand({
          code: 108,
          parameters: ["Raw DSL command comment from sample."],
        }),
      ],
    }),
  ],
});

export const presentationStationEvent = mapEvent({
  mapId: 1,
  id: 4,
  name: "DSL Presentation Station",
  x: 8,
  y: 7,
  pages: [
    page({
      commands: [
        showText({ lines: ["Presentation station", "This event uses screen, audio, picture, and map helpers."] }),
        changeBattleBgm({
          audio: { asset: audioAsset({ folder: "bgm", name: "Battle1" }), volume: 80 },
        }),
        playBgm({
          audio: { asset: audioAsset({ folder: "bgm", name: "Theme6" }), volume: 70 },
        }),
        playSe({
          audio: { asset: audioAsset({ folder: "se", name: "Cursor2" }) },
        }),
        changeBattleBack({
          battleback1: imageAsset({ folder: "battlebacks1", name: "Grassland" }),
          battleback2: imageAsset({ folder: "battlebacks2", name: "Grassland" }),
        }),
        changeMapNameDisplay({
          enabled: true,
        }),
        changeWindowColor({
          tone: { red: 0, green: 0, blue: 0, gray: 0 },
        }),
        changeSaveAccess({
          enabled: true,
        }),
        showPicture({
          pictureId: 1,
          image: imageAsset({ folder: "pictures", name: "Actor1_1" }),
          position: { kind: "direct", x: 120, y: 90, origin: "center" },
          opacity: 200,
        }),
        movePicture({
          pictureId: 1,
          position: { kind: "direct", x: 160, y: 120, origin: "center" },
          duration: 30,
          wait: true,
        }),
        flashScreen({
          color: [255, 255, 255, 128],
          duration: 20,
        }),
        setWeatherEffect({
          weather: "rain",
          power: 2,
          duration: 30,
        }),
        playMovie({
          movie: movieAsset({ name: "Intro" }),
        }),
        fadeoutScreen(),
        fadeinScreen(),
        transferPlayer({
          destination: { kind: "direct", map: currentMap, x: 5, y: 6 },
        }),
        eraseEvent(),
      ],
    }),
  ],
});

export const labelDemoEvent = mapEvent({
  mapId: 1,
  id: 5,
  name: "DSL Label Demo",
  x: 10,
  y: 6,
  pages: [
    page({
      commands: [
        showText({ lines: ["Label demo", "This event jumps over one message, then continues."] }),
        jumpToLabel("AfterSkippedLine"),
        showText({ lines: ["You should not see this skipped line."] }),
        label("AfterSkippedLine"),
        showText({ lines: ["Jump target reached."] }),
      ],
    }),
  ],
});

export const movementStationEvent = mapEvent({
  mapId: 1,
  id: 6,
  name: "DSL Movement Station",
  x: 11,
  y: 7,
  pages: [
    page({
      commands: [
        showText({ lines: ["Movement station", "This event uses route and character helpers."] }),
        setEventLocation({
          character: currentEvent,
          destination: { kind: "direct", x: 11, y: 7 },
          direction: 2,
        }),
        setMovementRoute({
          target: currentEvent,
          route: [
            { kind: "turnDown" },
            { kind: "moveForward" },
            { kind: "routeWait", frames: 10 },
            { kind: "switchOn", switch: sampleRouteCompleteSwitch },
            { kind: "playSe", audio: { asset: audioAsset({ folder: "se", name: "Cursor2" }) } },
            { kind: "script", script: scriptInput({ code: "this.turnTowardPlayer();" }) },
          ],
          skippable: true,
          wait: true,
        }),
        showBalloonIcon({
          target: playerCharacter,
          balloon: "question",
        }),
        changeTransparency({
          transparent: false,
        }),
        changePlayerFollowers({
          visible: true,
        }),
        gatherFollowers(),
        getLocationInfo({
          variable: locationInfoVariable,
          info: "regionId",
          location: { kind: "direct", x: 11, y: 7 },
        }),
      ],
    }),
  ],
});

export const partyStateStationEvent = mapEvent({
  mapId: 1,
  id: 7,
  name: "DSL Party State Station",
  x: 12,
  y: 7,
  pages: [
    page({
      commands: [
        showText({ lines: ["Party state station", "This event touches party, actor, and enemy helpers."] }),
        changePartyMember({
          actor: heroActor,
          operation: "add",
          initialize: false,
        }),
        conditional({
          condition: {
            kind: "actor",
            actor: heroActor,
            check: { kind: "state", state: poisonState },
          },
          then: [showText({ lines: ["The hero is poisoned."] })],
          else: [showText({ lines: ["The hero is not poisoned."] })],
        }),
        conditional({
          condition: {
            kind: "enemy",
            enemyIndex: 0,
            check: { kind: "appeared" },
          },
          then: [
            changeEnemyHp({
              target: firstEnemy,
              operation: "lose",
              value: 10,
              allowDeath: true,
            }),
          ],
        }),
        conditional({
          condition: {
            kind: "item",
            item: potion,
          },
          then: [showText({ lines: ["The party has at least one potion."] })],
        }),
        controlTimer({ action: "start", seconds: 30 }),
        controlTimer({ action: "stop" }),
        rawDslCommand({
          code: 108,
          parameters: ["Raw fallback remains explicit in the sample workspace."],
        }),
      ],
    }),
  ],
});
