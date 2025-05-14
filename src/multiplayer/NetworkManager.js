// client side Socket.IO code
export default class NetworkManager {
  constructor() {
    this.socket = null;
    this.playerId = null;
    this.connected = false;
    this.eventListeners = {};
    this.roomId = null;

    this.currentScene = null;
    this.sceneSpecificEvents = {
      'Lobby': ['lobbyStatusUpdate', 'playerReadyState', 'gameJoined','gameCountdownStart', 'gameCountdownStop'],
      'Game': ['playerUpdated', 'playerHealthUpdate']
    };
  }

  // Add this method to set the current scene
  setCurrentScene(sceneName) {
    console.log(`NetworkManager: Setting current scene to ${sceneName}`);
    this.currentScene = sceneName;
  }

  //Connect to the server
  connect() {
    return new Promise((resolve, reject) => {
      try {
        // Connect to server
        this.socket = io();
        
        // Set up connection handlers
        // listens/confirms the succesfulnes of the connection in the broweser console 
        this.socket.on('connect', () => {
          this.connected = true;
          console.log('Connected to server');
        });

        //listener for a custom 'connected' event given by server.js
        this.socket.on('connected', (data) => {
          this.playerId = data.id;
          console.log('Assigned player ID:', this.playerId);
          resolve(data); // finnally oficcialy confirms a seccesfull connection 
          
        });

        // error logging 
        this.socket.on('connect_error', (error) => {
          console.error('Connection error:', error);
          reject(error);
        });

        // clean dissconation
        this.socket.on('disconnect', () => {
          this.connected = false;
          console.log('Disconnected from server');
        });

        this.socket.on('lobby_status_update', (data) => {
          console.log('Received lobby status update:', data);
          this.triggerEvent('lobbyStatusUpdate', data);
        });

        this.socket.on('player_ready_state', (data) => {
          console.log(`Player ${data.id} ready state changed to: ${data.isReady}`);
          this.triggerEvent('playerReadyState', data);
        });

        this.socket.on('game_countdown_start', (data) => {
          console.log('Game countdown started:', data.countdown);
          this.triggerEvent('gameCountdownStart', data);
        });
        
        this.socket.on('game_countdown_stop', () => {
          console.log('Game countdown stopped');
          this.triggerEvent('gameCountdownStop');
        });

        this.socket.on('game_start', (data) => {
          console.log('Game starting with players:', data.players.length);
          this.triggerEvent('gameStart', data);
        });
        // creates game joint event withe the gelp og triggerEvent
        this.socket.on('game_joined', (data) => {
          this.roomId = data.roomId;
          console.log(`Joined room: ${this.roomId}`);
          this.triggerEvent('gameJoined', data);
        });  

        // event listener for player_updated
        this.socket.on('player_updated', (data) => {
          this.triggerEvent('playerUpdated', data);
        });

        // event for player joined
        this.socket.on('player_joined', (data) => {
          console.log(`Player joined: ${data.id}`);
          this.triggerEvent('playerJoined', data);
        });

        //event for player left
        this.socket.on('player_left', (data) => {
          console.log(`Player left: ${data.id}`);
          this.triggerEvent('playerLeft', data);
        });

        // player health update listener
        this.socket.on('player_health_update', (data) => {
          //console.log(`Received health update for player ${data.id}: health=${data.health}`);
          this.triggerEvent('playerHealthUpdate', data);
        });

        // listener and event trigger for player hit
        this.socket.on('player_hit', (data) => {
          //console.log(`Received player hit: ${data.attackerId} hit ${data.targetId} for ${data.damage} damage`);
          this.triggerEvent('playerHit', data);
        });

        //listener for shockwave events
        this.socket.on('shockwave_created', (data) => {
          //console.log('Received shockwave_created event:', data);
          this.triggerEvent('shockwaveCreated', data);
        });

        this.socket.on('shockwave_destroyed', (data) => {
          //console.log('Received shockwave_destroyed event:', data);
          this.triggerEvent('shockwaveDestroyed', data);
        });

        //listener for herowave events
        this.socket.on('herowave_created', (data) => {
          //console.log('Received herowave_created event:', data);
          this.triggerEvent('herowaveCreated', data);
        });

        this.socket.on('herowave_destroyed', (data) => {
          //console.log('Received herowave_destroyed event:', data);
          this.triggerEvent('herowaveDestroyed', data);
        });

        //listener for arrow events
        this.socket.on('arrow_created', (data) => {
          //console.log('Received arrow_created event:', data);
          this.triggerEvent('arrowCreated', data);
        });

        this.socket.on('arrow_destroyed', (data) => {
          //console.log('Received arrow_destroyed event:', data);
          this.triggerEvent('arrowDestroyed', data);
        });
        //listener for ninjawave events
        this.socket.on('ninjawave_created', (data) => {
          //console.log('Received ninjawave_created event:', data);
          this.triggerEvent('ninjawaveCreated', data);
        });

        this.socket.on('ninjawave_destroyed', (data) => {
          //console.log('Received ninjawave_destroyed event:', data);
          this.triggerEvent('ninjawaveDestroyed', data);
        });

        //listener for fireball events
        this.socket.on('fireball_created', (data) => {
          //console.log('Received fireball_created event:', data);
          this.triggerEvent('fireballCreated', data);
        });

        this.socket.on('fireball_destroyed', (data) => {
          //console.log('Received fireball_destroyed event:', data);
          this.triggerEvent('fireballDestroyed', data);
        });

        this.socket.on('player_died', (data) => {
          console.log('Received player_died event:', data);
          this.triggerEvent('playerDied', data);
        });

        this.socket.on('game_over', (data) => {
          console.log('Received game_over event:', data);
          this.triggerEvent('gameOver', data);
        });
        // responsible for catching any errors such as connect_error in the try block
      } catch (error) {
        console.error('Failed to connect:', error);
        reject(error); // returns the promise as failed
      }
    });
  }
  
  //Register event listener, so that other game parts can lsiten to network events 
  //This allows other game components to listen to network events
  //without directly interacting with Socket.IO
  on(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }
  // properly cleaning up event listeners when switching scenes
  setCurrentScene(sceneName) {
    console.log(`NetworkManager: Transitioning from ${this.currentScene || 'none'} to ${sceneName}`);
    
    // Clean up previous scene's event listeners
    if (this.currentScene && this.currentScene !== sceneName) {
      // Get array of events for the previous scene
      const eventsToCleanup = this.sceneSpecificEvents[this.currentScene] || [];
      
      if (eventsToCleanup.length > 0) {
        console.log(`Cleaning up ${eventsToCleanup.length} event listeners from ${this.currentScene} scene`);
        
        // Clear each event listener for the previous scene
        eventsToCleanup.forEach(eventName => {
          if (this.eventListeners[eventName]) {
            console.log(`Clearing all listeners for ${eventName}`);
            this.eventListeners[eventName] = [];
          }
        });
      }
    }
    
    this.currentScene = sceneName;
  }
    // scene-aware triggerEvent 
  triggerEvent(event, data) {
    const callbacks = this.eventListeners[event];
    if (!callbacks) return;

    // Check if this is a scene-specific event
    let isSceneSpecificEvent = false;
    let targetScene = null;
    
    // Find which scene this event belongs to
    for (const [scene, events] of Object.entries(this.sceneSpecificEvents)) {
      if (events.includes(event)) {
        isSceneSpecificEvent = true;
        targetScene = scene;
        break;
      }
    }

    // If it's scene-specific but not for the current scene, skip it
    if (isSceneSpecificEvent && targetScene !== this.currentScene) {
      console.log(`Skipping event ${event} because we're in ${this.currentScene || 'unknown'} scene, not ${targetScene}`);
      return;
    }

    // If not scene-specific or is for the current scene, trigger it
    callbacks.forEach(callback => callback(data));
  }
  
  // Disconnect from the server
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
  //send Initial player data
  //called once after conection to set up player in gamelobby
  joinGame(playerData) {
    if (!this.connected) return;
    
    // Geting the character type from Game scene
    const characterType = playerData.characterType || 'tank';
    
    this.socket.emit('join_game', {
      x: playerData.x,
      y: playerData.y,
      characterType: characterType,
      health: playerData.health || 100
    });
  }

  syncPlayerPosition(playerData) {
    if (!this.connected) return;
    
    //send a position update instead off rejoining the game
    this.sendPlayerUpdate(
      playerData.x,
      playerData.y,
      {
        animation: 'turn',
        facing: 'right',
        player: {
          characterType: playerData.characterType,
          health: playerData.health,
          attack1OnCooldown: false,
          attack2OnCooldown: false
        }
      }
    );
  }

  sendPlayerReadyToggle(isReady) {
    if (!this.connected) return;
    this.socket.emit('player_ready_toggle', { isReady });
  }
  //Send player position update where x and y is the player position adn the extras is for animation and direction facing
  sendPlayerUpdate(x, y, extras = {}) {
    if (!this.connected) return;

    // Get cooldown states from the local player
    const localPlayer = extras.player;

    const data = {
      x,
      y,
      attack1OnCooldown: localPlayer?.attack1OnCooldown || false,
      attack2OnCooldown: localPlayer?.attack2OnCooldown || false,
      ...extras
    };
    // debug purpose
    //console.log('Sending player update:', data);
    // emmits the message of player_update for server.js 
    this.socket.emit('player_update', data);
  }
    sendPlayerHit(targetId, damage) {
    if (!this.connected) return;
    this.socket.emit('player_hit', {
      targetId: targetId,
      damage: damage
    });
  }
  
  sendPlayerDied(killedBy) {
    if (!this.connected) return;
    this.socket.emit('player_died', { killedBy });
  }
  
  sendShockwaveCreated(x, y, direction) {
    if (!this.connected) return;
    this.socket.emit('shockwave_created', { x, y, direction });
  }
  
  sendHerowaveCreated(x, y, direction) {
    if (!this.connected) return;
    this.socket.emit('herowave_created', { x, y, direction });
  }
  
  sendArrowCreated(x, y, direction) {
    if (!this.connected) return;
    this.socket.emit('arrow_created', { x, y, direction });
  }
  
  sendNinjawaveCreated(x, y, direction) {
    if (!this.connected) return;
    this.socket.emit('ninjawave_created', { x, y, direction });
  }
  
  sendFireballCreated(x, y, direction, positions) {
    if (!this.connected) return;
    this.socket.emit('fireball_created', { x, y, direction, positions });
  }

  sendShockwaveDestroyed(id) {
    if (!this.connected) return;
    this.socket.emit('shockwave_destroyed', { id });
  }
  sendHerowaveDestroyed(id) {
    if (!this.connected) return;
    this.socket.emit('herowave_destroyed', { id });
  }
  sendArrowDestroyed(id) {
    if (!this.connected) return;
    this.socket.emit('arrow_destroyed', { id });
  }
  sendNinjawaveDestroyed(id) {
    if (!this.connected) return;
    this.socket.emit('ninjawave_destroyed', { id });
  }
  sendFireballDestroyed(id) {
    if (!this.connected) return;
    this.socket.emit('fireball_destroyed', { id });
  }
}