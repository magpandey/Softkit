const {changeDirectory} = require("../core/workspace.js")
const logger = require('../utils/logger.js')
function goFunction(args,rl){
    if(args.length === 0){
        logger.warn("Please provide a Respective directory to navigate");
        return;
    }
    const {success, path, message} = changeDirectory(args[0])
    if(success){
        logger.success("Moved to " + path);
    }else{
        logger.error(message);
    }
}

module.exports = goFunction