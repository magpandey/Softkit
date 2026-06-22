const { moveFile } = require('../core/fileSystem');
const logger = require('../utils/logger.js')
function commandMoveFile(args, rl) {
    if (args.length === 0) {
        logger.warn("Provide a filename to move");
        return;
    }

    rl.question(logger.question("Where to move ? : "), (ans) => {
        const { success,message } = moveFile(args[0], ans);
        if(success){
            logger.success(message);
        }else{
            logger.error(message)
        }
        rl.prompt()
       
    });
}

module.exports = commandMoveFile;