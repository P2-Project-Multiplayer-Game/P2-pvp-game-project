// Handles game synchronizastion beetween players

import NetworkManager from './NetworkManager.js';
import { TankCharacter } from '../gameObjects/TankCharacter.js';
import { HeroCharacter } from '../gameObjects/HeroCharacter.js';
import { ArcherCharacter } from '../gameObjects/ArcherCharacter.js';
import { NinjaCharacter } from '../gameObjects/NinjaCharacter.js';
import { SkeletonCharacter } from '../gameObjects/SkeletonCharacter.js';

export default class GameSync {
  constructor(scene, networkManager) {
    this.scene = scene;
    this.network = networkManager;
    this.localPlayer = null;
    this.remotePlayers = new Map(); // Map of player ID to player game objects
    
    // Just a demo to show we recieve player data from server
    console.log("GameSync2 created! Ready to recieve player data");
    
    // Setup network events
    this.setupEvents();
  }
  
  // Set up network event handlers
  setupEvents() {
    // Handle game joined with existing players
    this.network.on('gameJoined', (data) => {
      console.log('Joined game room:', data.roomId);
      console.log('Got these players from server:', data.players);
      
      // Get lobby players data and create remote players
      const lobbyPlayers = this.scene.registry.get('lobbyPlayers') || [];
      console.log('Processing players from lobby:', lobbyPlayers.length);

      // Track processed players to avoid duplicates
      const processedPlayers = new Set();

      // Create remote players from lobby data
      lobbyPlayers.forEach(player => {
        if (player.id === this.network.playerId) return; // Skip local player
        
        console.log(`Creating remote player: ${player.id} at (${player.x}, ${player.y})`);
        this.addRemotePlayer(player);
        processedPlayers.add(player.id);
      });
      
      // Then process any additional players from gameJoined that weren't in lobby data
      data.players.forEach(player => {
        if (player.id !== this.network.playerId && !processedPlayers.has(player.id)) {
          console.log(`Creating remote player from gameJoined: ${player.id}`);
          this.addRemotePlayer(player);
        }
      });
    });
    // Handle player updates
    this.network.on('playerUpdated', (data) => {
      //console.log(`Got update for player ${data.id}: x=${data.x}, y=${data.y}`);
      this.updateRemotePlayer(data);
    });

    // Handle new players joining
    this.network.on('playerJoined', (data) => {
      console.log(`New player joined: ${data.id} as ${data.characterType || 'unknown'}`);
      this.addRemotePlayer(data);
    });
    
    // Handle players leaving
    this.network.on('playerLeft', (data) => {
      console.log(`Player left: ${data.id}`);
      this.removeRemotePlayer(data.id);
    });

    // Listen for health updates
    this.network.on('playerHealthUpdate', (data) => {
      const remotePlayer = this.remotePlayers.get(data.id);
      if (remotePlayer) {
        remotePlayer.health = data.health;
        //console.log(`Updated remote player ${data.id} health to ${data.health}`);
        
        // If health is 0, the player is dead
        if (data.health <= 0) {
          console.log(`Remote player ${data.id} has died!`);
          // Visual indicator for defeat (optional)
          //remotePlayer.setTint(0x555555);
        }
      }
    });


    this.network.on('playerDied', (data) => {
      console.log(`Player ${data.id} has died`);
      
      // If it's the local player, don't remove them from scene
      if (data.id === this.network.playerId) {
        // Mark local player as dead
        this.localPlayer.isAlive = false;
        this.localPlayer.isDead = true;
        
        // Disable physics movement
        this.localPlayer.body.moves = false;
        
        return;
      }
      
      // For remote players, begin removal process
      const remotePlayer = this.remotePlayers.get(data.id);
      if (remotePlayer) {
        // Mark as dead
        remotePlayer.isAlive = false;
        remotePlayer.isDead = true;
        
        // The actual sprite will be destroyed by CombatManager's tween
      }
    });
    
  }
  
  // Set local player 
  setLocalPlayer(player) {
    this.localPlayer = player;
    console.log("Local player setted to:", player);
  }
  
  // Add a remote player
  addRemotePlayer(playerData) {
    // Skip if this is the local player
    if (playerData.id === this.network.playerId) {
        console.log(`Skipping local player creation: ${playerData.id}`);
        return;
    }

    // Check if remote player already exists
    if (this.remotePlayers.has(playerData.id)) {
        console.log(`Remote player ${playerData.id} already exists, skipping`);
        return;
    }

    console.log(`Creating remote player ${playerData.id} as ${playerData.characterType || 'tank'}`);
    
    // Get a random spawn point if no position provided
    let spawnX = playerData.x;
    let spawnY = playerData.y;

    if (!spawnX || !spawnY) {
      const spawnPoint = this.scene.getRandomSpawnPoint();
      spawnX = spawnPoint.x;
      spawnY = spawnPoint.y;
    }
  
    // Create the correct character type based on data from server
    let remotePlayer;
    switch (playerData.characterType) {
      case 'ninja':
        remotePlayer = new NinjaCharacter(this.scene, spawnX, spawnY);
        break;
      case 'archer':
        remotePlayer = new ArcherCharacter(this.scene, spawnX, spawnY);
        break;
      case 'hero':
        remotePlayer = new HeroCharacter(this.scene, spawnX, spawnY);
        break;
      case 'skeleton':
        remotePlayer = new SkeletonCharacter(this.scene, spawnX, spawnY);
        break;
      case 'tank':
      default:
        remotePlayer = new TankCharacter(this.scene, spawnX, spawnY);
    }

    remotePlayer.body.setAllowGravity(false);
    remotePlayer.body.moves = false; // Prevent physics from moving the player
    // Store the player ID with the game object
    remotePlayer.playerId = playerData.id;
    
    // Add visual indicator for remote players
    //remotePlayer.setTint(0xff0000);
    
    this.remotePlayers.set(playerData.id, remotePlayer);
    console.log(`Created remote player ${playerData.id} with gravity disabled`);
    // Add to map
    this.remotePlayers.set(playerData.id, remotePlayer);
    console.log(`Current remote players: ${Array.from(this.remotePlayers.keys()).join(', ')}`);
    // Setup PvP collisions - add this line
    this.scene.setupPvPCollisions();
  }
  
  // Update a remote player
  updateRemotePlayer(data) {
    // Skip if we're shutting down
    if (this.isShuttingDown) return;
    
    const remotePlayer = this.remotePlayers.get(data.id);
    
    if (!remotePlayer) {
        console.log(`Can't update player ${data.id} because they don't exist. Players in map: ${Array.from(this.remotePlayers.keys()).join(', ')}`);
        return;
    }
    
    // Update players position
    remotePlayer.x = data.x;
    remotePlayer.y = data.y;

    // Skip animation updates if shutting down or animations not available
    if (data.animation && remotePlayer.animationKeys && remotePlayer.anims && remotePlayer.active) {
        const animKey = remotePlayer.animationKeys[data.animation];
        if (animKey && remotePlayer.anims.exists(animKey)) {
            remotePlayer.anims.play(animKey, true);
        }
    }
    // Just logging to demonstrate its working
    //console.log(`Updated remote player ${data.id} to position x=${data.x}, y=${data.y}`);

    // Update cooldown states
    if (data.attack1OnCooldown !== undefined) {
        remotePlayer.attack1OnCooldown = data.attack1OnCooldown;
    }
    if (data.attack2OnCooldown !== undefined) {
        remotePlayer.attack2OnCooldown = data.attack2OnCooldown;
    } 

    // Store previous flipX state to detect changes
    const wasFlipped = remotePlayer.flipX;
    
    // Update facing direction
    if (data.facing === 'left') {
      remotePlayer.flipX = true;
    } else if (data.facing === 'right') {
      remotePlayer.flipX = false;
    }
    
    // If flipX changed, manually call the character's update method
    // This will trigger the offset logic in the character class
    if (wasFlipped !== remotePlayer.flipX) {
      remotePlayer.update();
    }

    // Direct animation playing instead of state machine transition
    if (data.animation) {
      if (remotePlayer.animationKeys && remotePlayer.animationKeys[data.animation]) {
        remotePlayer.anims.play(remotePlayer.animationKeys[data.animation], true);
      }
    }
  }
  
  // Remove a remote player
  removeRemotePlayer(playerId) {
    const player = this.remotePlayers.get(playerId);
    if (player) {
      player.destroy();
      this.remotePlayers.delete(playerId);
      console.log(`Removed remote player ${playerId}`);
    }
  }
  // Updates the server with local player state
  update() {

    // Skip if shutting down or no local player
    if (this.isShuttingDown || !this.localPlayer || !this.network || 
        !this.network.connected || this.localPlayer.isDead || this.network.isTransitioning) {
        return;
    }
    
    // Skip if no local player or not connected
    if (!this.localPlayer || !this.network || !this.network.connected || this.localPlayer.isDead) {
      return;
    }
    
    const currentState = this.localPlayer.stateMachine.currentState;
    let animation = 'turn';
    let facing = this.localPlayer.flipX ? 'left' : 'right';

    // Map state machine states to animations
    switch (currentState) {
      case 'IDLE': animation = 'turn'; break;
      case 'MOVE_LEFT': animation = 'left'; break;
      case 'MOVE_RIGHT': animation = 'right'; break;
      case 'JUMP': animation = 'jump'; break;
      case 'ATTACK': animation = 'attack'; break;
      case 'ATTACK2': animation = 'attack2'; break;
      case 'HURT': animation = 'hurt'; break;
    }

    // Send update to server
    this.network.sendPlayerUpdate(
      this.localPlayer.x,
      this.localPlayer.y,
      {
        animation,
        facing,
        player: this.localPlayer
      }
    );
  }
}