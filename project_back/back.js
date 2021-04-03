'use strict';

const fs = require('fs');

class Account {
  constructor(login, password, id) {
    this.login = login;
    this.password = password;
    this.id = id;
  }
}


// TODO IN FRONT:
// FIRSTLY, NEED TO CHECK/CREATE DATABASE IN DIRECTORY OF PROJECT

const checkDB = () => new Promise(resolve => {
  fs.mkdir('data', err => {
    if (err) {
      fs.readFile('data/authorize', err => {
        if (err) {
          fs.writeFile('data/authorize', '', () => {});
          resolve();
        }

        resolve();
      });
    }

    fs.writeFile('data/authorize', '', () => {});
    resolve();
  });
});

const createAccount = (login, password) => new Promise((resolve, reject) => {
  fs.readFile('data/authorize', (err, data) => {
    if (err) console.log('CHECK YOUR DB!');

    const users = data.toString().split('\n');
    users.pop();
    for (let i = 0; i < users.length; i++) {
      const user = users[i].split(' - ');
      if (login === user[0]) reject('LOGIN IS ALREADY USED');
    }

    fs.appendFile('data/authorize', login + ' - ' + password + '\n', err => {
      if (err) reject('SMTH WENT WRONG WHILE APPENDING DATA');

      resolve('created');
    });
  });
});

const checkAccount = (login, password) => new Promise((resolve, reject) => {
  fs.readFile('data/authorize', (err, data) => {
    if (err) reject('CHECK DB');

    const users = data.toString().split('\n');
    for (let i = 0; i < users.length; i++) {
      const user = users[i].split(' - ');
      if (login === user[0] && password === user[1]) resolve('ACC EXISTS');
    }
    reject('INCORRECT USER DATA');
  });
});

//TESTING

(async () => {
  await checkDB().then(() => console.log('check in progress'))
		  .catch(reason => console.log(reason));
  await createAccount('Arrtem 13', 'QWEasdZXC')
    .then(value => console.log(value))
    .catch(reason => console.log(reason));
  await createAccount('QWEasdZXC', 'Arrtem 13')
    .then(value => console.log(value))
    .catch(reason => console.log(reason));
  await checkAccount('Arrtem 13', 'QWEasdZXC').then(value => console.log(value))
    .catch(reason => console.log(reason));
  await checkAccount('QWEasdZXC', 'Arrtem 13').then(value => console.log(value))
    .catch(reason => console.log(reason));
  await checkAccount('Arrtem 11', 'QWEasdZXC').then(value => console.log(value))
    .catch(reason => console.log(reason));
})();

