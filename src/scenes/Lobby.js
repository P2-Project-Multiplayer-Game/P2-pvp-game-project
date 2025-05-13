import NetworkManager from '../multiplayer/NetworkManager.js';

export class Lobby extends Phaser.Scene {
    constructor() {
        super('Lobby');
        this.players = new Map(); // Map of player ID to player data
        this.networkManager = null;
        this.characterSprites = new Map(); // Map of player ID to character sprite
        this.readyTexts = new Map(); // Map of player ID to ready text
        this.characterPositions = []; // Array of positions for character displays
        this.selectedCharacter = null; // Store selected character from previous screen
    }

    init(data) {
        this.selectedCharacter = data.character;
    }

    create() {
        // Add background
        this.add.image(0, 0, 'main_menu_background')
            .setOrigin(0, 0)
            .setDisplaySize(this.cameras.main.width, this.cameras.main.height);

        // Add title text
        this.add.text(this.cameras.main.centerX, 60, 'WAITING FOR PLAYERS', {
            fontFamily: 'Arial',
            fontSize: 36,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Add ready status UI
        this.readyStatusFrame = this.add.image(this.cameras.main.centerX, 130, 'selector_character_frame')
            .setScale(0.8);
        
        this.readyStatusText = this.add.text(this.cameras.main.centerX, 130, '0/0 Players Ready', {
            fontFamily: 'Arial',
            fontSize: 24,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Add instruction UI
        this.instructionBox = this.add.image(this.cameras.main.centerX, this.cameras.main.height - 100, 'blank_ui_board')
            .setScale(0.7);
        
        this.instructionText = this.add.text(this.cameras.main.centerX, this.cameras.main.height - 100, 'Press ENTER to toggle Ready', {
            fontFamily: 'Arial',
            fontSize: 24,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Set up positions for character display
        this.setupCharacterPositions();

        // Connect to server
        this.networkManager = new NetworkManager();
        this.networkManager.connect()
            .then(data => {
                console.log('Connected to server with ID:', data.id);

                // Listen for lobby status updates
                this.networkManager.on('lobby_status_update', (data) => {
                    this.updateLobbyStatus(data);
                });
                
                // Listen for player ready state changes
                this.networkManager.on('player_ready_state', (data) => {
                    this.updatePlayerReadyState(data);
                });
                
                // Listen for new players joining
                this.networkManager.on('player_joined', (data) => {
                    this.addPlayerToLobby(data);
                });
                
                // Listen for players leaving
                this.networkManager.on('player_left', (data) => {
                    this.removePlayerFromLobby(data.id);
                });

                // Listen for game countdown start
                this.networkManager.on('game_countdown_start', (data) => {
                    this.startGameCountdown(data.countdown);
                });

                // Listen for game start
                this.networkManager.on('game_start', (data) => {
                    this.startGame(data);
                });

                // Join the game with selected character
                this.networkManager.joinGame({
                    characterType: this.selectedCharacter,
                    isReady: false
                });

                // Register local player
                this.localPlayerId = this.networkManager.playerId;

            })
            .catch(err => {
                console.error('Failed to connect:', err);
            });

        // Add keyboard input for ready toggle
        this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        this.enterKey.on('down', () => {
            if (this.networkManager && this.networkManager.connected) {
                const isCurrentlyReady = this.players.get(this.localPlayerId)?.isReady || false;
                this.networkManager.socket.emit('player_ready_toggle', { isReady: !isCurrentlyReady });
            }
        });
    }

    setupCharacterPositions() {
        // Calculate positions for up to 6 characters in a semicircle arrangement
        const radius = 240;
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.height/2 + 50;
        
        // For 6 potential positions
        for (let i = 0; i < 6; i++) {
            // Calculate angle (in radians) for evenly spaced positions in upper semicircle
            const angle = Math.PI * (0.1 + 0.8 * (i/5)); // Range from 0.1π to 0.9π
            
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle) * 0.5; // Flatten the arc vertically
            
            this.characterPositions.push({ x, y });
        }
    }

    updateLobbyStatus(status) {
        // Update ready count text
        this.readyStatusText.setText(`${status.playersReady}/${status.totalPlayers} Players Ready`);
        
        // Change color based on if all are ready
        if (status.playersReady === status.totalPlayers && status.totalPlayers >= status.minPlayers) {
            this.readyStatusText.setColor('#00ff00'); // Green when all ready
        } else {
            this.readyStatusText.setColor('#ffffff'); // White otherwise
        }
        
        // Update minimum player text if needed
        if (status.totalPlayers < status.minPlayers) {
            this.instructionText.setText(`Need ${status.minPlayers - status.totalPlayers} more player(s)\nPress ENTER to toggle Ready`);
        } else {
            this.instructionText.setText('Press ENTER to toggle Ready');
        }
    }
    
    addPlayerToLobby(playerData) {
        // Skip if player already exists
        if (this.players.has(playerData.id)) return;
        
        // Store player data
        this.players.set(playerData.id, playerData);
        
        // Find next available position index
        const posIndex = this.findNextAvailablePosition();
        if (posIndex === -1) return; // No positions available
        
        const pos = this.characterPositions[posIndex];
        
        // Create character sprite based on character type
        let spriteKey;
        switch (playerData.characterType) {
            case 'tank': spriteKey = 'tank_idle'; break;
            case 'ninja': spriteKey = 'ninja_idle'; break;
            case 'hero': spriteKey = 'hero_idle'; break;
            case 'archer': spriteKey = 'archer_idle'; break;
            case 'skeleton': spriteKey = 'skeleton_idle'; break;
            default: spriteKey = 'tank_idle';
        }
        
        // Create sprite
        const sprite = this.add.sprite(pos.x, pos.y, spriteKey)
            .setScale(2);
            
        // Play idle animation if available
        if (this.anims.exists(`${playerData.characterType}_idle`)) {
            sprite.play(`${playerData.characterType}_idle`);
        }
        
        // Store sprite reference
        this.characterSprites.set(playerData.id, {
            sprite: sprite,
            posIndex: posIndex
        });
        
        // Add character type text
        this.add.text(pos.x, pos.y + 60, playerData.characterType, {
            fontFamily: 'Arial',
            fontSize: 18,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        // Add ready text (initially not ready)
        const readyText = this.add.text(pos.x, pos.y - 60, 'Not Ready', {
            fontFamily: 'Arial',
            fontSize: 18,
            color: '#ff0000',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        this.readyTexts.set(playerData.id, readyText);
        
        // Update ready state if provided
        if (playerData.isReady) {
            this.updatePlayerReadyState({
                id: playerData.id,
                isReady: true
            });
        }
    }
    
    findNextAvailablePosition() {
        // Get all used position indices
        const usedIndices = Array.from(this.characterSprites.values())
            .map(data => data.posIndex);
        
        // Find first available position
        for (let i = 0; i < this.characterPositions.length; i++) {
            if (!usedIndices.includes(i)) {
                return i;
            }
        }
        
        return -1; // No available positions
    }
    
    updatePlayerReadyState(data) {
        // Update player data
        const player = this.players.get(data.id);
        if (player) {
            player.isReady = data.isReady;
            this.players.set(data.id, player);
        }
        
        // Update visual ready text
        const readyText = this.readyTexts.get(data.id);
        if (readyText) {
            if (data.isReady) {
                readyText.setText('Ready!');
                readyText.setColor('#00ff00'); // Green
            } else {
                readyText.setText('Not Ready');
                readyText.setColor('#ff0000'); // Red
            }
        }
        
        // Add ready effect to sprite
        const spriteData = this.characterSprites.get(data.id);
        if (spriteData && spriteData.sprite) {
            if (data.isReady) {
                spriteData.sprite.setTint(0xccffcc); // Light green tint
            } else {
                spriteData.sprite.clearTint();
            }
        }
    }
    
    removePlayerFromLobby(playerId) {
        // Delete player data
        this.players.delete(playerId);
        
        // Remove sprite
        const spriteData = this.characterSprites.get(playerId);
        if (spriteData && spriteData.sprite) {
            spriteData.sprite.destroy();
        }
        this.characterSprites.delete(playerId);
        
        // Remove ready text
        const readyText = this.readyTexts.get(playerId);
        if (readyText) {
            readyText.destroy();
        }
        this.readyTexts.delete(playerId);
    }
    
    startGameCountdown(seconds) {
        // Create countdown text
        const countdownText = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            `Game starting in ${seconds}`,
            {
                fontFamily: 'Arial',
                fontSize: 48,
                color: '#ffff00',
                stroke: '#000000',
                strokeThickness: 6
            }
        ).setOrigin(0.5);
        
        // Start countdown animation
        this.countdownTimer = seconds;
        
        const countdownInterval = setInterval(() => {
            this.countdownTimer--;
            
            if (this.countdownTimer <= 0) {
                clearInterval(countdownInterval);
                countdownText.setText('Fight!');
                
                // Zoom effect on Fight! text
                this.tweens.add({
                    targets: countdownText,
                    scale: 1.5,
                    duration: 500,
                    yoyo: true,
                    ease: 'Power2'
                });
            } else {
                countdownText.setText(`Game starting in ${this.countdownTimer}`);
                
                // Pulse effect
                this.tweens.add({
                    targets: countdownText,
                    scale: 1.2,
                    duration: 300,
                    yoyo: true,
                    ease: 'Power1'
                });
            }
        }, 1000);
    }
    
    startGame(data) {
        // Clean up keyboard event
        this.input.keyboard.removeKey(this.enterKey);
        
        // Transition to game scene
        this.scene.start('Game', {
            character: this.selectedCharacter
        });
    }

    update() {
        
        // Play idle animations for character sprites
        this.characterSprites.forEach((data, playerId) => {
            const player = this.players.get(playerId);
            if (player && data.sprite) {
                // Ensure animation is playing
                const charType = player.characterType;
                if (!data.sprite.anims.isPlaying && this.anims.exists(`${charType}_idle`)) {
                    data.sprite.play(`${charType}_idle`);
                }
            }
        });
    }
}