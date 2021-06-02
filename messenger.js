'use strict'

const fs = require('fs');
const { setegid } = require('process');
const readline = require('readline');

const Back = require('./back.js');
const backend = new Back;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> '
});

let storage;
let status = false;
let currentLogin;

const commands = {
    help() {list(storage.commandsDescription)},
    hotkeys() {list(storage.hotkeysDescription)},
    registration() {registrationScreen()},
    login() {loginScreen()},
    logout() {logoutScreen()},
    account() {accountScreen()},
    friends() {friendsScreen()},
    messages() {messageScreen()},
    news() {newsScreen()},
    notifications() {},
    exit() {rl.close()}
};

async function init() {
    await backend.createDB();
    storage = await backend.getFrontStorage();
}

async function showMessage(text, color) {
    let index = storage.colors[color];
    console.log(index + storage.messages[text] + storage.colors.white);
}

async function checkInput(input, arg1, arg2, res1, res2) {
    if (input === arg1 || input === arg1[0]) {
        await res1();
    } else if (input === arg2 || input === arg2[0]) {
        await res2();
    } else {
        showMessage('invalidInput', 'red');
    }
}

function list(object) {
    for (const [key, value] of Object.entries(object)) {
        console.log('\u001b[36m' + key + '\u001b[37m: ' + value);
    }
}

function question(str) {
    return new Promise(resolve => {
        rl.question(storage.questions[str], resolve);
    });
}

async function loginScreen() {
    if (status) {
        showMessage('loggedIn', 'red');
        return;
    }

    const login = await question('login');
    const password = await question('password');

    const check = await backend.checkAccount(login, password);

    if (check) {
        showMessage('logSuccess', 'green');
        status = true;
        currentLogin = login;
    } else {
        showMessage('logFail', 'red');
    }

    rl.prompt();
}

function logoutScreen() {
    if (status) {
        showMessage('logoutSuccess', 'green');
        status = false;
    } else {
        showMessage('logoutFail', 'red');
    }
}

async function infoAdd() {
    const additional = await question('addInfo');

    if (additional === 'y' || additional === 'yes') {
        const infoArray = [];
        for (let i = 0; i < storage.registrationQuestions.length; i++) {
            let answer = await new Promise(resolve => {
                rl.question(storage.registrationQuestions[i], resolve);
            });
            infoArray.push(answer);
        }
        await backend.addInfo(currentLogin, infoArray);
        showMessage('infoAddSuccess', 'green');
    } else {
        const infoArray = ['', '', '', '', ''];
        await backend.addInfo(currentLogin, infoArray);
        showMessage('infoAddLater', 'cyan');
    }
}

async function registrationScreen() {
    if (status) {
        showMessage('loggedIn', 'red');
        return;
    }

    const login = await question('loginCreate');
    const password = await question('passwordCreate');

    const check = await backend.createAccount(login, password);

    if (check) {
        showMessage('regSuccess', 'green');
        status = true;
        currentLogin = login;
        await infoAdd();        
    } else {
        showMessage('regFail', 'red');
    }

    rl.prompt();
}

async function changeInfo(num) {
    const infoObject = await backend.getInfo(currentLogin);

    const item = storage.profileInfo[num - 1];
    infoObject[item] = await question('newInfo');
    await backend.changeInfo(currentLogin, infoObject);

    showMessage('infoUpdate', 'green');
}

async function changePassword() {
    const currentPassword = await question('currentPass');
    const result = await backend.checkAccount(currentLogin, currentPassword);

    if (result) {
        const newPassword = await question('newPass');
        const newPasswordRepeat = await question('repeatPass');

        if (newPassword === newPasswordRepeat) {
            await backend.changePassword(currentLogin, newPassword);
            showMessage('passChangeSuccess', 'green');
        } else {
            showMessage('passChangeFail', 'red');
        }
    } else {
        showMessage('passCheckFail', 'red');
    }
}

async function editAccount() {
    showMessage('whatChange', 'white');
    for (let i = 0; i < storage.profileInfo.length; i++) {
        console.log(`${i+1} - ${storage.profileInfo[i]}`);
    }

    const input = parseInt(await question('options'));

    if (!storage.profileInfo[input - 1]) {
        showMessage('invalidInput', 'red');
        return;
    }

    if (input < storage.profileInfo.length) {
        await changeInfo(input);
    } else {
        await changePassword();
    } 
}

async function showAccount() {
    const infoObject = await backend.getInfo(currentLogin);

    showMessage('infoCheck', 'white');
    console.log('\u001b[0m' + '\x1b[1A');
    console.table(infoObject);
}

async function accountScreen() {
    if (!status) {
        showMessage('notLoggedIn', 'red');
        return;
    }

    const info = await question('seeEdit');
    await checkInput(info, 'see', 'edit', showAccount, editAccount);

    rl.prompt();
}

async function checkAccount() {
    const name = await question('friendName');
}

async function friendsScreen() {
    if (!status) {
        showMessage('notLoggedIn', 'red');
        return;
    }

    const friendList = await backend.getFriends(currentLogin);

    console.log('\n\x1b[1A' + 'Your friends:');
    for (let i = 0; i < friendList.length; i++) {
        console.log(`${i+1}. ` + friendList[i]);
    }

    const add = await question('addFriend');
    if (add === 'y' || add === 'yes') {
        const newFriend = await question('username');
        await backend.addFriend(currentLogin, newFriend);
    }

    rl.prompt();
}

async function writeMessage() {
    const partner = await question('writeMess');
    if (partner === '') return;
        
    const messObject = await backend.getMessages(currentLogin, partner);
    if(messObject === undefined) {
        showMessage('messagesNew', 'white');
    } else {
        const dialog = messObject.join('\n')
            .split(partner)
            .join(storage.colors.blue + partner + storage.colors.white)
            .split(currentLogin)
            .join(storage.colors.magenta + currentLogin + storage.colors.white);
        console.log(dialog);
    }

    showMessage('sendFile', 'cyan');
    const text = await question('newMess');

    if (text === 'send file') {
        const file = await question('filePath');
        await backend.sendFile(partner, file);
        await backend.addMessage(currentLogin, partner, '([sent file])');
    } else if (text !== '') { 
        await backend.addMessage(currentLogin, partner, text);
        console.log(storage.colors.magenta + currentLogin + storage.colors.white + ': ' + text);
    }
}

async function messageScreen() {
    if (!status) {
        showMessage('notLoggedIn', 'red');
        return;
    }

    const chats = await backend.getChats(currentLogin);
    const friends = await backend.getFriends(currentLogin);

    const difference = (s1, s2) => new Set(
        [...s1].filter(v => !s2.has(v))
    );

    const dif1 = new Set(friends);
    const dif2 = new Set(chats);

    const resArr = Array.from(difference(dif1, dif2));

    console.log('\n\x1b[1A' + 'Available chats:');
    for (let i = 0; i < chats.length; i++) {
        console.log('- ' + chats[i]);
    }

    console.log('\n\x1b[1A' + 'Friends you have no chats with:');
    for (let i = 0; i < resArr.length; i++) {
        console.log('- ' + resArr[i]);
    }

    await writeMessage();

    rl.prompt();
}

async function newsScreen() {
    if (!status) {
        showMessage('notLoggedIn', 'red');
        return;
    }

    const news = await backend.getNews();

    console.log('\n\x1b[1A' + 'Latest news:');
    for (let i = 0; i < news.length; i++) {
        console.log(news[i]);
    }

    const add = await question('postSmth');
    if (add === 'y' || add === 'yes') {
        const news = await question('newPost');
        await backend.addNews(currentLogin, news);
    }

    rl.prompt();
}


(async () => {
    await init();
    console.clear();
    showMessage('greeting', 'white');
    showMessage('helpComm', 'cyan');
    rl.prompt();
})();

rl.on('line', (line) => {
    line = line.trim();
    const command = commands[line];
    if (command) {
        command();
    } else {
        showMessage('unknown', 'red');
    }
    rl.prompt();
}).on('close', () => {
    showMessage('bye', 'white');
    process.exit(0);
}).on('SIGINT', () => {});


readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

process.stdin.on('keypress', (str, key) => {
    //console.log(key)

    // if (key.name === 'q' && key.ctrl) {
    //     commands.login();
    // } else if (key.name === 'w' && key.ctrl) {
    //     commands.account();
    // } else if (key.name === 'e' && key.ctrl) {
    //     commands.messages();
    // } else if (key.name === 'r' && key.ctrl) {
    //     commands.news();
    // } else if (key.name === 't' && key.ctrl) {
    //     commands.notifications();
    // }
})