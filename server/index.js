const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());

const http = require('http').Server(app);
const io = require('socket.io')(http);

let users = [];

io.sockets.on('connection', function (socket) {
  let user = {socketID: socket.id};
  users.push(user);
  console.log('---- create ' + socket.id);

  socket.on('update', function(update) {
    console.log('---- update ' + socket.id);
    Object.assign(user, update);
    io.emit('update', users);
  });

  socket.on('disconnect', function() {
    console.log('---- disconnecting ' + socket.id);
    console.log('   users: ' + users.map(u => " " + u.socketID));
    let n = users.indexOf(user);
    console.log('   n: ' + n);
    users = users.slice(0,n).concat(users.slice(n+1));
    console.log('   users after remove: ' + users.map(u => " " + u.socketID));
    io.emit('update', users);
  });

  console.log('connection established');
});

const server = http.listen(3000, function() {
    console.log('listening on *:3000');
});
