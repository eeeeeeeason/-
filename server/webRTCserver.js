var app = require('express')();
var express = require('express');
var http = require('http').Server(app);
var io = require('socket.io')(http);
app.use('/src',express.static('src')); //TODO: 这个/src其实跟node的启动位置有关，如若在外面一层启动则路径会发生改变！
app.get('/', function(req, res){
  res.sendFile(__dirname + '/testSignaling.html');
});
let sockList = []
io.on('connection', function(socket){
  sockList = Object.keys(io.sockets.sockets)
  console.log(socket.id)
  console.log(sockList)
  console.log(io.sockets.sockets)
  socket.send('连接成功，欢迎用户');//FIXME:似乎无法工作？，无法发送对象{status: 1,msg: '连接成功，欢迎用户'}，只能发送字符串，客户端采用默认onmessage事件触发
  socket.on('wav', function(msg){
    console.log(msg)
    io.emit('wavMsg', msg);
    // console.log(msg);
  });
  socket.on('_ice_candidate',function(msg){
    // io.emit('_ice_candidate', msg); //修改为发送给处我以外的人
    sockList.forEach(element => {
      if (element == socket.id) return;
      io.sockets.connected[element].emit('_ice_candidate', msg);
    });
    // io.sockets.sockets
  })
  socket.on('offer',function(msg){
    // io.emit('offer', msg);
    sockList.forEach(element => {
      if (element == socket.id) return;
      io.sockets.connected[element].emit('offer', msg);
    });
  })
  socket.on('answer',function(msg){
    // io.emit('answer', msg);
    sockList.forEach(element => {
      if (element == socket.id) return;
      io.sockets.connected[element].emit('answer', msg);
    });
  })
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});