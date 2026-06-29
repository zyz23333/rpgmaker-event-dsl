import {
  actorRef,
  battleProcessing,
  breakLoop,
  callCommonEvent,
  changeGold,
  changeItem,
  comment,
  commonEvent,
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
  rawDslCommand,
  script,
  shopProcessing,
  showChoices,
  showText,
  switchDefinition,
  switchRef,
  transferPlayer,
  variableDefinition,
  variableRef,
  wait,
} from "@rmmv-event-dsl/core";

export const sampleSwitchDefinition = switchDefinition({
  id: 1,
  name: "Sample Switch",
});

export const sampleVariableDefinition = variableDefinition({
  id: 1,
  name: "Sample Variable",
});

export const sampleCommonEventDefinition = commonEvent({
  id: 1,
  name: "Sample Common Event",
  trigger: "none",
  commands: [showText(["Common event from DSL"])],
});

const sampleSwitch = switchRef({ id: 1 });
const sampleVariable = variableRef({ id: 1 });
const sampleActor = actorRef({ id: 1 });
const sampleItem = itemRef({ id: 1 });
const sampleMap = mapRef({ id: 1 });
const sampleCommonEvent = commonEventRef({ id: 1 });

export const fullEvent = mapEvent({
  mapId: 1,
  id: 1,
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
          troop: {
            kind: "troop",
            useRandomEncounter: true,
          },
          canEscape: true,
          canLose: false,
        }),
        showChoices({
          choices: ["Yes", "No"],
          branches: [[callCommonEvent(sampleCommonEvent)], [exitEvent()]],
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
        rawDslCommand({
          code: 355,
          parameters: ["this._messageWindow.close();"],
        }),
      ],
    }),
  ],
});
