var app = require('express')();
var express = require('express');
var http = require('http').Server(app);
var io = require('socket.io')(http);
app.use('/src',express.static('/src'));
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  socket.send({status: 1,msg: '连接成功，欢迎用户'});
  socket.on('chat message', function(msg){
  io.emit('chat message', msg);
  console.log('message: ' + msg);
});
  socket.on('wav', function(msg){
    console.log(msg)
    io.emit('wavMsg', msg);
    // console.log(msg);
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});