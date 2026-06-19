const { createFile, createFolder } = require("../core/filesystem.js");
const { changeDirectory } = require("../core/workspace.js");
const path = require('path')

function commandCreateFile(args,rl){
    if(args.length === 0){
        console.log(`Please provide a file to create`);
        return;
    }
        const {success, message} = createFile(args[0]);
        if(success === true){
           console.log(`File : ${args[0]} create`)
        }else{
            console.log(message);
        }
}
module.exports = commandCreateFile

