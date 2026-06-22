const { deleteFile } = require('../core/fileSystem.js');
const logger = require('../utils/logger.js');

function commandDeleteFile(args, rl) {
    if (args.length === 0) {
        logger.warn("Please provide a filename to delete");
        return;
    }

    rl.question(logger.question(`Are you sure you want to delete ${args[0]}? (y/n): `), (ans) => {
        if (ans.trim().toLowerCase() === 'y') {
            const { success, message } = deleteFile(args[0]);
            if (success) {
                logger.success(message);
            } else {
                logger.error(message);
            }
        } else {
            logger.warn("Deletion cancelled");
        }
        rl.prompt();
    });
}

module.exports = commandDeleteFile;