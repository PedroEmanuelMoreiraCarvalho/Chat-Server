
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
var playlist = []
var next_requests = 0
var restart_requests = 0
var users_online = -1

io.on('connection', (socket) => {
  connections.push(socket)
  users_online++
  socket.messages = []
  socket.next_req = false
  socket.restart_req = false
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
  io.to(socket.id).emit("updatePlaylist", playlist)
  io.to(socket.id).emit("updateVideo",{video: playlist[0]})

  socket.on("message", (data) => {
    socket.user_name = data.user
    connections.forEach((socket)=>{
      socket.messages.push(data)
    })
    connections.forEach((socket)=>{
      io.to(socket.id).emit("updateMessages", socket.messages)
    })
  });

  socket.on("pauseHandled",() => {
    connections.forEach((_socket)=>{
      _socket.messages.push({author: 1, user: "server", message: `${socket.user_name} pausou o vídeo`})
      io.to(_socket.id).emit("updateMessages", _socket.messages)
    })
  })

  socket.on("playHandled",() => {
    connections.forEach((_socket)=>{
      _socket.messages.push({author: 1, user: "server", message: `${socket.user_name} retomou o vídeo`})
      io.to(_socket.id).emit("updateMessages", _socket.messages)
    })
  })

  socket.on("videoEnded",() => {
    next_requests=0
    connections.forEach((_socket)=>{
      _socket.next_req = false
    })

    playlist.shift()
    connections.forEach((_socket)=>{
      io.to(_socket.id).emit("updateVideo",{video: playlist[0]})
    })
    connections.forEach((socket)=>{
      io.to(socket.id).emit("updatePlaylist", playlist)
    })
  })

  socket.on("addvideo",(video) => {
    playlist.push(video.video)
    connections.forEach((socket)=>{
      io.to(socket.id).emit("updatePlaylist", playlist)
    })
    if(playlist[1]==undefined){
      connections.forEach((_socket)=>{
        io.to(_socket.id).emit("updateVideo",{video: playlist[0]})
      })
    }
  })

  socket.on("next_request",()=>{
    let req_needed_to_skip = Math.floor((users_online+1)/2)
    if(!socket.next_req){
      next_requests++
      socket.next_req = true
      connections.forEach((_socket)=>{
        _socket.messages.push({author: 1, user: "server", message: `${socket.user_name} pediu para skipar o vídeo (${next_requests}/${req_needed_to_skip})`})
        io.to(_socket.id).emit("updateMessages", _socket.messages)
      })
    }
    if(next_requests>=req_needed_to_skip){
      next_requests=0
      connections.forEach((_socket)=>{
        _socket.next_req = false
      })

      playlist.shift()
      connections.forEach((_socket)=>{
        io.to(_socket.id).emit("updateVideo",{video: playlist[0]})
      })
      connections.forEach((socket)=>{
        io.to(socket.id).emit("updatePlaylist", playlist)
      })
      connections.forEach((socket)=>{
        socket.messages.push({author: 1, user: "server", message: `vídeo skipado`})
        io.to(socket.id).emit("updateMessages", socket.messages)
      })
    }
  })

  socket.on("restart",()=>{
    let req_needed_to_restart = Math.floor((users_online+1)/2)
    if(!socket.restart_req){
      restart_requests++
      socket.restart_req = true
      connections.forEach((_socket)=>{
        _socket.messages.push({author: 1, user: "server", message: `${socket.user_name} pediu para reiniciar o vídeo (${restart_requests}/${req_needed_to_restart})`})
        io.to(_socket.id).emit("updateMessages", _socket.messages)
      })
    }
    if(restart_requests>=req_needed_to_restart){
      restart_requests=0
      connections.forEach((_socket)=>{
        _socket.restart_req = false
      })

      connections.forEach((_socket)=>{
        io.to(_socket.id).emit("updateVideo",{video: undefined})
        io.to(_socket.id).emit("updateVideo",{video: playlist[0]})
      })
      
      connections.forEach((socket)=>{
        socket.messages.push({author: 1, user: "server", message: `vídeo reiniciado`})
        io.to(socket.id).emit("updateMessages", socket.messages)
      })
    }
  })

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