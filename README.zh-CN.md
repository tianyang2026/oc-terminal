# oc-terminal

[English](README.md)

**给 OpenCode 内置持久终端补齐类似 VS Code 的快捷键体验，焦点在终端里也能使用。**

使用 OpenCode 原生右侧终端和持久 PTY，支持打开、新建、隐藏、恢复和结束终端，无需 tmux。

## 安装

```sh
opencode plugin add github:tianyang2026/oc-terminal
```

固定首版：

```sh
opencode plugin add github:tianyang2026/oc-terminal#v0.1.0
```

四个快捷键全部由插件注册，不需要额外添加 `keybinds`。如果命令没出现，重启一次 TUI。命令面板中的分组是 **oc-terminal**；插件不新增 `/terminal` 入口。

也可以克隆仓库，把本地绝对路径加入 `~/.config/opencode/cli.json` 的 `plugins` 数组，作为仅在本地 CLI 运行的插件使用。连接远程服务器时，这种方式也保持本地加载。避免同时通过多个路径安装。

## 快捷键

| 按键 | 动作 |
| --- | --- |
| <kbd>Ctrl</kbd> + <kbd>`</kbd> | 打开／隐藏面板；打开时选择列表最后一个终端，没有则新建 |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>`</kbd> | 新建并打开终端 |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Q</kbd> | 隐藏面板，保留 shell |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>K</kbd> | 结束终端：一个运行中的终端直接结束，多个弹选择器 |

选择器只列出当前会话的运行中终端。公开插件 API 没有提供原生面板当前选中的终端 ID，因此多终端时由你选择，不猜测当前终端。

持久化由 OpenCode 管理。隐藏面板后可以重新连接仍存活的 PTY；已结束的 shell 无法恢复，也不保证机器或服务故障后进程仍存活。

## 自定义快捷键

本地 CLI 插件示例（合并到现有 `cli.json`，不要覆盖其他配置）：

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

首版支持 `ctrl+[alt+][shift+]<单个 ASCII 按键>`；符号使用未按 Shift 的键名，例如 `ctrl+shift+1`。`false` 同时禁用该动作的快捷键及命令面板入口。暂不支持功能键、leader 或多段组合键。普通快捷键和终端内提前拦截使用同一配置，修改后不会继续拦截旧键位。

## 兼容性

- 按 OpenCode V2 **2.0.5** 开发，原始本地版本在 macOS 使用过；其他版本、系统和终端模拟器仍需验证。
- 使用实验性 `persistentPty` API 和宿主命令 ID，升级 OpenCode 时可能需要适配。
- 内置终端会优先将按键交给 shell，因此插件在更早的输入层只接管配置的快捷键，支持 CSI-u／Kitty 和 xterm `modifyOtherKeys` 编码。
- 快捷键长按重复和释放事件不会重复执行动作。普通输入、粘贴、其他控制键照常传给 shell。
- 传统控制字符无法区分 Ctrl+K 和 Ctrl+Shift+K，插件不会吞掉这些模糊输入。若终端不发送扩展按键序列，终端内快捷键可能不可用，可通过命令面板操作。
- 原生 `/terminal` 入口仍会显示。布局沿用右侧面板。

## 从本地原型迁移

安装前将旧的 `oc-terminal` 目录移出 OpenCode 自动发现路径（需要时备份到其他位置），避免重复加载。删除原型添加的 `cli.json` 中 `terminal.toggle`、`terminal.close` 两条覆盖配置，由插件统一管理快捷键。另一个旧的 tmux 插件可以继续通过 `"-local.terminal"` 停用。

## 开发

```sh
npm ci
npm test
npm pack --dry-run
```

测试覆盖按键协议、非目标输入透传、自定义绑定、生命周期清理、宿主命令分发及结束终端逻辑。宿主行为使用 mock，实际 TUI 交互仍需手动验证。

仓库包含编译好的 `dist/`，支持直接从 GitHub 安装。修改源码后运行 `npm run build`，将构建结果一起提交。CI 在 Node 22、24 下运行测试并检查构建产物一致性。

MIT 许可证，欢迎提交 issue 和 PR。
