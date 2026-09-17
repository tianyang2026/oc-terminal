# Changelog

## 0.1.0

- Package the original local terminal-shortcut plugin for OpenCode V2.
- Provide toggle, new, hide and end actions without separate CLI keybindings.
- Intercept configured CSI-u/Kitty and xterm shortcuts before native terminal forwarding.
- Suppress shortcut repeat/release events while preserving unrelated shell input.
- Share configurable bindings between ordinary keymaps and raw input handling.
- Add session-scoped terminal selection, protocol/lifecycle tests and bilingual documentation.

Compatibility baseline: OpenCode 2.0.5. Native command IDs and persistent PTY APIs remain version-sensitive.
