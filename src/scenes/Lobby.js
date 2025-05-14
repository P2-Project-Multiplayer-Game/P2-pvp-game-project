import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../config.js';
import NetworkManager from '../multiplayer/NetworkManager.js';
import LobbyUIManager from '../multiplayer/LobbyUIManager.js';
import GameState from '../multiplayer/GameState.js';
import NetworkService from '../services/NetworkService.js';
import { CHARACTER_DATA } from '../config.js';
export class Lobby extends Phaser.Scene {
    constructor() {
        super('Lobby');
        this.isReady = false;
        this.totalPlayers = 1; // For local testing
        this.readyPlayers = 0; // For local testing
    }

    init(data) {
        // Get the selected character from CharacterSelector
        this.selectedCharacter = data.character || 'tank';
    }

    create() {
        // Add background
        this.add.image(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, 'menu_background')
            .setOrigin(0.5, 0.57)
            .setDisplaySize(SCREEN_WIDTH + 300, SCREEN_HEIGHT + 300);

        // Add character frame before text but after background
        this.add.image(SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.15, 'selector_character_frame')
            .setOrigin(0.5)
            .setScale(0.6, 0.4)  // Stretch to become rectangular
            .setDepth(1);

        // Add header text
        this.add.text(
            SCREEN_WIDTH / 2,
            SCREEN_HEIGHT * 0.1,
            'WAITING FOR PLAYERS',
            {
                fontSize: '32px',
                fontFamily: 'monoSpace',
                color: '#D1B183',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5).setDepth(2);
        
        // Ready status text - on top of the frame
        this.readyStatusText = this.add.text(
            SCREEN_WIDTH / 2,
            SCREEN_HEIGHT * 0.2,
            `${this.readyPlayers} out of ${this.totalPlayers} players ready`,
            {
                fontSize: '24px',
                color: '#CFAF82',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5).setDepth(2);

        // Ready prompt at bottom
        this.add.image(SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.922, 'blank_ui_board')
            .setScale(1.1, 0.35)
            .setOrigin(0.5);

        this.readyPromptText = this.add.text(
            SCREEN_WIDTH / 2,
            SCREEN_HEIGHT * 0.922,
            'Press ENTER to ready up',
            {
                fontSize: '24px',
                fontFamily: 'monoSpace',
                color: '#CFAF82',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5);

        // Add blinking effect to the prompt
        this.tweens.add({
            targets: this.readyPromptText,
            alpha: { from: 1, to: 0.5 },
            duration: 1000,
            yoyo: true,
            repeat: -1
        });

        // Add torch animations - positioned exactly like in CharacterSelector
        this.add.sprite(310, 410, 'torch').play('torch_burn').setScale(3.5);
        this.add.sprite(505, 410, 'torch').play('torch_burn').setScale(3.5);

        // Add character display
        this.displaySelectedCharacter();

        // Listen for Enter key to toggle ready status
        this.input.keyboard.on('keydown-ENTER', this.toggleReady, this);
        // Initialize network connection using the singleton service
        NetworkService.initialize()
            .then(networkManager => {
                this.networkManager = networkManager;
                // Set current scene name
                this.networkManager.setCurrentScene('Lobby');
                console.log('Connected to server with ID:', this.networkManager.playerId);

                this.lobbyUIManager = new LobbyUIManager(this, this.networkManager);
                this.gameState = new GameState(this, this.networkManager);
                
                // Join the lobby after connection
                this.networkManager.joinGame({
                    characterType: this.selectedCharacter,
                });
            })
            .catch(err => {
                console.error('Failed to connect:', err);
            });
    }

    displaySelectedCharacter() {
        // Character display settings - matching CharacterSelector

        // Use the imported CHARACTER_DATA instead
        const data = CHARACTER_DATA[this.selectedCharacter] || CHARACTER_DATA.tank;

        // Create character sprite - matching CharacterSelector position
        this.characterSprite = this.add.sprite(
            SCREEN_WIDTH / 2, 
            SCREEN_HEIGHT * 0.72, // Match CharacterSelector (was 0.5)
            data.textureKey
        )
        .setScale(2.5)
        .setOrigin(0.5);

        // Play idle animation
        this.characterSprite.play(data.animKey);
    }
    toggleReady() {
        // Toggle ready state
        this.isReady = !this.isReady;
        
        // Update UI elements
        this.readyPromptText.setText(this.isReady ? 'Press ENTER to cancel' : 'Press ENTER to ready up');
        
        if (this.isReady) {
            this.characterSprite.setTint(0x00ff00);
        } else {
            this.characterSprite.clearTint();
        }
        
        // Send ready state to server
        this.networkManager.sendPlayerReadyToggle(this.isReady);
    }

    /* 
    toggleReady() {
        // Toggle ready state
        this.isReady = !this.isReady;
        
        // Update local ready count for demonstration
        this.readyPlayers = this.isReady ? 1 : 0;
        
        // Update ready status text
        this.readyStatusText.setText(`${this.readyPlayers} out of ${this.totalPlayers} players ready`);
        
        // Update prompt based on ready state
        this.readyPromptText.setText(this.isReady ? 'Press ENTER to cancel' : 'Press ENTER to ready up');
        
        // Visual indicator of ready status
        if (this.isReady) {
            this.characterSprite.setTint(0x00ff00); // Green tint when ready
        } else {
            this.characterSprite.clearTint();
        }
        
        // If all players are ready, start the game after a delay
        if (this.readyPlayers >= this.totalPlayers) {
            this.time.delayedCall(2000, () => {
                this.scene.start('Game', { character: this.selectedCharacter });
            });
        }
    }
    */
}
/*
1. Player enters Lobby scene
2. Player selects character and presses "Ready" button
3. LobbyUIManager displays ready state of all players
4. When all players are ready:
   a. NetwrokManager sends "gameCountdownStart" event with countdown value
   b. LobbyUIManager displays countdown in Lobby scene
   c. A player can unready making their ready true/false statement again false 
   d. LobbyUIManager stops displaying countdown in Lobby scene
   e just like in a server/Netrokmanager sends "gameCount"downStop
   f player can once again ready themsels doing the same logic as in a
   g. LobbyUIManager displays countdown in Lobby scene
  h. When countdown reaches 0, server/networkmanager sends "gameStart" event
   i. GameState.js receives "gameStart" event and transitions to Game scene
5. Game.js initializes with character data from Lobby scene
6. Game begins
*/