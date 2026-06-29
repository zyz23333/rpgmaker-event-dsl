export type WorkspaceCommandOptions = {
  workspaceRoot: string;
};

export type CompileWorkspaceOptions = WorkspaceCommandOptions & {
  check: boolean;
};

export type PushWorkspaceOptions = WorkspaceCommandOptions & {
  allowDestructive: boolean;
};

export async function cloneWorkspace(options: WorkspaceCommandOptions): Promise<never> {
  throw unimplementedWorkflowError("clone", options.workspaceRoot);
}

export async function pullWorkspace(options: WorkspaceCommandOptions): Promise<never> {
  throw unimplementedWorkflowError("pull", options.workspaceRoot);
}

export async function decompileWorkspace(options: WorkspaceCommandOptions): Promise<never> {
  throw unimplementedWorkflowError("decompile", options.workspaceRoot);
}

export async function compileWorkspace(options: CompileWorkspaceOptions): Promise<never> {
  const commandName = options.check ? "compile --check" : "compile";
  throw unimplementedWorkflowError(commandName, options.workspaceRoot);
}

export async function diffWorkspace(options: WorkspaceCommandOptions): Promise<never> {
  throw unimplementedWorkflowError("diff", options.workspaceRoot);
}

export async function pushWorkspace(options: PushWorkspaceOptions): Promise<never> {
  const commandName = options.allowDestructive ? "push --allow-destructive" : "push";
  throw unimplementedWorkflowError(commandName, options.workspaceRoot);
}

function unimplementedWorkflowError(commandName: string, workspaceRoot: string): Error {
  return new Error(
    `${commandName} workflow is not implemented yet for workspace ${workspaceRoot}.`,
  );
}
