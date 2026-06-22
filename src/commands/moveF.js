const { moveFile } = require('../core/fileSystem');

function commandMoveFile(args, rl) {
    if (args.length === 0) {
        console.log("Provide a filename to move");
        return;
    }

    rl.question("Where to move the file to?: ", (ans) => {
        const { message } = moveFile(args[0], ans);
        console.log(message);
        rl.prompt();
    });
}

module.exports = commandMoveFile;