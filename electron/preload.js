
const {contextBridge,ipcRenderer} = require("electron")

contextBridge.exposeInMainWorld('softkit',{
    sendCommand: (input) => {
        ipcRenderer.send('command',input)
    },
    sendAnswer : (input) => {
        ipcRenderer.send('answer',input);
    },
    onOutput: (callback) => {
        ipcRenderer.on('output',(event,data) => {
            callback(data);
        })
    },
    onQuestion : (callback) => {
        ipcRenderer.on('question', (event,prompt) => {
            callback(prompt);
        })
    }
})