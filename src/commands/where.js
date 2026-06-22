const {getCurrentDirectory} = require("../core/workspace.js")
function whereFunction(args,rl){
    const currentDir = getCurrentDirectory();
    logger.info(`Current directory : ${currentDir}`);

}
module.exports = whereFunction