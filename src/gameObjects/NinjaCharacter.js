import { Character } from './Character.js';

export class NinjaCharacter extends Character {
    constructor(scene, x, y) {
        super(scene, x, y, {
            characterType: 'ninja',
            idleSpriteKey: 'ninja_idle',

            //health system
            health: 80, // Less health than tank
            maxHealth: 80,

            // comabt modifiers such as damage and attack cooldowns
            attackDamage: 15, // Higher damage
            attack2Damage: 10, // the initial shockwave , probobly should have low damage
            attack3Damage: 30, // the delayed move probably should have a higher damage 
            attack1Cooldown: 500, // 0.5 seconds mele attack (alredy defualt value)
            attack2Cooldown: 6000, // 6 seconds cooldown for attack2 

            //projectile modifiers such as speed and lastability
            projectileVelocity: 800,     // Ninjawave speed (was 800)
            projectileLifetime: 300,    // Ninjawave lifetime (was 1800ms)

            //movementspeed modifiers
            moveSpeed: 300,         // Faster movement (ninja is agile)
            jumpVelocity: 500,     // Higher jump (ninja is agile)

            //miscellaneous modifiers 
            invincibilityDuration: 800, // Shorter invincibility

            // collision and display offset modifiers
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

        
        //kalleopdatering start

        this.on('animationcomplete', (anim) => {
            if (anim.key === this.animationKeys.attack2) {
                this.updateBodyboxOffset(); // tilbage til default offset
            }
        });
        
        //kalleopdatering forsat i update
        
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
            frameRate: 8, // slow attack
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
        const currentAnim = this.anims.currentAnim?.key;
        const currentFrame = this.anims.currentFrame?.index;

        if (currentAnim === this.animationKeys.attack2 && currentFrame === 5) {
            // specifik frame offset
            this.body.setOffset(50, this.body.offset.y); // her kan specifik frame offset justeres
        } else if (this.flipX !== this.prevFlipX) {
            this.updateBodyboxOffset();
            this.prevFlipX = this.flipX;
        }
        
        // Call parent update method
        super.update();
    }

    updateBodyboxOffset() {
        const offset = this.flipX ? this.leftFacingOffset : this.rightFacingOffset;
        this.body.setOffset(offset.x, offset.y);
    }
}