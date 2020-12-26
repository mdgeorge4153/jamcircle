const express = require('express');
const app = express();

const http = require('http').Server(app);
const io = require('socket.io')(http);

let users = [];

io.sockets.on('connection', function (socket) {
  let user = {id: socket.id};
  users.push(user);

  socket.on('update', function(update) {
    Object.assign(user, update);
    io.emit('update', users);
  });

  socket.on('cycle', function() {
    let nextSolo = users.findIndex((user,i) => i > 0 && user.playing == "solo");
    nextSolo = nextSolo == -1 ? 1 : nextSolo;
    users = users.slice(nextSolo).concat(users.slice(0,nextSolo));
    io.emit('update', users);
  });

  socket.on('fast forward', function() {
  });

  socket.on('disconnect', function() {
    let n = users.indexOf(user);
    users = users.slice(0,n).concat(users.slice(n+1));
    io.emit('update', users);
  });
});

const server = http.listen(3000, function() {
});
