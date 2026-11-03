import { changeGold, comment, type DslCommand } from "rpgmaker-event-dsl";
import { introduction } from "./introduction.js";

type RewardOptions = { gold: number; text: string };

export function reward({ gold: amount, text }: RewardOptions): DslCommand[] {
  const quantity = { kind: "constant", value: amount } as const;
  return [
    ...introduction,
    comment({ lines: [text] }),
    changeGold({ operation: "gain", value: quantity }),
  ];
}

export const completedReward = (options: RewardOptions): DslCommand[] => [
  ...reward(options),
  comment({ lines: ["Reward complete"] }),
];
