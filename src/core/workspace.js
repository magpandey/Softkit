const path = require("path");
const fs = require("fs");

const rootDir = path.parse(process.cwd()).root;
let currentDir = process.cwd();

function getCurrentDirectory(){
    return currentDir;
}

function getRootDirectory(){
    return rootDir;
}

function changeDirectory(input){
    const resolvedPath = path.resolve(currentDir,input);
    if(!fs.existsSync(resolvedPath)){
        return {success : false, message:`No such directory : ${input}` };
    }
    
    const relative = path.relative(rootDir,resolvedPath);
    if(relative.startsWith("..")){
        return {success : false, message: `Cannot navigate outside of Softkit workspace`};
    }

    if(!fs.statSync(resolvedPath).isDirectory(input)){
        return {success : false, message : `No a directory : ${input}`};
    }
    currentDir = resolvedPath;
    return {success : true, path : currentDir};
}

module.exports = {
    getCurrentDirectory,
    getRootDirectory,
    changeDirectory
}