const fs = require("fs");
const {getCurrentDirectory} = require("../core/workspace.js");
const path = require("path");

function listFilesAndDirectory(){
    const dir = getCurrentDirectory();
    try {
        const items = fs.readdirSync(dir);
        if(items.length === 0){
            console.log(`${dir} is empty`);
            return;
        }
        console.log(`\nContents of ${dir}:\n`);

        items.forEach(e => {
            const fullpath = path.join(dir,e);
            const isDir = fs.statSync(fullpath).isDirectory();

             if (isDir) {
                console.log(`  [DIR]  ${e}`);
            } else {
                console.log(`  [FILE] ${e}`);
            } 
        });
        console.log("");
    } catch (error) {
        console.log(`Could'nt read the directory : ${error.message}`)
    }
}
module.exports = listFilesAndDirectory