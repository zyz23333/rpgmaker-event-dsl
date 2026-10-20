import { validateRequirements } from "./mv-evidence.js";

await validateRequirements({ history: "all" });
console.log(
  "Evidence index and all historical result records are valid; coverage status is audited separately.",
);
