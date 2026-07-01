import {
  battleProcessing,
  breakLoop,
  callCommonEvent,
  changeGold,
  changeItems,
  comment,
  commonEvent,
  commonEventRef,
  conditional,
  controlSelfSwitch,
  controlSwitches,
  controlVariables,
  eraseEvent,
  exitEvent,
  itemRef,
  jumpToLabel,
  label,
  loop,
  mapEvent,
  mapRef,
  page,
  pluginCommand,
  rawDslCommand,
  script,
  shopProcessing,
  showChoices,
  showText,
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

export const visitCount = variableDefinition({
  id: 1,
  name: "Sample Visit Count",
});

const tourStartedSwitch = switchRef({ id: 1 });
const chestOpenedSwitch = switchRef({ id: 2 });
const visitCountVariable = variableRef({ id: 1 });
const potion = itemRef({ id: 1 });
const currentMap = mapRef({ id: 1 });
const sampleCommonEvent = commonEventRef({ id: 1 });
const batTroop = troopRef({ id: 1 });

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
        showText({ lines: ["Event DSL sample", "Talk to nearby events to try each command family."] }),
        controlSwitches({
          switch: tourStartedSwitch,
          value: true,
        }),
        controlVariables({
          variable: visitCountVariable,
          operation: "add",
          value: 1,
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
          switch: chestOpenedSwitch,
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
        comment(["Battle, shop, loop, plugin command, script, and raw command sample."]),
        showText({ lines: ["Practice station", "This event exercises several command compilers."] }),
        loop([showText({ lines: ["Loop body runs once, then breaks."] }), breakLoop()]),
        battleProcessing({
          troop: batTroop,
          canEscape: true,
          canLose: true,
        }),
        shopProcessing({
          goods: [{ kind: "item", item: potionItem, price: 1 }],
          allowSelling: true,
        }),
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

export const transferPadEvent = mapEvent({
  mapId: 1,
  id: 4,
  name: "DSL Transfer Pad",
  x: 8,
  y: 7,
  pages: [
    page({
      commands: [
        showText({ lines: ["Transfer pad", "You will jump to another tile on the same map."] }),
        transferPlayer({
          map: currentMap,
          x: 5,
          y: 6,
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
