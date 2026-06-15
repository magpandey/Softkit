const helpFunction = require("./help.js");
const exitFunction = require("./exit.js");

const commands = {
    "help" : helpFunction,
    "exit" : exitFunction
}

module.exports = commands