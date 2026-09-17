import assert from "node:assert/strict"
import { test } from "node:test"
import { setupTerminal } from "../dist/terminal.js"

function fixture(options = {}) {
  let handler, layer, disposed = false, route = {type:"session", sessionID:"ses_test"}
  const calls = [], notices = [], removals = []
  const state = { terminals: [], selected: undefined, error: undefined, picker: undefined }
  const hostCommands = ["terminal.toggle", "session.terminal", "terminal.close"].map((id) => ({id}))
  const context = {
    options,
    ui: {
      router: { current: () => route }, toast: { show: (notice) => notices.push(notice) },
      slot(claim) { claim.render({}); return () => { disposed = true } },
      dialog: { async select(input) { state.picker = input; return state.selected } },
    },
    keymap: {
      layer(get) { layer = get() }, commands: () => hostCommands,
      dispatch: (id) => calls.push(id),
    },
    renderer: {
      prependInputHandler(fn) { handler = fn },
      removeInputHandler(fn) { assert.equal(fn,handler); handler = undefined },
    },
    client: { experimental: { persistentPty: {
      async list(input) {
        assert.equal(input.sessionID, "ses_test")
        if (state.error) throw state.error
        return state.terminals
      },
      async remove(input) { removals.push(input.ptyID) },
    } } },
  }
  const cleanup = setupTerminal(context)
  return {
    state, calls, notices, removals, hostCommands, cleanup,
    command: (action) => layer.commands.find((c) => c.id === `oc-terminal.${action}`),
    raw: (sequence) => handler(sequence), home: () => { route = {type:"home"} },
    isClean: () => disposed && handler === undefined,
  }
}
const pty = (id, status = "running") => ({id, status, title:"Terminal", command:"zsh", cwd:"/project"})

test("all four commands are registered without cli.json keybindings", async () => {
  const f = fixture()
  for (const action of ["toggle", "new", "hide", "kill"]) assert.ok(f.command(action).bind)
  await f.command("new").run()
  assert.deepEqual(f.calls, ["session.terminal"])
  f.cleanup()
  assert.ok(f.isClean())
})

test("focused-terminal raw shortcut is consumed once, preserving shell input", () => {
  const f = fixture()
  assert.equal(f.raw("\x1b[96;5u"), true)
  assert.equal(f.raw("\x1b[96;5:2u"), true)
  assert.equal(f.raw("\x1b[96;5:3u"), true)
  assert.deepEqual(f.calls, ["terminal.toggle"])
  assert.equal(f.raw("\x03"), false)
  assert.equal(f.raw("\x0b"), false)
  f.home()
  assert.equal(f.raw("\x1b[96;5u"), false)
  f.cleanup()
})

test("a missing host action reports an error without creating a hidden terminal", async () => {
  const f = fixture()
  f.hostCommands.splice(0)
  await f.command("new").run()
  assert.equal(f.notices[0].variant, "error")
  assert.match(f.notices[0].message, /session\.terminal/)
  assert.deepEqual(f.calls, [])
  f.cleanup()
})

test("only running terminals can be ended; multiple terminals require a selection", async () => {
  const f = fixture()
  f.state.terminals = [pty("pty_old","exited"), pty("pty_one")]
  await f.command("kill").run()
  assert.deepEqual(f.removals, ["pty_one"])
  f.state.terminals.push(pty("pty_two"))
  await f.command("kill").run() // cancelled picker
  assert.equal(f.removals.length, 1)
  assert.equal(f.state.picker.options.length, 2)
  f.state.selected = "pty_two"
  await f.command("kill").run()
  assert.deepEqual(f.removals, ["pty_one", "pty_two"])
  f.cleanup()
})

test("empty terminal list and API errors are handled, kill lock is released", async () => {
  const f = fixture()
  await f.command("kill").run()
  assert.match(f.notices.at(-1).message, /No running/)
  f.state.error = new Error("Disconnected")
  await f.command("kill").run()
  assert.equal(f.notices.at(-1).message, "Disconnected")
  f.state.error = undefined
  f.state.terminals = [pty("pty_one")]
  await f.command("kill").run()
  assert.deepEqual(f.removals, ["pty_one"])
  f.cleanup()
})

test("options control both registered bindings and raw interception", async () => {
  const f = fixture({keys:{toggle:"ctrl+alt+t", kill:false}})
  assert.equal(f.command("toggle").bind,"ctrl+alt+t")
  assert.equal(f.command("kill"), undefined)
  assert.equal(f.raw("\x1b[96;5u"), false)
  assert.equal(f.raw("\x1b[107;6u"), false)
  assert.equal(f.raw("\x1b[116;7u"), true)
  assert.deepEqual(f.calls, ["terminal.toggle"])
  f.cleanup()
})
