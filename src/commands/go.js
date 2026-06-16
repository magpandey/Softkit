const {getCurrentDirectory,changeDirectory} = require("../core/workspace.js")

function goFunction(args,rl){
    if(args.length === 0){
        console.log("Please provide a Respective directory to navigate");
        return;
    }
    const {success, path, message} = changeDirectory(args[0])
    if(success){
        console.log("Moved to " + path);
    }else{
        console.log(message);
    }
}

module.exports = goFunction