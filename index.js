'use strict';

require('dotenv').config();

const EventEmitter = require('events');
const net = require('net');

const uuid = require('uuid/v4');

const PORT = process.env.PORT;

const server = net.createServer();
const eventEmitter = new EventEmitter();
const socketPool = {};


let User = function (socket) {
  let newId = uuid();
  this.id = newId;
  this.nickname = `User-${newId}`;
  this.socket = socket;

};

server.on('connection', (socket) => {
  let user = new User(socket);
  socketPool[user.id] = user;
  socket.on('data', (buffer) => dispatchAction(user.id, buffer));

  console.log(`${user.nickname} has connected`);

  for (let person in socketPool) {
    if (socketPool[person].nickname === socketPool[user.id].nickname) {
      socketPool[user.id].socket.write(` \nyou have connected\n \n **************** \n COMMANDS: \n @all - sends a message to everyone \n @list - list all users in the chatroom \n @dm <username> - send a discrete message to one user \n @nickname <new name> - sets up a username \n @quit - exit chat \n \n **************** \n`);
    }
    else {
      socketPool[person].socket.write(`${socketPool[user.id].nickname} has joined the chat\n`);
    }
  }

});


let dispatchAction = (userId, buffer) => {
  let text = parse(buffer);
  text && eventEmitter.emit(text.atCommand, text, userId);
};

let parse = (buffer) => {
  let text = buffer.toString().trim();
  if (!text.startsWith('@')) {
    console.log(new Error('User did not use an @ command'));
    return null;
  } else {
    let [atCommand, allText] = text.split(/\s+(.*)/);

    let [who, message] = allText ? allText.split(/\s+(.*)/) : [];
    return { atCommand, allText, who, message };
  }
};


eventEmitter.on('@all', (data, userId) => {
  console.log(data);

  for (let person in socketPool) {
    let user = socketPool[person];
    user.socket.write(`[${socketPool[userId].nickname}]: ${data.allText}\n`);
  }
});

eventEmitter.on('@nickname', (data, userId) => {
  console.log(data);
  let oldName = socketPool[userId].nickname;
  socketPool[userId].nickname = data.who;

  for (let person in socketPool) {
    if (socketPool[person].nickname === socketPool[userId].nickname) {
      socketPool[userId].socket.write('your nickname is now ' + socketPool[userId].nickname + '\n');
    }
    else {
      socketPool[person].socket.write(`${oldName} changed name to ${socketPool[userId].nickname}\n`);
    }
  }
});


eventEmitter.on('@dm', (data, userId) => {
  console.log(data);
  let sendToWho;

  for (let person in socketPool) {
    if (socketPool[person].nickname === data.who) {
      sendToWho = socketPool[person].id;
    }
  }

  if (sendToWho) {
    socketPool[sendToWho].socket.write(`dm - [${socketPool[userId].nickname}]: ${data.message}\n`);
    socketPool[userId].socket.write(`dm - [${socketPool[userId].nickname}]: ${data.message}\n`);
  } else {
    socketPool[userId].socket.write(data.who + ' does not exist\n');
    console.log(new Error('user does not exist'));
  }
});

eventEmitter.on('@list', (data, userId) => {
  console.log(data);
  socketPool[userId].socket.write(`Listing all users connected:\n`);

  for (let person in socketPool) {
    if (socketPool[person].nickname === socketPool[userId].nickname) {
      socketPool[userId].socket.write(`${socketPool[person].nickname} <-- you \n`);
    } else {
      socketPool[userId].socket.write(`${socketPool[person].nickname}\n`);
    }
  }
});


eventEmitter.on('@quit', (data, userId) => {
  console.log(data);
  let user = socketPool[userId].nickname;
  socketPool[userId].socket.write(`disconnecting..\n`);
  socketPool[userId].socket.destroy();
  delete socketPool[userId];

  for (let person in socketPool) {
    socketPool[person].socket.write(`${user} has left the chat\n`);
  }

});

server.on('error', () => {
  console.log('there is an error!');

});

server.listen(PORT, () => {
  console.log(`Chat is on port ${PORT}`);
});