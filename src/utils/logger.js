

let ipcSender = null;

function setIPCMode(senderFn) {
    ipcSender = senderFn;
}

function print(prefix, colorCode, message) {
    if (ipcSender) {
        ipcSender(`${prefix} ${message}`);
    } else {
        console.log(`${colorCode}${prefix}\x1b[0m ${message}`);
    }
}

function success(message) {
    print('[SUCCESS]', '\x1b[32m', message);
}

function error(message) {
    print('[ERROR]', '\x1b[31m', message);
}

function warn(message) {
    print('[WARN]', '\x1b[33m', message);
}

function info(message) {
    print('[INFO]', '\x1b[36m', message);
}

function newline() {
    if (ipcSender) {
        ipcSender('');
    } else {
        console.log('');
    }
}

function question(message) {
    return '\x1b[33m' + message + '\x1b[0m';
}

module.exports = { success, error, warn, info, newline, question, setIPCMode };