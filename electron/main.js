const {app,BrowserWindow,ipcMain} = require('electron');
const parser = require('../src/parser/parser.js')
const commands = require('../src/commands/index.js')
const path = require('path');

function createWindow(){
    const win = new BrowserWindow({
        width: 1000,
        height: 700,
        webPreferences: {
            preload : path.join(__dirname,"preload.js")
        }
    });
    win.loadFile(path.join(__dirname,"index.html"))
}
ipcMain.on('command',(event,input) => {
    const {command,args} = parser.parse(input);
    if(commands[command]){
        commands[command](args)
    }
})
app.whenReady().then(() => {
    createWindow();
})