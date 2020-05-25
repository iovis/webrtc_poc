const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('.'));

io.on('connection', socket => {
  console.log('connected');

  socket.on('candidate', candidate => {
    console.log('candidate');
    socket.broadcast.emit('candidate', candidate);
  });

  socket.on('sdp', sdp => {
    console.log('sdp');
    socket.broadcast.emit('sdp', sdp);
  });

  socket.on('answer', answer => {
    console.log('answer');
    socket.broadcast.emit('answer', answer);
  });
});

http.listen(3000);
