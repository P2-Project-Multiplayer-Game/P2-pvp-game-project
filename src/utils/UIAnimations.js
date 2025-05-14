export class UIAnimations {
    static createBattleIntro(scene, onComplete) {
        // Create black overlay if not exists
        const fadeOverlay = scene.fadeOverlay || scene.add.rectangle(
            0, 0,
            scene.scale.width, scene.scale.height,
            0x000000
        )
        .setOrigin(0)
        .setDepth(10000)
        .setAlpha(1);
        
        // Add the Battle! text on top of black overlay
        const battleText = scene.add.text(
            scene.scale.width / 2, 
            scene.scale.height / 2, 
            'BATTLE!', 
            {
                fontSize: '64px',
                fontFamily: 'Arial',
                color: '#D1B183',
                stroke: '#000000',
                strokeThickness: 6,
                resolution: 1
            }
        )
        .setOrigin(0.5)
        .setDepth(10001);  // Above the black overlay
        
        // Add up-and-down hover animation
        scene.tweens.add({
            targets: battleText,
            y: battleText.y - 15,  // Hover up 15 pixels
            duration: 500,
            yoyo: true,
            repeat: -1,            // Continually hover
            ease: 'Sine.easeInOut' // Smooth sine wave movement
        });
        
        // Add the blinking animation
        scene.tweens.add({
            targets: battleText,
            alpha: { from: 1, to: 0.5 },
            duration: 625,
            yoyo: true,
            repeat: 3,  // Blink a few times
            onComplete: () => {
                // Keep screen black for less then a seconds total, then fade out quickly
                scene.time.delayedCall(600, () => {
                    // Start the fade transition - quick fade out
                    scene.tweens.add({
                        targets: fadeOverlay,
                        alpha: 0,
                        duration: 400,  // Quick fade out (less than 1 second)
                        ease: 'Cubic.easeOut',  // Smoother fade transition
                        onComplete: () => {
                            fadeOverlay.destroy();
                            battleText.destroy();
                            if (onComplete) onComplete();
                        }
                    });
                });
            }
        });
        
        return { fadeOverlay, battleText };
    }

    static createBlinkingText(scene, textObject) {
        return scene.tweens.add({
            targets: textObject,
            alpha: { from: 1, to: 0 },
            duration: 625,
            yoyo: true,
            repeat: -1
        });
    }
}