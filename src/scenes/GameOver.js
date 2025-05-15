import { SCREEN_HEIGHT, SCREEN_WIDTH, CHARACTER_DATA } from '../config.js';
export class GameOver extends Phaser.Scene {
    constructor() {
        super('GameOver');
    }

    init(data) {
        // Store the players in rank order (1st, 2nd, 3rd...)
        // Store the players in rank order (1st, 2nd, 3rd...)
        this.playersRanking = data.playersRanking || [];
        this.matchDuration = data.matchDuration || 0;
        
        console.log('Game Over received players:', this.playersRanking.map(p => 
            `${p.characterType} (rank: ${p.rank})`).join(', '));
            
        console.log('Match duration:', this.formatTime(this.matchDuration));
    }
    //time formatter
    formatTime(ms) {
    if (!ms) return '00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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
        // play again text
        const pressEnterText = this.add.text(SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.75, 'PRESS ENTER TO PLAY AGAIN', {
            fontSize: '20px',
            color: '#FFD700', // Gold color
            stroke: '#000000',
            strokeThickness: 4,
            resolution: 1
        }).setOrigin(0.5, 0.5);

        this.add.text(SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.2, 
            `Match Duration: ${this.formatTime(this.matchDuration)}`, {
            fontSize: '24px',
            fontStyle: 'bold',
            color: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        this.input.keyboard.on('keydown-ENTER', () => this.scene.start('CharacterSelector'));
        // Display winners on pedestals
        this.displayWinnersOnPodium();
    }

    displayWinnersOnPodium() {
        // Sort players by rank
        this.playersRanking.sort((a, b) => a.rank - b.rank);
        
        // Pedestal positions
        const pedestalPositions = [
            { rank: 1, x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT * 0.45 },    // 1st place (center/top)
            { rank: 2, x: SCREEN_WIDTH / 4, y: SCREEN_HEIGHT * 0.60 },    // 2nd place (left)
            { rank: 3, x: SCREEN_WIDTH / 1.35, y: SCREEN_HEIGHT * 0.73 }  // 3rd place (right)
        ];
        
        // Display each player according to their rank
        this.playersRanking.forEach(player => {
            if (!player) return;

            try {
                // Get character data
                const charType = player.characterType || 'tank';
                const characterData = CHARACTER_DATA[charType] || CHARACTER_DATA.tank;
                
                if (player.rank <= 3) {
                    // Find corresponding pedestal position
                    const pedestal = pedestalPositions.find(p => p.rank === player.rank);
                    if (!pedestal) return;
                    
                    // Create character sprite on pedestal
                    const playerSprite = this.add.sprite(pedestal.x, pedestal.y, characterData.textureKey)
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
                        
                    // Play animation if it exists
                    if (characterData.animKey && this.anims.exists(characterData.animKey)) {
                        playerSprite.play(characterData.animKey, true);
                    }
                    
                    // Add character name
                    this.add.text(pedestal.x+20, pedestal.y + 10, `${characterData.name || charType}\nDamage: ${player.damageDealt || 0}`, {
                        fontSize: 22,
                        fontStyle: 'Bold',
                        color: '#FFFFFF',
                        stroke: '#000000',
                        strokeThickness: 4
                    }).setOrigin(0.5, 0);
                }
            } catch (e) {
                console.error(`Error displaying player ${player.id || player.rank}:`, e);
            }
        });
        
        // Add text for players beyond top 3
        const otherPlayers = this.playersRanking.filter(player => player.rank > 3);
        if (otherPlayers.length > 0) {
            let otherRankingsText = 'Other players:\n';
            
            otherPlayers.forEach(player => {
                const charType = player.characterType || 'tank';
                const characterData = CHARACTER_DATA[charType] || CHARACTER_DATA.tank;
                 otherRankingsText += `#${player.rank}: ${characterData.name || charType} (Damage: ${player.damageDealt || 0})\n`;
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