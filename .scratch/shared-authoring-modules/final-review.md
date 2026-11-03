# Shared authoring final review

Status: resolved
Date: 2026-11-03

Fixed baseline: `d24991486b118f3b71f24f0938b400652c5cd857`.
Initial reviewed HEAD: `cdbee50b76f36e4ef718765f37fa0f20fd6fd133`.
Independent recheck HEAD: `9c92973750fde1619607e32ad73557756b2a8b0b`.
Diff: `git diff d24991486b118f3b71f24f0938b400652c5cd857...HEAD`.

Two independent reviewers performed the Standards and Spec axes. Initial line references below identify the initial reviewed commit. All findings were fixed by one implementer, and each original reviewer independently rechecked its axis. The final subsequent merge `9ca0f2a567b584ad95093caff977d444a1345aa0` only clarifies sample setup and records the verified post-build executable-link refresh; it does not change product code.

## Standards

- **[P2] Preserve module initialization order when projecting function identities.** In `packages/rpgmaker-event-dsl/src/workspace/definition-identities.ts:147`, the new function closure uses the unrestricted module `binding` resolver; `:211` evaluates initializers against the completed binding table. Consequently, `export const identity = pick(); function pick() { return { id }; } const id = 99;` supplies identity 99 to Decompile even though the call reads an uninitialized const. A public Workspace API probe under Node 22 confirmed Compile Check rejects this source with `Cannot access binding "id" before initialization`, while Decompile publishes all three candidate source files. This breaches `docs/adr/0020-restricted-shared-authoring-modules.md`: “Ordinary lexical bindings, including shadowing and const initialization order, apply within that subset,” and ADR 0014's requirement to fail when existing declarations cannot be evaluated sufficiently to determine identity. Preserve the module initialization environment when invoking identity functions, while keeping unrelated fields lazy; reject this case before publication.

No additional actionable documented-standard breaches or baseline-smell findings. The separate eager evaluator and lazy identity projection are required by ADR 0020, so their intentional semantic separation is not reported as duplication. Tooling-enforced checks were excluded. Repository remained clean.

### Independent recheck at 9c92973750fde1619607e32ad73557756b2a8b0b

**Original P2 finding resolved.** Reviewed `git diff cdbee50b76f36e4ef718765f37fa0f20fd6fd133..HEAD` and reran the original public Workspace API reproduction under Node 22. Decompile now rejects it with `MV-DECOMPILE-IDENTITY ... Identity module binding id is read before initialization` instead of publishing candidate files; Compile Check retains its matching rejection. The fix carries the originating module's initialization boundary through function calls and deferred fields, checks it before memo lookup, and preserves completed imported-module bindings. The added public-seam regressions cover direct/transitive imports, scalar/field/arrow results, escaped local objects, and initialized functions with unrelated commands left lazy.

The changed validation rule for forbidden values nested in unused function array results remains inside ADR 0020's restricted function boundary. The Compile Contract Version advance to `/44` and the `/43` freshness regression follow ADR 0013. No remaining or new actionable documented-standard breaches or baseline-smell findings were found in the fix surface. I did not rerun the full suite or edit product files; the repository remained clean.

## Spec

1. **[P2] Reject forbidden results inside arrays in unused functions.** In `packages/rpgmaker-event-dsl/src/workspace/definitions.ts:287`, `validateAuthorCalls.resolveValue()` treats every array expression as unknown; consequently the return checks at lines 312–317 miss known function tokens inside it. Public `compileWorkspace({ check: true })` accepts a loaded `function leaf() { return comment({ lines: ["ok"] }); } function unused() { return [leaf]; }` beside a valid event. Calling `unused()` instead reaches `assertAuthorResult` and rejects the same unsupported result. Spec line 72 says “函数返回函数不在第一版内”; line 78 requires “不能以函数尚未调用为由让不支持的函数体悄悄通过正式编译”. Traverse array elements/spreads in inert result validation and cover this unused-body case, so Check does not certify a module whose validity changes only when the already-loaded helper is used.

2. **[P2] Preserve module initialization order in Decompile identity projection.** `packages/rpgmaker-event-dsl/src/workspace/definition-identities.ts:197–213` resolves any module const lazily without tracking whether it was initialized when an identity-producing function was invoked. Repro: `const identity = select(); const id = 99; function select() { return id; }`, then an explicit exported `commonEvent({ id: identity, name: "Existing", trigger: "none", commands: [] })`. Public Compile rejects `Cannot access binding "id" before initialization`, but public Decompile succeeds and publishes `src/decompiled/` using identity 99. Spec line 70 requires “遵循所支持语法的普通词法绑定规则”; line 86 requires “身份无法可靠确定仍须失败”. Track the module evaluation boundary needed by identity reads, as function-local TDZ handling already does, and reject before candidate publication while retaining lazy treatment of unrelated command payloads.

Both repros ran against reviewed HEAD through the public Workspace API on Windows / Node 22.19.0. No product files changed.

### Independent fix recheck — 2026-11-03

Reviewed integration HEAD `9c92973750fde1619607e32ad73557756b2a8b0b`, including `git diff cdbee50b76f36e4ef718765f37fa0f20fd6fd133..HEAD`.

Both original Spec findings are **resolved**. Re-ran the original external public-Workspace-API probes on Windows / Node 22.19.0: Compile Check now rejects the unused `[leaf]` result at its actual return location, and Decompile rejects the module-before-initialization identity with `Identity module binding id is read before initialization` instead of publishing candidates. Ordinary Compile continues to reject that same invalid identity.

Inspected inert array/spread traversal, module initialization cutoffs, propagation through calls and deferred fields, and the added negative/positive workflow cases. The changes preserve lazy treatment of unrelated command payloads and permit calls after the relevant module constants initialize. Compile Contract Version is advanced to `/44` with previous-version rejection coverage. No remaining or new actionable Spec findings in the changed surface. Product files were not edited, and no full suite was repeated.

## Final delivery verification

The retained integration worktree was built with actual Windows / Node 22.19.0 and pnpm 10.33.0. Its built `shared-authoring-cli.test.ts` passed 1/1 in 15.22 seconds, covering the documented workflow, stale transitive dependencies, recompilation, saved output and documented failures. A post-build frozen install and the sample package's `pnpm exec rpgmaker-event-dsl --help` also succeeded. Focused source and static-check receipts are in [ticket 07](issues/07-cli-examples-and-acceptance.md#comments); earlier feature matrices remain in tickets 01–06. No native MV editor/game execution is claimed.

Standards: 1 initial finding, worst P2, resolved, 0 remaining. Spec: 2 initial findings, worst P2, resolved, 0 remaining. The shared initialization finding appears on both axes; there were 2 distinct product defects.
