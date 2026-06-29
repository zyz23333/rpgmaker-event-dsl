import { captureStandardProjectDataSnapshot, getWorkspaceStatePaths } from "./state.js";
import { loadWorkspace } from "./workspace.js";

export type WorkspaceCommandOptions = {
  workspaceRoot: string;
};

export type CompileWorkspaceOptions = WorkspaceCommandOptions & {
  check: boolean;
};

export type PushWorkspaceOptions = WorkspaceCommandOptions & {
  allowDestructive: boolean;
};

export async function cloneWorkspace(options: WorkspaceCommandOptions): Promise<void> {
  const workspace = await loadWorkspace(options.workspaceRoot);
  const statePaths = getWorkspaceStatePaths(workspace.workspaceRoot);

  await captureStandardProjectDataSnapshot({
    dataDirectory: workspace.dataDirectory,
    statePaths,
  });
}

export async function pullWorkspace(options: WorkspaceCommandOptions): Promise<void> {
  await cloneWorkspace(options);
}

export async function decompileWorkspace(options: WorkspaceCommandOptions): Promise<never> {
  throw new Error(
    `decompile workflow is not implemented yet for workspace ${options.workspaceRoot}.`,
  );
}

export async function compileWorkspace(options: CompileWorkspaceOptions): Promise<never> {
  const commandName = options.check ? "compile --check" : "compile";
  throw new Error(
    `${commandName} workflow is not implemented yet for workspace ${options.workspaceRoot}.`,
  );
}

export async function diffWorkspace(options: WorkspaceCommandOptions): Promise<never> {
  throw new Error(`diff workflow is not implemented yet for workspace ${options.workspaceRoot}.`);
}

export async function pushWorkspace(options: PushWorkspaceOptions): Promise<never> {
  const commandName = options.allowDestructive ? "push --allow-destructive" : "push";
  throw new Error(
    `${commandName} workflow is not implemented yet for workspace ${options.workspaceRoot}.`,
  );
}
