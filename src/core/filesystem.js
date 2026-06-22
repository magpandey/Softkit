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


function deleteFile(filename){
    const fullPath = path.join(getCurrentDirectory(),filename);

    if(!fs.existsSync(fullPath)){
        return {success : false, message: `File does not exists: ${filename}`}
    }
    const isDirectory = fs.statSync(fullPath).isDirectory();
    if(isDirectory){
        return {success : false, message : `Not a file : ${error.message}`};
    }

    try {
        fs.unlinkSync(fullPath);
        return {success : true, message : `File deleted Successfully : ${filename}`};
    } catch (error) {
        return {success : false, message : `Some Error occured while deletion of file : ${filename}`};
    }
}
function deleteFolder(foldername, force) {
    const fullPath = path.join(getCurrentDirectory(), foldername);

    if (!fs.existsSync(fullPath)) {
        return { success: false, message: `Folder does not exist: ${foldername}` };
    }

    const isDirectory = fs.statSync(fullPath).isDirectory();
    if (!isDirectory) {
        return { success: false, message: `Not a folder: ${foldername}` };
    }

    const isEmpty = fs.readdirSync(fullPath).length === 0;
    if (!isEmpty && !force) {
        return { success: false, message: `Folder is not empty. Use --force to delete recursively` };
    }

    try {
        fs.rmSync(fullPath, { recursive: true, force: true });
        return { success: true, message: `Folder deleted: ${foldername}` };
    } catch (error) {
        return { success: false, message: `Could not delete folder: ${error.message}` };
    }
}

function moveFile(source, destination) {
    const resolvedSource = path.resolve(getCurrentDirectory(), source);
    const resolvedDest = path.resolve(getCurrentDirectory(), destination);

    if (!fs.existsSync(resolvedSource)) {
        return { success: false, message: `Source file does not exist: ${source}` };
    }

    if (fs.statSync(resolvedSource).isDirectory()) {
        return { success: false, message: `Source is a folder, not a file: ${source}` };
    }

    if (!fs.existsSync(resolvedDest)) {
        return { success: false, message: `Destination does not exist: ${destination}` };
    }

    const finalDest = fs.statSync(resolvedDest).isDirectory()
        ? path.join(resolvedDest, path.basename(resolvedSource))
        : resolvedDest;

    if (fs.existsSync(finalDest)) {
        return { success: false, message: `File already exists at destination: ${path.basename(finalDest)}` };
    }

    try {
        fs.copyFileSync(resolvedSource, finalDest);
        fs.unlinkSync(resolvedSource);
        return { success: true, message: `File moved: ${source} → ${finalDest}` };
    } catch (error) {
        return { success: false, message: `Could not move file: ${error.message}` };
    }
}



module.exports = {createFile,createFolder,deleteFile,deleteFolder,moveFile};