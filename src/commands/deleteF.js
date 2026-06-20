const {deleteFile} = require('../core/filesystem.js')

function commandDeleteFile(args,rl){
    if(args.length === 0){
        console.log(`Please provide filename to delete `);
        return;
    }
    rl.question(`Are you sure you want to delete ${args[0]}? (y/n): `,(ans) => {
        if(ans.trim().toLowerCase() === 'y'){
                const {message} = deleteFile(args[0]);
                
                    console.log(message);
                }else{
                    console.log(message);
                }
                rl.prompt();
            })
        }
    module.exports = commandDeleteFile;

