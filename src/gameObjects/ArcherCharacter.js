import { Character } from './Character.js';

export class ArcherCharacter extends Character {
    constructor(scene, x, y) {
        super(scene, x, y, {
            characterType: 'archer',
            idleSpriteKey: 'archer_idle', 
            health: 80, // ninjavaerdier
            maxHealth: 80,
            attackDamage: 15,       // Normal attack damage
            attack2Damage: 25,      // arrow damage
            attack1Cooldown: 500, // 0.5 seconds mele attack (alredy defualt value)
            attack2Cooldown: 1000, // 1 seconds cooldown for attack2 
            invincibilityDuration: 800, 
            hitboxConfig: { width: 20, height: 45 },
            // Define custom hitbox offsets for the specific charecter sub class
            hitboxOffsetConfig: {
                x: { left: -5, right: 5 },  // Adjust these values based on chrecters attack animation
                y: 15 // Vertical offset from character center
            }, 
            //  custom ready indicator positions 
            readyIndicatorConfig: {
                attack1: {
                    x: -6,  // Always left
                    y: -12   // Offset from center
                },
                attack2: {
                    x: 6,   // Always right
                    y: -12   // Offset from center
                }
            },
            animationKeys: {
                left: 'archer_left',
                right: 'archer_right',
                turn: 'archer_turn',
                jump: 'archer_jump',
                attack: 'archer_attack',
                attack2: 'archer_attack2',
                hurt: 'archer_hurt'
            }
        });
        this.setScale(0.85);
        this.body.setSize(27, 55); 
        // Store the different offsets 
        this.rightFacingOffset = { x: 0, y: 0 };
        this.leftFacingOffset = { x: 5, y: 0 };  
        
        // offest based on initial direction
        this.body.setOffset(this.rightFacingOffset.x, this.rightFacingOffset.y);
        
        //previous flipX state to detect changes
        this.prevFlipX = this.flipX;
    }

    initAnimations() {
        this.anims.create({
            key: this.animationKeys.left,
            frames: this.anims.generateFrameNames('archer_run', { prefix: 'running', end: 8, zeroPad: 4 }),
            frameRate: 10, // aendrede vaerdier
            repeat: -1
        });
        this.anims.create({
            key: this.animationKeys.turn,
            frames: this.anims.generateFrameNames('archer_idle', { prefix: 'idle', end: 8, zeroPad: 4 }),
            frameRate: 4, 
            repeat: -1
        });
        this.anims.create({
            key: this.animationKeys.right,
            frames: this.anims.generateFrameNames('archer_run', { prefix: 'running', end: 8, zeroPad: 4 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: this.animationKeys.jump,
            frames: this.anims.generateFrameNames('archer_jump', { prefix: 'jumping', end: 7, zeroPad: 4 }),
            frameRate: 4,
            repeat: 0
        });
        this.anims.create({
            key: this.animationKeys.attack,
            frames: this.anims.generateFrameNames('archer_attack', { prefix: 'attackRight', end: 4, zeroPad: 4 }),
            frameRate: 12, // Faster attack
            repeat: 0
        });
        this.anims.create({ //secondary attack i.e attack2
                key: this.animationKeys.attack2,
                frames: this.anims.generateFrameNames('archer_attack', { prefix: 'attackRight', end: 5, zeroPad: 4 }),
                frameRate: 12,
                repeat: 0
        });
        this.anims.create({
            key: this.animationKeys.hurt,
            frames: this.anims.generateFrameNames('archer_hurt', { prefix: 'hurt', end: 3, zeroPad: 4 }),
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