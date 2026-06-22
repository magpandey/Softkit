const fs = require("fs");
const path = require("path");
const { getCurrentDirectory } = require("../core/workspace.js");
const logger = require('../utils/logger.js');

function listFilesAndDirectory(args, rl) {
    const dir = getCurrentDirectory();

    try {
        const items = fs.readdirSync(dir);

        if (items.length === 0) {
            logger.warn(`${dir} is empty`);
            return;
        }

        logger.newline()
        logger.info(`Contents of ${dir}:`);
        logger.newline()

        items.forEach(e => {
            const fullPath = path.join(dir, e);
            const isDir = fs.statSync(fullPath).isDirectory();

            if (isDir) {
                logger.info(`  [DIR]  ${e}`);
            } else {
                logger.info(`  [FILE] ${e}`);
            }
        });

        logger.newline()

    } catch (error) {
        logger.error(`Could not read directory: ${error.message}`);
    }
}

module.exports = listFilesAndDirectory;