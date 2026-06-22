const { deleteFolder } = require('../core/fileSystem');

function commandDeleteFolder(args, rl) {
    if (args.length === 0) {
        console.log("Please provide a folder name to delete");
        return;
    }

    const force = args[1] === "--force";

    rl.question(`Are you sure you want to delete ${args[0]}? (y/n): `, (ans) => {
        
        if (ans.trim().toLowerCase() === 'y') {
            const { message } = deleteFolder(args[0], force);
            console.log(message);
        } else {
            console.log("Deletion cancelled");
        }
        rl.prompt();
    });
}

module.exports = commandDeleteFolder;