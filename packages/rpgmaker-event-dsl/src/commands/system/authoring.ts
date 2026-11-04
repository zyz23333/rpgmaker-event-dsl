import type {
  GameOverDslCommand,
  OpenMenuScreenDslCommand,
  OpenSaveScreenDslCommand,
  ReturnToTitleScreenDslCommand,
} from "../../domain/types.js";
import { assertSceneArguments } from "./validation.js";

export function openMenuScreen(...inputs: []): OpenMenuScreenDslCommand {
  assertSceneArguments("openMenuScreen", inputs);
  return {
    kind: "openMenuScreen",
  };
}

export function openSaveScreen(...inputs: []): OpenSaveScreenDslCommand {
  assertSceneArguments("openSaveScreen", inputs);
  return {
    kind: "openSaveScreen",
  };
}

export function gameOver(...inputs: []): GameOverDslCommand {
  assertSceneArguments("gameOver", inputs);
  return {
    kind: "gameOver",
  };
}

export function returnToTitleScreen(...inputs: []): ReturnToTitleScreenDslCommand {
  assertSceneArguments("returnToTitleScreen", inputs);
  return {
    kind: "returnToTitleScreen",
  };
}
