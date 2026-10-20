// The single native default state used by compilation and exact Blank classification.
export function blankBattleEventPage() {
  return {
    conditions: {
      actorHp: 50,
      actorId: 1,
      actorValid: false,
      enemyHp: 50,
      enemyIndex: 0,
      enemyValid: false,
      switchId: 1,
      switchValid: false,
      turnA: 0,
      turnB: 0,
      turnEnding: false,
      turnValid: false,
    },
    span: 0,
    list: [{ code: 0, indent: 0, parameters: [] as unknown[] }],
  };
}
