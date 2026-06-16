const helpFunction = require("./help.js");
const exitFunction = require("./exit.js");
const whereFunction = require("./where.js");

const commands = {
    "help" : helpFunction,
    "exit" : exitFunction,
    "loca-where" : whereFunction
}

module.exports = commands