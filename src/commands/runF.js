// src/commands/run.js

const { runFile } = require('../core/runner');
const logger = require('../utils/logger');

async function commandRun(args, rl) {
    if (args.length === 0) {
        logger.warn("Please provide a filename to run: run <filename>");
        return;
    }

    const result = await runFile(args[0]);
    
    if (result.success) {
        logger.success(result.message);
    } else {
        logger.error(result.message);
    }

    rl.prompt();
}

module.exports = commandRun;