// Independently authored numeric saved slots from visual-map E201/E202/E203/E285.
// No compiler or decompiler is used to produce this synthetic native expectation.
export const locationRecords = [
  ...[0, 2, 4, 6, 8].flatMap((direction) =>
    [0, 1, 2].flatMap((fade) => [
      { code: 201, indent: 0, parameters: [0, 1, 10000, 2147483647, direction, fade] },
      { code: 201, indent: 0, parameters: [1, 1, 2, 3, direction, fade] },
    ]),
  ),
  ...[0, 1, 2].flatMap((vehicle) => [
    { code: 202, indent: 0, parameters: [vehicle, 0, 1, 2147483647, 0] },
    { code: 202, indent: 0, parameters: [vehicle, 1, 1, 2, 3] },
  ]),
  ...[0, 2, 4, 6, 8].flatMap((direction) => [
    { code: 203, indent: 0, parameters: [0, 0, 2147483647, 10000, direction] },
    { code: 203, indent: 0, parameters: [99, 1, 2, 3, direction] },
    { code: 203, indent: 0, parameters: [0, 2, 99, 0, direction] },
  ]),
  ...[0, 1, 2, 3, 4, 5, 6].flatMap((info) => [
    { code: 285, indent: 0, parameters: [3, info, 0, 10000, 2147483647] },
    { code: 285, indent: 0, parameters: [3, info, 1, 1, 2] },
  ]),
  { code: 0, indent: 0, parameters: [] },
];
