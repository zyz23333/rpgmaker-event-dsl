import type {
  GameOverDslCommand,
  OpenMenuScreenDslCommand,
  OpenSaveScreenDslCommand,
  ReturnToTitleScreenDslCommand,
} from "../dsl.js";

export function openMenuScreen(): OpenMenuScreenDslCommand {
  return {
    kind: "openMenuScreen",
  };
}

export function openSaveScreen(): OpenSaveScreenDslCommand {
  return {
    kind: "openSaveScreen",
  };
}

export function gameOver(): GameOverDslCommand {
  return {
    kind: "gameOver",
  };
}

export function returnToTitleScreen(): ReturnToTitleScreenDslCommand {
  return {
    kind: "returnToTitleScreen",
  };
}
