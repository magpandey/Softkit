# Softkit

A custom command-line shell and file management tool built entirely from scratch using Node.js core modules, wrapped in an Electron desktop GUI. Softkit implements its own REPL loop, input parser, filesystem engine, workspace state manager, process executor, and a dual-mode output logger — all without any third-party utility libraries.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Technical Deep Dive](#technical-deep-dive)
  - [The REPL Loop](#the-repl-loop)
  - [The Parser](#the-parser)
  - [Workspace State Management](#workspace-state-management)
  - [The Filesystem Engine](#the-filesystem-engine)
  - [The Logger — Dual Mode Output](#the-logger--dual-mode-output)
  - [The Runner — Child Process Execution](#the-runner--child-process-execution)
  - [The Command Registry](#the-command-registry)
- [Electron Integration](#electron-integration)
  - [Process Architecture](#process-architecture)
  - [IPC Pipeline](#ipc-pipeline)
  - [The Fake RL Object](#the-fake-rl-object)
  - [Interactive Question Flow](#interactive-question-flow)
- [Project Structure](#project-structure)
- [Commands Reference](#commands-reference)
- [Installation and Usage](#installation-and-usage)
- [Design Decisions](#design-decisions)
- [Future Versions](#future-versions)

---

## Overview

Softkit is a desktop shell application that lets users navigate their filesystem, manage files and folders, and execute scripts — all from a styled terminal UI running inside an Electron window. The CLI engine is fully decoupled from the GUI layer, meaning the same core (`src/`) runs identically in both PowerShell (via `node src/index.js`) and the Electron desktop window (via `npm start`).

The project was built as a deep study of Node.js internals — specifically `readline`, `fs`, `path`, `child_process`, module caching, closures, event emitters, and inter-process communication — with the goal of understanding these primitives by implementing something real with them rather than studying them abstractly.

---

## Architecture

```
Softkit/
│
├── src/                         # The engine — platform agnostic
│   ├── index.js                 # CLI entry point
│   ├── shell/
│   │   └── shell.js             # readline REPL loop
│   ├── parser/
│   │   └── parser.js            # tokenizes raw input → { command, args }
│   ├── commands/
│   │   ├── index.js             # command registry (dispatch table)
│   │   ├── help.js
│   │   ├── exit.js
│   │   ├── where.js             # loca-where
│   │   ├── go.js                # get-into
│   │   ├── list.js              # give-info
│   │   ├── createF.js           # create-f
│   │   ├── createDir.js         # create-dir
│   │   ├── deleteF.js           # del-f
│   │   ├── deleteDir.js         # del-dir
│   │   ├── moveF.js             # move-f
│   │   └── run.js               # run-file
│   ├── core/
│   │   ├── workspace.js         # shared directory state via closures
│   │   ├── fileSystem.js        # pure fs operations returning {success, message}
│   │   └── runner.js            # child_process execution engine
│   └── utils/
│       └── logger.js            # dual-mode output (ANSI terminal / IPC Electron)
│
└── electron/                    # The GUI layer
    ├── main.js                  # Electron main process
    ├── preload.js               # contextBridge IPC bridge
    └── index.html               # terminal UI renderer
```

The critical architectural boundary: `src/` knows nothing about Electron. `electron/` knows nothing about `fs` or `readline`. They communicate exclusively through IPC channels and the logger's mode switch.

---

## Technical Deep Dive

### The REPL Loop

`shell.js` implements a Read-Evaluate-Print-Loop using Node's built-in `readline` module. A `readline.Interface` is created with `process.stdin` and `process.stdout`, establishing a persistent connection to the terminal's input and output streams.

The loop is not a traditional `while(true)` — it is event-driven. Node's event loop drives it: `rl.on('line', callback)` registers a listener that fires every time the user presses Enter. The "loop" is the chain:

```
line event fires → handler runs → rl.prompt() called → waits for next line event
```

`rl.prompt()` re-displays `Softkit >` and re-arms the stdin listener. Without it at the end of every handler path, the shell appears frozen — stdin is still open but the prompt is gone.

The `'close'` event on the readline interface handles `Ctrl+C` and `exit` command gracefully, calling `process.exit(0)` after a farewell message.

---

### The Parser

`parser.js` takes a raw trimmed string and returns a structured object:

```javascript
parse("get-into ../projects") → { command: "get-into", args: ["../projects"] }
parse("create-dir test --enter") → { command: "create-dir", args: ["test", "--enter"] }
parse("help") → { command: "help", args: [] }
```

Implementation uses `String.split(/\s+/)` — a regex that splits on one or more consecutive whitespace characters, preventing empty strings from sneaking into the args array when users type extra spaces. The first token is lowercased and becomes `command`. Everything from index 1 onward becomes `args` via `Array.slice(1)`.

Lowercasing only the command (not args) is a deliberate decision — filenames are case-sensitive on Linux/Mac and should be preserved.

---

### Workspace State Management

`workspace.js` is the most architecturally interesting file in the engine. It manages two pieces of shared state:

```javascript
const rootDir = path.parse(process.cwd()).root; // "C:\" — set once, never changes
let currentDir = process.cwd();                 // mutable, changes on navigation
```

These variables live at module scope — outside any function. Three exported functions (`getCurrentDirectory`, `getRootDirectory`, `changeDirectory`) are defined in the same scope, giving each a permanent reference to both variables through **closure**. When any function reads or writes `currentDir`, it is reaching directly into the one memory slot where that variable lives.

**Module caching** is the mechanism that makes this a true singleton. Node.js executes a module's code exactly once on first `require()`, then caches the result. Every subsequent `require('../core/workspace')` from any command file — `go.js`, `list.js`, `createF.js`, `deleteF.js` — receives the same cached export object, whose functions all close over the same `currentDir` variable. A `changeDirectory` call from `go.js` updates the value that `getCurrentDirectory` in `list.js` will read on the very next call.

`changeDirectory(input)` performs four sequential validations before committing any state change:

1. `path.resolve(currentDir, input)` — resolves relative input (`..`, `./sub`, plain names) into an absolute path using the current directory as base.
2. `fs.existsSync(resolvedPath)` — confirms the path exists on disk.
3. `fs.statSync(resolvedPath).isDirectory()` — confirms it is a directory, not a file.
4. `path.relative(rootDir, resolvedPath).startsWith('..')` — confirms the target is within the drive root sandbox. A relative path starting with `..` means you would have to navigate above `rootDir` to reach the target — i.e., it is outside the permitted boundary.

Only if all four pass does `currentDir = resolvedPath` execute. The function returns `{ success: boolean, message?: string, path?: string }` — a pattern used consistently across the entire engine.

---

### The Filesystem Engine

`fileSystem.js` contains pure filesystem operations with no knowledge of the shell, readline, or display concerns. Every function follows the same contract:

- Receives plain string arguments (filenames, folder names)
- Resolves full paths internally using `getCurrentDirectory()` from workspace
- Validates preconditions (existence, type, emptiness)
- Performs the operation inside a try/catch
- Returns `{ success: boolean, message: string }`

The `{ success, message }` return contract means command files never need their own try/catch — `fileSystem.js` handles all error cases and always returns something meaningful. Command files just read `success` to decide which logger level to use and print `message`.

Key operations and their underlying Node APIs:

| Operation | Node API |
|-----------|----------|
| Create file | `fs.writeFileSync(path, "")` |
| Create folder | `fs.mkdirSync(path, { recursive: true })` |
| Delete file | `fs.unlinkSync(path)` |
| Delete folder | `fs.rmSync(path, { recursive: true, force: true })` |
| Move file | `fs.copyFileSync(src, dest)` + `fs.unlinkSync(src)` |
| List directory | `fs.readdirSync(path)` |
| Check existence | `fs.existsSync(path)` |
| Check type | `fs.statSync(path).isDirectory()` |

`moveFile` uses `path.basename(source)` to extract just the filename when the destination is a directory — so `move-f app.js ../backup` correctly resolves to `../backup/app.js` rather than requiring the user to specify the full destination filename.

---

### The Logger — Dual Mode Output

`logger.js` is one of the most architecturally significant files despite being small. It solves a cross-cutting concern: the same engine must produce colored output in a terminal AND send plain text over IPC to an Electron renderer — without any command file knowing which environment it's running in.

The mechanism is a module-level `ipcSender` variable, initially `null` (CLI mode). An exported `setIPCMode(fn)` function replaces it with a callback provided by the Electron main process. From that point, every logger call routes through `ipcSender` instead of `console.log`.

```javascript
let ipcSender = null;

function print(prefix, colorCode, message) {
    if (ipcSender) {
        ipcSender(`${prefix} ${message}`);  // Electron: send over IPC
    } else {
        console.log(`${colorCode}${prefix}\x1b[0m ${message}`);  // CLI: ANSI color
    }
}
```

In CLI mode, ANSI escape codes (`\x1b[32m` for green, `\x1b[31m` for red, etc.) produce colored terminal output. In Electron mode, plain prefixed strings (`[SUCCESS]`, `[ERROR]`, `[INFO]`, `[WARN]`, `[QUESTION]`) are sent over IPC — the renderer reads the prefix and applies CSS color classes, achieving the same visual result through a different mechanism.

This is **dependency injection via a mode switch** — the consumer (logger) adapts its behavior based on a dependency (the output function) injected at runtime.

---

### The Runner — Child Process Execution

`runner.js` uses `child_process.spawn` to execute external files. `spawn` is chosen over `exec` because it streams output in real time rather than buffering it — for a shell tool where scripts may produce many lines of output, streaming is the correct choice.

```javascript
const child = spawn(runtime, [fullPath], {
    cwd: getCurrentDirectory(),
    stdio: 'inherit'
});
```

`stdio: 'inherit'` connects the child process's stdin/stdout/stderr directly to Softkit's terminal. The child process's `console.log` output appears in the terminal as if Softkit printed it — completely transparent to the user.

A runtime lookup table maps file extensions to their executors:

```javascript
const runtimes = {
    '.js':  'node',
    '.py':  'python',
    '.exe':  null   // direct execution — no runtime prefix
};
```

`runFile` returns a Promise because `spawn` is asynchronous — it starts the process and returns immediately, then emits events. Two events matter:

- `child.on('close', code)` — process finished. Exit code `0` = success universally.
- `child.on('error', err)` — process could not start. Typically means the runtime is not installed — this is how "python not found" errors are caught cleanly.

The command file (`run.js`) uses `async/await` on the returned Promise, giving sequential-looking code despite the underlying async nature.

---

### The Command Registry

`commands/index.js` is a dispatch table — a plain object mapping command name strings to their handler functions:

```javascript
const commands = {
    "help":       helpFunction,
    "exit":       exitFunction,
    "loca-where": whereFunction,
    "get-into":   goFunction,
    "give-info":  listFilesAndDirectory,
    "create-f":   commandCreateFile,
    "create-dir": commandCreateFolder,
    "del-f":      commandDeleteFile,
    "del-dir":    commandDeleteFolder,
    "move-f":     commandMoveFile,
    "run-file":   commandRun
};
```

`shell.js` performs lookup as `commands[command]` — if the key exists, the value is a function reference (not a call). `commands[command](args, rl)` is the actual invocation. This pattern scales cleanly — adding a new command is one `require` and one key in this object. The parser's `toLowerCase()` on the command token ensures keys are always matched case-insensitively.

---

## Electron Integration

### Process Architecture

Electron runs two separate Node.js processes:

**Main process** (`electron/main.js`) — full Node.js with unrestricted filesystem and OS access. This is where the entire Softkit engine (`src/`) is called from. One main process exists per application instance.

**Renderer process** (`electron/index.html`) — a Chromium browser context. Can render HTML/CSS/JS but has no direct access to Node.js APIs or the filesystem for security reasons. One renderer process per window.

**Preload script** (`electron/preload.js`) — runs in a privileged context that bridges both worlds. Has access to Electron's IPC APIs and can selectively expose specific capabilities to the renderer via `contextBridge.exposeInMainWorld`. This is the security boundary — the renderer gets exactly the API surface preload chooses to expose, nothing more.

---

### IPC Pipeline

Four named IPC channels handle all communication:

| Channel | Direction | Purpose |
|---------|-----------|---------|
| `'command'` | renderer → main | User typed a command and pressed Enter |
| `'output'` | main → renderer | Engine produced output to display |
| `'question'` | main → renderer | Engine needs interactive user input |
| `'answer'` | renderer → main | User responded to a question |

`logger.setIPCMode` is called in `main.js` immediately after the window is created:

```javascript
logger.setIPCMode((data) => {
    mainWindow.webContents.send('output', data);
});
```

`mainWindow.webContents.send` is Electron's direct line into the renderer — it fires a message on any named channel with arbitrary data. From this point, every `logger.success/error/info/warn` call anywhere in the engine automatically routes to the renderer window. No command file required any modification.

---

### The Fake RL Object

The engine's command files were written against Node's `readline` interface — specifically `rl.prompt()` and `rl.question()`. In Electron, no readline exists. Rather than rewrite command files, a mock object is injected that satisfies the same interface:

```javascript
function createElectronRL() {
    return {
        prompt: () => {},  // no-op — HTML input is always present
        question: (prompt, callback) => {
            mainWindow.webContents.send('question', prompt);
            ipcMain.once('answer', (event, answer) => {
                callback(answer);
            });
        }
    };
}

const rl = createElectronRL();
```

This is the **dependency injection** pattern in action. Command files receive `rl` as a parameter — they call `rl.question(prompt, callback)` without knowing whether they're talking to readline or the fake IPC object. In CLI mode, real readline handles it. In Electron mode, the fake object handles it identically from the command file's perspective.

`ipcMain.once` (not `ipcMain.on`) is critical here — it registers a one-time listener that self-removes after firing. This prevents stale listeners accumulating across multiple interactive commands.

---

### Interactive Question Flow

The complete round-trip for `del-f app.js` through the Electron pipeline:

```
[1] User types "del-f app.js" → Enter
[2] renderer: window.softkit.sendCommand("del-f app.js")
[3] preload: ipcRenderer.send('command', 'del-f app.js')
[4] main: ipcMain.on('command') fires
[5] parser.parse → { command: 'del-f', args: ['app.js'] }
[6] commands['del-f'](['app.js'], fakeRl)
[7] commandDeleteFile calls fakeRl.question("Are you sure?...", CALLBACK_A)
[8] fakeRl: mainWindow.webContents.send('question', "Are you sure?...")
[9] fakeRl: ipcMain.once('answer') registered — execution pauses here
[10] renderer: onQuestion fires → awaitingAnswer = true → prompt displayed
[11] User types "y" → Enter
[12] renderer: awaitingAnswer is true → window.softkit.sendAnswer("y")
[13] preload: ipcRenderer.send('answer', 'y')
[14] main: ipcMain.once('answer') fires → callback('y') → CALLBACK_A runs
[15] deleteFile('app.js') executes → fs.unlinkSync removes file from disk
[16] logger.success("File deleted: app.js") → ipcSender fires
[17] main: mainWindow.webContents.send('output', '[SUCCESS] File deleted: app.js')
[18] preload: ipcRenderer.on('output') fires → onOutput callback
[19] renderer: appendOutput → green [SUCCESS] line appears in terminal div
[20] fakeRl.prompt() → no-op
```

`commandDeleteFile` ran completely unchanged from its CLI implementation. The entire interactive flow was handled by the IPC infrastructure around it.

---

## Project Structure

### Dependency Graph

```
index.js
└── shell.js
    ├── parser.js
    └── commands/index.js
        ├── help.js
        ├── exit.js
        ├── where.js ──────────────── workspace.js
        ├── go.js ─────────────────── workspace.js
        ├── list.js ───────────────── workspace.js
        ├── createF.js ────────────── fileSystem.js ── workspace.js
        ├── createDir.js ──────────── fileSystem.js ── workspace.js
        ├── deleteF.js ────────────── fileSystem.js ── workspace.js
        ├── deleteDir.js ──────────── fileSystem.js ── workspace.js
        ├── moveF.js ──────────────── fileSystem.js ── workspace.js
        └── run.js ────────────────── runner.js ─────── workspace.js
```

All command files also depend on `logger.js`. No circular dependencies exist anywhere in the graph — dependency flow is strictly one-directional.

---

## Commands Reference

| Command | Syntax | Description |
|---------|--------|-------------|
| `help` | `help` | List all available commands |
| `exit` | `exit` | Close Softkit gracefully |
| `loca-where` | `loca-where` | Print current working directory |
| `get-into` | `get-into <dir>` | Navigate into a directory (relative or absolute) |
| `give-info` | `give-info` | List contents of current directory with type labels |
| `create-f` | `create-f <filename>` | Create an empty file in current directory |
| `create-dir` | `create-dir <name> [--enter]` | Create a folder; optionally navigate into it |
| `del-f` | `del-f <filename>` | Permanently delete a file (with confirmation) |
| `del-dir` | `del-dir <folder> [--force]` | Delete a folder; `--force` required for non-empty folders |
| `move-f` | `move-f <filename>` | Move a file (prompts for destination) |
| `run-file` | `run-file <filename>` | Execute `.js`, `.py`, or `.exe` files |

**Navigation notes:** All path arguments support relative paths (`../sibling`, `./sub/folder`) and absolute paths (`C:\Users\...`). Navigation is bounded by the drive root — cross-drive navigation is not supported in v1.

**Flag reference:**
- `--enter` on `create-dir` — navigate into the newly created folder immediately
- `--force` on `del-dir` — allow recursive deletion of non-empty directories

---

## Installation and Usage

### Prerequisites

- Node.js 18+
- npm
- Python (optional — required only for running `.py` files)

### Setup

```bash
git clone <repo-url>
cd Softkit
npm install
```

### Run as CLI

```bash
node src/index.js
```

### Run as Desktop Application

```bash
npm start
```

---

## Design Decisions

**Why no external utility libraries?**
The project's purpose was to learn Node.js core modules by using them directly. `readline` instead of `inquirer`, `fs` instead of `fs-extra`, `child_process` directly instead of `execa`. Understanding what these packages wrap is more valuable than using the wrappers.

**Why separate `fileSystem.js` from command files?**
Separation of concerns — core logic should not know about display. `fileSystem.js` returns data; command files decide how to present it. This also means `fileSystem.js` functions are reusable across any number of commands without duplication.

**Why `workspace.js` uses module-level variables instead of a class?**
Node's module caching creates singleton behavior without class syntax — `workspace.js` is loaded once, its variables live for the application's lifetime, and every importer shares the same state through closure references. This is idiomatic Node.js — using the module system's own semantics rather than adding class-based OOP on top.

**Why `{ success, message }` return objects instead of exceptions?**
Exceptions are appropriate for genuinely unexpected failures. "File not found" or "folder not empty" are expected, handleable conditions — not exceptions. Returning structured objects keeps control flow explicit and readable, and avoids try/catch sprawl in command files.

**Why a fake `rl` object in Electron instead of rewriting command files?**
The engine was designed for CLI first. Rewriting command files for Electron would couple the engine to a specific environment. Injecting a mock object that satisfies the same interface keeps command files environment-agnostic — they work in CLI and Electron without modification.

**Why `--force` required for non-empty folder deletion?**
Safety. Recursive deletion is irreversible. Requiring an explicit flag means the user must consciously declare intent to delete non-empty directories — preventing accidental mass deletion from a typo in the folder name.

---

## Future Versions

### v2 — Power User Features

- **Absolute path support everywhere** — `del-f C:\path\to\file.txt` without navigating there first. Requires `path.isAbsolute` check in `fileSystem.js` before joining with `currentDir`.
- **Folder copy and move** — recursive directory traversal using `fs.readdirSync` + `fs.mkdirSync` + `fs.copyFileSync` walking the entire tree. Includes partial failure handling.
- **Numbered directory picker** — `give-info` displays items numbered `[1]`, `[2]`, `[3]`; user types a number to navigate into that item directly rather than typing the full name.
- **Command history** — up/down arrow keys cycle through previous commands. CLI: `readline` supports this natively via `history` option on `createInterface`. Electron: maintain a `history[]` array in renderer, intercept arrow keys in the keydown listener.
- **`.cpp` execution** — two chained child processes: `spawn('g++', [src, '-o', output])` on close → `spawn(output)`. Requires g++ installed.
- **`give-info` on specific file** — `give-info app.js` shows file size, created date, modified date, permissions via `fs.statSync`.

### v3 — Clipboard Buffer System

A persistent file buffer enabling mark-navigate-paste workflows:

- **`mark <filename>`** — adds a file to an in-memory buffer array stored in `workspace.js` alongside `currentDir`.
- **`copy-here`** — copies all buffered files into the current directory, preserving originals.
- **`move-here`** — moves all buffered files into the current directory, deleting originals.
- **`move-here --all`** — moves all buffered files at once.
- **`clear-buffer`** — empties the buffer.
- **`show-buffer`** — lists currently marked files.

This mirrors the mark/copy/paste workflow of file managers like Midnight Commander (`mc`) and represents a fundamentally different interaction model from path-based operations.

### Electron Polish

- **`electron-builder` packaging** — produce a distributable `.exe` installer. Single double-click launch, no terminal required.
- **App icon and window chrome** — proper title bar, application icon, minimize/maximize/close behavior.
- **Tab completion** — on Tab keypress, query current directory contents and autocomplete partial filenames. Renderer-side implementation using `give-info` results cached per directory.
- **Font and theme customization** — user-selectable monospace fonts, color themes (light/dark/solarized) stored in `localStorage`.

---

*Softkit v1 — Built from scratch. No shortcuts.*
