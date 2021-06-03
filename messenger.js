'use strict';

const readline = require('readline');

const Back = require('./back.js');
const backend = new Back();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '> ',
});

let storage;
let currentLogin;

const commands = {
  help() {
    list(storage.commandsDescription);
  },
  hotkeys() {
    list(storage.hotkeysDescription);
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
  friends() {
    friendsScreen();
  },
  messages() {
    messageScreen();
  },
  news() {
    newsScreen();
  },
  exit() {
    rl.close();
  },
};

async function init() {
  await backend.createDB();
  storage = await backend.getFrontStorage();
}

async function showMessage(text, color) {
  console.log(
    storage.colors[color] + storage.messages[text] + storage.colors.white
  );
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
    console.log(
      storage.colors.cyan + key + storage.colors.white + ': ' + value
    );
  }
}

function difference(s1, s2) {
  return new Set([...s1].filter(v => !s2.has(v)));
}

function intersection(s1, s2) {
  return new Set([...s1].filter(v => s2.has(v)));
}

function question(str) {
  return new Promise(resolve => {
    rl.question(storage.questions[str], resolve);
  });
}

async function loginScreen() {
  if (currentLogin) {
    showMessage('loggedIn', 'red');
    return;
  }

  const login = await question('login');
  const password = await question('password');

  const check = await backend.checkAccount(login, password);

  if (check) {
    showMessage('logSuccess', 'green');
    currentLogin = login;
  } else {
    showMessage('logFail', 'red');
  }

  rl.prompt();
}

function logoutScreen() {
  if (currentLogin) {
    showMessage('logoutSuccess', 'green');
    currentLogin = null;
    return;
  }

  showMessage('logoutFail', 'red');
}

async function infoAdd() {
  const additional = await question('addInfo');

  if (additional === 'y' || additional === 'yes') {
    const infoArray = [];
    for (let i = 0; i < storage.registrationQuestions.length; i++) {
      const answer = await new Promise(resolve => {
        rl.question(storage.registrationQuestions[i], resolve);
      });
      infoArray.push(answer);
    }
    await backend.addInfo(currentLogin, infoArray);
    showMessage('infoAddSuccess', 'green');
    return;
  }

  const infoArray = ['', '', '', '', ''];
  await backend.addInfo(currentLogin, infoArray);
  showMessage('infoAddLater', 'cyan');
}

async function registrationScreen() {
  if (currentLogin) {
    showMessage('loggedIn', 'red');
    return;
  }

  const login = await question('loginCreate');
  const password = await question('passwordCreate');

  const check = await backend.createAccount(login, password);

  if (check) {
    showMessage('regSuccess', 'green');
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

    return;
  }

  showMessage('passCheckFail', 'red');
}

async function editAccount() {
  showMessage('whatChange', 'white');
  for (let i = 0; i < storage.profileInfo.length; i++) {
    console.log(`${i + 1} - ${storage.profileInfo[i]}`);
  }

  const input = parseInt(await question('options'));

  if (!storage.profileInfo[input - 1]) {
    showMessage('invalidInput', 'red');
    return;
  }

  if (input < storage.profileInfo.length) {
    await changeInfo(input);
    return;
  }

  await changePassword();
}

async function showAccount() {
  const infoObject = await backend.getInfo(currentLogin);

  showMessage('infoCheck', 'white');
  console.log('\u001b[0m\x1b[1A');
  console.table(infoObject);
}

async function accountScreen() {
  if (!currentLogin) {
    showMessage('notLoggedIn', 'red');
    return;
  }

  const info = await question('seeEdit');
  await checkInput(info, 'see', 'edit', showAccount, editAccount);

  rl.prompt();
}

async function friendsScreen() {
  if (!currentLogin) {
    showMessage('notLoggedIn', 'red');
    return;
  }

  const friendList = await backend.getFriends(currentLogin);

  console.log('\n\x1b[1AYour friends:');
  for (let i = 0; i < friendList.length; i++) {
    console.log(
      storage.colors.yellow +
        `${i + 1}. ` +
        storage.colors.white +
        friendList[i]
    );
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
  if (!partner) return;

  const messObject = await backend.getMessages(currentLogin, partner);
  if (messObject) {
    const dialog = messObject
      .join('\n')
      .split(partner)
      .join(storage.colors.blue + partner + storage.colors.white)
      .split(currentLogin)
      .join(storage.colors.magenta + currentLogin + storage.colors.white);
    console.log(dialog);
  } else {
    showMessage('messagesNew', 'white');
  }

  const text = await question('newMess');

  if (!text) return;

  await backend.addMessage(currentLogin, partner, text);
  console.log(
    storage.colors.magenta + currentLogin +
        storage.colors.white + ': ' + text
  );
}

async function messageScreen() {
  if (!currentLogin) {
    showMessage('notLoggedIn', 'red');
    return;
  }

  const friends = await backend.getFriends(currentLogin);
  const dif1 = new Set(friends);
  const chats = await backend.getChats(currentLogin);
  const dif2 = new Set(chats);

  const resArr = Array.from(difference(dif1, dif2));

  console.log('\n\x1b[1AAvailable chats:');
  for (let i = 0; i < chats.length; i++) {
    console.log(storage.colors.yellow + '- ' +
        storage.colors.white + chats[i]);
  }

  console.log('\n\x1b[1AFriends you have no chats with:');
  for (let i = 0; i < resArr.length; i++) {
    console.log(
      storage.colors.yellow + '- ' + storage.colors.white + resArr[i]
    );
  }

  await writeMessage();

  rl.prompt();
}

async function newsScreen() {
  if (!currentLogin) {
    showMessage('notLoggedIn', 'red');
    return;
  }

  const friends = await backend.getFriends(currentLogin);
  const inter1 = new Set(friends);
  const news = await backend.getNews();

  const authors = [];
  for (let i = 0; i < news.length; i++) {
    const postAuthor = news[i].split(':')[0];
    authors.push(postAuthor);
  }
  const inter2 = new Set(authors);

  const resArr = Array.from(intersection(inter1, inter2));

  console.log('\n\x1b[1ALatest news:');
  for (let i = 0; i < news.length; i++) {
    if (resArr.indexOf(authors[i].split(':')[0]) !== -1) {
      console.log(
        news[i]
          .split(authors[i])
          .join(storage.colors.yellow + authors[i] +
                        storage.colors.white)
      );
    }
  }

  const add = await question('postSmth');
  if (add === 'y' || add === 'yes') {
    const news = await question('newPost');
    await backend.addNews(currentLogin, news);
    console.log(
      storage.colors.yellow + currentLogin +
            storage.colors.white + ': ' + news
    );
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

rl.on('line', line => {
  line = line.trim();
  const command = commands[line];
  if (command) {
    command();
  } else {
    showMessage('unknown', 'red');
  }
  rl.prompt();
})
  .on('close', () => {
    showMessage('bye', 'white');
    process.exit(0);
  })
  .on('SIGINT', () => {});

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

process.stdin.on('keypress', (str, key) => {
  for (const [item, value] of Object.entries(storage.buttons)) {
    if (key.name === item && key.ctrl) {
      console.log(`Ctrl + ${key.name} (${value})`);
      commands[value]();
      rl.prompt();
    }
  }
});
