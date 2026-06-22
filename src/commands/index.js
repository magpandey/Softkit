const helpFunction = require("./help.js");
const exitFunction = require("./exit.js");
const whereFunction = require("./where.js");
const goFunction = require("./go.js");
const listFilesAndDirectory = require("./list.js");
const commandCreateFile = require("./createF.js");
const commandCreateFolder = require("./createD.js");
const commandDeleteFile = require("./deleteF.js")
const commandDeleteFolder = require("./deleteDir.js");
const commandMoveFile = require("./moveF.js");

const commands = {
    "help" : helpFunction,
    "exit" : exitFunction,
    "loca-where" : whereFunction,
    "get-into" : goFunction,
    "give-info" : listFilesAndDirectory,
    "create-f"  : commandCreateFile,
    "create-dir" : commandCreateFolder,
    "del-f" : commandDeleteFile,
    "del-dir" : commandDeleteFolder,
    "move-f" : commandMoveFile
}

module.exports = commands