import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../config.js';
import { TankCharacter } from '../gameObjects/TankCharacter.js';
import { NinjaCharacter } from '../gameObjects/NinjaCharacter.js';
import { ArcherCharacter } from '../gameObjects/ArcherCharacter.js';
import { HeroCharacter } from '../gameObjects/HeroCharacter.js';
import { SkeletonCharacter } from '../gameObjects/SkeletonCharacter.js';

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

        // Add return to character selector text at the top
        const returnText = this.add.text(
            SCREEN_WIDTH / 2,
            20,
            'PRESS ENTER TO GO BACK TO CHARACTER SELECTOR',
            {
                fontFamily: 'Arial',
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4,
                align: 'center'
            }
        ).setOrigin(0.5, 0).setDepth(100);
        
        // Add blinking effect to make it more noticeable
        this.tweens.add({
            targets: returnText,
            alpha: { from: 1, to: 0.5 },
            duration: 1000,
            yoyo: true,
            repeat: -1
        });
        
        // Add keyboard listener for return to character selector
        this.input.keyboard.on('keydown-ENTER', () => {
            this.scene.start('CharacterSelector');
        });

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
                }
            });
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

        // Create dummy target for practice
        this.createDummyTargets(ground, platforms);

        // Set up collision between player and environment
        this.physics.add.collider(this.player, ground);
        this.physics.add.collider(this.player, platforms);
        
        // Set world bounds
        this.physics.world.setBounds(0, 0, scaledWidth, scaledHeight);
        this.cameras.main.setBounds(0, 0, scaledWidth, scaledHeight);
        
        // Add tutorial instructions - positioned to avoid overlap
        this.createTutorialText();
        this.time.addEvent({
            delay: 1000,
            callback: this.cleanupProjectiles,
            callbackScope: this,
            loop: true
        });
    }
    cleanupProjectiles() {
        // Clean up any projectiles that have existed too long
        this.fireballs.getChildren().forEach(fireball => {
            if (fireball.active && fireball.body) {
                // Get time since creation
                const lifetime = fireball.getData('createdAt') ? 
                    performance.now() - fireball.getData('createdAt') : 5000;
                    
                // Destroy if older than 5 seconds
                if (lifetime > 5000) {
                    fireball.destroy();
                }
            }
        });
        
        // Also clean up other projectiles like arrows
        this.arrows.getChildren().forEach(arrow => {
            if (arrow.active && arrow.body) {
                const lifetime = arrow.getData('createdAt') ? 
                    performance.now() - arrow.getData('createdAt') : 5000;
                    
                if (lifetime > 5000) {
                    arrow.destroy();
                }
            }
        });
    }
    createDummyTargets(ground, platforms) {
        // Create practice dummy at a visible position
        this.dummyTarget = this.physics.add.sprite(400, 300, 'tank_idle');
        this.dummyTarget.setImmovable(true);
        this.dummyTarget.health = 9999;
        this.dummyTarget.maxHealth = 9999;
        this.dummyTarget.characterType = 'dummy';
        this.dummyTarget.setTint(0xaaaaaa); // Gray tint to distinguish from player
        
        // Add floating health text for the dummy target
        this.dummyHealthBar = this.add.text(
            this.dummyTarget.x, 
            this.dummyTarget.y - 50, 
            `${this.dummyTarget.health} HP`, 
            {
                fontFamily: 'Arial',
                fontSize: 17,
                color: '#00ff00',
                stroke: '#000000',
                strokeThickness: 2,
                align: 'center'
            }
        ).setOrigin(0.5, 0.5).setDepth(10);
        
        // Set up collision between dummy and ground layers
        this.physics.add.collider(this.dummyTarget, ground);
        this.physics.add.collider(this.dummyTarget, platforms);
        
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
        // Instructions text - positioned on the right side to avoid overlap
        const instructions = [
            "Welcome to the Tutorial!",
            "",
            "Controls:",
            "- WASD or ARROW KEYS: Move and Jump",
            "- LEFT CLICK: Basic Attack",
            "- RIGHT CLICK: Special Attack",
            "",
            "Practice your attacks on the target dummy"
        ];
        
        // Position instructions on the right side
        this.add.text(SCREEN_WIDTH - 350, 80, instructions.join('\n'), {
            fontFamily: 'Arial',
            fontSize: 18,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'left'
        }).setOrigin(0, 0);
        
        // Add text to show damage dealt
        this.damageText = this.add.text(SCREEN_WIDTH/2, SCREEN_HEIGHT - 100, "", {
            fontFamily: 'Arial',
            fontSize: 16, // Changed from 24 to 16
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 2, // Also reduced stroke thickness
            align: 'center'
        }).setOrigin(0.5);
    }

    handleHitboxCollision(target, hitbox) {
        // Skip if target is already hit
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
        const damage = hitbox.damage || (attacker ? attacker.attackDamage : 10);
        
        // Apply damage
        this.applyDamageToTarget(target, damage, attacker);
    }

    handleShockwaveCollision(target, shockwave) {
        if (shockwave && shockwave.active && target && target.active) {
            const damage = shockwave.damage || (shockwave.owner ? shockwave.owner.attack2Damage : 10);
            this.applyDamageToTarget(target, damage, shockwave.owner);
            if (shockwave.owner && shockwave.owner.destroyShockwave) {
                shockwave.owner.destroyShockwave();
            }
        }
    }

    handleHerowaveCollision(target, herowave) {
        if (herowave && herowave.active && target && target.active) {
            const damage = herowave.damage || (herowave.owner ? herowave.owner.attack2Damage : 30);
            this.applyDamageToTarget(target, damage, herowave.owner);
            if (herowave.owner && herowave.owner.destroyHerowave) {
                herowave.owner.destroyHerowave();
            }
        }
    }

    handleNinjawaveCollision(target, ninjawave) {
        if (ninjawave && ninjawave.active && target && target.active) {
            const damage = ninjawave.damage || (ninjawave.owner ? ninjawave.owner.attack2Damage : 10);
            this.applyDamageToTarget(target, damage, ninjawave.owner);
            if (ninjawave.owner && ninjawave.owner.destroyNinjawave) {
                ninjawave.owner.destroyNinjawave();
            }
        }
    }

    handleArrowCollision(target, arrow) {
        if (arrow && arrow.active && target && target.active) {
            const damage = arrow.damage || (arrow.owner ? arrow.owner.attack2Damage : 10);
            this.applyDamageToTarget(target, damage, arrow.owner);
            if (arrow.owner && arrow.owner.destroyArrow) {
                arrow.owner.destroyArrow();
            }
        }
    }

    handleFireballCollision(target, fireball) {
        if (fireball && fireball.active) {
            // Apply damage to target
            const damage = fireball.damage || 10;
            this.applyDamageToTarget(target, damage, fireball.owner);
            
            // Destroy the fireball directly
            fireball.destroy();
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
        if (this.player) {
            this.player.update();
        }
        
        // Update dummy target health bar
        if (this.dummyTarget && this.dummyTarget.active) {
            // Position the health text above the dummy target
            this.dummyHealthBar.setPosition(
                this.dummyTarget.x, 
                this.dummyTarget.y - 50
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