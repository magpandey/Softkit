// src/core/runner.js

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { getCurrentDirectory } = require('./workspace');

const runtimes = {
    '.js':  'node',
    '.py':  'python',
    '.exe':  null
};

function runFile(filename) {
    const currentDir = getCurrentDirectory();
    const fullPath = path.resolve(currentDir, filename);

    if (!fs.existsSync(fullPath)) {
        return Promise.resolve({ success: false, message: `File does not exist: ${filename}` });
    }

    const ext = path.extname(filename).toLowerCase();

    if (!(ext in runtimes)) {
        return Promise.resolve({ success: false, message: `No runtime configured for ${ext} files` });
    }

    const runtime = runtimes[ext];

    return new Promise((resolve) => {
        const spawnArgs = runtime ? [fullPath] : [];
        const command = runtime || fullPath;

        const child = spawn(command, spawnArgs, {
            cwd: currentDir,
            stdio: 'inherit'
        });

        child.on('close', (code) => {
            resolve({
                success: code === 0,
                message: code === 0
                    ? `Executed: ${filename}`
                    : `Execution failed with exit code ${code}`
            });
        });

        child.on('error', (err) => {
            resolve({
                success: false,
                message: runtime
                    ? `${runtime} not found. Please install ${runtime} to run ${ext} files`
                    : `Could not execute: ${err.message}`
            });
        });
    });
}

module.exports = { runFile };