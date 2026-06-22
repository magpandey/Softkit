// src/utils/logger.js

function success(message) {
    console.log("\x1b[32m[SUCCESS]\x1b[0m " + message);
}

function error(message) {
    console.log("\x1b[31m[ERROR]\x1b[0m " + message);
}

function warn(message) {
    console.log("\x1b[33m[WARN]\x1b[0m " + message);
}

function info(message) {
    console.log("\x1b[36m[INFO]\x1b[0m " + message);
}
function question(message) {
    return "\x1b[33m" + message + "\x1b[0m";
}

module.exports = { success, error, warn, info,question };