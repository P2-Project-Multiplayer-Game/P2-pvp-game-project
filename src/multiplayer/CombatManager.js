export default class CombatManager { 
  constructor(scene, gameSync, networkManager) {
    this.scene = scene;
    this.gameSync = gameSync;
    this.network = networkManager;
    this.isShuttingDown = false;
    this.setupEvents();
  }

  setupEvents() {
    // Use the NetworkManager event system consistently
    this.network.on('playerHit', (data) => {
      this.handlePlayerHit(data);
    });

    this.network.on('shockwaveCreated', (data) => {
      this.handleRemoteShockwave(data);
    });

    this.network.on('shockwaveDestroyed', (data) => {
      this.handleRemoteShockwaveDestroyed(data);
    });

    this.network.on('herowaveCreated', (data) => {
      this.handleRemoteHerowave(data);
    });

    this.network.on('herowaveDestroyed', (data) => {
      this.handleRemoteHerowaveDestroyed(data);
    });

    this.network.on('arrowCreated', (data) => {
      this.handleRemoteArrow(data);
    });

    this.network.on('arrowDestroyed', (data) => {
      this.handleRemoteArrowDestroyed(data);
    });

    this.network.on('ninjawaveCreated', (data) => {
      this.handleRemoteNinjawave(data);
    });

    this.network.on('ninjawaveDestroyed', (data) => {
      this.handleRemoteNinjawaveDestroyed(data);
    });   

    this.network.on('fireballCreated', (data) => {
      this.handleRemoteFireball(data);
    });

    this.network.on('fireballDestroyed', (data) => {
      this.handleRemoteFireballDestroyed(data);
    });
    
    this.network.on('playerDied', (data) => {
      this.handlePlayerDeath(data);
    });
  }

  // Register hit using NetworkManager instead of direct socket access
  registerHit(attacker, target, damage) {
    if (target.playerId) {
      this.network.sendPlayerHit(target.playerId, damage);
    }
    console.log(`Hit registered: ${attacker.characterType} hit ${target.playerId || 'dummy'} for ${damage} damage`);
  }

  // Register shockwave using NetworkManager
  registerShockwave() {
    if (!this.gameSync.localPlayer) return;
    
    const player = this.gameSync.localPlayer;
    this.network.sendShockwaveCreated(
      player.x, 
      player.y, 
      player.flipX ? 'left' : 'right'
    );
    
    console.log("Sent shockwave creation event to server");
  }

  registerHerowave() {
    if (!this.gameSync.localPlayer) return;
    
    const player = this.gameSync.localPlayer;
    this.network.sendHerowaveCreated(
      player.x, 
      player.y, 
      player.flipX ? 'left' : 'right'
    );
    
    console.log("Sent herowave creation event to server");
  }

  registerArrow() {
    if (!this.gameSync.localPlayer) return;
    
    const player = this.gameSync.localPlayer;
    this.network.sendArrowCreated(
      player.x, 
      player.y, 
      player.flipX ? 'left' : 'right'
    );
    
    console.log("Sent arrow creation event to server");
  }

  registerNinjawave() {
    if (!this.gameSync.localPlayer) return;
    
    const player = this.gameSync.localPlayer;
    this.network.sendNinjawaveCreated(
      player.x, 
      player.y, 
      player.flipX ? 'left' : 'right'
    );
    
    console.log("Sent ninjawave creation event to server");
  }

  registerFireball(positions) {
    if (!this.gameSync.localPlayer) return;
    
    const player = this.gameSync.localPlayer;
    this.network.sendFireballCreated(
      player.x, 
      player.y, 
      player.flipX ? 'left' : 'right',
      positions
    );
    
    console.log("Sent fireball creation event to server with positions:", positions);
  }

  // Handle player hit logic
  handlePlayerHit(data) {
    if (this.isShuttingDown) return;
    // Find target player
    let targetPlayer;
    if (data.targetId === this.network.playerId) {
      targetPlayer = this.gameSync.localPlayer;
    } else {
      targetPlayer = this.gameSync.remotePlayers.get(data.targetId);
    }
  
    if (targetPlayer) {
      // Apply damage
      targetPlayer.health = Math.max(0, targetPlayer.health - data.damage);
      
      if (!targetPlayer.isInvincible) {
        if (targetPlayer === this.gameSync.localPlayer) {
          // For local player, use state machine
          targetPlayer.stateMachine.transition('HURT');
        } else {
          // For remote players, send animation update through the standard network update system
          // This will be processed by the regular animation pipeline already in place
          targetPlayer.anims.play(targetPlayer.animationKeys.hurt, true);
        }
      }
  
      //console.log(`Player ${data.targetId} took ${data.damage} damage, health now: ${targetPlayer.health}`);
      
      // Handle player death if health reaches 0
      if (targetPlayer.health <= 0) {
        console.log(`Player ${data.targetId} has died!`);
        
        if (targetPlayer === this.gameSync.localPlayer) {
          // Use NetworkManager for death notification
          this.network.sendPlayerDied(data.attackerId);
          console.log(`Player ${data.targetId} was killed by ${data.attackerId}`);
        }
      }
    }
  }

  // creates shockwave for remote player
  handleRemoteShockwave(data) {
    if (this.isShuttingDown) return;
    console.log('Handling remote shockwave creation from player:', data.playerId);
    
    const remotePlayer = this.gameSync.remotePlayers.get(data.playerId);
    
    if (!remotePlayer) {
      console.log(`Can't create shockwave: Player ${data.playerId} not found`);
      return;
    }
    
    // Set player direction based on data from server before creating shockwave
    if (data.direction === 'left') {
      remotePlayer.flipX = true;
    } else if (data.direction === 'right') {
      remotePlayer.flipX = false;
    }
    
    console.log(`Creating shockwave for remote player ${data.playerId} (${remotePlayer.characterType}) facing ${data.direction}`);
    
    if (remotePlayer.characterType === 'tank') {
      remotePlayer.createShockwave();
      console.log(`Remote shockwave created successfully at (${remotePlayer.x}, ${remotePlayer.y})`);
    }
  }

  handleRemoteShockwaveDestroyed(data) {
    const remotePlayer = this.gameSync.remotePlayers.get(data.playerId);
    if (remotePlayer && remotePlayer.shockwave) {
      remotePlayer.destroyShockwave();
    }
  }
  
  // handle remote herowave creation
  handleRemoteHerowave(data) {
    if (this.isShuttingDown) return;
    console.log('Handling remote herowave creation from player:', data.playerId);
    
    const remotePlayer = this.gameSync.remotePlayers.get(data.playerId);
    
    if (!remotePlayer) {
      console.log(`Can't create herowave: Player ${data.playerId} not found`);
      return;
    }
    
    // Set player direction based on data from server before creating herowave
    if (data.direction === 'left') {
      remotePlayer.flipX = true;
    } else if (data.direction === 'right') {
      remotePlayer.flipX = false;
    }
    
    console.log(`Creating herowave for remote player ${data.playerId} (${remotePlayer.characterType}) facing ${data.direction}`);
    
    if (remotePlayer.characterType === 'hero') {
      remotePlayer.createHerowave();
      console.log(`Remote herowave created successfully at (${remotePlayer.x}, ${remotePlayer.y})`);
    }
  }

  handleRemoteHerowaveDestroyed(data) {
    if (this.isShuttingDown) return;
    const remotePlayer = this.gameSync.remotePlayers.get(data.playerId);
    if (remotePlayer && remotePlayer.herowave) {
      remotePlayer.destroyHerowave();
    }
  }

  // handle remote arrows
  handleRemoteArrow(data) {
    if (this.isShuttingDown) return;
    console.log('Handling remote arrow creation from player:', data.playerId);
    
    const remotePlayer = this.gameSync.remotePlayers.get(data.playerId);
    
    if (!remotePlayer) {
      console.log(`Can't create arrow: Player ${data.playerId} not found`);
      return;
    }
    
    // Set player direction based on data from server before creating arrow
    if (data.direction === 'left') {
      remotePlayer.flipX = true;
    } else if (data.direction === 'right') {
      remotePlayer.flipX = false;
    }
    /*
    // Force position update before creating arrow if provided
    if (data.x && data.y) {
      remotePlayer.x = data.x;
      remotePlayer.y = data.y;
    }
    */
    console.log(`Creating arrow for remote player ${data.playerId} (${remotePlayer.characterType}) facing ${data.direction}`);
    
    if (remotePlayer.characterType === 'archer') {
      // Add small delay to ensure positioning is correct
      this.scene.time.delayedCall(10, () => {
        remotePlayer.createArrow();
        console.log(`Remote arrow created successfully at (${remotePlayer.x}, ${remotePlayer.y})`);
      });
    }
  }
  // Generic damage handler that all collision handlers can use
  handleCollisionDamage(attacker, target, damage, isLocalEvent = false) {
    if (this.isShuttingDown) return;
    // Skip invincible targets
    if (target.isInvincible) return;
    
    if (attacker === this.gameSync.localPlayer && target.playerId) {
      // Network damage (send to server)
      this.registerHit(attacker, target, damage);
    } else if (!target.playerId || isLocalEvent) {
      // Local damage (dummy targets or local processing)
      this.applyLocalDamage(target, damage);
    }
  }

  // Apply damage locally (for dummy targets or local effects)
  applyLocalDamage(target, damage) {
    target.health = Math.max(0, target.health - damage);
    
    if (target.health <= 0) {
      this.handleEntityDeath(target);
    }
  }

  // Handle death
  handleEntityDeath(entity) {
    if (entity.isDead) return;
    
    entity.isDead = true;
    this.scene.playersRanking.push(entity);
    
    // Visual effects
    this.scene.tweens.add({
      targets: entity,
      alpha: 0,
      y: entity.y - 50,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => {
        if (entity.destroy) entity.destroy();
      }
    });
  }
  
  handleRemoteArrowDestroyed(data) {
    const remotePlayer = this.gameSync.remotePlayers.get(data.playerId);
    if (remotePlayer && remotePlayer.arrow) {
      remotePlayer.destroyArrow();
    }
  }

  // handle remote ninjawave creation
  handleRemoteNinjawave(data) {
    if (this.isShuttingDown) return;
    console.log('Handling remote ninjawave creation from player:', data.playerId);
    
    const remotePlayer = this.gameSync.remotePlayers.get(data.playerId);
    
    if (!remotePlayer) {
      console.log(`Can't create ninjawave: Player ${data.playerId} not found`);
      return;
    }
    
    // Set player direction based on data from server before creating ninjawave
    if (data.direction === 'left') {
      remotePlayer.flipX = true;
    } else if (data.direction === 'right') {
      remotePlayer.flipX = false;
    }
    
    console.log(`Creating ninjawave for remote player ${data.playerId} (${remotePlayer.characterType}) facing ${data.direction}`);
    
    if (remotePlayer.characterType === 'ninja') {
      remotePlayer.createNinjawave();
      console.log(`Remote ninjawave created successfully at (${remotePlayer.x}, ${remotePlayer.y})`);
    }
  }

  handleRemoteNinjawaveDestroyed(data) {
    const remotePlayer = this.gameSync.remotePlayers.get(data.playerId);
    if (remotePlayer && remotePlayer.ninjawave) {
      remotePlayer.destroyNinjawave();
    }
  }

  // handle remote fireball creation
  handleRemoteFireball(data) {
    if (this.isShuttingDown) return;
      console.log('Handling remote fireball creation from player:', data.playerId);
      
      const remotePlayer = this.gameSync.remotePlayers.get(data.playerId);
      
      if (!remotePlayer) {
          console.log(`Can't create fireball: Player ${data.playerId} not found`);
          return;
      }
      
      // Set player direction based on data from server
      if (data.direction === 'left') {
          remotePlayer.flipX = true;
      } else if (data.direction === 'right') {
          remotePlayer.flipX = false;
      }
      
      console.log(`Creating fireball for remote player ${data.playerId} with positions:`, data.positions);
      
      if (remotePlayer.characterType === 'skeleton') {
          // Pass the positions to createFireball
          remotePlayer.createFireball(data.positions);
      }
  }

  handleRemoteFireballDestroyed(data) {
    const remotePlayer = this.gameSync.remotePlayers.get(data.playerId);
    if (remotePlayer && remotePlayer.fireball) {
      remotePlayer.destroyFireball();
    }
  }

  handlePlayerDeath(data) {
    if (this.isShuttingDown) return;
    // Get the player who died
    let deadPlayer;
    if (data.id === this.network.playerId) {
      deadPlayer = this.gameSync.localPlayer;
      console.log('You have died!');
      
      // Mark player as dead
      deadPlayer.isDead = true;
      
      // Completely disable physics for dead local player
      deadPlayer.body.moves = false;
      deadPlayer.body.enable = false;
      
      // For local player, signal UI manager to show death UI
      this.scene.events.emit('playerDeath', { 
        local: true,
        id: data.id,
        rank: data.rank
      });
    } else {
      // Remote player died
      deadPlayer = this.gameSync.remotePlayers.get(data.id);
      console.log(`Player ${data.id} has died!`);
      
      if (deadPlayer) {
        // Mark remote player as dead
        deadPlayer.isDead = true;
        deadPlayer.isAlive = false;
        if (deadPlayer.body) {
          deadPlayer.body.enable = false;
        }
        this.scene.events.emit('playerDeath', {
          local: false,
          id: data.id,
          rank: data.rank
        });
      }
    }
    
    if (deadPlayer) {
      // Store player's rank for game over screen
      deadPlayer.rank = data.rank;
      deadPlayer.isAlive = false;  // Keep this for compatibility with existing code
      
      // Add death visual effect
      this.scene.tweens.add({
        targets: deadPlayer,
        alpha: 0,
        y: deadPlayer.y - 50,
        duration: 1000,
        ease: 'Power2',
        onComplete: () => {
          // Add player to scene's playersRanking array
          if (!this.scene.playersRanking.includes(deadPlayer)) {
            this.scene.playersRanking.push(deadPlayer);
          }
        }
      });
    }
  }
}