
const {contextBridge,ipcRenderer} = require("electron")

contextBridge.exposeInMainWorld('softkit',{
    sendCommand: (input) => {
        ipcRenderer.send('command',input)
    },
    onOutput: (callback) => {
        ipcRenderer.on('output',(event,data) => {
            callback(data);
        })
    }
})