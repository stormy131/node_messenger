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
        registrationScreen()
    },
    login() {
        loginScreen();
    },
    logout() {
        logoutScreen();
    },
    account() {
        accountScreen();
    },
    messages() {
        messageScreen();
    },
    notifications() {

    },
    exit() {
        rl.close();
    }
};


const messages = {
    greeting: 'Welcome to Node Messenger (° ͜ʖ͡°)╭∩╮',
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
    infoAddSuccess: 'Information successfully added',
    infoCheck: 'Information about your account:',
    loggedIn: 'You are logged in',
    notLoggedIn: 'You are not logged in',
    invalidInput: 'Invalid input, please try again:',
    messageSuccess: 'The message was successfully sent',
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
    } else if (color === 'cyan') {
        index = '\u001b[36m';
    }

    console.log(`${index}${text}\u001b[37m`);

    if (state === true || state === false) {
        status = state;
    }
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
            showMessage(messages.logFail, 'red');
        }

        rl.prompt();
    } else {
        showMessage(messages.loggedIn, 'red');
    }

}

function logoutScreen() {
    if (status) {
        showMessage(messages.logoutSuccess, 'green', false);
    } else {
        showMessage(messages.logoutFail, 'red');
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
                showMessage(messages.infoAddSuccess, 'green');
            }
        } else {
            showMessage(messages.regFail, 'red');
        }

        rl.prompt();
    } else {
        showMessage(messages.loggedIn, 'red');
    }

}

async function infoScreen() {
    const infoObject = await backend.getInfo(currentLogin);
    console.log('\x1b[1A');
    showMessage(messages.infoCheck, 'white');
    console.table(infoObject);
}

async function editInfoScreen() {
    const infoObject = await backend.getInfo(currentLogin);
    const item = await question(`What do you want to change: `);

    if (typeof infoObject[item] !== "undefined") {
        infoObject[item] = await question('New information: ');

        await backend.changeInfo(currentLogin, infoObject);

        console.log('info succesfully changed');
    } else {
        showMessage(messages.invalidInput, 'red');
        await editInfoScreen();
    }

}

async function accountScreen() {
    if (status) {
        const info = await question(`Do you want to see or edit your account? [see/edit]: `);

        if (info === 'see' || info === 's') {
            await infoScreen();
        } else if (info === 'edit' || info === 'e') {
            await editInfoScreen();
        } else {
            showMessage(messages.invalidInput, 'red');
            await accountScreen();
        }
    } else {
        showMessage(messages.notLoggedIn, 'red');
    }

    rl.prompt();
}

async function checkMessage() {
    const item = await question(`Which messages: `);

    const infoObject = await backend.getMessages(currentLogin, item);

    const dialog = infoObject.join('\n');
    console.log(dialog);
}

async function sendMessage() {
    const recipient = await question(`For whom: `);
    const text = await question(`Text: `);

    await backend.addMessage(currentLogin, recipient, text);
    showMessage(messages.messageSuccess, 'green');
}

async function messageScreen() {
    if (status) {
        const info = await question(`Send a message or check your messages? [send/check]: `);

        if (info === 'send' || info === 's') {
            await sendMessage();
        } else if (info === 'check' || info === 'c') {
            await checkMessage();
        } else {
            showMessage(messages.invalidInput, 'red');
            await messageScreen();
        }
    } else {
        showMessage(messages.notLoggedIn, 'red');
    }

    rl.prompt();
}


backend.checkDB();
console.clear();
showMessage(messages.greeting, 'white', status);
showMessage(messages.helpComm + '\n', 'cyan', status);
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
}).on('SIGINT', () => {});


readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

process.stdin.on('keypress', (str, key) => {
    //console.log(key)
    if (key.name === 'q' && key.ctrl === true) {
        loginScreen();
    } else if (key.name === 'w' && key.ctrl === true) {
        messageScreen();
    }
})