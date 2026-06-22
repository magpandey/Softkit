const { createFolder } = require("../core/fileSystem.js");
const { changeDirectory } = require("../core/workspace.js");
const logger = require('../utils/logger.js');

function commandCreateFolder(args, rl) {
    if (args.length === 0) {
        logger.warn("Please provide a folder name: create-dir <foldername>");
        return;
    }

    const shouldEnter = args[1] === "--enter";
    const { success, message } = createFolder(args[0]);

    if (success && shouldEnter) {
        logger.success(message);
        const moved = changeDirectory(args[0]);
        if (moved.success) {
            logger.success(`Moved to: ${moved.path}`);
        }
    } else if (success && !shouldEnter) {
        logger.success(message);
    } else {
        logger.error(message);
    }
}

module.exports = commandCreateFolder;