
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

var messages = []

setInterval(()=>{
  messages = []
},1800000)

io.on('connection', (socket) => {
  console.log("usuario conectado",socket.id);
  socket.on("message", (data) => {
    io.emit('updateMessages', messages)
  });
});


server.listen(port);