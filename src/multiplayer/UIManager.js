export default class UIManager {
    constructor(scene, gameSync, networkManager) {
        this.scene = scene;
        this.gameSync = gameSync;
        this.network = networkManager;
        this.uiElements = new Map();
        this.setupEvents();

        //cooldown indicator tracking
        this.cooldownIndicators = new Map(); // Map of playerId -> {attack1: object, attack2: object}
        //  Wait a short time before setting up indicators to ensure players are positioned
        this.scene.time.delayedCall(100, () => {
            this.setupCooldownIndicators();
        });
    }
  
    setupEvents() {
        // Listen for player death to show spectating message
        this.scene.events.on('playerDeath', (data) => {
            this.removePlayerCooldownIndicators(data.id);
            if (data.local) {
            this.showSpectatingMessage();
            
            // Disable inputs temporarily
            this.scene.input.keyboard.enabled = false;
            
            // Re-enable just for spectator controls after a short delay
            setTimeout(() => {
                this.scene.input.keyboard.enabled = true;
            }, 1000);
            }
        });
    }

    setupCooldownIndicators() {

        // Create indicators for local player
        this.createPlayerCooldownIndicators(this.gameSync.localPlayer);
        
        // Create indicators for existing remote players
        this.gameSync.remotePlayers.forEach((player, playerId) => {
            this.createPlayerCooldownIndicators(player);
        });
        
        // Listen for new players joining
        this.network.on('playerJoined', (data) => {
            setTimeout(() => {
                const player = this.gameSync.remotePlayers.get(data.id);
                if (player && !this.cooldownIndicators.has(data.id)) {
                    this.createPlayerCooldownIndicators(player);
                }
            }, 200);
        });
        
        // Listen for players leaving
        this.network.on('playerLeft', (data) => {
            this.removePlayerCooldownIndicators(data.id);
        });
    }

    createPlayerCooldownIndicators(player) {
        if (!player) return;
        
        const playerId = player.playerId || this.network.playerId;
        // First remove any existing indicators for this player
        if (this.cooldownIndicators.has(playerId)) {
            this.removePlayerCooldownIndicators(playerId);
        }
        // Define indicator configuration
        const indicatorConfig = {
            attack1: {
                x: -6,
                y: -15
            },
            attack2: {
                x: 6,
                y: -15
            }
        };
        
        // Choose emoji based on character type
        let attack2Symbol = '✨'; // Default
        if (player.characterType === 'tank') {
            attack2Symbol = '💫';
        } else if (player.characterType === 'ninja') {
            attack2Symbol = '🗡️';
        } else if (player.characterType === 'archer') {
            attack2Symbol = '🏹';
        } else if (player.characterType === 'skeleton') {
            attack2Symbol = '🔥';
        }
        
        // Create attack1 indicator
        const attack1Indicator = this.scene.add.text(
            player.x + indicatorConfig.attack1.x,
            player.y + indicatorConfig.attack1.y,
            '⚔️',
            {
                fontSize: '10px',
                stroke: '#000000',
                strokeThickness: 3
            }
        )
        .setOrigin(0.5)
        .setDepth(20)         // Ensure indicators are visible above other elements
    
        
        // Create attack2 indicator
        const attack2Indicator = this.scene.add.text(
            player.x + indicatorConfig.attack2.x,
            player.y + indicatorConfig.attack2.y,
            attack2Symbol,
            {
                fontSize: '10px',
                stroke: '#000000',
                strokeThickness: 3
            }
        )
        .setOrigin(0.5)
        .setDepth(20)         // Ensure indicators are visible above other elements

        // Log initial positions for debugging
        //console.log(`Created indicators for ${player.characterType} at x:${player.x}, y:${player.y}`);
        // Set initial alpha based on cooldown state
        attack1Indicator.setAlpha(player.attack1OnCooldown ? 0 : 1);
        attack2Indicator.setAlpha(player.attack2OnCooldown ? 0 : 1);
        
        // Store indicators
        this.cooldownIndicators.set(playerId, {
            attack1: attack1Indicator,
            attack2: attack2Indicator,
            config: indicatorConfig
        });
    }

    removePlayerCooldownIndicators(playerId) {
        const indicators = this.cooldownIndicators.get(playerId);
        if (indicators) {
            indicators.attack1.destroy();
            indicators.attack2.destroy();
            this.cooldownIndicators.delete(playerId);
        }
    }

    showSpectatingMessage() {
        const spectatingText = this.scene.add.text(
            this.scene.cameras.main.centerX,
            50,
            'You died! Spectating...',
            {
                fontFamily: 'Arial',
                fontSize: 24,
                color: '#ff0000',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5, 0.5)
        .setDepth(20);
        
        // Fade it in
        spectatingText.alpha = 0;
        this.scene.tweens.add({
            targets: spectatingText,
            alpha: 1,
            duration: 500,
            ease: 'Power2'
        });
        
        // Store reference
        this.uiElements.set('spectatingText', spectatingText);
    }

    updateCooldownIndicators() {
        // Update local player indicators
        if (this.gameSync.localPlayer) {
            const localPlayerId = this.network.playerId;
            const localPlayer = this.gameSync.localPlayer;
            const indicators = this.cooldownIndicators.get(localPlayerId);
            
            if (indicators) {
                // Position update
                // Log position updates occasionally for debugging
                if (Math.random() < 0.01) {  // Only log 1% of the time to avoid console spam
                    //console.log(`Local player at (${localPlayer.x}, ${localPlayer.y}), indicators at (${indicators.attack1.x}, ${indicators.attack1.y})`);
                }
                indicators.attack1.setPosition(
                    localPlayer.x + indicators.config.attack1.x,
                    localPlayer.y + indicators.config.attack1.y
                );
                indicators.attack2.setPosition(
                    localPlayer.x + indicators.config.attack2.x,
                    localPlayer.y + indicators.config.attack2.y
                );
                
                // Visibility update (use actual cooldown state)
                if (indicators.attack1.alpha === 0 && !localPlayer.attack1OnCooldown) {
                    this.scene.tweens.add({
                        targets: indicators.attack1,
                        alpha: 1,
                        duration: 500,
                        ease: 'Power1'
                    });
                } else if (indicators.attack1.alpha === 1 && localPlayer.attack1OnCooldown) {
                    indicators.attack1.setAlpha(0);
                }
                
                if (indicators.attack2.alpha === 0 && !localPlayer.attack2OnCooldown) {
                    this.scene.tweens.add({
                        targets: indicators.attack2,
                        alpha: 1,
                        duration: 700,
                        ease: 'Power1'
                    });
                } else if (indicators.attack2.alpha === 1 && localPlayer.attack2OnCooldown) {
                    indicators.attack2.setAlpha(0);
                }
            }
        }
        
        // Update remote player indicators
        this.gameSync.remotePlayers.forEach((player, playerId) => {
            const indicators = this.cooldownIndicators.get(playerId);
            
            if (indicators) {
                // Position update
                indicators.attack1.setPosition(
                    player.x + indicators.config.attack1.x,
                    player.y + indicators.config.attack1.y
                );
                indicators.attack2.setPosition(
                    player.x + indicators.config.attack2.x,
                    player.y + indicators.config.attack2.y
                );
                
                // Visibility update (use network synced state)
                if (indicators.attack1.alpha === 0 && !player.attack1OnCooldown) {
                    this.scene.tweens.add({
                        targets: indicators.attack1,
                        alpha: 1,
                        duration: 500,
                        ease: 'Power1'
                    });
                } else if (indicators.attack1.alpha === 1 && player.attack1OnCooldown) {
                    indicators.attack1.setAlpha(0);
                }
                
                if (indicators.attack2.alpha === 0 && !player.attack2OnCooldown) {
                    this.scene.tweens.add({
                        targets: indicators.attack2,
                        alpha: 1,
                        duration: 700,
                        ease: 'Power1'
                    });
                } else if (indicators.attack2.alpha === 1 && player.attack2OnCooldown) {
                    indicators.attack2.setAlpha(0);
                }
            }
        });
    }
    update() {
        // Update cooldown indicators for all players
        this.updateCooldownIndicators();
    }

    clearUI() {
        this.uiElements.forEach(element => {
            element.destroy();
        });
        this.uiElements.clear();
        
        this.cooldownIndicators.forEach(indicators => {
            indicators.attack1.destroy();
            indicators.attack2.destroy();
        });
        this.cooldownIndicators.clear();
    }
}