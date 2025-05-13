import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../config.js';
export class GameOver extends Phaser.Scene {
    constructor() {
        super('GameOver');
    }

    init(data) {
        // Store the players in rank order (1st, 2nd, 3rd...)
        this.playersRanking = data.playersRanking || [];
        console.log('Game Over received players:', this.playersRanking.map(p => 
            `${p.characterType} (rank: ${p.rank})`).join(', '));
    }

    create() {
        // Background and decorative elements
        this.add.image(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, 'menu_background')
            .setOrigin(0.5, 0.57)
            .setDisplaySize(SCREEN_WIDTH + 300, SCREEN_HEIGHT + 300);
            
        this.add.image(SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.13, 'gameOver_sign')
            .setScale(0.8)
            .setOrigin(0.5);
        
        // Add pedestals
        this.add.image(SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.646, 'pedestal_1').setScale(3);
        this.add.image(SCREEN_WIDTH / 4, SCREEN_HEIGHT * 0.72, 'pedestal_2').setScale(3);
        this.add.image(SCREEN_WIDTH / 1.35, SCREEN_HEIGHT * 0.785, 'pedestal_3').setScale(3);

        // Add torch decorations
        this.add.sprite(310, 410, 'torch').play('torch_burn').setScale(3.5);
        this.add.sprite(505, 410, 'torch').play('torch_burn').setScale(3.5);

        // Add restart button
        this.add.image(SCREEN_WIDTH / 1.1, SCREEN_HEIGHT * 0.94, 'newGame_button')
        .setInteractive({ useHandCursor: true })
        .setScale(0.42)
        .setOrigin(0.5)
        .on('pointerdown', () => this.scene.start('CharacterSelector'));

        // Display winners on pedestals
        this.displayWinnersOnPodium();
    }

    displayWinnersOnPodium() {
        // Sort players by rank if not already sorted
        this.playersRanking.sort((a, b) => a.rank - b.rank);
        
        // Pedestal positions (center = 1st, left = 2nd, right = 3rd)
        const pedestalPositions = [
            { rank: 1, x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT * 0.45 },    // 1st place (center/top)
            { rank: 2, x: SCREEN_WIDTH / 4, y: SCREEN_HEIGHT * 0.60 },    // 2nd place (left)
            { rank: 3, x: SCREEN_WIDTH / 1.35, y: SCREEN_HEIGHT * 0.73 }  // 3rd place (right)
        ];
        
        // Display each player according to their rank
        this.playersRanking.forEach(player => {
            // Only show top 3
            if (player.rank > 3) return;
            
            // Find corresponding pedestal position
            const pedestal = pedestalPositions.find(p => p.rank === player.rank);
            if (!pedestal) return;
            
            // Get texture key and animation
            const textureKey = player.texture.key;
            const animKey = (player.animationKeys && player.animationKeys.turn) || 'turn';
            
            // Create character sprite on pedestal
            const playerSprite = this.add.sprite(pedestal.x, pedestal.y, textureKey)
                .setOrigin(0.5, 1)
                .setScale(2.5);
                
            // Add rank number above player
            this.add.text(pedestal.x + 40, pedestal.y - 130, `#${player.rank}`, {
                fontSize: '30px',
                fontStyle: 'bold',
                color: player.rank === 1 ? '#FFD700' : (player.rank === 2 ? '#C0C0C0' : '#CD7F32'),
                stroke: '#000000',
                strokeThickness: 4
            }).setOrigin(0.5);
                
            // Play idle animation if it exists
            if (this.anims.exists(animKey)) {
                playerSprite.play(animKey, true);
            }
            
            // Add character type name
            this.add.text(pedestal.x, pedestal.y + 10, player.characterType, {
                fontSize: 22,
                fontStyle: 'Bold',
                color: '#FFFFFF',
                stroke: '#000000',
                strokeThickness: 4
            }).setOrigin(0.5, 0);
        });
        
        // Add text for players beyond top 3
        if (this.playersRanking.length > 3) {
            let otherRankingsText = 'Other players:\n';
            
            this.playersRanking.forEach(player => {
                if (player.rank > 3) {
                    otherRankingsText += `#${player.rank}: ${player.characterType}\n`;
                }
            });
            
            this.add.text(SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.9, otherRankingsText, {
                fontSize: 22,
                fontStyle: 'Bold',
                color: '#FFFFFF',
                stroke: '#000000',
                strokeThickness: 3,
                align: 'center'
            }).setOrigin(0.5);
        }
    }
}