import { pathToFileURL } from "node:url";

import { collectEventDefinitions, type EventDefinition } from "./dsl.js";

export async function loadDefinitionFile(filePath: string): Promise<EventDefinition[]> {
  const fileUrl = pathToFileURL(filePath).href;
  const moduleExports = (await import(fileUrl)) as Record<string, unknown>;
  return collectEventDefinitions(moduleExports);
}
