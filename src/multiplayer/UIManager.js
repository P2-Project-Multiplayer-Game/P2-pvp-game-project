export default class UIManager {
  constructor(scene, gameSync, networkManager) {
    this.scene = scene;
    this.gameSync = gameSync;
    this.network = networkManager;
    this.uiElements = new Map();
    
    this.setupEvents();
  }
  
  setupEvents() {
    // Listen for player death to show spectating message
    this.scene.events.on('playerDeath', (data) => {
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
    .setScrollFactor(0)
    .setDepth(100);
    
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
  
  clearUI() {
    this.uiElements.forEach(element => {
      element.destroy();
    });
    this.uiElements.clear();
  }
}