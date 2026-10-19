import { commonEvent, showChoices } from "rpgmaker-event-dsl";

export const commonEventIndependentSavedChoiceIndices001 = commonEvent({
  id: 1,
  name: "Independent saved choice indices",
  trigger: "none",
  commands: [
    showChoices({ choices: [{ text: "", commands: [] }], cancel: { kind: "choice", index: 0 } }),
  ],
});
