const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const logger = require('../src/utils/logger');
const parser = require('../src/parser/parser');
const commands = require('../src/commands');

let mainWindow;

function createElectronRL() {
    return {
        prompt: () => {},
        question: (prompt, callback) => {
            mainWindow.webContents.send('question', prompt);
            ipcMain.once('answer', (event, answer) => {
                callback(answer);
            });
        }
    };
}

const rl = createElectronRL();

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 700,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });
    mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(() => {
    createWindow();

    logger.setIPCMode((data) => {
        mainWindow.webContents.send('output', data);
    });

    ipcMain.on('command', (event, input) => {
        const { command, args } = parser.parse(input);
        if (commands[command]) {
            commands[command](args, rl);
        } else {
            logger.warn(`Unknown command: ${command}. Type 'help' for list of commands`);
        }
    });
});