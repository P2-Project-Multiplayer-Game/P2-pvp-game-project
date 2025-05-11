import { Character } from './Character.js';

export class TankCharacter extends Character {
    constructor(scene, x, y) {
        super(scene, x, y, {
            characterType: 'tank',
            idleSpriteKey: 'tank_idle',
            health: 100,
            maxHealth: 100,
            attackDamage: 10,       // Normal attack damage
            attack2Damage: 25,      // Shockwave damage
            attack1Cooldown: 500, // 0.5 seconds mele attack (alredy defualt value)
            attack2Cooldown: 1000, // 1 seconds cooldown for attack2 
            invincibilityDuration: 1000,
            hitboxConfig: { width: 35, height: 45 },
            // Define custom hitbox offsets for the specific charecter sub class
            hitboxOffsetConfig: {
                x: { left: -5, right: 5 },  // Adjust these values based on chrecters attack animation
                y: 15 // Vertical offset from character center
            },
            //  custom ready indicator positions 
            readyIndicatorConfig: {
                attack1: {
                    x: { left: 5, right: +5 },
                    y: -10
                },
                attack2: {
                    x: { left: 5, right: +5 },
                    y: -10
                }
            },
            animationKeys: {
                left: 'tank_left',
                right: 'tank_right',
                turn: 'tank_turn',
                jump: 'tank_jump',
                attack: 'tank_attack',
                attack2: 'tank_attack2',
                hurt: 'tank_hurt'
            }
        });
        this.body.setSize(20, 48); 
        // Store the different offsets 
        this.rightFacingOffset = { x: 5, y: 0 };
        this.leftFacingOffset = { x: 0, y: 0 };  
        
        // offest based on initial direction
        this.body.setOffset(this.rightFacingOffset.x, this.rightFacingOffset.y);
        
        //previous flipX state to detect changes
        this.prevFlipX = this.flipX;
    }

    initAnimations() {
        try {
            this.anims.create({
                key: this.animationKeys.left,
                frames: this.anims.generateFrameNames('tank_run', { prefix: 'running', end: 8, zeroPad: 4 }),
                frameRate: 10,
                repeat: -1
            });
            this.anims.create({
                key: this.animationKeys.turn,
                frames: this.anims.generateFrameNames('tank_idle', { prefix: 'idle', end: 8, zeroPad: 4 }),
                frameRate: 10,
                repeat: -1
            });
            this.anims.create({
                key: this.animationKeys.right,
                frames: this.anims.generateFrameNames('tank_run', { prefix: 'running', end: 8, zeroPad: 4 }),
                frameRate: 10,
                repeat: -1
            });
            this.anims.create({
                key: this.animationKeys.jump,
                frames: this.anims.generateFrameNames('tank_jump', { prefix: 'jumping', end: 8, zeroPad: 4 }),
                frameRate: 5,
                repeat: 0
            });
            this.anims.create({ //standard attack
                key: this.animationKeys.attack,
                frames: this.anims.generateFrameNames('tank_attack', { prefix: 'attackRight', end: 5, zeroPad: 4 }),
                frameRate: 13,
                repeat: 0
            });
            this.anims.create({ //secondary attack i.e attack2
                key: this.animationKeys.attack2,
                frames: this.anims.generateFrameNames('tank_attack', { prefix: 'secondAttack', end: 5, zeroPad: 4 }),
                frameRate: 13,
                repeat: 0
            });
            this.anims.create({
                key: this.animationKeys.hurt,
                frames: this.anims.generateFrameNames('tank_hurt', { prefix: 'hurt', end: 3, zeroPad: 4 }), // Placeholder replace with hurt animation
                frameRate: 10,
                repeat: 0
            });
            console.log('TankCharacter animations created successfully');
        } catch (error) {
            console.error('TankCharacter animation creation failed:', error);
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