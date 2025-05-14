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

    addPlayerToLobby(playerData) {
        // Skip if this is the local player or player already exists
        if (playerData.id === this.network.playerId || this.playerDisplays.has(playerData.id)) {
            return;
        }
        
        const SCREEN_WIDTH = this.scene.sys.game.config.width;
        const SCREEN_HEIGHT = this.scene.sys.game.config.height;
        
        // Currently we'll just update the lobby count
        // In a more advanced implementation, we would show remote player characters
        console.log(`Player ${playerData.id} joined the lobby as ${playerData.characterType}`);
    }
    
    removePlayerFromLobby(playerId) {
        if (this.playerDisplays.has(playerId)) {
            const display = this.playerDisplays.get(playerId);
            if (display.sprite) display.sprite.destroy();
            if (display.text) display.text.destroy();
            this.playerDisplays.delete(playerId);
        }
    }
    // Other methods...
}