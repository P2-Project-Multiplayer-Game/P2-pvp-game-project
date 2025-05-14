import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../config.js';
import { TankCharacter } from '../gameObjects/TankCharacter.js';
import { NinjaCharacter } from '../gameObjects/NinjaCharacter.js';
import { ArcherCharacter } from '../gameObjects/ArcherCharacter.js';
import { HeroCharacter } from '../gameObjects/HeroCharacter.js';
import { SkeletonCharacter } from '../gameObjects/SkeletonCharacter.js';
import { UIAnimations } from '../utils/UIAnimations.js';

export class Tutorial extends Phaser.Scene {
    constructor() {
        super('Tutorial');
    }

    init(data) {
        this.selectedCharacter = data.character || 'tank';
    }

    create() {
        // Create the tilemap
        const map = this.make.tilemap({ key: 'tilemap' });
        const tileset = map.addTilesetImage('oakwood', 'tiles');

        // Create background from object layer
        const backgroundLayer = map.getObjectLayer('Background');
        if (backgroundLayer) {
            backgroundLayer.objects.forEach((object, index) => {
                // Get the image key from properties
                let imageKey = null;
                if (object.properties) {
                    const imageProp = object.properties.find(prop => prop.name === 'image');
                    if (imageProp) {
                        imageKey = imageProp.value;
                    }
                }

                // Fallback to GID if no image property.
                if (!imageKey && object.gid) {
                    const gid = object.gid;
                    if (gid === 316) imageKey = 'background1';
                    else if (gid === 317) imageKey = 'background2';
                    else if (gid === 318) imageKey = 'background3';
                }

                if (imageKey) {
                    // Create the image with scaling to match Tiled dimensions
                    const image = this.add.image(object.x, object.y, imageKey)
                        .setOrigin(0, 0)
                        .setDepth(-3 + index); 

                    // Override y-position with slight offset from Tiled
                    image.y = 0;

                    // Apply scaling
                    const imageData = this.textures.get(imageKey);
                    const sourceWidth = imageData.source[0].width;
                    const sourceHeight = imageData.source[0].height;
                    if (object.width && object.height) {
                        const scaleX = this.scale.width / sourceWidth;
                        const scaleY = this.scale.height / sourceHeight;
                        const scale = Math.max(scaleX, scaleY);
                        
                        image.setScale(scale);
                    }
                } else {
                    console.warn(`No valid image key for background object: ${object.name}, gid: ${object.gid}`);
                }
            });
        } else {
            console.warn('Background layer not found in tilemap');
        }

        // Create ground layer and set collisions
        const ground = map.createLayer('ground', tileset);
        ground.setCollisionByProperty({ collides: true });

        // Create platforms layer and set collisions
        const platforms = map.createLayer('Platforms', tileset);
        platforms.setCollisionByProperty({ collides: true });

        const mapWidth = map.widthInPixels;
        const mapHeight = map.heightInPixels;
        // Calculate and apply map scaling
        const scaleX = SCREEN_WIDTH / mapWidth;
        const scaleY = SCREEN_HEIGHT / mapHeight;
        ground.setScale(scaleX, scaleY);
        platforms.setScale(scaleX, scaleY);

        const scaledWidth = mapWidth * scaleX;
        const scaledHeight = mapHeight * scaleY;

        // Create player at default position
        const defaultX = 100;
        const defaultY = 480;

        // Create player based on selected character
        if (this.selectedCharacter === 'tank') {
            this.player = new TankCharacter(this, defaultX, defaultY);
        } else if (this.selectedCharacter === 'ninja') {
            this.player = new NinjaCharacter(this, defaultX, defaultY);
        } else if (this.selectedCharacter === 'hero') {
            this.player = new HeroCharacter(this, defaultX, defaultY);
        } else if (this.selectedCharacter === 'archer') {
            this.player = new ArcherCharacter(this, defaultX, defaultY);
        } else if (this.selectedCharacter === 'skeleton') {
            this.player = new SkeletonCharacter(this, defaultX, defaultY);
        } else {
            // Fall back to tank as default
            this.player = new TankCharacter(this, defaultX, defaultY);
        }

        // Create attack effect groups
        this.hitboxes = this.physics.add.group({ allowGravity: false });
        this.shockwaves = this.physics.add.group({ allowGravity: false });
        this.herowaves = this.physics.add.group({ allowGravity: false });
        this.ninjawaves = this.physics.add.group({ allowGravity: false });
        this.arrows = this.physics.add.group({ allowGravity: false });
        this.fireballs = this.physics.add.group({ allowGravity: true });

        // Set up arrow collisions
        this.physics.add.collider(this.arrows, ground);
        this.physics.add.collider(
            this.arrows, 
            platforms, 
            (arrow, platform) => {
                if (arrow.owner) {
                    arrow.owner.destroyArrow();
                } else {
                    arrow.destroy();
                }
            },
            null,
            this
        );

        // Set up fireball collisions
        this.physics.add.collider(this.fireballs, ground);

        // Create dummy targets for practice
        this.createDummyTargets();

        // Set up collision between player and environment
        this.physics.add.collider(this.player, ground);
        this.physics.add.collider(this.player, platforms);
        
        // Set world bounds
        this.physics.world.setBounds(0, 0, scaledWidth, scaledHeight);
        this.cameras.main.setBounds(0, 0, scaledWidth, scaledHeight);
        
        // Add tutorial instructions
        this.createTutorialText();
        
        // Create battle intro animation
        UIAnimations.createBattleIntro(this, () => {
            console.log("Tutorial intro complete");
        });
    }
    
    createDummyTargets() {
        // Create a primary practice dummy
        this.dummyTarget = this.physics.add.sprite(300, 480, 'tank_idle');
        this.dummyTarget.setImmovable(true);
        this.dummyTarget.health = 100;
        this.dummyTarget.maxHealth = 100;
        this.dummyTarget.characterType = 'dummy';
        
        // Add floating health text for the dummy target
        this.dummyHealthBar = this.add.text(
            this.dummyTarget.x, 
            this.dummyTarget.y - 40, 
            `${this.dummyTarget.health} HP`, 
            {
                fontFamily: 'Arial',
                fontSize: 17,
                color: '#00ff00',
                stroke: '#000000',
                strokeThickness: 1,
                align: 'center'
            }
        ).setOrigin(0.5, 0.5).setDepth(10);
        
        // Set up collision between dummy and ground
        this.physics.add.collider(this.dummyTarget, this.ground);
        
        // Set up attack collisions with dummy target
        this.setupDummyCollisions();
    }
    
    setupDummyCollisions() {
        // Hitbox collisions
        this.physics.add.overlap(
            this.hitboxes,
            this.dummyTarget,
            this.handleHitboxCollision,
            null,
            this
        );
        
        // Shockwave collisions
        this.physics.add.overlap(
            this.dummyTarget,
            this.shockwaves,
            this.handleShockwaveCollision,
            null,
            this
        );
        
        // Hero wave collisions
        this.physics.add.overlap(
            this.dummyTarget,
            this.herowaves,
            this.handleHerowaveCollision,
            null,
            this
        );
        
        // Ninja wave collisions
        this.physics.add.overlap(
            this.dummyTarget,
            this.ninjawaves,
            this.handleNinjawaveCollision,
            null,
            this
        );
        
        // Arrow collisions
        this.physics.add.overlap(
            this.dummyTarget,
            this.arrows,
            this.handleArrowCollision,
            null,
            this
        );
        
        // Fireball collisions
        this.physics.add.overlap(
            this.dummyTarget,
            this.fireballs,
            this.handleFireballCollision,
            null,
            this
        );
    }
    
    createTutorialText() {
        // Instructions text
        const instructions = [
            "Welcome to the Tutorial!",
            "",
            "Controls:",
            "- WASD: Move and Jump",
            "- Left Click: Basic Attack",
            "- Right Click: Special Attack",
            "",
            "Practice your attacks on the dummy target."
        ];
        
        this.add.text(20, 20, instructions.join('\n'), {
            fontFamily: 'Arial',
            fontSize: 18,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        });
        
        // Add text to show damage dealt
        this.damageText = this.add.text(20, 200, "", {
            fontFamily: 'Arial',
            fontSize: 20,
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 3
        });
    }

    handleHitboxCollision(target, hitbox) {
        // Skip if target is already hit or invulnerable
        if (hitbox.hitTargets && hitbox.hitTargets.has(target)) {
            return;
        }
        
        // Mark this target as hit
        if (hitbox.hitTargets) {
            hitbox.hitTargets.add(target);
        }
        
        // Get the owner of the hitbox
        const attacker = hitbox.owner;
        
        // Get damage from the hitbox
        const damage = hitbox.damage || attacker.attackDamage;
        
        // Apply damage
        this.applyDamageToTarget(target, damage, attacker);
    }

    handleShockwaveCollision(target, shockwave) {
        if (shockwave.active && target.active) {
            const damage = shockwave.damage || (shockwave.owner ? shockwave.owner.attack2Damage : 10);
            this.applyDamageToTarget(target, damage, shockwave.owner);
            shockwave.owner.destroyShockwave();
        }
    }

    handleHerowaveCollision(target, herowave) {
        if (herowave.active && target.active) {
            const damage = herowave.damage || (herowave.owner ? herowave.owner.attack2Damage : 30);
            this.applyDamageToTarget(target, damage, herowave.owner);
            herowave.owner.destroyHerowave();
        }
    }

    handleNinjawaveCollision(target, ninjawave) {
        if (ninjawave.active && target.active) {
            const damage = ninjawave.damage || (ninjawave.owner ? ninjawave.owner.attack2Damage : 10);
            this.applyDamageToTarget(target, damage, ninjawave.owner);
            ninjawave.owner.destroyNinjawave();
        }
    }

    handleArrowCollision(target, arrow) {
        if (arrow.active && target.active) {
            const damage = arrow.damage || (arrow.owner ? arrow.owner.attack2Damage : 10);
            this.applyDamageToTarget(target, damage, arrow.owner);
            arrow.owner.destroyArrow();
        }
    }

    handleFireballCollision(target, fireball) {
        if (fireball.active && target.active) {
            if (fireball.hitTargets && fireball.hitTargets.has(target)) {
                return;
            }
            if (fireball.hitTargets) {
                fireball.hitTargets.add(target);
            }
            
            const damage = fireball.damage || (fireball.owner ? fireball.owner.attack2Damage : 10);
            this.applyDamageToTarget(target, damage, fireball.owner);
            fireball.owner.destroyFireball();
        }
    }

    applyDamageToTarget(target, damage, attacker) {
        // Apply damage to the target
        target.health -= damage;
        
        // Display damage dealt
        this.showDamageText(`${damage} damage dealt!`);
        
        // Respawn if health depleted
        if (target.health <= 0) {
            target.health = target.maxHealth;
            this.showDamageText("Target respawned!");
        }
        
        // Visual feedback
        this.tweens.add({
            targets: target,
            alpha: 0.5,
            duration: 100,
            yoyo: true,
        });
    }
    
    showDamageText(message) {
        this.damageText.setText(message);
        this.damageText.alpha = 1;
        
        // Clear message after delay
        this.time.delayedCall(2000, () => {
            this.damageText.alpha = 0;
        });
    }

    update() {
        // Update player
        this.player.update();
        
        // Update dummy target health bar
        if (this.dummyTarget && this.dummyTarget.active) {
            // Position the health text above the dummy target
            this.dummyHealthBar.setPosition(
                this.dummyTarget.x, 
                this.dummyTarget.y - 40
            );
            
            // Update health text
            this.dummyHealthBar.setText(`${this.dummyTarget.health} HP`);
            
            // Update color based on health percentage
            const healthPercent = (this.dummyTarget.health / this.dummyTarget.maxHealth) * 100;
            if (healthPercent > 60) {
                this.dummyHealthBar.setColor('#00ff00'); // green
            } else if (healthPercent > 30) {
                this.dummyHealthBar.setColor('#ffa500'); // orange
            } else {
                this.dummyHealthBar.setColor('#ff0000'); // red
            }
        }
    }
}