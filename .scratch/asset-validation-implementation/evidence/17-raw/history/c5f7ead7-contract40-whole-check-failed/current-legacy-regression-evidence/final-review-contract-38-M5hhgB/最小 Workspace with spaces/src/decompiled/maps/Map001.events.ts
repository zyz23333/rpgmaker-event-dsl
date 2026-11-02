import { mapEvent, page } from "rpgmaker-event-dsl";

export const mapEventCompleteBlank001 = mapEvent({
  mapId: 1,
  id: 1,
  name: "Complete blank",
  note: "  <tag: x>\r\n\n<tag:y>\rtrailing\n",
  x: 0,
  y: 0,
  pages: [
    page({
      commands: [

      ],
    })
  ],
});
