export default class HealthDisplayManager {
    constructor(scene, gameSync, networkManager) {
        this.scene = scene;
        this.gameSync = gameSync;
        this.network = networkManager;
        this.healthDisplays = new Map(); // Maps playerId -> text object
        this.corners = [
            { x: 20, y: 0, origin: { x: 0, y: 0 } },           // Top left
            { x: this.scene.scale.width - 20, y: 0, origin: { x: 1, y: 0 } },            // Top right
            { x: 20, y: this.scene.scale.height - 5, origin: { x: 0, y: 1 } },           // Bottom left
            { x: this.scene.scale.width / 2, y: this.scene.scale.height - 5, origin: { x: 0.5, y: 1 } }, // Bottom center (5th player)
            { x: this.scene.scale.width - 20, y: this.scene.scale.height - 5, origin: { x: 1, y: 1 } }  // Bottom right
        ];
        this.usedCorners = new Map(); // Maps playerId -> corner index
        
        this.setup();
    }

    setup() {
        // Create health display for local player
        this.createHealthDisplay(this.network.playerId, this.gameSync.localPlayer);
        
        // Create health displays for existing remote players
        this.gameSync.remotePlayers.forEach((player, playerId) => {
            this.createHealthDisplay(playerId, player);
        });
        
        // Listen for health updates
        this.network.on('playerHealthUpdate', (data) => {
            this.updateHealthDisplay(data.id, data.health);
        });
        
        // Listen for player hits (for local player health updates)
        this.network.on('playerHit', (data) => {
            if (data.targetId === this.network.playerId) {
                // Local player was hit, update their display after a short delay
                // to ensure health is updated first
                setTimeout(() => {
                    this.updateHealthDisplay(this.network.playerId, this.gameSync.localPlayer.health);
                }, 50);
            }
        });
        
        // Listen for new players joining
        this.network.on('playerJoined', (data) => {
            setTimeout(() => {
                const player = this.gameSync.remotePlayers.get(data.id);
                if (player) {
                    this.createHealthDisplay(data.id, player);
                }
            }, 200); // Short delay to ensure player is added to gameSync
        });
        // event listener for gameJoined event
        this.network.on('gameJoined', (data) => {
            console.log('Initializing health displays for existing players:', data.players);
            
            // Create health displays for all players in the room
            data.players.forEach(playerData => {
                // Skip if this is the local player 
                if (playerData.id === this.network.playerId) {
                    return;
                }
                
                // Get the player object from gameSync
                const remotePlayer = this.gameSync.remotePlayers.get(playerData.id);
                if (remotePlayer) {
                    // Create health display for this existing player
                    this.createHealthDisplay(playerData.id, remotePlayer);
                    
                    // Update the health to match server data
                    if (playerData.health !== undefined) {
                        this.updateHealthDisplay(playerData.id, playerData.health);
                    }
                }
            });
        });
        // Listen for players leaving
        this.network.on('playerLeft', (data) => {
            this.removeHealthDisplay(data.id);
        });
    }

    createHealthDisplay(playerId, player) {
        // Skip if display already exists
        if (this.healthDisplays.has(playerId)) return;
        
        // Find an unused corner
        let cornerIndex = this.getNextAvailableCorner();
        const corner = this.corners[cornerIndex];
        this.usedCorners.set(playerId, cornerIndex);
        
        // Create player label with simplified format
        const isLocalPlayer = playerId === this.network.playerId;
        let initialText;
        if (isLocalPlayer) {
            initialText = `You ${player.characterType}: ${player.health || 100}/${player.maxHealth || 100} HP`;
        } else {
            initialText = `${player.characterType}: ${player.health || 100}/${player.maxHealth || 100} HP`;
        }
        
        // Create text object
        const text = this.scene.add.text(
            corner.x, 
            corner.y, 
            initialText,
            {
                fontFamily: 'Arial',
                fontSize: 22,
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4
            }
        )
        .setOrigin(corner.origin.x, corner.origin.y)
        .setDepth(10)
        .setScrollFactor(0); // Keep fixed on screen during camera movement
        
        this.healthDisplays.set(playerId, text);

        // Always update display immediately to set the correct color based on health
        this.updateHealthDisplay(playerId, player.health || 100);
    
        
        // If this is a new display for an existing player, ensure it shows correct health
        if (player.health !== undefined && player.health !== 100) {
            this.updateHealthDisplay(playerId, player.health);
        }
    }

    updateHealthDisplay(playerId, health) {
        const display = this.healthDisplays.get(playerId);
        if (!display) return;
        
        // Get player object
        let player;
        if (playerId === this.network.playerId) {
            player = this.gameSync.localPlayer;
        } else {
            player = this.gameSync.remotePlayers.get(playerId);
        }
        
        if (!player) return;
        
        // Calculate health percentage relative to max health
        const maxHealth = player.maxHealth || 100;
        const healthPercent = (health / maxHealth) * 100;
        
        // Update text with simplified format
        const isLocalPlayer = playerId === this.network.playerId;
        if (isLocalPlayer) {
            display.setText(`You ${player.characterType}: ${health}/${maxHealth} HP`);
        } else {
            display.setText(`${player.characterType}: ${health}/${maxHealth} HP`);
        }
        
        // Update color based on health percentage (same for all players)
        if (healthPercent > 60) {
            display.setColor('#00ff00'); // Green for everyone above 60%
        } else if (healthPercent > 30) {
            display.setColor('#ffa500'); // Orange for everyone between 30-60%
        } else {
            display.setColor('#ff0000'); // Red for everyone below 30%
        }
        
        // Make local player text bold to distinguish it
        if (isLocalPlayer) {
            display.setFontStyle('bold');
        } else {
            display.setFontStyle('normal');
        }
    }

    removeHealthDisplay(playerId) {
        const display = this.healthDisplays.get(playerId);
        if (display) {
            display.destroy();
            this.healthDisplays.delete(playerId);
            this.usedCorners.delete(playerId);
        }
    }

    getNextAvailableCorner() {
        // Find first unused corner
        for (let i = 0; i < this.corners.length; i++) {
            let used = false;
            for (const cornerIndex of this.usedCorners.values()) {
                if (cornerIndex === i) {
                    used = true;
                    break;
                }
            }
            if (!used) return i;
        }
        // If all corners are used, return the first corner
        return 0;
    }

    update() {
        // Update local player's health display every frame
        // (useful for health changes not triggered by network events)
        if (this.gameSync.localPlayer) {
            this.updateHealthDisplay(
                this.network.playerId, 
                this.gameSync.localPlayer.health
            );
        }
    }
}