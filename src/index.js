const startShell = require("../src/shell/shell.js");

try {
    startShell();
} catch (error) {
    console.log("Unable to run the application ");
    console.error(error);
}