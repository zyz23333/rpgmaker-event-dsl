# Event command reference

[Documentation](../../README.md)

Command helpers follow the RPG Maker MV 1.6.1 editor's names in camelCase. Each
reference below contains examples, accepted inputs, defaults and saved-state rules.
Import helpers from `rpgmaker-event-dsl` and place commands in an explicit event's
`commands` list; short fragments in the reference omit that surrounding context.

| Command family                                                                                    | Reference                                                      |
| ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Show Text, Number Input, Select Item, Scrolling Text, Comment, Choices, Conditional, Loop, Labels | [Messages and flow control](message-flow.md)                   |
| Switches, Self Switches, Variables, Timer, Gold, Items, Equipment inventory, Party, Shop          | [Switches, variables, inventory and party](variables-party.md) |
| Map appearance, characters, locations and all Movement Route instructions                         | [Map, characters and movement](map.md)                         |
| Pictures, audio, screen effects, Wait and Movie                                                   | [Pictures, audio and screen effects](media.md)                 |
| Actor resources, growth, skills, equipment, text/images, enemies and battle control               | [Actors, enemies and battle](actors-battle.md)                 |
| Access settings, window color, Menu, Save, Game Over and Title                                    | [System access and scenes](system.md)                          |
| Script, Plugin Command, raw commands and the Script Command Gate                                  | [Scripts, plugins and raw commands](extensions.md)             |

Continuation records belong to their parent helper: Show Text owns its text lines,
Choices and Battle Processing own result bodies, Shop Processing owns goods
continuations, and Set Movement Route owns route mirrors. Write the helper's named
fields rather than separate native continuation commands.

Some legal native saved values differ from current editor picker choices or remain
saved while inactive. Each reference describes which values are preserved, warned
about or rejected. Command coverage does not guarantee that every plugin or malformed
native shape is supported; see [raw command boundaries](extensions.md).

For enclosing events, pages, identities and Project Data References, use the
[event reference](../events.md). For exact asset filenames, indirect dependencies
and exceptions, use the [asset reference](../assets.md).
