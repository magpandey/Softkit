const { createFolder } = require("../core/filesystem");
const { changeDirectory, getCurrentDirectory } = require("../core/workspace");

function commandCreateFolder(args,rl){
    if(args.lenth === 0){
        cosole.log(`Please provide folder name`);
        return;
    }

    const {success,message} = createFolder(args[0]);
    if(success){
         console.log(message);
         const moved = changeDirectory(args[0]);
         if(moved.success){
            console.log(`Moved to : ${moved.path}`)
         }
    }else{
        console.log(message);
    }
}

module.exports = commandCreateFolder;