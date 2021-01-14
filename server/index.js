const express = require('express');
const app = express();

const http = require('http').Server(app);
const io = require('socket.io')(http);

let users    = [];
let sequence = 0;

function update(newUsers) {
  users = newUsers;
  sequence++;
  let message = {users, sequence};
  console.log("sending update message: ", message);
  io.emit('update', message);
}

io.sockets.on('connection', function (socket) {
  let user = {id: socket.id};
  update(users.concat(user));

  socket.on('update', function(data) {
    console.log('processing update');
    Object.assign(user, data);
    update(users);
  });

  socket.on('cycle', function() {
    console.log('processing cycle');
    let nextSolo = users.findIndex((user,i) => i > 0 && user.playing == "solo");
    nextSolo = nextSolo == -1 ? 1 : nextSolo;
    update(users.slice(nextSolo).concat(users.slice(0,nextSolo)));
  });

  socket.on('fast forward', function() {
    console.log('processing ff');
  });

  socket.on('disconnect', function() {
    console.log('processing disconnect');
    let n = users.indexOf(user);
    update(users.slice(0,n).concat(users.slice(n+1)));
  });

  socket.on('direct message', function({recipient, ...message}) {
    console.log('processing direct message');
    let msg = {senderID: user.id, ...message};
    socket.to(recipient).emit('direct message', msg);
  });

  socket.on('chat', function(message) {
    console.log("chat message from ", user.id, ": ", message);
    io.emit('chat', {senderID: user.id, message});
  });

  console.log('connection');
});

const server = http.listen(3000, function() {
});
