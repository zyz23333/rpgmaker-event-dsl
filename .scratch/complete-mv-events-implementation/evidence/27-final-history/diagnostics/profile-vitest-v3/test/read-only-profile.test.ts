import * as workspace from "M:/Shuen/Codex/mv-events-implementation-20261020/worktrees/mv-ticket-27-final/packages/rpgmaker-event-dsl/src/workspace-api.ts";
import { validateRequirements } from "../index-profile.mts";
it("read-only full index profile with original workspace module imports", async () => { if(typeof workspace.cloneWorkspace!=="function")throw new Error("workspace import missing"); await validateRequirements(); });
