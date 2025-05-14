import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../config.js';
export default class LobbyUIManager {
    constructor(scene, networkManager) {
        this.scene = scene;
        this.network = networkManager;
        this.playerDisplays = new Map();
        this.boundEventHandlers = new Map(); // Store references to event handlers
        this.setupEvents();
    }

    setupEvents() {
        this.network.on('lobby_status_update', (data) => {
            this.updateLobbyStatus(data);
        });
        
        this.network.on('player_ready_state', (data) => {
            this.updatePlayerReadyState(data);
        });
        
        this.network.on('playerJoined', (data) => {
            this.addPlayerToLobby(data);
        });
        
        this.network.on('playerLeft', (data) => {
            this.removePlayerFromLobby(data.id);
        });
        
        this.network.on('game_countdown_start', (data) => {
            this.startCountdown(data.countdown);
        });

        // Initial player data for already present players
        this.network.on('gameJoined', (data) => {
            /*
            console.log('Game joined event received with players:', data.players.length);
            
            // Process all players except self when we join
            const remotePlayers = data.players.filter(p => p.id !== this.network.playerId);
            console.log('Remote players to add:', remotePlayers.length);
            
            // Add each player individually 
            remotePlayers.forEach(player => {
                // Make sure the player has the required data
                if (!player.characterType) {
                    console.warn('Missing characterType for player in gameJoined:', player.id);
                    player.characterType = 'tank';
                }
                this.addPlayerToLobby(player);
            });
            
            // Update lobby status with initial values
            this.updateLobbyStatus({
                totalPlayers: data.players.length,
                playersReady: data.players.filter(p => p.isReady).length
            });
            */
            this.initializeLobbyPlayers(data.players);
        });
    }

    // Implementation methods

    updateLobbyStatus(data) {
        // Store the values in the scene for reference
        this.scene.totalPlayers = data.totalPlayers;
        this.scene.readyPlayers = data.playersReady;
        // Update the ready status text
        this.scene.readyStatusText.setText(`${data.playersReady} out of ${data.totalPlayers} players ready`);
        
        // Log for debugging
        console.log(`Lobby status updated: ${data.playersReady} out of ${data.totalPlayers} players ready`);
    }

    startCountdown(countdown) {
        console.log('Game countdown started:', countdown);
        
        // Create countdown text if it doesn't exist already
        if (!this.scene.countdownText) {
            this.scene.countdownText = this.scene.add.text(
                SCREEN_WIDTH / 2,
                SCREEN_HEIGHT * 0.26, // Position below ready status text
                `Starting in ${countdown}...`,
                {
                    fontSize: '28px',
                    fontFamily: 'monoSpace',
                    color: '#FF9900',  // Orange color to stand out
                    stroke: '#000000',
                    strokeThickness: 4
                }
            ).setOrigin(0.5).setDepth(2);
            
            // Add pulsing effect
            this.scene.tweens.add({
                targets: this.scene.countdownText,
                scale: { from: 1, to: 1.2 },
                duration: 800,
                yoyo: true,
                repeat: -1
            });
        } else {
            // Update existing text
            this.scene.countdownText.setText(`Starting in ${countdown}...`);
        }
        
        // Update the countdown number each second
        let currentCount = countdown;
        
        // Clear any existing countdown timer
        if (this.countdownTimer) {
            this.scene.time.removeEvent(this.countdownTimer);
        }
        
        this.countdownTimer = this.scene.time.addEvent({
            delay: 1000,
            callback: () => {
                currentCount--;
                if (currentCount > 0) {
                    this.scene.countdownText.setText(`Starting in ${currentCount}...`);
                } else {
                    this.scene.countdownText.setText('GO!');
                }
            },
            repeat: countdown - 1
        });
    }

    initializeLobbyPlayers(players) {
        // Skip local player
        const remotePlayers = players.filter(p => p.id !== this.network.playerId);
        
        // Add each remote player to display
        remotePlayers.forEach(player => {
            this.addPlayerToLobby(player);
        });
        
        // Update lobby status with initial values
        this.updateLobbyStatus({
            totalPlayers: players.length,
            playersReady: players.filter(p => p.isReady).length
        });
    }

    updatePlayerReadyState(data) {
        // If this is the local player, update our sprite
        if (data.id === this.network.playerId) {
            this.scene.isReady = data.isReady;
            
            // Update the text prompt
            this.scene.readyPromptText.setText(data.isReady ? 'Press ENTER to cancel' : 'Press ENTER to ready up');
            
            // Update character tint
            if (data.isReady) {
                this.scene.characterSprite.setTint(0x00ff00);
            } else {
                this.scene.characterSprite.clearTint();
            }
        } else {
            // If it's a remote player, update their display
            const playerDisplay = this.playerDisplays.get(data.id);
            if (playerDisplay) {
                if (data.isReady) {
                    playerDisplay.sprite.setTint(0x00ff00);
                } else {
                    playerDisplay.sprite.clearTint();
                }
            }
        }
    }

    
    removePlayerFromLobby(playerId) {
        if (this.playerDisplays.has(playerId)) {
            const display = this.playerDisplays.get(playerId);
            if (display.sprite) display.sprite.destroy();
            if (display.text) display.text.destroy();
            this.playerDisplays.delete(playerId);
        }
    }

    addPlayerToLobby(playerData) {
        // Skip if this is the local player or player already exists
        if (playerData.id === this.network.playerId || this.playerDisplays.has(playerData.id)) {
            return;
        }
        
        // Character data matching the same format used in Lobby.js
        const characterData = {
            'tank': {
                textureKey: 'tank_idle',
                animKey: 'tank_turn',
                name: 'Tank'
            },
            'ninja': {
                textureKey: 'ninja_idle',
                animKey: 'ninja_turn',
                name: 'Ninja'
            },
            'hero': {
                textureKey: 'hero_idle',
                animKey: 'hero_turn',
                name: 'Hero'
            },
            'archer': {
                textureKey: 'archer_idle',
                animKey: 'archer_turn',
                name: 'Archer'
            },
            'skeleton': {
                textureKey: 'skeleton_idle',
                animKey: 'skeleton_turn',
                name: 'Skeleton'
            }
        };

        // Get character data for this player
        const data = characterData[playerData.characterType] || characterData.tank;
        
        // Create character sprite for this remote player
        const sprite = this.scene.add.sprite(
            0, // Position will be set by repositionAllPlayers
            SCREEN_HEIGHT * 0.72,
            data.textureKey
        )
        .setScale(2.5)
        .setOrigin(0.5);
        
        // Play idle animation
        sprite.play(data.animKey);
        
        // Add character name
        const nameText = this.scene.add.text(
            0, // Position will be set by repositionAllPlayers
            SCREEN_HEIGHT * 0.85,
            data.name,
            {
                fontSize: '28px',
                fontFamily: 'monoSpace',
                fontStyle: 'bold',
                color: '#CFAF82',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5);
        
        // Apply ready state if player is already ready
        if (playerData.isReady) {
            sprite.setTint(0x00ff00);
        }
        
        // Store the display objects
        this.playerDisplays.set(playerData.id, {
            sprite: sprite,
            text: nameText,
            characterType: playerData.characterType
        });
        
        console.log(`Added remote player ${playerData.id} to lobby display as ${playerData.characterType}`);
        
        // Reposition all players
        this.repositionAllPlayers();
    }

    removePlayerFromLobby(playerId) {
        if (this.playerDisplays.has(playerId)) {
            const display = this.playerDisplays.get(playerId);
            if (display.sprite) display.sprite.destroy();
            if (display.text) display.text.destroy();
            this.playerDisplays.delete(playerId);
            
            // Reposition remaining players
            this.repositionAllPlayers();
        }
    }

    repositionAllPlayers() {
        // Get all players - remote and local
        const remotePlayers = Array.from(this.playerDisplays.keys());
        const totalPlayers = remotePlayers.length + 1; // +1 for local player
        
        // Calculate spacing based on total number of players
        const availableWidth = SCREEN_WIDTH * 0.8; // Use 80% of screen width
        const spacing = availableWidth / (totalPlayers + 1); // +1 for even spacing
        
        // Position starting point
        const startX = (SCREEN_WIDTH - availableWidth) / 2 + spacing;
        
        // Set local player position (center if alone, otherwise positioned in sequence)
        if (totalPlayers === 1) {
            // Solo player is centered
            this.scene.characterSprite.setPosition(SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.72);
        } else {
            this.scene.characterSprite.setPosition(startX, SCREEN_HEIGHT * 0.72);
        }
        
        // Position remote players
        remotePlayers.forEach((playerId, index) => {
            const display = this.playerDisplays.get(playerId);
            const xPos = startX + spacing * (index + 1);
            
            // Update positions
            display.sprite.setPosition(xPos, SCREEN_HEIGHT * 0.72);
            display.text.setPosition(xPos, SCREEN_HEIGHT * 0.85);
        });
        
        console.log(`Repositioned ${totalPlayers} players in the lobby`);
    }
    // Other methods...
}