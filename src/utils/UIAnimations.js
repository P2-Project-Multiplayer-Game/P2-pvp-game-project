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
        
        // Add scaling animation 
        scene.tweens.add({
            targets: battleText,
            scale: { from: 1, to: 1.2 },
            duration: 800,
            yoyo: true,
            repeat: -1
        });
        
        // Add the blinking animation
        scene.tweens.add({
            targets: battleText,
            alpha: { from: 1, to: 0.5 },
            duration: 420,
            yoyo: true,
            repeat: 2.5,  // Blink a few times
            onComplete: () => {
                // Keep screen black for less then a seconds total, then fade out quickly
                scene.time.delayedCall(400, () => {
                    // Start the fade transition - quick fade out
                    scene.tweens.add({
                        targets: fadeOverlay,
                        alpha: 0,
                        duration: 270,  // Quick fade out (less than 1 second)
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
            duration: 420,
            yoyo: true,
            repeat: -1
        });
    }
}