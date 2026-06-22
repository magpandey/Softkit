const logger = require('../utils/logger.js')
function helpFunction(args,rl){
    logger.success("Available commands : ");
    logger.success("help - Show this help message");
    logger.success("exit - Exit from Softkit");
    
}
module.exports = helpFunction