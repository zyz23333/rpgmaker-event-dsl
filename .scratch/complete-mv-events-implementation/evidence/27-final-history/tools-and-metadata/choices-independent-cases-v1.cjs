// Self-authored literal inputs and independent outcomes for later R3 pairing.
// Preparation only. No compiler is used to construct any expected list/value.
// Each case needs a fresh real Map action event and actual Input OK/choice input.
// An observer must read $dataMap and let Scene_Map execute; do not call setup/update.
const c = (code, parameters = [], indent = 0) => ({ code, indent, parameters });
const value = (number, indent = 0) => c(122, [50, 50, 0, 0, number], indent);
const complete = () => c(122, [51, 51, 0, 0, 1]);
function choices(names, cancel, selected, cancelBody = false) {
  const list = [c(102, [names, cancel, selected, 2, 0])];
  names.forEach((name, index) => list.push(c(402, [index, name]), value(index + 1, 1), c(0, [], 1)));
  if (cancelBody) list.push(c(403, [6, null]), value(9, 1), c(0, [], 1));
  return [...list, c(404), complete(), c(0)];
}
const choiceCases = [
  { id: 'default-second', list: choices(['one', 'two'], -1, 1),
    choice: { savedDefault: 1, nativeDefault: 1, savedCancel: -1, nativeCancel: -1, index: 1 }, actions: ['ok'], expected: { value: 2, complete: 1 } },
  { id: 'one-choice-cancel-selects-first', list: choices(['only'], 0, 0),
    choice: { savedDefault: 0, nativeDefault: 0, savedCancel: 0, nativeCancel: 0, index: 0 }, actions: ['cancel'], expected: { value: 1, complete: 1 } },
  { id: 'separate-cancel-body', list: choices(['one', 'two'], -2, 0, true),
    choice: { savedDefault: 0, nativeDefault: 0, savedCancel: -2, nativeCancel: -2, index: 0 }, actions: ['cancel'], expected: { value: 9, complete: 1 } },
  { id: 'disabled-cancel-keeps-wait', list: choices(['one', 'two'], -1, 0),
    choice: { savedDefault: 0, nativeDefault: 0, savedCancel: -1, nativeCancel: -1, index: 0 }, actions: ['cancel', 'assert-waiting', 'ok'], expected: { value: 1, complete: 1 } },
  // Accepted choice-5 cancel has NO 403. Runtime changes cancel to -2 and skips
  // all bodies, then continues. The previous extra-403 probe is a different input.
  { id: 'saved-cancel-five-without-403', list: choices(['one', 'two'], 5, 0),
    choice: { savedDefault: 0, nativeDefault: 0, savedCancel: 5, nativeCancel: -2, index: 0 }, actions: ['cancel'], expected: { value: 0, complete: 1 } },
  { id: 'saved-default-five-needs-navigation', list: choices(['one', 'two'], -1, 5),
    choice: { savedDefault: 5, nativeDefault: 5, savedCancel: -1, nativeCancel: -1, index: 5 }, actions: ['ok', 'assert-waiting', 'up', 'ok'], expected: { value: 1, complete: 1 } },
  { id: 'no-default-down-selects-first', list: choices(['one', 'two'], -1, -1),
    choice: { savedDefault: -1, nativeDefault: -1, savedCancel: -1, nativeCancel: -1, index: -1 }, actions: ['down', 'ok'], expected: { value: 1, complete: 1 } },
];
const controlCases = [
  { id: 'label-full-whitespace-crlf-exact', list: [c(119, [' L\r\n\t ']), value(99), c(118, ['L']), value(88), c(118, [' L\r\n\t ']), value(7), complete(), c(0)], expected: { value: 7, complete: 1 } },
  { id: 'label-first-duplicate', list: [c(119, ['duplicate']), value(99), c(118, ['duplicate']), value(3), complete(), c(115), c(118, ['duplicate']), value(4), c(0)], expected: { value: 3, complete: 1 } },
  { id: 'label-missing-continues', list: [c(119, ['missing']), value(5), complete(), c(0)], expected: { value: 5, complete: 1 } },
  { id: 'label-empty-exact', list: [c(119, ['']), value(99), c(118, ['']), value(6), complete(), c(0)], expected: { value: 6, complete: 1 } },
  { id: 'loop-break-exit', list: [c(112), value(7, 1), c(113, [], 1), c(0, [], 1), c(413), c(115), value(99), complete(), c(0)], expected: { value: 7, complete: 0 } },
  { id: 'nested-loop-mixed-body-markers', list: [c(112), c(112, [], 1), value(8, 2), c(113, [], 2), c(0, [], 2), c(413, [], 1), c(113, [], 1), c(413), complete(), c(0)], expected: { value: 8, complete: 1 } },
  { id: 'break-outside-skips-to-list-end', list: [c(113), value(99), complete(), c(0)], expected: { value: 0, complete: 0 } },
  { id: 'conditional-switch-then', initialSwitches: { 2: true }, list: [c(111, [0, 2, 0]), value(11, 1), c(0, [], 1), c(411), value(12, 1), c(0, [], 1), c(412), complete(), c(0)], expected: { value: 11, complete: 1 } },
  { id: 'conditional-switch-else', initialSwitches: { 2: false }, list: [c(111, [0, 2, 0]), value(11, 1), c(0, [], 1), c(411), value(12, 1), c(0, [], 1), c(412), complete(), c(0)], expected: { value: 12, complete: 1 } },
  { id: 'conditional-no-else-false', initialSwitches: { 2: false }, list: [c(111, [0, 2, 0]), value(99, 1), c(0, [], 1), c(412), complete(), c(0)], expected: { value: 0, complete: 1 } },
  // Deliberate actual runtime stagnation controls; fresh process per case.
  // Observe running + no progress over an explicit finite window, then quit.
  { id: 'label-self-jump-stagnation', list: [c(118, ['again']), c(119, ['again']), complete(), c(0)], expected: { value: 0, complete: 0, remainsRunning: true }, stagnationFrames: 120 },
  { id: 'loop-with-wait-stagnation', list: [c(112), c(230, [1], 1), c(0, [], 1), c(413), complete(), c(0)], expected: { value: 0, complete: 0, remainsRunning: true }, stagnationFrames: 120 },
];
module.exports = { provenance: 'self-authored synthetic inputs; preparation, not acceptance',
  variables: { value: 50, complete: 51 }, requiredVariableCapacity: 51, requiredSwitchCapacity: 2,
  execution: 'fresh Map action event per case, actual Input pulses and unchanged normal Scene_Map updates',
  choiceCases, controlCases };
