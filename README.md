# oc-terminal

[中文说明](README.zh-CN.md) · [OpenCode V2 plugin documentation](https://opencode.ai/v2/docs/cli/plugins/)

**VS Code-style shortcuts for OpenCode's built-in persistent terminals — including while the terminal is focused.**

Open, create, hide, restore and end terminals from the keyboard. Uses OpenCode's native right-hand terminal pane and persistent PTYs; no tmux dependency.

## Install from GitHub

```sh
opencode plugin add github:tianyang2026/oc-terminal
```

The package exports both a dependency-free server entry and `./tui`. OpenCode loads its TUI component automatically. Compiled files are included in Git, so users do not need to build the plugin.

For a pinned release:

```sh
opencode plugin add github:tianyang2026/oc-terminal#v0.1.0
```

Restart the TUI if the new commands do not appear. All four shortcuts are provided by the plugin; no `keybinds` entries are required. The plugin adds commands to the palette under **oc-terminal**, and does not add a `/terminal` slash command.

For a **local, CLI-only installation**, clone this repository and add its absolute path to the `plugins` array in `~/.config/opencode/cli.json`. This keeps the plugin local when connecting to remote servers. Do not install the same plugin through multiple paths.

## Shortcuts

| Shortcut | Action |
| --- | --- |
| <kbd>Ctrl</kbd> + <kbd>`</kbd> | Show/hide the terminal pane; reopening selects the last listed terminal, or creates one if none exist |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>`</kbd> | Create and open a new terminal |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Q</kbd> | Hide the pane, keeping the shell running |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>K</kbd> | End a running terminal: one is ended directly; multiple open a picker |

The picker is session-scoped. OpenCode's plugin API does not expose the native pane's selected terminal, so the plugin does **not** guess which terminal is visible when several are running.

Persistence belongs to OpenCode. Hiding the pane or reconnecting a TUI can reattach to a surviving PTY. Ending a terminal really ends it; “restore” does not resurrect a killed shell or survive every server/machine failure.

## Configure

For a local CLI installation, use the object form in `cli.json` (merge into your existing plugin list):

```json
{
  "plugins": [
    {
      "package": "/absolute/path/to/oc-terminal",
      "options": {
        "keys": {
          "toggle": "ctrl+alt+t",
          "new": "ctrl+shift+`",
          "hide": "ctrl+shift+q",
          "kill": false
        }
      }
    }
  ]
}
```

Supported bindings in v0.1: `ctrl+[alt+][shift+]<single ASCII key>`, such as `ctrl+alt+t`. Use the unshifted symbol in bindings (`ctrl+shift+1` for Ctrl+Shift+1), and `false` to disable an action and its palette entry. Function keys, leader sequences and multi-key chords are not supported yet. Conflicting or invalid bindings fail with an explanatory error.

The same configuration drives ordinary keybindings and raw input interception. Rebinding a shortcut stops intercepting its old sequence.

## Compatibility and input handling

- Developed against **OpenCode V2 2.0.5**; the original local implementation was exercised on macOS. Other OpenCode versions, operating systems and terminal emulators need validation.
- Uses experimental `persistentPty` APIs and native command IDs: `terminal.toggle`, `terminal.close`, `session.terminal`. These may change between OpenCode releases.
- The native terminal intercepts key events ahead of normal command bindings. This plugin consumes only configured shortcuts at the earlier raw-sequence stage, supporting CSI-u/Kitty and xterm `modifyOtherKeys` sequences.
- Shortcut repeat/release events are consumed without executing the action again. Ordinary typing, paste and unrelated terminal keys pass through.
- Legacy control bytes cannot distinguish Ctrl+Shift+K from Ctrl+K. They are deliberately left alone. If your terminal does not send distinct extended key sequences, shortcuts inside the pane may not work; use the palette or configure a supported distinct combination.
- OpenCode's built-in `/terminal` entry remains available. This plugin controls the native right-side pane; it does not add bottom docking or fullscreen layout.

### Migrating from the original local prototype

Remove the old `oc-terminal` directory from OpenCode's auto-discovery path before installing this package, keeping a backup elsewhere if desired. Remove the prototype's `terminal.toggle` and `terminal.close` overrides from `cli.json` so custom plugin bindings are the sole source of truth. A separate old `local.terminal`/tmux plugin can remain disabled with `"-local.terminal"`.

## Development

```sh
npm ci
npm test
npm pack --dry-run
```

Tests cover protocol decoding, pass-through, custom keys, lifecycle cleanup, native command dispatch and terminal selection/removal with a mocked host. They are not a replacement for interactive TUI testing.

`dist/` is committed for direct Git installation. Run `npm run build` and commit generated changes alongside source changes. CI checks tests, generated-file consistency and package contents on Node 22 and 24.

Source: `src/terminal.ts` (plugin behavior), `src/shortcuts.ts` (shared binding/protocol mapping), `src/tui.ts` (TUI entry), `src/index.ts` (server entry).

MIT licensed. Issues and small, focused contributions are welcome.
