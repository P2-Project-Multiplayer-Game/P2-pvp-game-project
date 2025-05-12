var express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3001;
const RoomManager = require('./server/LobbyManager');
const LobbyManager = require('./server/LobbyManager');

//module.exports = { io, server };

// giving directionory forfiles that the server can utilize a
app.use(express.static(__dirname));
app.use('/src', express.static(__dirname + '/src'));
app.use('/assets', express.static(__dirname + '/assets'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Initialize room manager
const roomManager = new LobbyManager();
// Track players in rooms
const players = new Map();

// Socket.IO conecttion handling - this runs when a client connects
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Send player their ID
  socket.emit('connected', { id: socket.id });

  // Handle player joining game
  socket.on('join_game', (playerData) => {
    // all players join the default room as defined in the lobbyManager
    const roomId = roomManager.getDefaultRoom();
    socket.join(roomId);
    
    // Store player data with character type in the players map
    const player = {
      id: socket.id,
      x: playerData.x || 100,
      y: playerData.y || 100,
      roomId: roomId,
      characterType: playerData.characterType || 'tank',
      health: playerData.health || 100  
    };
    
    players.set(socket.id, player);
    console.log(`Player ${socket.id} joined room ${roomId} as ${player.characterType}`);

    // TODO: Notify other players in the same room that a new player has joined
    // This is probably neede to allow GameSync to create player instances
    // Notify other players in the same room that a new player has joined
    socket.to(roomId).emit('player_joined', player);

    socket.to(roomId).emit('player_health_update', {
      id: socket.id,
      health: player.health
    });
    // Handle player movement/states updates
    socket.on('player_update', (data) => {
      const player = players.get(socket.id);
      if (player) {
        //for console logging putposes
        // console.log(`Player ${socket.id} update: x=${data.x}, y=${data.y}, animation=${data.animation || 'none'}`);
        // Updates player states with the received data from networkmanager
        if (data.x !== undefined) player.x = data.x;
        if (data.y !== undefined) player.y = data.y;
        if (data.animation !== undefined) player.animation = data.animation;
        if (data.facing !== undefined) player.facing = data.facing;
        
        // Broadcast to other players in the same lobby
        socket.to(player.roomId).emit('player_updated', {
          id: socket.id,
          x: player.x,
          y: player.y,
          animation: player.animation,
          facing: player.facing
        });
      }
    });
    // succefull join notification
    socket.emit('game_joined', {
      roomId: roomId,
      players: Array.from(players.values())
        .filter(p => p.roomId === roomId)
    });
  });
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);

    // notify others when a player leaves
    const player = players.get(socket.id);
    if (player && player.roomId) {
      socket.to(player.roomId).emit('player_left', { id: socket.id });
    }
    // Remove player from tracking
    players.delete(socket.id);
  });

  socket.on('player_hit', (data) => {
    // validate hit 
    const attacker = players.get(socket.id);
    const target = players.get(data.targetId);
    
    if (attacker && target && target.roomId === attacker.roomId) {
      // Calculate new health
      if (!target.health) target.health = 100; // Default health if not set
      target.health = Math.max(0, target.health - data.damage);
      
      // broadcast the hit to all players in room
      io.to(attacker.roomId).emit('player_hit', {
        attackerId: socket.id,
        targetId: data.targetId,
        damage: data.damage,
        knockback: data.knockback || 0 // Pass knockback info, default to 0
      });
      
      // Also broadcast the updated health
      io.to(attacker.roomId).emit('player_health_update', {
        id: data.targetId,
        health: target.health
      });
      
      console.log(`Player ${socket.id} hit player ${data.targetId} for ${data.damage} damage. Health now: ${target.health}`);
    }
  });

  socket.on('shockwave_created', (data) => {
    const player = players.get(socket.id);
    
    if (player) {
      // broadcast shockwave to other players in same room
      socket.to(player.roomId).emit('shockwave_created', {
        playerId: socket.id,
        x: data.x,
        y: data.y,
        direction: data.direction
      });
      
      console.log(`Player ${socket.id} created shockwave facing ${data.direction}`)
    }
  });

  socket.on('shockwave_destroyed', (data) => {
    const player = players.get(socket.id);
    if (player) {
      // Broadcast destruction to all clients in room
      io.to(player.roomId).emit('shockwave_destroyed', {
        playerId: socket.id,
        id: data.id
      });
    }
  });
  
  socket.on('herowave_created', (data) => {
    const player = players.get(socket.id);
    
    if (player) {
      // broadcast herowave to other players in same room
      socket.to(player.roomId).emit('herowave_created', {
        playerId: socket.id,
        x: data.x,
        y: data.y,
        direction: data.direction
      });
      
      console.log(`Player ${socket.id} created herowave facing ${data.direction}`)
    }
  });

  socket.on('herowave_destroyed', (data) => {
    const player = players.get(socket.id);
    if (player) {
      // Broadcast destruction to all clients in room
      io.to(player.roomId).emit('herowave_destroyed', {
        playerId: socket.id,
        id: data.id
      });
    }
  });
  socket.on('arrow_created', (data) => {
    const player = players.get(socket.id);
    
    if (player) {
      // broadcast arrow to other players in same room
      socket.to(player.roomId).emit('arrow_created', {
        playerId: socket.id,
        x: data.x,
        y: data.y,
        direction: data.direction
      });
      
      console.log(`Player ${socket.id} created arrow facing ${data.direction}`)
    }
  });

  socket.on('arrow_destroyed', (data) => {
    const player = players.get(socket.id);
    if (player) {
      // Broadcast destruction to all clients in room
      socket.to(player.roomId).emit('arrow_destroyed', {
        playerId: socket.id,
        id: data.id
      });
    }
  });


  socket.on('ninjawave_created', (data) => {
    const player = players.get(socket.id);
    
    if (player) {
      // broadcast ninjawave to other players in same room
      socket.to(player.roomId).emit('ninjawave_created', {
        playerId: socket.id,
        x: data.x,
        y: data.y,
        direction: data.direction
      });
      
      console.log(`Player ${socket.id} created ninjawave facing ${data.direction}`)
    }
  });

  socket.on('ninjawave_destroyed', (data) => {
    const player = players.get(socket.id);
    if (player) {
      // Broadcast destruction to all clients in room
      io.to(player.roomId).emit('ninjawave_destroyed', {
        playerId: socket.id,
        id: data.id
      });
    }
  });

  socket.on('fireball_created', (data) => {
      const player = players.get(socket.id);
      
      if (player) {
          // broadcast fireball to other players in same room with positions
          socket.to(player.roomId).emit('fireball_created', {
              playerId: socket.id,
              x: data.x,
              y: data.y,
              direction: data.direction,
              positions: data.positions // Include the positions array
          });
          
          console.log(`Player ${socket.id} created fireball facing ${data.direction} with positions:`, data.positions);
      }
  });

  socket.on('fireball_destroyed', (data) => {
    const player = players.get(socket.id);
    if (player) {
      // Broadcast destruction to all clients in room
      io.to(player.roomId).emit('fireball_destroyed', {
        playerId: socket.id,
        id: data.id
      });
    }
  });
});

// Server initiation
http.listen(port, () => {
    console.log(`Socket.IO server running on port ${port}`);
    console.log(`Access at http://130.225.37.31:${port}/`);
});

/* Socket.IO docs

socket.emit('message', "this is a test"); //sending to sender-client only

socket.broadcast.emit('message', "this is a test"); //sending to all clients except sender

socket.broadcast.to('game').emit('message', 'nice game'); //sending to all clients in 'game' room(channel) except sender

socket.to('game').emit('message', 'enjoy the game'); //sending to sender client, only if they are in 'game' room(channel)

socket.broadcast.to(socketid).emit('message', 'for your eyes only'); //sending to individual socketid

io.emit('message', "this is a test"); //sending to all clients, include sender

io.in('game').emit('message', 'cool game'); //sending to all clients in 'game' room(channel), include sender

io.of('myNamespace').emit('message', 'gg'); //sending to all clients in namespace 'myNamespace', include sender

socket.emit(); //send to all connected clients

socket.broadcast.emit(); //send to all connected clients except the one that sent the message

socket.on(); //event listener, can be called on client to execute on server

io.sockets.socket(); //for emiting to specific clients

io.sockets.emit(); //send to all connected clients (same as socket.emit)

io.sockets.on() ; //initial connection from a client.

*/