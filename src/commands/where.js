const {getCurrentDirectory} = require("../core/workspace.js")
const logger = require("../utils/logger.js")
function whereFunction(args,rl){
    const currentDir = getCurrentDirectory();
    logger.info(`Current directory : ${currentDir}`);

}
module.exports = whereFunction