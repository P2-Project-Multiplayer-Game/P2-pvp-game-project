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
            
            // Extract and prepare player data before cleanup
            const playerRankings = [];
            
            try {
                // Process each ranked player
                data.rankings.forEach(rankedPlayer => {
                    let playerObj;
                    
                    // Find the actual player object
                    if (rankedPlayer.id === this.network.playerId) {
                        playerObj = this.gameSync.localPlayer;
                    } else {
                        playerObj = this.gameSync.remotePlayers.get(rankedPlayer.id);
                    }
                    
                    if (playerObj) {
                        // Create a simplified data structure with just what's needed
                        const simplifiedPlayer = {
                            rank: rankedPlayer.rank,
                            characterType: playerObj.characterType,
                            texture: {
                                key: playerObj.texture.key
                            },
                            animationKeys: playerObj.animationKeys,
                            // Add other required properties
                        };
                        playerRankings.push(simplifiedPlayer);
                    }
                });
                
                // Clean up network resources to prevent further updates
                this.cleanupNetworkResources();
                
                // Transition to game over scene with simplified player data
                this.scene.scene.start('GameOver', { 
                    playersRanking: playerRankings
                });
            } catch (e) {
                console.error("Error preparing GameOver transition:", e);
                // Fallback with minimal data
                this.scene.scene.start('GameOver', { 
                    rawRankings: data.rankings
                });
            }
        });

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