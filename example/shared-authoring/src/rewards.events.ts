import { commonEvent } from "rpgmaker-event-dsl";
import { completedReward as reward } from "./shared/rewards.js";
import { eventSettings } from "./shared/settings.js";

export const copperReward = commonEvent({
  ...eventSettings,
  id: 2,
  name: "Copper reward",
  commands: reward({ gold: 25, text: "Copper chest" }),
});

export const silverReward = commonEvent({
  ...eventSettings,
  id: 3,
  name: "Silver reward",
  commands: reward({ gold: 90, text: "Silver chest" }),
});
