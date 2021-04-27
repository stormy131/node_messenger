'use strict';

const fs = require('fs');

class Account {
  constructor(login, name, age, country, city, info) {
    this.login = login;
    this.name = name;
    this.age = age;
    this.country = country;
    this.city = city;
    this.info = info;
  }

  toString() {
    return 'User: ' + this.login + '\nFull name: ' + this.name +
      '\nAge: ' + this.age + '\nCountry: ' + this.country + ' City ' +
      this.city + '\nInfo: ' + this.info;
  }
}

class back{

  // TODO IN FRONT:
  // FIRSTLY, NEED TO CHECK/CREATE DATABASE IN DIRECTORY OF PROJECT

  checkDB() {
    return new Promise(resolve => {
      fs.mkdir('data', err => {
        if (err) {
          fs.readFile('data/authorize', err => {
            if (err) {
              fs.writeFile('data/authorize', '', () => {});
            }
          });

          fs.readFile('data/info', err => {
            if(err){
              fs.writeFile('data/info', '', () => {});
            }
          });

          fs.mkdir('data/messages', err => {
            if(err) resolve();
          });

          return;
        }

        fs.writeFile('data/authorize', '', () => {});
        fs.writeFile('data/info', '', () => {});
        fs.mkdir('data/messages', () => {});
        resolve();
      });
    });
  }

  createAccount(login, password){ 
    return new Promise((resolve, reject) => {
      fs.readFile('data/authorize', (err, data) => {
        if (err){
          console.log('CHECK YOUR DB!');
          throw err;
        }

        const users = data.toString().split('\n');
        users.pop();
        console.log(users);
        for (let i = 0; i < users.length; i++) {
          const user = users[i].split(' - ');
          if (login === user[0]){
            console.log('LOGIN IS ALREADY USED');
            resolve();
            return;
          }
        }

        fs.appendFile('data/authorize', login + ' - ' + password + '\n', err => {
          if (err){
            console.log('SMTH WENT WRONG WHILE APPENDING DATA');
            reject();
          }

          console.log('created');
          resolve();
        });
      });
    });
  }

  checkAccount(login, password){ 
    return new Promise( resolve => {
      fs.readFile('data/authorize', (err, data) => {
        if (err){
          console.log('CHECK DB');
          resolve();
          return
        }

        const users = data.toString().split('\n');
        for (let i = 0; i < users.length; i++) {
          const user = users[i].split(' - ');
          if (login === user[0] && password === user[1]){
            console.log('ACC EXISTS');
            resolve(true);
            return
          }
        }

        console.log('INCORRECT USER DATA');
        resolve(false);
      });
    });
  }

  // INFO-ARRAY INTERFACE: [FULL NAME, AGE, COUNTRY, CITY, INFO]

  async addInfo(login, info){
    const user = new Account(login, ...info);
    await fs.appendFile('data/info', JSON.stringify(user) + '\n', err => {
      if (err) {
        console.log('SMTH went wrong while appending data');
        return;
      }
    });
  }

  async getInfo(login){
    await fs.readFile('data/info', (err, data) => {
      if (err) {
        console.log('CHECK YOUR DB');
        return;
      }

      const content = data.toString().split('\n');
      content.pop();
      for (const line of content) {
        const user = JSON.parse(line);
        if (user.login === login) {
          console.dir(user);
        }
      }
    });
  }

  async addMessage(from, to, message){
    fs.readFile('data/messages/' + from + ' - ' + to, err => {
      if(err){
        fs.readFile('data/messages/' + to + ' - ' + from, err => {
          if(err){
            fs.writeFile('data/messages/' + from + ' - ' + to,
                        from + ': ' + message + '\n', () => {});
            return;
          }

          fs.appendFile('data/messages/' + to + ' - ' + from,
                        from + ': ' + message + '\n', () => {});
          return;
        });
      }

      fs.appendFile('data/messages/' + from + ' - ' + to,
                    from + ': ' + message + '\n', () => {});
    });
  }

}

module.exports = back;

//TESTING

/*(async () => {
  const api = new Api;
  await api.checkDB();
  await api.createAccount('Artem', '!@#');
  await api.checkAccount('Artem', '!@#');
  await api.addInfo('Artem', ['1','2','3','4','5']);
  await api.getInfo('Artem');
  await api.addMessage('Artem', 'Dmytro', 'Welcome to node_messenger!)');
})();*/
