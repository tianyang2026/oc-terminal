export declare const defaults: {
    readonly toggle: "ctrl+`";
    readonly new: "ctrl+shift+`";
    readonly hide: "ctrl+shift+q";
    readonly kill: "ctrl+shift+k";
};
export type Action = keyof typeof defaults;
export interface Shortcut {
    action: Action;
    bind: string;
    code: number;
    modifiers: number;
}
export declare function createShortcuts(value: unknown): Shortcut[];
export declare function matchShortcut(sequence: string, shortcuts: readonly Shortcut[]): {
    action: "toggle" | "new" | "hide" | "kill";
    press: boolean;
} | undefined;
