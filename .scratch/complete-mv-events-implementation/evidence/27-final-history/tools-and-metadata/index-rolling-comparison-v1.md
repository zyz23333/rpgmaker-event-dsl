# Ticket27 evidence-index timing and bounded-read change

Original `fullcheck-v1` exited1 with44 files/1153 tests:1151 passed and2 failed. One existing Decompile publication child produced no IPC/stdout/stderr before its original10-second deadline. Its exact child and complete result remain retained. The documentary Choices E2 review omitted its requirement ID; its925-byte original is retained with SHA verified against clean18e7ac. Appending pending IDs corrected only the documentary lookup.

`deadline-and-index-focused-v1` retained the original limits and2workers: Decompile015 passed in about3.96seconds, but the now-reachable complete index timed out at10007ms. This does not establish that the original child responsiveness failure has a fixed root cause.

The original32-file batch implementation's complete read-only profile validated6429 result records containing1,170,007,539 characters in10416.79ms. Requirements124.66ms/list33.77ms/read waiting7812.63ms/JSON1777.96ms/schema380.69ms/fingerprint268.90ms/other8.68ms. The entire6562-file input set, including6429 result records, was physically retained after the timed run:1,173,063,016 bytes, regular nlink1 files and read-back SHA checks. See `index-profile-retained-inputs-v1.json`.

Root reviewed the minimal tool-only replacement before execution. It preserves the maximum32 unsettled reads and original sorted validation order, replacing batch barriers with a32-slot ring that refills a completed slot before parsing its current content. Reads always settle to data or explicit failure, so a later I/O rejection is handled even if an earlier validation aborts. All existing schema, requirement identity, run identity, fingerprint, fixture and difference checks remain present. No product source, accepted domain, requirement, fixture pin, worker count or deadline changed.

Static package typecheck, scoped lint and scoped formatting all exited0. The changed helper SHA stayed `343a11790df3a07ded5b34aa17a2e5fd0fcb7b65e5e25776ee995e6d451fddba`.

The changed complete read-only profile validated the same6429 records and1,170,007,539 characters in4250.86ms: await-read1570.07ms/JSON1791.19ms/schema382.78ms/fingerprint263.47ms. This is an observed comparison with run order and file-cache limitations, not a guarantee against every host delay or an assertion that I/O scheduling alone explains the full timing difference. The independent actual public index test then passed at the original10-second limit and2workers:1passed/2filtered,4.22seconds in the test and5.79seconds overall. The profiles are diagnostic function executions, separately identified from that actual test pass.

Every original failed run, profile source, instrumented copy, output and completion receipt remains append-only. This note does not claim the later full check, fresh build, built Windows baseline, E2 comparison or actual native games have already passed.
