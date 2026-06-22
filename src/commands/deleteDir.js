const { deleteFolder } = require('../core/fileSystem');
const logger = require('../utils/logger.js');

function commandDeleteFolder(args, rl) {
    if (args.length === 0) {
        logger.warn("Please provide a folder name to delete");
        return;
    }

    const force = args[1] === "--force";

    rl.question(logger.question(`Are you sure you want to delete ${args[0]}? (y/n): `), (ans) => {
        if (ans.trim().toLowerCase() === 'y') {
            const { success, message } = deleteFolder(args[0], force);
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

module.exports = commandDeleteFolder;