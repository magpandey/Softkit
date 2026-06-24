const logger = require('../utils/logger.js')
function helpFunction(args,rl){
    logger.info("Available commands : ");
    logger.info("help - Show this help message");
    logger.info("exit - Exit from Softkit");
    logger.info('create-f - To create file');
    logger.info("create-dir- To create folder")
    logger.info("del-f - To Delete File")
    logger.info("move-f - To Move File")
    logger.info ("run-file - To Run")
}

module.exports = helpFunction