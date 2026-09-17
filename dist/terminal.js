import { createShortcuts, matchShortcut } from "./shortcuts.js";
export function setupTerminal(context) {
    const shortcuts = createShortcuts(context.options.keys);
    const sessionID = () => {
        const route = context.ui.router.current();
        return route.type === "session" ? route.sessionID : undefined;
    };
    const report = (error) => context.ui.toast.show({
        title: "oc-terminal", message: error instanceof Error ? error.message : String(error), variant: "error",
    });
    function host(id) {
        if (!context.keymap.commands().some((command) => command.id === id)) {
            throw new Error(`OpenCode command ${id} is unavailable. Open a session and check your OpenCode version.`);
        }
        context.keymap.dispatch(id);
    }
    let killing = false;
    async function kill() {
        const id = sessionID();
        if (!id || killing)
            return;
        killing = true;
        try {
            const terminals = (await context.client.experimental.persistentPty.list({ sessionID: id }))
                .filter((terminal) => terminal.status === "running");
            if (!terminals.length) {
                context.ui.toast.show({ title: "oc-terminal", message: "No running terminals", variant: "info" });
                return;
            }
            const ptyID = terminals.length === 1 ? terminals[0].id : await context.ui.dialog.select({
                title: "End terminal", placeholder: "Choose a terminal to end",
                options: terminals.map((terminal, index) => ({
                    title: `${index + 1}. ${terminal.title}`,
                    value: terminal.id,
                    description: `${terminal.foregroundProcess ?? terminal.command} · ${terminal.cwd} · ${terminal.id}`,
                })),
            });
            if (!ptyID)
                return;
            await context.client.experimental.persistentPty.remove({ ptyID });
            context.ui.toast.show({ title: "oc-terminal", message: "Terminal ended", variant: "success" });
        }
        finally {
            killing = false;
        }
    }
    const actions = {
        toggle: () => host("terminal.toggle"),
        new: () => host("session.terminal"),
        hide: () => host("terminal.close"),
        kill,
    };
    async function run(action) {
        if (!sessionID())
            return;
        try {
            await actions[action]();
        }
        catch (error) {
            report(error);
        }
    }
    const titles = {
        toggle: "Toggle terminal", new: "New terminal", hide: "Hide terminal", kill: "End terminal",
    };
    const dispose = context.ui.slot({
        append: "app",
        render: () => {
            context.keymap.layer(() => ({
                mode: "global", priority: 10, enabled: () => !!sessionID(),
                commands: shortcuts.map(({ action, bind }) => ({
                    id: `oc-terminal.${action}`, title: titles[action], group: "oc-terminal",
                    bind, palette: true, run: () => run(action),
                })),
                bindings: shortcuts.map(({ action }) => `oc-terminal.${action}`),
            }));
            return null;
        },
    });
    // Native terminal KeyEvent interception runs before normal shortcut layers.
    // Intercept only configured shortcuts at the raw-sequence stage instead.
    const raw = (sequence) => {
        const match = matchShortcut(sequence, shortcuts);
        if (!match || !sessionID())
            return false;
        if (match.press)
            void run(match.action);
        return true;
    };
    context.renderer.prependInputHandler(raw);
    return () => {
        context.renderer.removeInputHandler(raw);
        dispose();
    };
}
