import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../config.js';

export class CharacterSelector extends Phaser.Scene {
    constructor() {
        super('CharacterSelector');
    }

    create() {

        this.add.image(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, 'menu_background').setOrigin(0.5, 0.57).setDisplaySize(SCREEN_WIDTH + 300, SCREEN_HEIGHT + 300);
        this.add.image(SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.16, 'choose_text_ui').setScale(0.23).setOrigin(0.5);
        this.add.image(SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.922, 'blank_ui_board').setScale(0.45, 0.35).setOrigin(0.5);
        this.add.image(Math.round(SCREEN_WIDTH / 7), Math.round(SCREEN_HEIGHT * 0.17), 'controls_info_ui').setScale(0.9).setOrigin(0.5);

        this.add.sprite(310, 410, 'torch').play('torch_burn').setScale(3.5);
        this.add.sprite(505, 410, 'torch').play('torch_burn').setScale(3.5);

        const pressEnterText = this.add.text(SCREEN_WIDTH / 2, 175, 'PRESS ENTER TO SELECT', {
            fontSize: '18px',
            // fontStyle: 'bold',
            color: '#D1B183',
            stroke: '#000000',
            strokeThickness: 4,
            resolution: 1
        }).setOrigin(0.5 , -1);
            // Adding the blinking effect to the pressEnterText
            this.tweens.add({
                targets: pressEnterText,
                alpha: { from: 1, to: 0 },
                duration: 1250,
                yoyo: true,
                repeat: -1
            });

        
        this.menuCharacters = [
            {
                key: 'tank',
                textureKey: 'tank_idle',
                idleAnim: 'tank_turn',
                name: 'Tank',
                primaryAttack: 'Sword Strike',
                secondaryAttack: 'Power Blast'
            },
            {
                key: 'ninja',
                textureKey: 'ninja_idle',
                idleAnim: 'ninja_turn',
                name: 'Ninja',
                primaryAttack: 'NinjaAttack1',
                secondaryAttack: 'NinjaAttack2'
            },
            {
                key: 'hero',
                textureKey: 'hero_idle',
                idleAnim: 'hero_turn',
                name: 'Hero',
                primaryAttack: 'HeroAttack1',
                secondaryAttack: 'HeroAttack2'
            },
            {
                key: 'archer',
                textureKey: 'archer_idle',
                idleAnim: 'archer_turn',
                name: 'Archer',
                primaryAttack: 'ArcherAttack1',
                secondaryAttack: 'ArcherAttack2'
            },
            {
                key: 'skeleton',
                textureKey: 'skeleton_idle',
                idleAnim: 'skeleton_turn',
                name: 'Skeleton',
                primaryAttack: 'SkeletonAttack1',
                secondaryAttack: 'SkeletonAttack2'
            }
        ];
        this.currentCharacterIndex = 0;

        const iconX = SCREEN_WIDTH / 2;
        const iconY = SCREEN_HEIGHT * 0.72;
        this.menuCharacters.forEach(character => {
            character.previewSprite = this.add.sprite(iconX, iconY, character.textureKey)
                .setScale(2.5)
                .setOrigin(0.5)
                .setVisible(false);
        });

        const arrowOffsetX = 175;

        this.leftArrow = this.add.image(SCREEN_WIDTH / 2 - arrowOffsetX, iconY, 'arrow_left')
            .setInteractive({ useHandCursor: true })
            .setScale(1)
            .on('pointerdown', () => this.changeCharacter(-1));

        this.rightArrow = this.add.image(SCREEN_WIDTH / 2 + arrowOffsetX, iconY, 'arrow_right')
            .setInteractive({ useHandCursor: true })
            .setScale(1)
            .on('pointerdown', () => this.changeCharacter(1));

        this.displayCharacter();

        this.input.keyboard.on('keydown-LEFT',  () => this.changeCharacter(-1));
        this.input.keyboard.on('keydown-RIGHT', () => this.changeCharacter(1));
        this.input.keyboard.on('keydown-ENTER', () => this.startGame(this.menuCharacters[this.currentCharacterIndex].key));
    }

    displayCharacter() {
        const characterToDisplay = this.menuCharacters[this.currentCharacterIndex];

        this.menuCharacters.forEach(character => character.previewSprite.setVisible(false));

        if (this.nameText) this.nameText.destroy();
        if (this.attackText) this.attackText.destroy();

        characterToDisplay.previewSprite.setVisible(true);
        characterToDisplay.previewSprite.play(characterToDisplay.idleAnim);

        this.nameText = this.add.text(
            SCREEN_WIDTH / 2,
            SCREEN_HEIGHT * 0.92,
            characterToDisplay.name,
            { 
                fontFamily: 'monoSpace',
                fontSize: '38px', 
                color: '#CFAF82',
                stroke: '#000000',
                fontStyle: 'bold',
                strokeThickness: 4,
                resolution: 1
            }
        ).setOrigin(0.5);


        this.attackText = this.add.text(
            SCREEN_WIDTH / 5,
            SCREEN_HEIGHT * 0.92,
            `Primary: ${characterToDisplay.primaryAttack}\nSecondary: ${characterToDisplay.secondaryAttack}`,
            {
                fontFamily: 'Monospace',
                fontSize: '24px',
                fontStyle: 'bold',
                color: '#CFAF82',
                stroke: '#000000',
                strokeThickness: 4,
                resolution: 5
            }
        ).setOrigin(0.5);
    }

    changeCharacter(delta) {
        this.currentCharacterIndex = Phaser.Math.Wrap(this.currentCharacterIndex + delta, 0, this.menuCharacters.length);
        this.displayCharacter();
    }

    startGame(key) {
        this.scene.start('Game', { character: key });
    }
}