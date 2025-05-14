import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../config.js';

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
            .setScale(0.5, 0.2)  // Stretch to become rectangular
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
            .setScale(0.45, 0.35)
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
    }

    displaySelectedCharacter() {
        // Character display settings - matching CharacterSelector
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

        const data = characterData[this.selectedCharacter] || characterData.tank;

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

        // Add character name - positioning below character
        this.add.text(
            SCREEN_WIDTH / 2,
            SCREEN_HEIGHT * 0.85, // Adjusted to match screenshot
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
    }

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
}