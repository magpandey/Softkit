const {getCurrentDirectory} = require("../core/workspace.js")
function whereFunction(args,rl){
    const currentDir = getCurrentDirectory();
    console.log(`Current directory : ${currentDir}`);

}
module.exports = whereFunction