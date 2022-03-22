
const app = require('express')();
const server = require('http').createServer(app);
const port  = process.env.PORT || 8000;
const io = require('socket.io')(server,{
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }}
);

app.get("/",(req,res)=>{
  res.send("Server Chat Workind!!")
});

io.on('connection', (socket) => {
  console.log("usuario conectado",socket.id);
  socket.on('message', (data) => {
    io.emit('updateMessages', data)
  });
});

server.listen(port);
