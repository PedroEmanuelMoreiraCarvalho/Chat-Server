
const app = require('express')();
const server = require('http').createServer(app);
const ws = require('ws')
const parser = require("socket.io-msgpack-parser");
const port  = process.env.PORT || 8000;
const io = require('socket.io')(server,{
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  wsEngine: ws.Server,
  parser
});

var connections = []
var users_online = -1

io.on('connection', (socket) => {
  connections.push(socket)
  users_online++
  socket.messages = []
  socket.user_name = "Alguém"
  connections.forEach((_socket)=>{
    if(_socket!=socket)
    _socket.messages.push({author: 1, user: "server", message: `${socket.user_name} entrou no chat`})
  })
  io.emit("updateOnlineUsers", users_online)
  connections.forEach((_socket)=>{
    if(_socket!=socket)
    io.to(_socket.id).emit("updateMessages", _socket.messages)
  })

  socket.on("message", (data) => {
    socket.user_name = data.user
    connections.forEach((socket)=>{
      socket.messages.push(data)
    })
    connections.forEach((socket)=>{
      io.to(socket.id).emit("updateMessages", socket.messages)
    })
  });

  socket.on("typing",()=>{
    usertyping = socket.user_name
    connections.forEach((_socket)=>{
      if(_socket!=socket)
      io.to(_socket.id).emit("someoneTyping",{user: usertyping})
    })
  });

  socket.on("disconnect",()=>{
    users_online--
    connections.forEach((_socket)=>{
      _socket.messages.push({author: 1, user: "server", message: `${socket.user_name} saiu do chat`})
    })
    connections.forEach((socket)=>{
      io.to(socket.id).emit("updateMessages", socket.messages)
    })
    connections.filter((socket_con)=>{return socket_con!=socket})
    io.emit("updateOnlineUsers", users_online)
  })
});


server.listen(port);