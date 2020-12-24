const express = require('express');
const app = express();

const http = require('http').Server(app);
const io = require('socket.io')(http);

let users = [];

io.sockets.on('connection', function (socket) {
  let user = {id: socket.id};
  users.push(user);
  console.log('---- create ' + socket.id);

  socket.on('update', function(update) {
    console.log('---- update ' + socket.id);
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
    console.log('---- disconnecting ' + socket.id);
    console.log('   users: ' + users.map(u => " " + u.id));
    let n = users.indexOf(user);
    console.log('   n: ' + n);
    users = users.slice(0,n).concat(users.slice(n+1));
    console.log('   users after remove: ' + users.map(u => " " + u.id));
    io.emit('update', users);
  });

  console.log('connection established');
});

const server = http.listen(3000, function() {
    console.log('listening on *:3000');
});
