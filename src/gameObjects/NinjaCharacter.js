import { Character } from './Character.js';

export class NinjaCharacter extends Character {
    constructor(scene, x, y) {
        super(scene, x, y, {
            characterType: 'ninja',
            idleSpriteKey: 'ninja_idle',
            health: 80, // Less health than tank
            maxHealth: 80,
            attackDamage: 15, // Higher damage
            attack2Damage: 35, // Higher damage
            moveSpeed: 350,         // Faster movement (ninja is agile)
            jumpVelocity: 500,     // Higher jump (ninja is agile)
            invincibilityDuration: 800, // Shorter invincibility
            hitboxConfig: { width: 50, height: 45 }, // Smaller hitbox
            // Define custom hitbox offsets for the specific charecter sub class
            hitboxOffsetConfig: {
                x: { left: -15, right: 15  },  // Adjust these values based on chrecters attack animation
                y: 15 // Vertical offset from character center
            },
            animationKeys: {
                left: 'ninja_left',
                right: 'ninja_right',
                turn: 'ninja_turn',
                jump: 'ninja_jump',
                attack: 'ninja_attack',
                attack2: 'ninja_attack2',
                hurt: 'ninja_hurt'
            }
        });
        this.setScale(0.90);
        this.body.setSize(20, 55);
        // Store the different offsets 
        this.rightFacingOffset = { x: 10, y: 0 };
        this.leftFacingOffset = { x: 0, y: 0 };  
        
        // offest based on initial direction
        this.body.setOffset(this.rightFacingOffset.x, this.rightFacingOffset.y);
        
        //previous flipX state to detect changes
        this.prevFlipX = this.flipX;
        
    }

    initAnimations() {
        // Placeholder: Using tank animations; replace with ninja assets
        this.anims.create({
            key: this.animationKeys.left,
            frames: this.anims.generateFrameNames('ninja_run', { prefix: 'running', end: 8, zeroPad: 4 }),
            frameRate: 16, // Faster for ninja
            repeat: -1
        });
        this.anims.create({
            key: this.animationKeys.turn,
            frames: this.anims.generateFrameNames('ninja_idle', { prefix: 'idle', end: 4, zeroPad: 4 }),
            frameRate: 6,
            repeat: -1
        });
        this.anims.create({
            key: this.animationKeys.right,
            frames: this.anims.generateFrameNames('ninja_run', { prefix: 'running', end: 8, zeroPad: 4 }),
            frameRate: 16,
            repeat: -1
        });
        this.anims.create({
            key: this.animationKeys.jump,
            frames: this.anims.generateFrameNames('ninja_jump', { prefix: 'jumping', end: 8, zeroPad: 4 }),
            frameRate: 6,
            repeat: 0
        });
        this.anims.create({
            key: this.animationKeys.attack,
            frames: this.anims.generateFrameNames('ninja_attack', { prefix: 'attackRight', end: 4, zeroPad: 4 }),
            frameRate: 16, // Faster attack
            repeat: 0
        });
        this.anims.create({
            key: this.animationKeys.attack2,
            frames: this.anims.generateFrameNames('ninja_attack2', { prefix: 'ninjaspecial', end: 7, zeroPad: 4 }),
            frameRate: 16, // slow attack
            repeat: 0
        });
        this.anims.create({
            key: this.animationKeys.hurt,
            frames: this.anims.generateFrameNames('ninja_hurt', { prefix: 'hurt', end: 3, zeroPad: 4 }),
            frameRate: 12,
            repeat: 0
        });
    }

    update() {
        // Check if flipX state changed
        if (this.flipX !== this.prevFlipX) {
            if (this.flipX) {
                this.body.setOffset(this.leftFacingOffset.x, this.leftFacingOffset.y);
            } else {
                this.body.setOffset(this.rightFacingOffset.x, this.rightFacingOffset.y);
            }
            this.prevFlipX = this.flipX;
        }
        
        // Call parent update method
        super.update();
    }
}