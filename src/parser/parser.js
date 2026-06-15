
function parse(input){
    const parts = input.split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    return {command,args};
}
module.exports = {parse};