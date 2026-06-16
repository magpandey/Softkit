const path = require("path");
const fs = require("fs");

const rootDir = process.cwd();
let currentDir = process.cwd();

function getCurrentDirectory(){
    return currentDir;
}

function getRootDirectory(){
    return rootDir;
}

function changeDirectory(){
    const resolvedPath = path.resolve(currentDir,input);
    if(!fs.existsSync(resolvedPath)){
        return {success : false, message:`No such directory : ${input}` };
    }

    const relative = path.relative(rootDir,resolvedPath);
    if(relative.startsWith("..")){
        return {success : false, message: `Cannot navigate outside of Softkit workspace`};
    }
    currentDir = resolvedPath;
    return {success : true, path : currentDir};
}

module.exports = {
    getCurrentDirectory,
    getRootDirectory,
    changeDirectory
}