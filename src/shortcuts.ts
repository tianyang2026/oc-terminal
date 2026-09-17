export const defaults = {
  toggle: "ctrl+`",
  new: "ctrl+shift+`",
  hide: "ctrl+shift+q",
  kill: "ctrl+shift+k",
} as const

export type Action = keyof typeof defaults
export interface Shortcut { action: Action; bind: string; code: number; modifiers: number }

// Normalize shifted US-layout symbols to the key used in binding strings.
const plain = "`1234567890-=[]\\;',./"
const shifted = '~!@#$%^&*()_+{}|:"<>?'
function baseCode(code: number): number {
  if (code >= 65 && code <= 90) return code + 32
  const index = shifted.indexOf(String.fromCodePoint(code))
  return index < 0 ? code : plain.charCodeAt(index)
}

export function createShortcuts(value: unknown): Shortcut[] {
  if (value !== undefined && (value === null || typeof value !== "object" || Array.isArray(value))) {
    throw new Error("oc-terminal: keys must be an object")
  }
  const overrides = (value ?? {}) as Record<string, unknown>
  for (const action of Object.keys(overrides)) {
    if (!Object.hasOwn(defaults, action)) throw new Error(`oc-terminal: unknown action ${action}`)
  }
  const used = new Set<string>()
  return (Object.keys(defaults) as Action[]).flatMap((action) => {
    const bind = Object.hasOwn(overrides, action) ? overrides[action] : defaults[action]
    if (bind === false) return []
    if (typeof bind !== "string") throw new Error(`oc-terminal: invalid binding for ${action}`)
    const parts = bind.toLowerCase().split("+")
    const key = parts.pop()!
    const modifiers = parts.reduce((bits, part) => bits | ({ ctrl: 4, shift: 1, alt: 2 }[part] ?? 0), 0)
    if (!parts.includes("ctrl") || parts.some((p) => !["ctrl", "shift", "alt"].includes(p)) ||
        new Set(parts).size !== parts.length || key.length !== 1 || !/^[\x21-\x7e]$/.test(key) || key === "+") {
      throw new Error(`oc-terminal: use ctrl+[alt+][shift+]<ASCII key> for ${action}, or false`)
    }
    const code = baseCode(key.charCodeAt(0))
    const identity = `${code}:${modifiers}`
    if (used.has(identity)) throw new Error(`oc-terminal: duplicate binding ${bind}`)
    used.add(identity)
    return [{ action, bind: [...parts, String.fromCharCode(code)].join("+"), code, modifiers }]
  })
}

export function matchShortcut(sequence: string, shortcuts: readonly Shortcut[]) {
  const kitty = /^\x1b\[(\d+)(?::\d*){0,2};(\d+)(?::([123]))?(?:;[\d:]+)?u$/.exec(sequence)
  const xterm = /^\x1b\[27;(\d+);(\d+)~$/.exec(sequence)
  // Legacy Ctrl bytes cannot distinguish Ctrl+K from Ctrl+Shift+K.
  // Leave them (and paste/mouse/control sequences) untouched.
  if (!kitty && !xterm) return
  const code = Number(kitty ? kitty[1] : xterm![2])
  if (!Number.isSafeInteger(code) || code < 0 || code > 0x10ffff) return
  const encodedModifiers = Number(kitty ? kitty[2] : xterm![1])
  if (!Number.isInteger(encodedModifiers) || encodedModifiers < 1 || encodedModifiers > 256) return
  const modifiers = (encodedModifiers - 1) & ~(64 | 128)
  const shortcut = shortcuts.find((s) => s.code === baseCode(code) && s.modifiers === modifiers)
  if (shortcut) return { action: shortcut.action, press: Number(kitty?.[3] ?? 1) === 1 }
}
