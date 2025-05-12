export default class CombatManager { 
  constructor(scene, gameSync, networkManager) {
    this.scene = scene;
    this.gameSync = gameSync;
    this.network = networkManager;
    this.setupEvents();
    // im adding this class to handle combat sync between players
  }

  setupEvents() {
    // listen for hit events from NetworManager
    this.network.on('playerHit', (data) => {
        this.handlePlayerHit(data);
    });

    // Use the NetworkManager event system
    this.network.on('shockwaveCreated', (data) => {
        this.handleRemoteShockwave(data);
    });

    this.network.on('shockwaveDestroyed', (data) => {
      this.handleRemoteShockwaveDestroyed(data);
    });

    // Listen for herowave created events
    this.network.on('herowaveCreated', (data) => {
      this.handleRemoteHerowave(data);
    });

    this.network.on('herowaveDestroyed', (data) => {
      this.handleRemoteHerowaveDestroyed(data);
    });

    // Listen for arrow created events
    this.network.on('arrowCreated', (data) => {
      this.handleRemoteArrow(data);
    });

    this.network.on('arrowDestroyed', (data) => {
      this.handleRemoteArrowDestroyed(data);
    });

    // Listen for ninjawave created events
    this.network.on('ninjawaveCreated', (data) => {
      this.handleRemoteNinjawave(data);
    });

    this.network.on('ninjawaveDestroyed', (data) => {
      this.handleRemoteNinjawaveDestroyed(data);
    });   

    // Listen for fireball created events
    this.network.on('fireballCreated', (data) => {
      this.handleRemoteFireball(data);
    });

    this.network.on('fireballDestroyed', (data) => {
      this.handleRemoteFireballDestroyed(data);
    });
  }

  // this is called when local player hits somone
  registerHit(attacker, target, damage) {
    // only send hit if target is a player with id
    if (target.playerId) {
      // Calculate knockback if the attacker has projectileKnockback
      let knockback = 0;
      if (attacker.projectileKnockback > 0) {
        const knockbackDirection = attacker.x > target.x ? -1 : 1;
        knockback = attacker.projectileKnockback * knockbackDirection;
      }
    
      this.network.socket.emit('player_hit', {
        targetId: target.playerId,
        damage: damage,
        knockback: knockback //send the knockback value
      });
    }
    
    // for debugin purposes
    console.log(`Hit registered: ${attacker.characterType} hit ${target.playerId || 'dummy'} for ${damage} damage`);
  }

  // called when local player creates shockwave
  registerShockwave() {
    if (!this.gameSync.localPlayer) return;
    
    this.network.socket.emit('shockwave_created', {
      x: this.gameSync.localPlayer.x,
      y: this.gameSync.localPlayer.y,
      direction: this.gameSync.localPlayer.flipX ? 'left' : 'right'
    });
    
    // debug log
    console.log("Sent shockwave creation event to server");
  }

  registerHerowave() {
    if (!this.gameSync.localPlayer) return;
    
    this.network.socket.emit('herowave_created', {
      x: this.gameSync.localPlayer.x,
      y: this.gameSync.localPlayer.y,
      direction: this.gameSync.localPlayer.flipX ? 'left' : 'right'
    });
    
    // debug log
    console.log("Sent herowave creation event to server");
  }

  // method for arrow registration
  registerArrow() {
    if (!this.gameSync.localPlayer) return;
    
    this.network.socket.emit('arrow_created', {
      x: this.gameSync.localPlayer.x,
      y: this.gameSync.localPlayer.y,
      direction: this.gameSync.localPlayer.flipX ? 'left' : 'right'
    });
    
    console.log("Sent arrow creation event to server");
  }

  registerNinjawave() {
    if (!this.gameSync.localPlayer) return;
    
    this.network.socket.emit('ninjawave_created', {
      x: this.gameSync.localPlayer.x,
      y: this.gameSync.localPlayer.y,
      direction: this.gameSync.localPlayer.flipX ? 'left' : 'right'
    });
    
    // debug log
    console.log("Sent ninjawave creation event to server");
  }

  registerFireball(positions) {
      if (!this.gameSync.localPlayer) return;
      
      this.network.socket.emit('fireball_created', {
          x: this.gameSync.localPlayer.x,
          y: this.gameSync.localPlayer.y,
          direction: this.gameSync.localPlayer.flipX ? 'left' : 'right',
          positions: positions // Add the positions array
      });
      
      console.log("Sent fireball creation event to server with positions:", positions);
  }
  // handels hit confermation from server
  handlePlayerHit(data) {
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
      // Apply knockback for local player only (where physics works)
      if (data.knockback) {
        if (targetPlayer === this.gameSync.localPlayer) {
          // Local player - use physics
          targetPlayer.setVelocityX(data.knockback);
          targetPlayer.setVelocityY(-50);
        } else {
          // Remote player - simulate knockback visually using tweens
          this.scene.tweens.add({
            targets: targetPlayer,
            x: targetPlayer.x + (data.knockback * 0.5), // Scale down the effect for visual consistency
            duration: 300,
            ease: 'Power2'
          });
        }
      }
      
      if (!targetPlayer.isInvincible) {
        if (targetPlayer === this.gameSync.localPlayer) {
          // For local player, use state machine
          targetPlayer.stateMachine.transition('HURT');
        } else {
          // For remote players, send animation update through the standard network update system
          // This will be processed by the regular animation pipeline already in place
          targetPlayer.anims.play(targetPlayer.animationKeys.hurt, true);
        }
        /*
        // Flash effect helps provide immediate visual feedback
        this.scene.tweens.add({
          targets: targetPlayer,
          alpha: 0.5,
          duration: 100,
          yoyo: true,
          repeat: 3
        });
        */
      }
  
      console.log(`Player ${data.targetId} took ${data.damage} damage, health now: ${targetPlayer.health}`);
      
      // Handle player death if health reaches 0
      if (targetPlayer.health <= 0) {
        console.log(`Player ${data.targetId} has died!`);
        
        // If this is the local player who died
        if (targetPlayer === this.gameSync.localPlayer) {
          // Notify server about death
          this.network.socket.emit('player_died', { 
            killedBy: data.attackerId 
          });
          console.log(`Player ${data.targetId} was killed by ${data.attackerId } `);
          // Visual indicator for defeat
          //targetPlayer.setTint(0x555555);
        }
      }
    }
  }


  // creates shockwave for remote player
  handleRemoteShockwave(data) {
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
    const remotePlayer = this.gameSync.remotePlayers.get(data.playerId);
    if (remotePlayer && remotePlayer.herowave) {
      remotePlayer.destroyHerowave();
    }
  }

  // handle remote arrows
  handleRemoteArrow(data) {
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
  
  handleRemoteArrowDestroyed(data) {
    const remotePlayer = this.gameSync.remotePlayers.get(data.playerId);
    if (remotePlayer && remotePlayer.arrow) {
      remotePlayer.destroyArrow();
    }
  }

  // handle remote ninjawave creation
  handleRemoteNinjawave(data) {
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
}