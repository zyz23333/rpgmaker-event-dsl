import { nativeAssetEvents, type AssetDependency } from "./asset-uses.js";

export type CommonEventAssetCall = {
  caller: string;
  nativePath: string;
  target: string;
  targetId: number;
  dependencyChain: readonly AssetDependency[];
};

/** Complete validated events are independent roots; these edges never copy their uses. */
export function collectCommonEventCalls(
  files: ReadonlyMap<string, string>,
): CommonEventAssetCall[] {
  const calls: CommonEventAssetCall[] = [];
  for (const event of nativeAssetEvents(files))
    for (const page of event.pages)
      for (const [index, command] of page.list.entries()) {
        if (command.code !== 117) continue;
        const targetId = command.parameters[0] as number;
        calls.push({
          caller: event.identity,
          nativePath: `${page.nativePath}.list[${index}].parameters[0]`,
          target: `commonEvent:${targetId}`,
          targetId,
          dependencyChain: [],
        });
      }
  return calls;
}
