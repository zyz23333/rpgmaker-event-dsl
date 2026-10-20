import * as dsl from "../src/index.js";

function checkPublicTypes() {
  dsl.changeSaveAccess({ enabled: false });
  dsl.changeMenuAccess({ enabled: true });
  dsl.changeEncounter({ enabled: false });
  dsl.changeFormationAccess({ enabled: true });
  dsl.changeWindowColor({ tone: { red: -0, green: -255, blue: 255, gray: 113 } });
  dsl.openMenuScreen();
  dsl.openSaveScreen();
  dsl.gameOver();
  dsl.returnToTitleScreen();

  // @ts-expect-error The shared Tone type has only named components across all three families.
  const tupleTone: dsl.ToneInput = [0, 0, 0, 0];
  // @ts-expect-error The shared Color type has only named components.
  const tupleColor: dsl.ColorInput = [0, 0, 0, 0];
  void tupleTone;
  void tupleColor;

  // @ts-expect-error A Save Access flag is explicit.
  dsl.changeSaveAccess({});
  // @ts-expect-error A Menu Access flag is a boolean.
  dsl.changeMenuAccess({ enabled: 1 });
  // @ts-expect-error Encounter uses the explicit enabled field.
  dsl.changeEncounter({ disabled: true });
  // @ts-expect-error Formation Access does not accept Script Input.
  dsl.changeFormationAccess({ enabled: dsl.scriptInput({ code: "true" }) });
  // @ts-expect-error The old Encounter helper is absent.
  dsl.changeEncounterDisable({ disabled: true });
  // @ts-expect-error Window Tone has no tuple alias.
  dsl.changeWindowColor({ tone: [0, 0, 0, 0] });
  // @ts-expect-error Hidden gray is still required.
  dsl.changeWindowColor({ tone: { red: 0, green: 0, blue: 0 } });
  // @ts-expect-error Window Tone is explicit and has no System default.
  dsl.changeWindowColor({});
  // @ts-expect-error Window Tone has no None input.
  dsl.changeWindowColor({ tone: null });
  // @ts-expect-error Window Tone has no extra component.
  dsl.changeWindowColor({ tone: { red: 0, green: 0, blue: 0, gray: 0, alpha: 255 } });
  // @ts-expect-error Menu scene has zero inputs.
  dsl.openMenuScreen({});
  // @ts-expect-error Save scene has zero inputs, including undefined.
  dsl.openSaveScreen(undefined);
  // @ts-expect-error Game Over has zero inputs.
  dsl.gameOver(false);
  // @ts-expect-error Return To Title has zero inputs.
  dsl.returnToTitleScreen({});
}

// Checked by the package TypeScript invocation; invalid authoring calls never execute.
void checkPublicTypes;
