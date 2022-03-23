
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

var connections = -1
var messages = []

setInterval(()=>{
  messages = []
},1800000)

io.on('connection', (socket) => {
  connections++
  console.log("conectado")
  io.emit("updateOnlineUsers", connections)
  io.emit("updateMessages", messages)

  socket.on("message", (data) => {
    messages.push(data)
    io.emit("updateMessages", messages)
  });

  socket.on("disconnect",()=>{
    connections--
    io.emit("updateOnlineUsers", connections)
  })
});


server.listen(port);
