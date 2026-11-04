export type NativeMovementRecord = { code: number; parameters?: unknown[]; indent?: null | 0 };

export type NativeMovementRoute = {
  list: NativeMovementRecord[];
  repeat: boolean;
  skippable: boolean;
  wait: boolean;
};
