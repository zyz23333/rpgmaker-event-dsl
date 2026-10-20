import { renderMovementRoute } from "../commands/movement/decompile.js";
import { nativeDirections, pageDirections, pagePriorities } from "../map-event/page.js";
import { literal, mapPageTriggerFromCode, renderPageConditions } from "./core.js";
import type { SnapshotMapEventPage } from "./types.js";

export function renderMapPageSettings(page: SnapshotMapEventPage): string[] {
  const fields: string[] = [];
  const conditions = renderPageConditions(page.conditions);
  if (conditions !== "{}") fields.push(`conditions: ${conditions},`);
  const image: string[] = [];
  if (page.image.characterName !== "")
    image.push(
      `character: imageAsset({ folder: "characters", name: ${literal(page.image.characterName)} })`,
    );
  if (page.image.characterIndex !== 0) image.push(`characterIndex: ${page.image.characterIndex}`);
  if (page.image.tileId !== 0) image.push(`tileId: ${page.image.tileId}`);
  if (page.image.direction !== 2)
    image.push(
      `direction: ${literal(pageDirections[nativeDirections.indexOf(page.image.direction as 2)])}`,
    );
  if (page.image.pattern !== 0) image.push(`pattern: ${page.image.pattern}`);
  if (image.length) fields.push(`image: { ${image.join(", ")} },`);
  const movement: string[] = [];
  if (page.movement) {
    if (page.movement.type !== "fixed") movement.push(`type: ${literal(page.movement.type)}`);
    if (page.movement.speed !== 3) movement.push(`speed: ${page.movement.speed}`);
    if (page.movement.frequency !== 3) movement.push(`frequency: ${page.movement.frequency}`);
    const route = renderMovementRoute(page.movement.route)!.expression;
    if (route !== "{ commands: [] }") movement.push(`route: ${route}`);
  }
  if (movement.length) fields.push(`movement: { ${movement.join(", ")} },`);
  if (page.priorityType !== 0)
    fields.push(`priority: ${literal(pagePriorities[page.priorityType])},`);
  const options: string[] = [];
  if (page.walkAnime !== true) options.push(`walkAnimation: ${page.walkAnime}`);
  if (page.stepAnime !== false) options.push(`stepAnimation: ${page.stepAnime}`);
  if (page.directionFix !== false) options.push(`directionFix: ${page.directionFix}`);
  if (page.through !== false) options.push(`through: ${page.through}`);
  if (options.length) fields.push(`options: { ${options.join(", ")} },`);
  if (page.trigger !== 0) fields.push(`trigger: ${literal(mapPageTriggerFromCode(page.trigger))},`);
  return fields;
}
