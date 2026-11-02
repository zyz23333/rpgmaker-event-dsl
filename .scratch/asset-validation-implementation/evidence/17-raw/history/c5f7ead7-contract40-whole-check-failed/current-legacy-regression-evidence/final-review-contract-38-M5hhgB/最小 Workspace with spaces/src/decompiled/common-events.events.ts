import { comment, commonEvent, showText } from "rpgmaker-event-dsl";

export const commonEventEvidenceCommonEvent001 = commonEvent({
  id: 1,
  name: "Evidence Common Event",
  trigger: "none",
  commands: [
    showText({ lines: ["Synthetic CR\rkept",""], face: { image: null, index: 0 }, background: "dim", position: "top" }),
    comment({ lines: ["Self-authored fixture",""] }),
  ],
});
