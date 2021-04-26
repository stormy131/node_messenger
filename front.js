'use strict'

const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> '
});

console.clear();
console.log('Welcome to Node Messenger\n   type "help" to see the command list\n   type "login" for login\n ');
rl.prompt();

const commands = {
    help() {
        console.log('Commands:', Object.keys(commands).join(', '));
    },
    login() {
        loginScreen();
    },
    exit() {
        rl.close();
    }
};


function question(str) {
    return new Promise(resolve => {
        rl.question(str, resolve)
    });
}

async function loginScreen() {
    console.clear();

    const login = await question(`Login: `);

    const password = await question(`Password: `);

    console.log(`\nYour login: ${login}\nYour password: ${password}\n`);
    rl.prompt();
}


rl.on('line', (line) => {
    line = line.trim();
    const command = commands[line];
    if (command) {
        command();
    } else {
        console.log('Unknown command');
    }
    rl.prompt();
}).on('close', () => {
    console.log('Good luck!');
    process.exit(0);
});
