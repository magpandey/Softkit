const { createFile, createFolder } = require("../core/filesystem.js");
const { changeDirectory } = require("../core/workspace.js");
const path = require('path')
const logger = require('../utils/logger.js')

function commandCreateFile(args,rl){
    if(args.length === 0){
        logger.warn(`Please provide a file to create`);
        return;
    }
        const {success, message} = createFile(args[0]);
        if(success === true){
           logger.success(`File : ${args[0]} create`)
        }else{
            logger.error(message);
        }
}
module.exports = commandCreateFile

