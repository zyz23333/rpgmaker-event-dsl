import type { RawEventCommand } from "../../compiler/types.js";
import type { ShowTextDslCommand } from "../../domain/types.js";

export function compileShowText(node: ShowTextDslCommand, indent: number): RawEventCommand[] {
  return [
    {
      code: 101,
      indent,
      parameters: [
        node.face.image?.name ?? "",
        node.face.index,
        { window: 0, dim: 1, transparent: 2 }[node.background],
        { top: 0, middle: 1, bottom: 2 }[node.position],
      ],
    },
    ...node.lines.map((line) => ({ code: 401, indent, parameters: [line] })),
  ];
}
