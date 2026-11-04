import { constants } from "node:fs";
import { mkdir, open, realpath } from "node:fs/promises";
import { resolve } from "node:path";

import { workspaceStateDirectoryName } from "./state.js";

// libuv v1.51.0 include/uv/win.h: UV_FS_O_EXLOCK; src/win/fs.c opens
// with share=0. Node accepts numeric open flags but does not expose this flag
// in fs.constants. Supported on Windows since libuv 1.17.0; the verification
// baseline is Node 22.23.0 / libuv 1.51.0.
const windowsExclusiveOpen = 0x10000000;

export async function withWorkspaceOperationLock<T>(
  workspaceRoot: string,
  commandName: string,
  operation: () => Promise<T>,
): Promise<T> {
  if (process.platform !== "win32") {
    throw new Error("Workspace operations currently require Windows for operation locking.");
  }

  // Resolve aliases before taking the lease, without reading mutable Workspace
  // configuration or data. A missing Workspace is never created by a command.
  const root = await realpath(workspaceRoot);
  const stateDirectory = resolve(root, workspaceStateDirectoryName);
  await mkdir(stateDirectory, { recursive: true });
  const lockPath = resolve(stateDirectory, "operation.lock");
  const handle = await open(
    lockPath,
    constants.O_RDWR | constants.O_CREAT | windowsExclusiveOpen,
    0o600,
  ).catch((error: unknown) => {
    if (error instanceof Error && "code" in error && error.code === "EBUSY") {
      throw new Error(
        `Workspace is busy before ${commandName}: ${root}. Retry after the active operation finishes.`,
        {
          cause: error,
        },
      );
    }
    throw error;
  });

  try {
    return await operation();
  } finally {
    // Keep the file permanently. The live kernel handle is the lease; its
    // release (including process death) proves that no prior owner holds it.
    // Never unlink a stale pathname, which could remove another contender's
    // replacement lease, and never inspect or clear Interrupted Push state.
    await handle.close();
  }
}
