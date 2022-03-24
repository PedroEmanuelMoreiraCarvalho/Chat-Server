
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

io.on('connection', (socket) => {
  connections.push(socket)
  socket.messages = []
  var user_name = ""
  io.emit("updateOnlineUsers", connections.length)
  connections.forEach((socket)=>{
    io.to(socket.id).emit("updateMessages", socket.messages)
  })

  socket.on("message", (data) => {
    user_name = data.user
    connections.forEach((socket)=>{
      socket.messages.push(data)
    })
    connections.forEach((socket)=>{
      io.to(socket.id).emit("updateMessages", socket.messages)
    })
  });

  socket.on("disconnect",()=>{
    connections.filter((socket_con)=>{return socket_con!=socket})
    connections.forEach((socket)=>{
      socket.messages.push({author: 1, user: "server", message: `${user_name} saiu do chat`})
    })
    connections.forEach((socket)=>{
      io.to(socket.id).emit("updateMessages", socket.messages)
    })
    io.emit("updateOnlineUsers", connections.length)
  })
});


server.listen(port);