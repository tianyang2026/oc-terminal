import { Plugin } from "@opencode/plugin/tui"
import { setupTerminal } from "./terminal.js"

export default Plugin.define({ id: "oc-terminal", setup: setupTerminal })
