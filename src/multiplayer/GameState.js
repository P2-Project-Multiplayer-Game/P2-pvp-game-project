import NetworkService from '../services/NetworkService.js';  

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
                //  Disconnect the socket completely
                console.log("Disconnecting socket before GameOver scene transition");
                NetworkService.disconnect();
                
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
}