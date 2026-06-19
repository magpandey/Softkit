const fs = require('fs')
const path = require('path')
const {getCurrentDirectory} = require('../core/workspace.js')
function createFile(filename){
    const currDir = getCurrentDirectory();
    const fullPath = path.join(currDir,filename);    
    if(fs.existsSync(fullPath)){
        return {success: false, message: `Already exists : ${filename}`}
    }
    try {
        fs.writeFileSync(fullPath, "");
        return {success: true, message: `File created: ${filename}`}
    } catch (error) {
        return {success: false, message : `Could not create file : ${error.message}`};
    }
}

function createFolder(foldername){
    const currDir = getCurrentDirectory();
    const fullPath = path.join(currDir,foldername);

    if(fs.existsSync(fullPath)){
        return {success: false, message: `Already exists: ${foldername}`}
    }
    try {
        fs.mkdirSync(fullPath,{recursive: true});
        return {success: true, message: `Folder created: ${foldername}`};
    } catch (error) {
        return {success: false, message: `Error in creating the folder: ${error.message}`};
    }
}

module.exports = {createFile,createFolder};