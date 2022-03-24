
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
var messages = []

setInterval(()=>{
  messages = []
  connections.forEach((socket)=>{
    socket.begin = 0
  })
  connections.forEach((socket)=>{
    io.to(socket.id).emit("updateMessages", messages.slice(socket.begin))
  })
},1800000)

io.on('connection', (socket) => {
  connections.push(socket)
  const begin = messages.length
  socket.begin = begin
  var user_name = ""
  io.emit("updateOnlineUsers", connections.length-1)
  connections.forEach((socket)=>{
    io.to(socket.id).emit("updateMessages", messages.slice(socket.begin))
  })

  socket.on("message", (data) => {
    messages.push(data)
    user_name = data.user
    connections.forEach((socket)=>{
      io.to(socket.id).emit("updateMessages", messages.slice(socket.begin))
    })
  });

  socket.on("disconnect",()=>{
    connections.pop(socket)
    messages.push({author: 1, user: "server", message: `${user_name} saiu do chat`})
    connections.forEach((socket)=>{
      io.to(socket.id).emit("updateMessages", messages.slice(socket.begin))
    })
    io.emit("updateOnlineUsers", connections.length-1)
  })
});


server.listen(port);
