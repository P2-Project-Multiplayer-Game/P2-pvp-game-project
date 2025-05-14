export default class GameState {
    constructor(scene, networkManager, gameSync) {
        this.scene = scene;
        this.network = networkManager;
        this.gameSync = gameSync;
        this.setupEvents();
    }

    setupEvents() {
        // Game over handler
        this.network.on('gameOver', (data) => {
            console.log('Game over! Rankings:', data.rankings);
            
            // Convert network ranking data to player objects
            const playerRankings = [];
            
            // Process each ranked player
            data.rankings.forEach(rankedPlayer => {
                let playerObj;
                
                // Find the actual player object
                if (rankedPlayer.id === this.network.playerId) {
                    playerObj = this.gameSync.localPlayer;
                } else {
                    playerObj = this.gameSync.remotePlayers.get(rankedPlayer.id);
                }
                
                // Add to rankings if player exists
                if (playerObj) {
                    // Store rank on player object for reference
                    playerObj.rank = rankedPlayer.rank;
                    playerRankings.push(playerObj);
                }
            });
            
            // Transition to game over scene with player objects in rank order
            this.scene.scene.start('GameOver', { 
                playersRanking: playerRankings
            });
        });

        // Game start handler - will be triggered when transitioning from lobby
        this.network.on('game_start', (data) => {
            console.log('Game starting with players:', data.players.length);
            
            // If we're in the Lobby scene, transition to Game
            if (this.scene.scene.key === 'Lobby') {
                const selectedCharacter = this.scene.selectedCharacter;
                this.scene.scene.start('Game', { 
                    character: selectedCharacter 
                });
            }
            // If we're in the Game scene, update player position
            else if (this.scene.scene.key === 'Game') {
                // Find our player data
                const myPlayerData = data.players.find(p => p.id === this.network.playerId);
                if (myPlayerData && this.gameSync && this.gameSync.localPlayer) {
                    // Update position from server
                    this.gameSync.localPlayer.x = myPlayerData.x;
                    this.gameSync.localPlayer.y = myPlayerData.y;
                    console.log(`Updated local player position to: ${myPlayerData.x}, ${myPlayerData.y}`);
                }
            }
        });
        
        // Countdown handler (optional - for visual countdown in lobby)
        this.network.on('game_countdown_start', (data) => {
            console.log('Game countdown started:', data.countdown);
            // Handle countdown display if needed
        });
    }
}