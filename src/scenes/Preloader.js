import { TankCharacter }  from '../gameObjects/TankCharacter.js';
import { NinjaCharacter } from '../gameObjects/NinjaCharacter.js';

export class Preloader extends Phaser.Scene {
    constructor() {
        super('Preloader');
    }

    init() {
        //  We loaded this image in our Boot Scene, so we can display it here
        this.add.image(512, 384, 'background');

        //  A simple progress bar. This is the outline of the bar.
        this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);

        //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
        const bar = this.add.rectangle(512 - 230, 384, 4, 28, 0xffffff);

        //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
        this.load.on('progress', (progress) => {

            //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
            bar.width = 4 + (460 * progress);

        });
    }

    preload() {
        //Load the assets for the game first we set path for the map assets 
        this.load.setPath('assets');
        // Loading the assets for the main menu
        this.load.image('arrow_left', '/UI_elements/arrow_left.png');
        this.load.image('arrow_right', '/UI_elements/arrow_right.png');
        this.load.image('menu_background', '/UI_elements/main_menu_background.png');
        this.load.image('choose_text_ui', '/UI_elements/choose_text_ui.png');
        this.load.image('blank_ui_board', '/UI_elements/blank_ui_board.png');
        this.load.image('selector_character_frame', '/UI_elements/selector_character_frame.png');
        this.load.image('controls_info_ui', '/UI_elements/controls_info_ui.png');
        this.load.image('newGame_button', '/UI_elements/newGame_button.png');
        this.load.image('gameOver_sign', '/UI_elements/gameOver_sign.png');
        
        //loading our tileset png file so that our json files from the proggram Tiled can use the json and use and arrange our tileset.
        this.load.image('tiles', 'oak_woods/oak_woods_tileset.png');
        //loading background images
        this.load.image('background1', 'oak_woods/background/background_layer_1.png');
        this.load.image('background2', 'oak_woods/background/background_layer_2.png');
        this.load.image('background3', 'oak_woods/background/background_layer_3.png');

        this.load.image('torch_1', 'torch/smalltorch1.png');
        this.load.image('torch_2', 'torch/smalltorch2.png');
        this.load.image('torch_3', 'torch/smalltorch3.png');

        this.load.image('pedestal_1', 'pedestals/pedestal_1st.png');
        this.load.image('pedestal_2', 'pedestals/pedestal_2nd.png');
        this.load.image('pedestal_3', 'pedestals/pedestal_3rd.png');

        //loading our game map Json file from the program Tiled
        this.load.tilemapTiledJSON('tilemap', 'game_map_oakwood_v3.json');
       
        //Tank character assets loads here
        this.load.atlas(
            'tank_idle',
            'tank/tank_idle.png', 'tank/tank_idle.json'    
        );
        this.load.atlas(
            'tank_run',
            'tank/tank_run.png', 'tank/tank_run.json'    
        );
        this.load.atlas(
            'tank_jump',
            'tank/tank_jump.png', 'tank/tank_jump.json'    
        );
        this.load.atlas(
            'tank_attack',
            'tank/tank_attack.png', 'tank/tank_attack.json'    
        );
        this.load.atlas(
            'tank_hurt',
            'tank/tank_hurt.png', 'tank/tank_hurt.json'    
        );

        //Archer character assets loads here
        this.load.atlas(
            'archer_idle',
            'archer/archer_idle.png', 'archer/archer_idle.json'    
        );
        this.load.atlas(
            'archer_run',
            'archer/archer_run.png', 'archer/archer_run.json'    
        );
        this.load.atlas(
            'archer_jump',
            'archer/archer_jump.png', 'archer/archer_jump.json'    
        );
        this.load.atlas(
            'archer_attack',
            'archer/archer_attack.png', 'archer/archer_attack.json'    
        );
        this.load.image(
            'arrow', 
            'archer/3/1_0.png',
            'archer/archer_attack.png', 'archer/archer_attack.json'   
        );
         this.load.atlas(
            'archer_hurt',
            'archer/archer_hurt.png', 'archer/archer_hurt.json'   
        );
        
        //Hero character assets loads here
        this.load.atlas(
            'hero_idle',
            'hero/hero_idle.png', 'hero/hero_idle.json'    
        );
        this.load.atlas(
            'hero_run',
            'hero/hero_run.png', 'hero/hero_run.json'    
        );
        this.load.atlas(
            'hero_jump',
            'hero/hero_jump.png', 'hero/hero_jump.json'    
        );
        this.load.atlas(
            'hero_attack',
            'hero/hero_attack.png', 'hero/hero_attack.json'    
        );
        this.load.atlas(
            'hero_attack2',
            'hero/hero_attack2.png', 'hero/hero_attack2.json'   
        );
         this.load.atlas(
            'hero_hurt',
            'hero/hero_hurt.png', 'hero/hero_hurt.json'   
        );
        
        //Ninja character assets loads here
        this.load.atlas(
            'ninja_idle',
            'ninja/ninja_idle.png', 'ninja/ninja_idle.json'    
        );
        this.load.atlas(
            'ninja_run',
            'ninja/ninja_run.png', 'ninja/ninja_run.json'    
        );
        this.load.atlas(
            'ninja_jump',
            'ninja/ninja_jump.png', 'ninja/ninja_jump.json'    
        );
        this.load.atlas(
            'ninja_attack',
            'ninja/ninja_attack.png', 'ninja/ninja_attack.json'
        );
        this.load.atlas(
            'ninja_attack2',
            'ninja/ninja_attack2.png', 'ninja/ninja_attack2.json'      
        );
         this.load.atlas(
            'ninja_hurt',
            'ninja/ninja_hurt.png', 'ninja/ninja_hurt.json'   
        );
        //skeleton assets load here
        this.load.atlas(
            'skeleton_idle',
            'skeleton/skeleton_idle.png', 'skeleton/skeleton_idle.json'    
        );
        this.load.atlas(
            'skeleton_run',
            'skeleton/skeleton_run.png', 'skeleton/skeleton_run.json'    
        );
        this.load.atlas(
            'skeleton_jump',
            'skeleton/skeleton_jump.png', 'skeleton/skeleton_jump.json'    
        );
        this.load.atlas(
            'skeleton_attack',
            'skeleton/skeleton_attack.png', 'skeleton/skeleton_attack.json'    
        );
        this.load.atlas(
            'skeleton_attack2',
            'skeleton/Skeleton_attack2_new.png', 'skeleton/Skeleton_attack2_new.json'    
        );
        
         this.load.atlas(
            'skeleton_hurt',
            'skeleton/skeleton_hurt.png', 'skeleton/skeleton_hurt.json'   
        );
        this.load.image(
            'fireball', 
            'Fireball/fireball1.png',
            'skeleton/skeleton_attack.png', 'skeleton/skeleton_attack.json'   
        );
    }

    create() {
        // Need to create all the idle animations in the preloader, in order for them to be used in the character selector
        this.anims.create({
            key: 'tank_turn',
            frames: this.anims.generateFrameNames('tank_idle', { prefix: 'idle', end: 8, zeroPad: 4 }),
            frameRate: 10,
            repeat: -1
        });
        
        this.anims.create({
            key: 'ninja_turn',
            frames: this.anims.generateFrameNames('ninja_idle', { prefix: 'idle', end: 8, zeroPad: 4 }),
            frameRate: 6,
            repeat: -1
        });
        
        this.anims.create({
            key: 'hero_turn',
            frames: this.anims.generateFrameNames('hero_idle', { prefix: 'idle', end: 8, zeroPad: 4 }),
            frameRate: 3,
            repeat: -1
        });
        
        this.anims.create({
            key: 'archer_turn',
            frames: this.anims.generateFrameNames('archer_idle', { prefix: 'idle', end: 8, zeroPad: 4 }),
            frameRate: 4,
            repeat: -1
        });
        this.anims.create({
            key: 'skeleton_turn',
            frames: this.anims.generateFrameNames('skeleton_idle', { prefix: 'idle', end: 8, zeroPad: 4 }),
            frameRate: 4,
            repeat: -1
        });

        this.anims.create({
            key: 'torch_burn',
            frames: [
                { key: 'torch_1' },
                { key: 'torch_2' },
                { key: 'torch_3' },
            ],
            frameRate: 8,
            repeat: -1
        });

        //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
        //  For example, you can define global animations here, so we can use them in other scenes.

        //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
        
        this.scene.start('CharacterSelector');
        // this.scene.start('GameOver');
         
    }
}
