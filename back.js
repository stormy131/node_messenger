'use strict';

const fs = require('fs');

class Account {
  constructor(login, name, birth, country, city, info) {
    this.login = login;
    this.name = name;
    this.birth = birth;
    this.country = country;
    this.city = city;
    this.info = info;
  }

  toString() {
    return 'User: ' + this.login + ' \nFull name: ' + this.name +
      '\nAge: ' + this.age + '\nCountry: ' + this.country + ' City ' +
      this.city + '\nInfo: ' + this.info;
  }
}

class Back {

  checkError(err) {
    if (err) throw err;
  }

  renderData(data) {
    const content = data.toString().split('\n');
    if (content[content.length - 1] === '') content.pop();

    return content;
  }

  getFrontStorage() {
    return new Promise(resolve => {
      fs.readFile('storage.json', (err, data) => {
        this.checkError(err);

        const storage = JSON.parse(data);
        resolve(storage);
      });
    });
  }

  // TODO IN FRONT:
  // FIRSTLY, NEED TO CHECK/CREATE DATABASE IN DIRECTORY OF PROJECT

  createDB() {
    const files = ['authorize', 'info', 'friends', 'news'];
    const dirs = ['messages', 'dropbox'];

    return new Promise(resolve => {
      fs.access('data', err => {
        if (err) {
          fs.mkdir('data', err => this.checkError(err));
        }
      });

      for (const file of files) {
        fs.access('data/' + file, err => {
          if (err) {
            fs.writeFile('data/' + file, '', err => this.checkError(err));
          }
        });
      }

      for (const dir of dirs) {
        fs.access('data/' + dir, err => {
          if (err) {
            fs.mkdir('data/' + dir, err => this.checkError(err));
          }
        });
      }

      resolve();
    });
  }

  createAccount(login, password) {
    return new Promise(resolve => {
      fs.readFile('data/authorize', (err, data) => {
        this.checkError(err);

        const users = this.renderData(data);

        if (users[users.length - 1] === '') users.pop();
        for (let i = 0; i < users.length; i++) {
          const user = users[i].split(' - ');
          if (login === user[0]) {
            console.log('LOGIN IS ALREADY USED');
            resolve(false);
            return;
          }
        }

        fs.appendFile(
          'data/authorize',
          login + ' - ' + password + '\n',
          err => {
            resolve(true);
            this.checkError(err);
          }
        );
      });
    });
  }

  checkAccount(login, password) {
    return new Promise(resolve => {
      fs.readFile('data/authorize', (err, data) => {
        this.checkError(err);

        const users = this.renderData(data);

        if (users[users.length - 1] === '') users.pop();
        for (let i = 0; i < users.length; i++) {
          const user = users[i].split(' - ');
          if (login === user[0] && password === user[1]) {
            resolve(true);
            return;
          }
        }

        console.log('INCORRECT USER DATA');
        resolve(false);
      });
    });
  }

  // INFO-ARRAY INTERFACE: [FULL NAME, BIRTH, COUNTRY, CITY, INFO]

  async addInfo(login, info) {
    const user = new Account(login, ...info);
    fs.appendFile('data/info', JSON.stringify(user) + '\n', err => {
      this.checkError(err);
    });
  }

  getInfo(login) {
    return new Promise(resolve => {
      fs.readFile('data/info', (err, data) => {
        this.checkError(err);

        const content = this.renderData(data);
        for (const line of content) {
          const user = JSON.parse(line);
          if (user.login === login) {
            resolve(user);
          }
        }
      });
    });
  }

  async changeInfo(login, newInfo) {
    fs.readFile('data/info', (err, data) => {
      this.checkError(err);

      const content = this.renderData(data);

      for (let i = 0; i < content.length; i++) {
        const user = JSON.parse(content[i]);
        if (user.login === login) {
          content[i] = JSON.stringify(newInfo);
          fs.writeFile('data/info', content.join('\n') + '\n', err =>
            this.checkError(err)
          );
        }
      }
    });
  }

  addMessage(from, to, message) {
    return new Promise(resolve => {
      fs.readdir('data/messages', (err, files) => {
        this.checkError(err);

        for (const file of files) {
          if (file === from + ' - ' + to || file === to + ' - ' + from) {
            fs.appendFile(
              'data/messages/' + file,
              from + ': ' + message + '\n',
              err => {
                this.checkError(err);
                resolve();
              }
            );

            return;
          }
        }

        fs.writeFile(
          'data/messages/' + from + ' - ' + to,
          from + ': ' + message + '\n',
          err => {
            this.checkError(err);
            resolve();
          }
        );
      });
    });
  }

  getMessages(from, to) {
    return new Promise(resolve => {
      fs.readdir('data/messages', (err, files) => {
        this.checkError(err);

        for (const file of files) {
          if (file === from + ' - ' + to || file === to + ' - ' + from) {
            fs.readFile('data/messages/' + file, (err, data) => {
              this.checkError(err);

              const content = this.renderData(data);
              resolve(content);
            });

            return;
          }
        }

        resolve();
      });
    });
  }

  async changePassword(login, newPassword) {
    fs.readFile('data/authorize', (err, data) => {
      this.checkError(err);

      const content = this.renderData(data);

      for (let i = 0; i < content.length; i++) {
        const account = content[i].split(' - ');
        if (account[0] === login) {
          content[i] = login + ' - ' + newPassword;

          if (content.length === 1) {
            content[0] += '\n';
            fs.writeFile('data/authorize', content[0], err =>
              this.checkError(err)
            );

            return;
          }

          fs.writeFile('data/authorize', content.join('\n'), err =>
            this.checkError(err)
          );

          break;
        }
      }
    });
  }

  async sendFile(to, path) {
    const file = path.split('/').pop();

    fs.copyFile(path, 'data/dropbox/' + to + '/' + file, err => {
      if (err) {
        fs.mkdir('data/dropbox/' + to, err => this.checkError(err));
        this.sendFile(to, path);
      }
    });
  }

  getChats(login) {
    return new Promise(resolve => {
      fs.readdir('data/messages', (err, files) => {
        this.checkError(err);

        let result = [];
        for (let i = 0; i < files.length; i++) {
          const file = files[i].split(' - ').indexOf(login);

          if (file === -1) {
            continue;
          } else {
            const chat = file.filter(user => user !== login);
            result = result.concat(chat);
          }
        }

        resolve(result);
      });
    });
  }

  async addNews(login, news) {
    fs.readFile('data/news', err => {
      this.checkError(err);

      fs.appendFile('data/news', login + ': ' + news + '\n', err =>
        this.checkError(err)
      );
    });
  }

  getNews() {
    return new Promise(resolve => {
      fs.readFile('data/news', (err, data) => {
        this.checkError(err);

        const content = this.renderData(data);

        resolve(content);
      });
    });
  }

  checkFriends(login, friend, users) {
    for (let i = 0; i < users.length; i++) {
      const user = users[i].split(': ');
      if (user[0] === login) {
        const friends = user[1].split(', ');
        for (let j = 0; j < friends.length; j++) {
          if (friends[j] === friend) return true;
        }
      }
    }

    return false;
  }

  async addFriend(login, friend) {
    fs.readFile('data/friends', async (err, data) => {
      this.checkError(err);

      const content = this.renderData(data);

      if (this.checkFriends(login, friend, content)) return;

      let flag = true;
      for (let i = 0; i < content.length; i++) {
        const user = content[i].split(': ');
        if (user[0] === login) {
          user[1] = user[1] + ', ' + friend;
          content[i] = user.join(': ');
          flag = false;
          fs.writeFile('data/friends', content.join('\n') + '\n', err =>
            this.checkError(err)
          );
          break;
        }
      }

      if (flag)
        fs.appendFile('data/friends', login + ': ' + friend + '\n', err =>
          this.checkError(err)
        );
      await this.addFriend(friend, login);
    });
  }

  getFriends(login) {
    return new Promise(resolve => {
      fs.readFile('data/friends', (err, data) => {
        this.checkError(err);

        const content = this.renderData(data);
        for (let i = 0; i < content.length; i++) {
          const user = content[i].split(': ');
          if (user[0] === login) {
            resolve(user[1].split(', '));
            break;
          }
        }
      });
    });
  }
}

module.exports = Back;
