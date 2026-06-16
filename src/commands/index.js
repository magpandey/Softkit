const helpFunction = require("./help.js");
const exitFunction = require("./exit.js");
const whereFunction = require("./where.js");
const goFunction = require("./go.js");

const commands = {
    "help" : helpFunction,
    "exit" : exitFunction,
    "loca-where" : whereFunction,
    "get-into" : goFunction
}

module.exports = commands