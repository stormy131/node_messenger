'use strict'

const readline = require('readline');

const back = require('./back.js');

const backend = new back;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> '
});

let status = false;
let currentLogin;

const commands = {
    help() {
        console.log('Commands:', Object.keys(commands).join(', '));
    },
    registration() {
        registrationScreen();
    },
    login() {
        loginScreen();
    },
    logout() {
        logoutScreen();
    },
    show_account() {
        infoScreen();
    },
    edit_account() {
        editInfoScreen();
    },
    writeMessage() {
        messageScreen();
    },
    exit() {
        rl.close();
    }
};


const messages = {
    greeting: 'Welcome to Node Messenger',
    unknown: 'Unknown command',
    helpComm: 'type "help" to see the command list',
    logComm: 'type "login" for login',
    regComm: 'type "registration" for registration',
    logFail: 'Authorization failed',
    logSuccess: 'You are successfully logged in',
    logoutFail: 'You are not logged in',
    logoutSuccess: 'You have logged out',
    regFail: 'Registration failed',
    regSuccess: 'Your account has been successfully created',
    regQuestion: 'Would you like to add some information about you to your account right now?\n' +
        'You can always do it later',
    infoAddSuccess: 'Information successfully added',
    loggedIn: 'You are logged in',
    notLoggedIn: 'You are not logged in',
    bye: 'Goodbye. Have a good day!'
}

function showMessage(text, color, state) {
    let index;

    if (color === 'white') {
        index = '\u001b[37m'
    } else if (color === 'red') {
        index = '\u001b[31m';
    } else if (color === 'green') {
        index = '\u001b[32m';
    }

    console.log(`${index}${text}\u001b[37m`);

    status = state;
}


function question(str) {
    return new Promise(resolve => {
        rl.question(str, resolve)
    });
}

async function loginScreen() {
    if (!status) {
        const login = await question(`Login: `);
        const password = await question(`Password: `);

        const bool = await backend.checkAccount(login, password);

        if (bool) {
            showMessage(messages.logSuccess, 'green', true);
            currentLogin = login;
        } else {
            showMessage(messages.logFail, 'red', false);
        }

        rl.prompt();
    } else {
        showMessage(messages.loggedIn, 'red', true);
    }

}

function logoutScreen() {
    if (status) {
        showMessage(messages.logoutSuccess, 'green', false);
    } else {
        showMessage(messages.logoutFail, 'red', false);
    }
}

async function registrationScreen() {
    if (!status) {
        const login = await question(`Create a login: `);
        const password = await question(`Pick a password: `);

        const bool = await backend.createAccount(login, password);

        if (bool) {
            showMessage(messages.regSuccess, 'green', true);
            currentLogin = login;

            const additional = await question('Would you like to add some extra info to your profile? [y/n]: ')
            if (additional === 'y' || additional === 'yes') {
                const name = await question(`What is your name? `);
                const age = await question(`How old are you? `);
                const country = await question(`What country are you from? `);
                const city = await question(`In which city of ${country} do you live? `);
                const info = await question('You can add some extra info about yourself: ');

                const infoArray = [];
                infoArray.push(name, age, country, city, info);
                await backend.addInfo(login, infoArray);
                showMessage(messages.infoAddSuccess, 'green', true);
            }
        } else {
            showMessage(messages.regFail, 'red', false);
        }

        rl.prompt();
    } else {
        showMessage(messages.loggedIn, 'red', true);
    }

}

async function infoScreen() {
    if (status) {
        const infoObject = await backend.getInfo(currentLogin);
        console.log('\nInformation about your account:');
        console.table(infoObject);
    } else {
        showMessage(messages.notLoggedIn, 'red', false);
    }

    rl.prompt();
}

async function editInfoScreen() {
    if (status) {
        const infoObject = await backend.getInfo(currentLogin);
        const item = await question(`What do you want to change: `);

        if (typeof infoObject[item] !== "undefined") {
            infoObject[item] = await question('New information: ');

            const values = Object.values(infoObject);
            values.shift();
            console.log(values);
            await backend.addInfo(currentLogin, values);
        } else {
            console.log('invalid input');
        }
    } else {
        showMessage(messages.notLoggedIn, 'red', false);
    }

    rl.prompt();
}

function messageScreen() {

}


console.clear();
showMessage(messages.greeting, 'white', status);
showMessage(messages.helpComm, 'white', status);
console.log('\n');
rl.prompt();

rl.on('line', (line) => {
    line = line.trim();
    const command = commands[line];
    if (command) {
        command();
    } else {
        showMessage(messages.unknown, 'red', status);
    }
    rl.prompt();
}).on('close', () => {
    showMessage(messages.bye, 'white', status);
    process.exit(0);
})