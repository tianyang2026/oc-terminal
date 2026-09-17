import assert from "node:assert/strict"
import { test } from "node:test"
import { createShortcuts, matchShortcut } from "../dist/shortcuts.js"

const bindings = createShortcuts()
test("CSI-u, Kitty alternates, modifier locks and xterm shortcuts", () => {
  for (const [sequence, action] of [
    ["\x1b[96;5u", "toggle"], ["\x1b[96;5:1u", "toggle"],
    ["\x1b[96;69u", "toggle"], ["\x1b[96;133u", "toggle"],
    ["\x1b[96;6u", "new"], ["\x1b[126;6u", "new"],
    ["\x1b[96:126:96;6u", "new"],
    ["\x1b[113;6u", "hide"], ["\x1b[81;6u", "hide"],
    ["\x1b[107;6u", "kill"], ["\x1b[75;6u", "kill"],
    ["\x1b[27;5;96~", "toggle"], ["\x1b[27;6;126~", "new"],
  ]) assert.deepEqual(matchShortcut(sequence, bindings), { action, press: true })
})

test("shell editing keys, ordinary input, mouse and paste are not shortcuts", () => {
  for (const sequence of [
    "`", "~", "hello", "\x03", "\x04", "\x0b", "\x11", "\x00",
    "\x1b[A", "\x1b[107;5u", "\x1b[96;1u", "\x1b[96;7u",
    "\x1b[<0;12;3M", "\x1b[200~hello\x1b[96;5u\x1b[201~",
    "\x1b[99999999;5u", "\x1b[96;0u", "\x1b[96;4294967301u",
  ]) assert.equal(matchShortcut(sequence, bindings), undefined, JSON.stringify(sequence))
})

test("repeat and release are recognized without triggering an action", () => {
  for (const event of [2, 3]) {
    assert.deepEqual(matchShortcut(`\x1b[96;5:${event}u`, bindings), { action: "toggle", press: false })
  }
})

test("customized and disabled bindings also change raw matching", () => {
  const custom = createShortcuts({ toggle: "ctrl+alt+t", new: false })
  assert.equal(matchShortcut("\x1b[96;5u", custom), undefined)
  assert.equal(matchShortcut("\x1b[96;6u", custom), undefined)
  assert.deepEqual(matchShortcut("\x1b[116;7u", custom), { action: "toggle", press: true })
  assert.equal(custom.find((s) => s.action === "toggle").bind, "ctrl+alt+t")
})

test("reject unsupported or conflicting bindings instead of silently ignoring them", () => {
  for (const value of [null, [], "keys", {unknown:true}, {constructor:true}, {new:null}, {new:13}, {new:"f4"},
    {new:"ctrl+ctrl+t"}, {new:"ctrl+super+t"}, {new:"ctrl+`"}]) {
    assert.throws(() => createShortcuts(value))
  }
})
