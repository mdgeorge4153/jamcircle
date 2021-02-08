
const bunyan = require('bunyan');
const logger = bunyan.createLogger({
  name: "server",
  streams: [
    { level: 'info', stream: process.stdout },
    { level: 'trace', path: 'server.log' },
  ],
});

const express = require('express');

const app = express();

const http = require('http').Server(app);
const io = require('socket.io')(http);

let users    = [];
let sequence = 0;
let chat     = [];

function update(newUsers) {
  users = newUsers;
  sequence++;
  let message = {users, sequence};
  logger.info({type: 'GLOB', users, sequence}, "updating users");
  io.emit('update', message);
}

io.sockets.on('connection', function (socket) {
  let user = {id: socket.id, username: ''};
  update(users.concat(user));

  function info(type, msg, payload) {
    logger.info({type, payload}, "[" + user.id.slice(0,5) + " (" + user.username + ")] " + msg);
  }

  socket.on('update', function(data) {
    Object.assign(user, data);
    info('NMSG', 'processing update message');
    update(users);
  });

  socket.on('cycle', function() {
    info('NMSG', 'processing cycle');
    let nextSolo = users.findIndex((user,i) => i > 0 && user.playing == "solo");
    nextSolo = nextSolo == -1 ? 1 : nextSolo;
    update(users.slice(nextSolo).concat(users.slice(0,nextSolo)));
  });

  socket.on('fast forward', function() {
    info('NMSG', 'processing ff');
    let n = users.indexOf(user);
    update(users.slice(0,n).concat(users.slice(n+1)).concat(user));
  });

  socket.on('disconnect', function() {
    info('NMSG', 'processing disconnect');
    let n = users.indexOf(user);
    update(users.slice(0,n).concat(users.slice(n+1)));
  });

  socket.on('direct message', function({recipient, ...message}) {
    info('DMSG', 'processing direct message to ' + recipient, {recipient, message});
    let msg = {senderID: user.id, ...message};
    socket.to(recipient).emit('direct message', msg);
  });

  socket.on('chat', function(message) {
    if (message == '/poll') {
      info('POLL', message);
      io.emit('poll', {});
    }
    else {
      info('CHAT', message);
      chat.push({senderID: user.id, message});
      io.emit('chat', {senderID: user.id, message});
    }
  });

  socket.on('poll_result', function(payload) {
    info('POLL', "received poll result", payload);
  });

  socket.on('log', function({message,payload}) {
    info('RLOG', message, payload);
  });

  for (let msg of chat)
    socket.emit('chat', msg);

  info('CONN', 'connection established');
});

const server = http.listen(3000, function() {
});
