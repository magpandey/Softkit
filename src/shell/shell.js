const readLine = require("readline");
const parser = require("../parser/parser.js");
const commands = require("../commands/index.js");

function startShell(){
    const rl = readLine.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: "Softkit >"
    });

    console.log("Welcome to SoftKit ! Type help for list of commands");
    rl.prompt();
    rl.on("line", (line) => {
        const input = line.trim();
        if(input){
            const {command,args} = parser.parse(input);
            if(commands[command]){
                commands[command](args,rl);
            }else{
                console.log(`Unknow command: ${command} .Type 'help' for list of commands`);
            }
        }
        rl.prompt();
    });

    rl.on("close",() => {
        console.log("Exiting.....");
        process.exit(0);
    }); 
}

module.exports = startShell;