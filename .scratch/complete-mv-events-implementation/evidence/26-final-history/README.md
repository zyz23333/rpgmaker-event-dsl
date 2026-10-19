# Ticket26 finalization execution history

This is the append-only finalization archive for current Compile Contract `mv-1.6.1/12`. It follows the [original DEV history](../26-history/README.md) and [current Timer report](../26-timer-saved-slot-roundtrip.md#最终化构建与-e4-产品比较--mv-16112). The original C worktree and its clean DEV commit remain intact. The actual executed product is clean commit `3c7aad677b489dec22d1ff21ba4c94272e47fea8` in `codex/mv-ticket-26-final`, after merging actual integration `888b95019192806b88c73d7804f0662e4cce7e8b`.

All commands used Windows / Node22.23.0 / pnpm10.33.0 with the original two workers and timeouts. New logs, TEMP/TMP, Windows sandboxes, physically retained execution inputs, E4 workspaces and original result files remain under `M:/Shuen/Codex/mv-events-implementation-20261020/ticket26-final/`. The root/package dependency junctions were consumed without modification; their F drive targets are not archive cleanup targets.

| Capture | Actual outcome | Retained per-requirement results |
| --- | --- | ---: |
| `fullcheck-v1` | Exit1; 42 files,1061 passed/8 failed. Seven obsolete coarse raw diagnostic assertions plus one evidence-index timeout at the original10 seconds. | 471 passed records |
| `focused-reconcile-v1` | Exit0; Loop, Movement, Timer and index,4 files/140 tests. | 62 passed records |
| `fullcheck-v2` | Exit0; full typecheck/lint/format and42 files/1069 tests. Historical lint warnings retained. | 471 passed records |
| `build-v1` | Exit0; fresh15-file dist; no dist existed in the new finalization tree before this build. | 0 |
| `built-windows-v1` | Exit0;18 files/455 tests,317.30 seconds, actual current built entry. | 453 passed records |
| `e4-launch-v1` | Exit0; actual current-built public Workspace comparison,14 scenarios/10 negative cases/10 resource identities. | 1 passed documentary comparison record |

The1458 new result records are individual requirement captures. In particular,471 passing captures from `fullcheck-v1` do not make that overall failed command pass. Its closed original stdout/stderr and exit1 receipt are retained. Only seven expected diagnostic paths changed after that run; no fixture pin, requirement row, worker count, timeout or accepted domain was weakened.

[archive-index-v1.json](archive-index-v1.json) maps all1507 initially archived files to their external originals, byte lengths and SHA-256. It includes closed stage logs, original machine results in the shared `results/` directory, three complete execution-input manifests, exact finalization tools, merge metadata and [E4 report](e4/report.json). E4's independently authored complete15 input carriers, actual generated4 and live15 carriers retain numeric negative zero in their original strict JSON bytes. The more readable scenario report also marks negative zero explicitly because ordinary JSON.stringify writes a numeric negative zero as0.

The [built input manifest](built-inputs-v1/manifest.json) binds source99 files, test/fixture61 files, dist15 files and all189 execution inputs. Its complete fingerprint is `ff26c6971616a1a96fd6f3412628d4819fa6e2b608331285970503fb9bcdd022`; source is `2fe2c69db4583c49d68af70d3ed3af703d38a6428bda3ba7b0c1429f6475e613`, and dist is `5342718948fcdbf73210a3d1f49153e3f16b30ddd8eeaaf2075e7d962483efe9`. Every actual execution file and its retained regular physical nlink=1 copy was SHA-checked after E4 and during the immutable byte audit.

The completed immutable audit preserves all300 incoming requirement rows in their original order and all288 original DEV rows by ID; current requirements remain314. It verifies6084 unique historical files from the incoming/DEV union by exact raw Git blob identity, plus applicable exact earlier report prefixes. The original26 report and merged evidence README remain exact prefixes. All1507 new archive input/copy pairs match, and all189 executed input/dist bytes remain unchanged. The closed audit and final selected index captures are copied separately under [post-archive-index-v1.json](post-archive-index-v1.json), leaving the first archive index immutable and excluding each producer's own currently open output.

The dedicated `.gitattributes` rule preserves this directory's original bytes, including mixed historical newlines and tool files. A committed-blob verifier reads back every new archive file, all174 non-dist execution inputs and final metadata through `git cat-file --batch`; its final clean SHA/tree receipt stays outside the commit to avoid self-reference. The retained15-file dist remains bound by the exact manifest and final audit.

E4 reuses the05 bounded same-identity load/save/container analysis. No new native session or Evidence ID was created, and no extracted first-party resource was executed or committed. This archive contains original conclusions, synthetic product fixtures and identity metadata, not an editor UI or game capture.26 has no allocated game group; final50 and actual52–54 remain later responsibilities.

Final selected evidence-index capture passed at the original10-second limit:1 test passed and2 filtered,4.11 seconds in the test and5.66 seconds overall. The closed original logs and receipts are retained under post-archive/final-index-v1/. Ticket26 is now resolved after its applicable gates; final metadata changes leave the executed product unchanged.
