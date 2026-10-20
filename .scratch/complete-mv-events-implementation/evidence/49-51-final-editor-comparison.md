# Final E1–E7 editor evidence and built-product comparison

Tickets49–51 use the user-approved editor reverse-engineering replacement. This report keeps shipped-code observations, conditional deductions, synthetic saved inputs and actual built-product output separate. Editor UI and actual game execution are not performed by this batch. Final R1–R7 belongs to52–54.

## Candidate and execution

Final built-product execution is pending ticket48. The comparison script and all new logs, temporary workspaces and receipts are under `M:/Shuen/Codex/mv-events-implementation-20261020/final-e1-e7/`. No build or full test suite is repeated here. The script composes complete independently authored native arrays; it does not run a compiler to construct its oracle. Its serializer emits numeric `-0` literally so the filesystem input and comparisons retain the accepted saved-value distinction.

## Shipped identity and evidence reuse

The selected editor is `F:/Shuen/RPG/rpgmaker-event-dsl/references/RPGMV/RPGMV.exe`, 19,595,264 bytes, SHA256 `1b7d685fd302505b104f51cc539e2d6c997b5164d4a6a55e745283536503d281`. Historical PE Evidence `ev_007ba386e622855bf771049084c3103afebbcc6b5d813f18c441f3ecf1d16d24` reports FileVersion1.6.1.0/ProductVersion1.6.1; this is self-reported version, not authentication of release origin. Historical SpinBox constructor Evidence is `ev_0abda227cbae2d1ac569a8e0af403fc960727b39b3d337287fe4165a16926d1d`. These are historical pointers, not new Evidence IDs.

Node22 read-only `verify-resources.cjs` rechecked five actual artifacts and183 resource references (including repeated references across reports), using the03–10 metadata, original `editor-serialization.md` table and ticket23's retained34-resource container receipt. All whole-file bytes/SHA256, outer lengths, decoded lengths/SHA256 and complete zlib input consumption matched. The external machine receipt is `resource-identity-receipt.json`; no first-party source was copied into this report or Git. The reused container code map remains `C:/Users/Shuen/.codex/tmp/mv-e1-editor-container-code-map.md`, with full decoded text outside Git. This batch made no new binary-analysis claim; an available REA session inventory was read once and did not produce new target Evidence.

The actual retained SpinBox bundle and ticket23 PE-resource Evidence `ev_b8067f7657b1ddb9b5509bb30f4e70e609bc89a84c5111b35af88e3cb87f39bd` were also parsed read-only: both Evidence IDs and subject hashes match their respective DLL/EXE. Their bundle file hashes are included in the same resource receipt. Native Ghidra output is decompiled evidence with its stated limitations; it is not original source or an executed Qt signal trace.

## E1

`MV-S7-E1` compares complete Map/Common/Troop defaults, five Map triggers, three Common triggers and three Battle spans, active/disabled condition settings, exact note, image fields, saved noncustom routes and normal20-page inputs. The independent21-page and Map Event ID1000 cases are explicitly synthetic saved capability; they are not ordinary button creation. The shrunk1×1 map retains saved coordinates99/88 with context warnings.

Reused code facts: template Q346222; Map whole-event clone/Apply Q8667116 and Q693633; page field/route bindings Q701512; Common bindings Q967367; Battle five condition flags Q8779077 and complete clone/return Q959423:95–105; ordered page enumeration and20-page creation buttons Q674163/Q959423/Q647618; nested serialization Q909009. Common none's explicit switch remains a normal capacity-checked reference, while disabled page-slot exceptions remain the accepted synthetic saved domain. Active field checks do not silently erase disabled values.

Image selection Q626433:93–127 rebuilds all image fields and can emit a category change to priority binding Q701512:35–36. Loading/serializing an existing event is a separate path and preserves residual tile/character fields. Page route confirmation explicitly sets wait=false; changing moveType alone does not delete or re-confirm its saved route. Note uses a one-line editor control: multicharacter/newline product preservation is an accepted saved contract, not a claim that opening the native note control always preserves every injected string. Qt signals/focus and actual write success remain outside the static observation.

## E2

`MV-S7-E2` compares the four child-body families, empty/nonempty/nested bodies, missing and empty else, present/absent child tails, exact402/403 and per-level0, all four Battle flag combinations, sole Shop placeholder, ordered repeated mixed placeholders/goods and free/custom upper prices.

[03](03-branches-and-battle-reverse.md) establishes insertion/tail, Choice and Battle paths; [07](07-shop-defaults-and-goods-reverse.md) establishes Shop load/append/reorder/copy/save. Choice403 `[6,null]` is the undefined-slot plus JSON deduction under the stated six-choice limit. One-choice Qt creation timing remains bounded as described in03. Shop's accepted exact `{kind:"placeholder"}` is `[0,0,0,0]`; sole placeholder becomes `goods:[]`, while mixed/repeated occurrences preserve order. This approval does not extend other zero-ID combinations.

## E3

`MV-S7-E3` compares Page and205 routes, absent/empty parameter envelopes as applicable, nonterminal indent absent/null/zero, bothM0 envelopes, exact complete505 mirrors and flags. The same independently saved route occurs under noncustom page settings, so preservation does not depend on present runtime execution.

[04](04-movement-records-and-mirrors-reverse.md) distinguishes default Page/205 flags and follows insert/replace/copy/paste. The accepted zero state comes from the specific null-record copy/paste arithmetic and retained exact-function replay. This remains conditional code execution evidence, not editor UI. M0 and the full505 mirror rule retain their original finite contract. All45 instruction parameter domains retain their separate automated responsibility.

## E4

`MV-S7-E4` compares Timer stop `[1]`, `[1,0]`, `[1,83]`, start boundaries, fixed/variable Transfer independent values and nondefault coordinates, Shop purchaseOnly/empty goods and Battle flags. [05](05-timer-stop-reverse.md), [06](06-transfer-defaults-reverse.md), [07](07-shop-defaults-and-goods-reverse.md) and03 separate new instance, existing load, explicit mode edits, parameter confirmation and container serialization.

Transfer's current-project map initial selection is not a compiler default; explicit map/x/y remain necessary. Fixed retain-direction/black-fade defaults do not inherit current project settings. Actor image refresh similarly reads project values on active actor change, while existing parameter load explicitly restores saved fields. This comparison does not claim to execute Qt mode-switch signal timing; it checks the independently accepted final saved values.

## E5

`MV-S7-E5` compares all four physical-line families: one/four Show Text lines, one/many Scrolling Text records, one/six Comment records and one/twelve Script records; empty strings and trailing empty records are preserved. Complete Label/Jump/Plugin line, actor Name/Nickname/Profile, Conditional/Variable script and MovementM45 strings include original CR/LF/CRLF and trailing characters. These control-character inputs are explicitly injected synthetic saved values.

[09](09-single-slot-strings-and-reconfirmation-reverse.md) separates direct saved-text slots from line records and documents native TextEdit maximumLineCount, width, lineCount, re-entry and CR conversion unknowns. Native reconfirmation risk warrants the accepted warning; it does not authorize normalization. The final product comparison checks complete carrier equality and warning reasons from original text. Script Gate remains enabled explicitly for saved scripts and is independently covered by the mandatory full candidate suite.

## E6

`MV-S7-E6` compares standard face7, third-row8/11, None with independent11/2147483647, character and face fields independently, missing image names and shrunk-map old coordinates. No asset files are supplied to the synthetic Workspace. Product equality therefore demonstrates saved values without consulting local image dimensions; warnings describe the standard-layout/context risk and do not claim a missing-file scan.

[08](08-face-index-and-image-replacement-reverse.md) follows fixed four-column/dynamic-row selection and parent load/save. For a fully loaded576×288 image, active cursor adjustment can reset a previous third-row index; with576×144 frameActive is false and that function skips adjustment. A1ms source timer does not prove the image is loaded. None and missing filenames also depend on unexecuted model/image timing. These bounded unknowns do not prevent the accepted independent name/index saving contract, and no actual picker/display result is asserted.

## E7

`MV-S7-E7` compares accepted constant9,999,999, lower1, independent lose+showLevelUp=true and variable operand slots. Original-helper, recognized-Raw and native-Decompile tests reject constant10,000,000 with located diagnostics and unchanged business state.

[10](10-exp-boundaries-reverse.md) separates the editor's control maximum9,999,999 from help99,999,999. A single full-text handler invocation on `10000000` truncates to seven characters before numeric conversion, giving candidate1,000,000. Numeric loaded10,000,000 follows the range setter with candidate9,999,999. Neither result is an unconditional prediction of full UI typing/paste/OK timing. Container serialization does not call that control; product refusal preserves the accepted domain rather than silently clamping it. Runtime variable values over this bound are the actual game's separateR7 responsibility.

## Bounded parameter responsibility check

The final105+45 traceability count is not a parameter-completeness proof. This pass cross-checks the independent `command-parameters/index.md` and the core, visual-map, actors-battle and movement normative groups against existing named fixture/test responsibilities: Choice headers/body mirrors; all Conditional and Variable operand modes; Input/Select Item slot limits; reverse ranges and unnamed System slots; Picture structural padding/tone/signed numeric values; audio None with independent four fields; location direct/variable/exchange and context coordinates; actor target/operand/enumeration flags; equipment runtime slot interpretation; Enemy/Force selectors and Battle flags; movement no-parameter versus parameterized envelopes, switch/speed/frequency/image/audio/script limits.

Representative tests and independently authored fixtures are linked by the existing438-row requirement index and ticket48 final source/built runs. No obvious unassigned parameter responsibility was identified in this bounded check. This statement does not claim every numeric combination was exhaustively retested, or turn a helper/code count into proof of runtime/editor behavior. Existing final native rows that combineE andR remain pending until their actual game obligations complete.

## Outcome

Pending the final built comparison. No ticket or E-group is marked passed by this preparation document.
