# Scripts, plugins and raw commands

[Documentation](../../README.md)

Examples use helpers from `rpgmaker-event-dsl`; short fragments omit imports and containing event declarations. See [events and references](../events.md) for enclosing types and [asset validation](../assets.md) for file checks.

## Script and Plugin Commands

Use `script({ code })` or `script(scriptInput({ code }))` under the Workspace
`scriptEnabled` Gate. Code splits only on LF into 1–12 physical records, including
empty and trailing records; CR stays literal. Empty and nested recognized raw scripts
also require the Gate. Decompile may publish them with a warning while the Gate is
closed. Single-slot Script Inputs in other command families retain their own full-string
contract without this record-count limit.

Use `pluginCommand({ line })` for a complete Plugin Command Line. The required string
may be empty and preserves every space, Tab, CR and LF. Plugin Commands compile with
the Script Command Gate closed; an optional Plugin Command Registry supplies lint,
while plugin-specific runtime semantics stay outside validation.

## Raw commands and the Script Command Gate

`rawDslCommand({ code, indent?, parameters })` carries one event command. Explicit
indent 0 is absolute. Decompile preserves genuinely unknown event codes with warnings,
provided the native envelope, strict JSON parameters and owning structure are valid.
Known malformed or currently unrepresented saved variants fail before source publication.
Known raw codes receive the same supported parameter, reference, continuation and
mirror validation as formal commands.

Strict JSON accepts finite numbers including negative zero, exact strings, null, dense
ordinary arrays and ordinary own-data objects. It preserves own `__proto__` keys, key
presence and empty containers. Undefined, holes, non-finite numbers, custom prototypes,
accessors, cycles and extra native record fields are rejected.

The Gate checks every recognizable script location, including empty or unreachable
355/655 records, script conditions and variable operands, route scripts, 505 mirrors
and saved Page routes even outside custom movement. When `scriptEnabled` is false,
Decompile warns while producing source; Check and Compile reject actual current source
containing scripts. Removing those scripts permits compilation without replacing the
old Snapshot. Plugin command argument semantics remain external.

For compile-time functions and imports, see [shared authoring](../../authoring.md#parameterized-command-functions). Their restricted evaluation is separate from the Script Command Gate.
