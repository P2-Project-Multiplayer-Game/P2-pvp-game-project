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
            console.log('Match duration:', formatTime(data.matchDuration));
            
            try {
                // Just pass the minimal data needed - no CHARACTER_DATA dependency
                const playerRankings = data.rankings.map(player => ({
                    id: player.id,
                    rank: player.rank,
                    characterType: player.characterType,
                    damageDealt: player.damageDealt || 0,
                    kills: player.kills || [] 
                }));
                
                // Clean up network resources
                this.cleanupNetworkResources();
                
                // Transition to GameOver with just the essential data
                this.scene.scene.start('GameOver', { 
                    playersRanking: playerRankings,
                    matchDuration: data.matchDuration
                });
            } catch (e) {
                console.error("Error preparing GameOver transition:", e);
                this.cleanupNetworkResources();
                this.scene.scene.start('GameOver', { 
                    playersRanking: data.rankings
                });
            }
        });
        // Helper function to format time in mm:ss format
        function formatTime(ms) {
        if (!ms) return '00:00';
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        // Game start handler - will be triggered when transitioning from lobby
        this.network.on('gameStart', (data) => {
            console.log('Game starting with players:', data.players.length);
            // We'll only receive this in Lobby scene
            const selectedCharacter = this.scene.selectedCharacter;
            
            // Store important data in registry for the Game scene
            this.scene.registry.set('lobbyPlayers', data.players);
            
            console.log('Transitioning from Lobby to Game with character:', selectedCharacter);
            this.scene.scene.start('Game', { 
                character: selectedCharacter
            });
        });
        
        // Countdown handler (optional - for visual countdown in lobby)
        this.network.on('game_countdown_start', (data) => {
            console.log('Game countdown started:', data.countdown);
            // Handle countdown display if needed
        });
    }

    cleanupNetworkResources() {
        try {
            // Mark network as transitioning first
            if (this.network) {
                this.network.isTransitioning = true;
            }
            // Remove all listeners from NetworkManager for player updates
            if (this.network) {
                this.network.removeAllListeners('playerUpdated');
                this.network.removeAllListeners('playerHealthUpdate');
            }
            
            // Clean up GameSync
            if (this.gameSync) {
                // Disable update method
                this.gameSync.isShuttingDown = true;
            }
            
            // Clean up any other managers that might be updating
            if (this.scene.healthDisplayManager) {
                this.scene.healthDisplayManager.isShuttingDown = true;
            }
            
            if (this.scene.uiManager) {
                this.scene.uiManager.isShuttingDown = true;
            }
            if (this.scene.combatManager) {
                this.scene.combatManager.isShuttingDown = true;
            }
            
            console.log("Network resources cleaned up for GameOver transition");
        } catch (e) {
            console.error("Error cleaning up network resources:", e);
        }
    }
}