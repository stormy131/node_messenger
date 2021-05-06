'use strict'

const { setegid } = require('process');
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
        commandsList();
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

const commandsDescription = {
    help: 'see the full commands list',
    registration: 'create a new account (new login and password)',
    login: 'sign in to an existing account (login and password required)',
    logout: 'sign out from an account',
    account: 'get or set information about your account',
    messages: 'check message history and write new messages',
    notifications: '',
    exit: 'stop running Node Messanger'
}


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
    infoAddLater: 'You can always add information later',
    infoCheck: 'Information about your account:',
    infoUpdate: 'Information was updated successfully',
    passCheckFail: 'Password is incorrect',
    passChangeSuccess: 'Password was successfully changed',
    passChangeFail: 'Password mismatch',
    loggedIn: 'You are logged in',
    notLoggedIn: 'You are not logged in',
    invalidInput: 'Invalid input, please try again:',
    messageSuccess: 'The message was successfully sent',
    messagesNew: 'You don`t have any messages with this user',
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


function commandsList() {
    const commandsKeys = Object.keys(commands);
    const commandsValues = Object.values(commandsDescription);

    for (let i = 0; i < commandsKeys.length; i++) {
        console.log('\u001b[36m' + commandsKeys[i] + '\u001b[37m: ' + commandsValues[i]);
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
            } else {
                const infoArray = ['', '', '', '', ''];
                await backend.addInfo(login, infoArray);
                showMessage(messages.infoAddLater, 'white');
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
    console.log('\u001b[0m' + '\x1b[1A');
    console.table(infoObject);
    console.log('\u001b[37m' + '\x1b[1A');
}

let infoRecursion = 0;

async function editInfoScreen() {
    const infoObject = await backend.getInfo(currentLogin);

    if(infoRecursion === 0) {
        console.log('What do you want to change:\n' +
        '1 - name\n' +
        '2 - birth date\n' +
        '3 - country\n' +
        '4 - city\n' +
        '5 - info\n' +
        '6 - set new password')
    }

    const input = await question('[1/2/3/4/5/6]: ');

    let item;

    if (input === ('1' || '2' || '3' || '4' || '5')) {
        if (input == 1) {item = 'name'} 
        else if (input == 2) {item = 'birth'}
        else if (input == 3) {item = 'country'}
        else if (input == 4) {item = 'city'}
        else if (input == 5) {item = 'info'};
        
        infoObject[item] = await question('New information: ');

        await backend.changeInfo(currentLogin, infoObject);

        showMessage(messages.infoUpdate, 'green');
        infoRecursion = 0;
    } else if (input === '6') {
        const currentPassword = await question('Current password: ');
        const result = await backend.checkAccount(currentLogin, currentPassword);
        if (result) {
            const newPasswordFirst = await question('Enter new password: ');
            const newPasswordSecond = await question('Repeat new password: ');

            if (newPasswordFirst === newPasswordSecond) {
                await backend.changePassword(currentLogin, newPasswordFirst);
                showMessage(messages.passChangeSuccess, 'green');
            } else {
                showMessage(messages.passChangeFail, 'red');
            }
        } else {
            showMessage(messages.passCheckFail, 'red');
        }
    } else {
        showMessage(messages.invalidInput, 'red');
        infoRecursion++;
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


async function messageScreen() {
    if (status) {
        const chats = await backend.getChats(currentLogin);

        console.log('\x1b[1A');
        console.log('Available chats:')

        for (let i = 0; i < chats.length; i++) {
            console.log('- ' + chats[i])
        }

        const partner = await question('Who do you want to write to? [username]: ');
        
        const infoObject = await backend.getMessages(currentLogin, partner);
        if(infoObject === undefined) {
            showMessage(messages.messagesNew, 'white');
        } else {
            const dialog = infoObject.join('\n');
            let newDialog = dialog.split(`${partner}`).join(`\u001b[34m${partner}\u001b[37m`);
            newDialog = newDialog.split(`${currentLogin}`).join(`\u001b[35m${currentLogin}\u001b[37m`);
            console.log(newDialog);
        }

        const text = await question('\u001b[36m(if you want to send file, type "send file")\u001b[37m\nNew message: ');
        if (text === 'send file') {
            const file = await question('Enter file path: ');
            await backend.sendFile(partner, file);
            await backend.addMessage(currentLogin, partner, `\u001b[35msent file\u001b[37m`)
        } else if (text === '') {

        } else {
            await backend.addMessage(currentLogin, partner, text);
            console.log(`\u001b[35m${currentLogin}\u001b[37m: ${text}`);
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