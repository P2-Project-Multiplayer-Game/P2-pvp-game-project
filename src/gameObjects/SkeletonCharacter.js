import { Character } from './Character.js';

export class SkeletonCharacter extends Character {
    constructor(scene, x, y) {
        super(scene, x, y, {
            characterType: 'skeleton',
            idleSpriteKey: 'skeleton_idle',

            //health system
            health: 80, 
            maxHealth: 80,

            // comabt modifiers such as damage and attack cooldowns
            attackDamage: 15, 
            attack2Damage: 35,
            attack1Cooldown: 500, // 0.5 seconds mele attack (alredy defualt value)
            attack2Cooldown: 5000, // 5 seconds cooldown for attack2 

            //projectile modifiers such as speed and lastability
            //add projectilespeed and the  this.scene.time.delayedCall(1600, ()  time modifiers
            
            //movementspeed modifiers
            moveSpeed: 200,        
            jumpVelocity: 480,

            //miscellaneous modifiers 
            invincibilityDuration: 800, 

            // collision and display offset modifiers
            hitboxConfig: { width: 45, height: 10 }, // TBD
            // Define custom hitbox offsets for the specific charecter sub class
            hitboxOffsetConfig: {
                x: { left: -15, right: 15 },  // Adjust these values based on chrecters attack animation
                y: 15 // Vertical offset from character center
            },
            //  custom ready indicator positions 
            readyIndicatorConfig: {
                attack1: {
                    x: -6,  // Always left
                    y: -15   // Offset from center
                },
                attack2: {
                    x: 6,   // Always right
                    y: -15   // Offset from center
                }
            },
            animationKeys: {
                left: 'skeleton_left',
                right: 'skeleton_right',
                turn: 'skeleton_turn',
                jump: 'skeleton_jump',
                attack: 'skeleton_attack',
                attack2: 'skeleton_attack2',
                hurt: 'skeleton_hurt'
            }
        });
        this.setScale(0.80);
        this.body.setSize(25, 60); 
        // Store the different offsets 
        this.rightFacingOffset = { x: 15, y: 0 };
        this.leftFacingOffset = { x: 35, y: 0 };  
        
        // offest based on initial direction
        this.body.setOffset(this.rightFacingOffset.x, this.rightFacingOffset.y);
        
        //previous flipX state to detect changes
        this.prevFlipX = this.flipX;
    }

    initAnimations() {
        //frameRate should be tweaked
        try{
        this.anims.create({
            key: this.animationKeys.left,
            frames: this.anims.generateFrameNames('skeleton_run', { prefix: 'running', end: 8, zeroPad: 4 }),
            frameRate: 12,
            repeat: -1
        });
        this.anims.create({
            key: this.animationKeys.turn,
            frames: this.anims.generateFrameNames('skeleton_idle', { prefix: 'idle', end: 8, zeroPad: 4 }),
            frameRate: 6,
            repeat: -1
        });
        this.anims.create({
            key: this.animationKeys.right,
            frames: this.anims.generateFrameNames('skeleton_run', { prefix: 'running', end: 8, zeroPad: 4 }),
            frameRate: 12,
            repeat: -1
        });
        this.anims.create({
            key: this.animationKeys.jump,
            frames: this.anims.generateFrameNames('skeleton_jump', { prefix: 'jumping', end: 8, zeroPad: 4 }),
            frameRate: 6,
            repeat: 0
        });
        this.anims.create({
            key: this.animationKeys.attack,
            frames: this.anims.generateFrameNames('skeleton_attack', { prefix: 'attackRight', end: 4, zeroPad: 4 }),
            frameRate: 8, // Faster attack
            repeat: 0
        });
        this.anims.create({
            key: this.animationKeys.attack2,
            frames: this.anims.generateFrameNames('skeleton_attack', { prefix: 'attackRight', end: 4, zeroPad: 4 }),
            frameRate: 8, // Faster attack
            repeat: 0
        });
        this.anims.create({
            key: this.animationKeys.hurt,
            frames: this.anims.generateFrameNames('skeleton_hurt', { prefix: 'hurt', end: 8, zeroPad: 4 }),
            frameRate: 12,
            repeat: 0
        });
            console.log('SkeletonCharacter animations created successfully');
        } catch (error) {
            console.error('SkeletonCharacter animation creation failed:', error);
        }
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