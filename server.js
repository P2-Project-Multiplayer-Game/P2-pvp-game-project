var express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3001;
const LobbyManager = require('./server/LobbyManager');
process.on('warning', e => { // stack overflaww debug
  console.warn('⚠️ MEMORY LEAK WARNING:');
  console.warn(e.stack);
  console.warn('----------------------');
});
//module.exports = { io, server };
const CharacterLogger = require('./server/CharacterLogger');
const characterLogger = new CharacterLogger();

// giving directionory forfiles that the server can utilize a
app.use(express.static(__dirname));
app.use('/src', express.static(__dirname + '/src'));
app.use('/assets', express.static(__dirname + '/assets'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Initialize room manager
const lobbyManager = new LobbyManager();
// Track players in rooms
const players = new Map();
const matchStartTimes = new Map();
const countdownTimers = new Map();

let connectionCount = 0;
io.engine.on("connection", (socket) => {
  connectionCount++;
  console.log(`Active connections: ${connectionCount}`);
  socket.on("close", () => connectionCount--);
});

// Add spawn points 
const spawnPoints = [
  { x: 85, y: 510 },  // Left side floor
  { x: 745, y: 510 },  // Right side floor
  { x: 421, y: 413 },  // Middle  down platform
  { x: 65, y: 290 }, // Middle Left Shelf
  { x: 750, y: 290 }, // Middle Right Shelf
  { x: 425, y: 100 },  // Upper Middle top platform
  { x: 118, y: 100 }   // Upper  Left top Shelf
];
//list of used spawned points
const usedSpawnPoints = [];

function getRandomSpawnPoint() {
  // Filter out already used spawn points
  const availablePoints = spawnPoints.filter(
    point => !usedSpawnPoints.some(used => 
      used.x === point.x && used.y === point.y
    )
  );
  
  // If all spawn points are used, reset and use any
  if (availablePoints.length === 0) {
    usedSpawnPoints.length = 0; // Clear array
    const randomPoint = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
    usedSpawnPoints.push(randomPoint);
    return randomPoint;
  }
  
  // Get random available point
  const randomPoint = availablePoints[Math.floor(Math.random() * availablePoints.length)];
  usedSpawnPoints.push(randomPoint);
  return randomPoint;
}

// Socket.IO conecttion handling - this runs when a client connects
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Send player their ID
  socket.emit('connected', { id: socket.id });
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
      if (data.attack1OnCooldown !== undefined) player.attack1OnCooldown = data.attack1OnCooldown;
      if (data.attack2OnCooldown !== undefined) player.attack2OnCooldown = data.attack2OnCooldown;
      // Broadcast to other players in the same lobby
      socket.to(player.roomId).emit('player_updated', {
        id: socket.id,
        x: player.x,
        y: player.y,
        animation: player.animation,
        facing: player.facing,
        attack1OnCooldown: player.attack1OnCooldown,
        attack2OnCooldown: player.attack2OnCooldown
      });
    }
  });
  // Handle player joining game
  socket.on('join_game', (playerData) => {
    // all players join the default room as defined in the lobbyManager
    const roomId = lobbyManager.getDefaultRoom();
    socket.join(roomId);
    
    // Store player data with character type in the players map
    const player = {
      id: socket.id,
      x: playerData.x || 100,
      y: playerData.y || 100,
      roomId: roomId,
      characterType: playerData.characterType || 'tank',
      health: playerData.health || 100,
      isAlive: true,  
      rank: null,
      damageDealt: 0, 
      kills: [], 
      isReady: false      
    };
    
    players.set(socket.id, player);
    console.log(`Player ${socket.id} joined room ${roomId} as ${player.characterType}`);

    // Add player to lobby manager
    lobbyManager.addPlayer(roomId, socket.id, player);

    // Notify other players in the same room that a new player has joined
    socket.to(roomId).emit('player_joined', player);

    // Send current lobby status to all players
    io.to(roomId).emit('lobby_status_update', lobbyManager.getLobbyStatus(roomId));
    
    socket.to(roomId).emit('player_health_update', {
      id: socket.id,
      health: player.health
    });

    // succefull join notification
    socket.emit('game_joined', {
      roomId: roomId,
      players: Array.from(players.values())
        .filter(p => p.roomId === roomId)
    });
  });

  // Handle player ready state toggle
  socket.on('player_ready_toggle', (data) => {
    const player = players.get(socket.id);
    if (!player) return;
    
    // Update ready state in both players map and lobby manager
    player.isReady = data.isReady;
    players.set(socket.id, player);
    
    // Update in lobby manager
    lobbyManager.setPlayerReady(player.roomId, socket.id, data.isReady);
    
    console.log(`Player ${socket.id} is ${data.isReady ? 'ready' : 'not ready'}`);
    
    // Get updated lobby status
    const lobbyStatus = lobbyManager.getLobbyStatus(player.roomId);
    console.log(`Lobby status after ready toggle: ${lobbyStatus.playersReady}/${lobbyStatus.totalPlayers} ready`);
    
    // Broadcast updated player ready state to all players in the room
    io.to(player.roomId).emit('player_ready_state', {
      id: socket.id,
      isReady: data.isReady
    });
    
    // Send updated lobby status
    io.to(player.roomId).emit('lobby_status_update', lobbyManager.getLobbyStatus(player.roomId));

    // If player unreadies, cancel countdown
    if (!data.isReady) {
      if (countdownTimers.has(player.roomId)) {
        clearTimeout(countdownTimers.get(player.roomId));
        countdownTimers.delete(player.roomId);
        io.to(player.roomId).emit('game_countdown_stop');
        console.log(`Countdown stopped in room ${player.roomId}`);
      }
      return;
    }

    // Check if all players are ready to start the game
    if (lobbyManager.areAllPlayersReady(player.roomId)) {
      console.log(`All players in room ${player.roomId} are ready. Starting game...`);
      
      // Mark game as started in lobby manager
      lobbyManager.setGameStarted(player.roomId, true);

      const countdownValue = 3;

      // Start game countdown
      io.to(player.roomId).emit('game_countdown_start', { countdown: 3 });
      
      // Wait 3 seconds then actually start the game
      const timerId = setTimeout(() => {
        // Clear used spawn points for fresh game
        usedSpawnPoints.length = 0;
        // Record match start time for this room
        matchStartTimes.set(player.roomId, Date.now());
        console.log(`Match in room ${player.roomId} started at ${new Date().toISOString()}`);
        // Get all current players in the room and assign spawn points
        const roomPlayers = Array.from(players.values())
          .filter(p => p.roomId === player.roomId)
          .map(p => {
            const spawnPoint = getRandomSpawnPoint();
            // Update player position server-side
            p.x = spawnPoint.x;
            p.y = spawnPoint.y;
            return {...p, fromLobby: true};
          });
        
        io.to(player.roomId).emit('game_start', {
          players: roomPlayers
        });
      }, countdownValue * 1000);
      countdownTimers.set(player.roomId, timerId);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);

    // notify others when a player leaves
    const player = players.get(socket.id);
    if (player && player.roomId) {
      socket.to(player.roomId).emit('player_left', { id: socket.id });
      // Remove from lobby manager
      lobbyManager.removePlayer(player.roomId, socket.id);
      
      // Update lobby status
      io.to(player.roomId).emit('lobby_status_update', 
        lobbyManager.getLobbyStatus(player.roomId));
    }
    // Remove player from tracking
    players.delete(socket.id);
  });

  socket.on('player_hit', (data) => {
    // validate hit 
    const attacker = players.get(socket.id);
    const target = players.get(data.targetId);
    
    if (attacker && target && target.roomId === attacker.roomId) {
      // Calculate new health and actual damage dealt
      if (!target.health) target.health = 100; // Default health if not set
      
      // Calculate effective damage (can't be more than current health)
      const effectiveDamage = Math.min(target.health, data.damage);
      
      // Update target health
      target.health = Math.max(0, target.health - data.damage);
      
      // Track damage dealt by attacker (only count effective damage)
      attacker.damageDealt = (attacker.damageDealt || 0) + effectiveDamage;
      console.log(`Player ${socket.id} has dealt ${attacker.damageDealt} total damage`);

      // broadcast the hit to all players in room
      io.to(attacker.roomId).emit('player_hit', {
        attackerId: socket.id,
        targetId: data.targetId,
        damage: data.damage
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
  
  // handler for player death, the event comes from combat manager.  
  socket.on('player_died', (data) => {
    const player = players.get(socket.id);
    if (player && player.isAlive) {
      console.log(`Player ${socket.id} has died, killed by ${data.killedBy}`);
      
      // Mark player as dead
      player.isAlive = false;
      // Register kill for the killer
      const killer = players.get(data.killedBy);
      if (killer) {
        // Add kill information with timestamp
        killer.kills = killer.kills || [];
        killer.kills.push({
          victimId: socket.id,
          victimType: player.characterType,
          timestamp: Date.now()
        });
        console.log(`Player ${data.killedBy} now has ${killer.kills.length} kills`);
      }
      
      // Calculate rankings - Traditional podium style (1st is winner, higher numbers = worse)
      const roomPlayers = Array.from(players.values()).filter(p => p.roomId === player.roomId);
      const aliveCount = roomPlayers.filter(p => p.isAlive).length;
      
      // Player rank is based on elimination order (first to die = worst rank)
      player.rank = aliveCount + 1;

      // Broadcast death to everyone in the room
      io.to(player.roomId).emit('player_died', {
        id: socket.id,
        killedBy: data.killedBy,
        rank: player.rank
      });
      
      // Check if game is over (only one player left alive)
      if (aliveCount <= 1) {
        const lastPlayerStanding = roomPlayers.find(p => p.isAlive);
        
        // If there's a winner, ensure they get rank 1
        if (lastPlayerStanding) {
          lastPlayerStanding.rank = 1;
        }
        // Calculate match duration
        let matchDuration = 0;
        const matchStartTime = matchStartTimes.get(player.roomId);
        if (matchStartTime) {
          matchDuration = Date.now() - matchStartTime;
          matchStartTimes.delete(player.roomId); // Clean up
          console.log(`Match in room ${player.roomId} lasted ${Math.floor(matchDuration/1000)} seconds`);
        }
        // Create final rankings sorted by rank (1st, 2nd, 3rd...)
        const finalRankings = roomPlayers
          .sort((a, b) => a.rank - b.rank) // Sort ascending by rank (1st, 2nd, 3rd...)
          .map(p => ({
            id: p.id,
            characterType: p.characterType,
            rank: p.rank,
            damageDealt: p.damageDealt || 0  ,
            kills: p.kills || []
          }));

        // Log match data to CSV file
        const matchLogPath = characterLogger.logMatch({
          rankings: finalRankings,
          matchDuration: matchDuration
        });
        console.log(`Game statistics logged to ${matchLogPath}`);

        // Send game over event with rankings
        io.to(player.roomId).emit('game_over', {
          winner: lastPlayerStanding ? lastPlayerStanding.id : null,
          rankings: finalRankings,
          matchDuration: matchDuration // Time in milliseconds
        });
      }
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