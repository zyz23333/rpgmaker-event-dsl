import {
  actorRef,
  battleProcessing,
  breakLoop,
  changeGold,
  changeItem,
  comment,
  commonEventCall,
  commonEventRef,
  conditional,
  controlSelfSwitch,
  controlSwitch,
  controlVariable,
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
  rawCommand,
  script,
  shopProcessing,
  showChoices,
  showText,
  switchRef,
  transferPlayer,
  troopRef,
  variableRef,
  wait,
} from "../../../packages/rmmv-event-dsl/src/index.js";

const sampleSwitch = switchRef({ id: 1 });
const sampleVariable = variableRef({ id: 1 });
const sampleActor = actorRef({ id: 1 });
const sampleItem = itemRef({ id: 1 });
const sampleMap = mapRef({ id: 1 });
const sampleCommonEvent = commonEventRef({ id: 1 });
const sampleTroop = troopRef({ id: 1 });

export const fullEvent = mapEvent({
  name: "FullEvent",
  x: 4,
  y: 4,
  pages: [
    page({
      conditions: {
        actor: sampleActor,
        item: sampleItem,
        selfSwitch: "A",
        switch1: sampleSwitch,
        switch2: sampleSwitch,
        variable: {
          ref: sampleVariable,
          operator: "ge",
          value: 10,
        },
      },
      commands: [
        comment(["example: full event"]),
        showText(["Hello", "World"]),
        conditional({
          condition: {
            switch1: sampleSwitch,
          },
          then: [showText(["Conditional branch"])],
          else: [showText(["Else branch"])],
        }),
        loop([showText(["Loop body"]), breakLoop()]),
        label("Gate"),
        jumpToLabel("Gate"),
        controlSwitch({
          switch: sampleSwitch,
          value: true,
        }),
        controlVariable({
          variable: sampleVariable,
          operation: "add",
          value: {
            kind: "random",
            from: 1,
            to: 3,
          },
        }),
        controlSelfSwitch({
          selfSwitch: "A",
          value: false,
        }),
        changeGold({
          operation: "gain",
          value: 100,
        }),
        changeItem({
          item: sampleItem,
          operation: "gain",
          amount: 1,
        }),
        wait(30),
        eraseEvent(),
        battleProcessing({
          troop: sampleTroop,
          canEscape: true,
          canLose: false,
        }),
        showChoices({
          choices: ["Yes", "No"],
          branches: [[commonEventCall(sampleCommonEvent)], [exitEvent()]],
          cancelBranch: [script(["console.log('cancel')"])],
        }),
        shopProcessing({
          goods: [0, 1, 1, 0, 1],
          allowSelling: true,
        }),
        transferPlayer({
          map: sampleMap,
          x: 5,
          y: 6,
        }),
        pluginCommand({
          command: "FullEventPlugin",
          args: ["alpha", "beta"],
        }),
        rawCommand({
          code: 355,
          parameters: ["this._messageWindow.close();"],
        }),
      ],
    }),
  ],
});
