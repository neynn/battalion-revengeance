import { ClientGameContext } from "../engine/clientGameContext.js";
import { LanguageHandler } from "../engine/language/languageHandler.js";
import { AttackAction } from "./action/types/attack.js";
import { CloakAction } from "./action/types/cloak.js";
import { DeathAction } from "./action/types/death.js";
import { EndTurnAction } from "./action/types/endTurn.js";
import { MoveAction } from "./action/types/move.js";
import { UncloakAction } from "./action/types/uncloak.js";
import { PortraitHandler } from "./portrait/portraitHandler.js";
import { DialogueHandler } from "./dialogue/dialogueHandler.js";
import { LAYER_TYPE } from "./enums.js";
import { MainMenuState } from "./states/mainMenu/mainMenu.js";
import { MapEditorState } from "./states/mapEditor/mapEditorState.js";
import { PlayState } from "./states/play.js";
import { TeamManager } from "./team/teamManager.js";
import { TypeRegistry } from "./type/typeRegistry.js";
import { HealAction } from "./action/types/heal.js";
import { CaptureAction } from "./action/types/capture.js";
import { TILE_HEIGHT, TILE_WIDTH } from "./constants.js";
import { ArenaState } from "./states/arena/arena.js";
import { ExplodeTileAction } from "./action/types/explodeTile.js";
import { StartTurnAction } from "./action/types/startTurn.js";
import { EntitySpawnAction } from "./action/types/entitySpawn.js";
import { ExtractAction } from "./action/types/extract.js";

export const BattalionContext = function() {
    ClientGameContext.call(this);

    this.transform2D.setSize(TILE_WIDTH, TILE_HEIGHT);
    this.typeRegistry = new TypeRegistry();
    this.teamManager = new TeamManager();
    this.portraitHandler = new PortraitHandler();
    this.dialogueHandler = new DialogueHandler();

    this.timer.input = (deltaTime) => {
        this.client.update();
        this.uiManager.update(this);
    }

    this.timer.update = (fDeltaTime) => {
        this.states.update(this);
        this.world.update(this);
    }

    this.timer.render = (deltaTime) => {
        this.applicationWindow.update(this);
        this.dialogueHandler.update(this, deltaTime);
        this.spriteManager.update(this);
        this.tileManager.update(this);
        this.renderer.update(this);
    }
}

BattalionContext.STATE = {
    PLAY: "PLAY",
    ARENA: "ARENA",
    MAIN_MENU: "MAIN_MENU",
    MAP_EDITOR: "MAP_EDITOR"
};

BattalionContext.prototype = Object.create(ClientGameContext.prototype);
BattalionContext.prototype.constructor = BattalionContext;

BattalionContext.prototype.init = function(resources) {
    for(let i = 0; i < LAYER_TYPE.COUNT; i++) {
        this.spriteManager.addLayer();
    }

    this.typeRegistry.load(resources);

    this.world.actionQueue.registerAction(TypeRegistry.ACTION_TYPE.EXTRACT, new ExtractAction());
    this.world.actionQueue.registerAction(TypeRegistry.ACTION_TYPE.SPAWN, new EntitySpawnAction(false));
    this.world.actionQueue.registerAction(TypeRegistry.ACTION_TYPE.START_TURN, new StartTurnAction());
    this.world.actionQueue.registerAction(TypeRegistry.ACTION_TYPE.EXPLODE_TILE, new ExplodeTileAction());
    this.world.actionQueue.registerAction(TypeRegistry.ACTION_TYPE.CAPTURE, new CaptureAction());
    this.world.actionQueue.registerAction(TypeRegistry.ACTION_TYPE.MOVE, new MoveAction());
    this.world.actionQueue.registerAction(TypeRegistry.ACTION_TYPE.HEAL, new HealAction());
    this.world.actionQueue.registerAction(TypeRegistry.ACTION_TYPE.ATTACK, new AttackAction());
    this.world.actionQueue.registerAction(TypeRegistry.ACTION_TYPE.CLOAK, new CloakAction());
    this.world.actionQueue.registerAction(TypeRegistry.ACTION_TYPE.DEATH, new DeathAction());
    this.world.actionQueue.registerAction(TypeRegistry.ACTION_TYPE.UNCLOAK, new UncloakAction());
    this.world.actionQueue.registerAction(TypeRegistry.ACTION_TYPE.END_TURN, new EndTurnAction());

    this.language.selectLanguage(LanguageHandler.LANGUAGE.ENGLISH);
    this.portraitHandler.load(resources.portraits);

    this.states.addState(BattalionContext.STATE.MAIN_MENU, new MainMenuState());
    this.states.addState(BattalionContext.STATE.MAP_EDITOR, new MapEditorState());
    this.states.addState(BattalionContext.STATE.ARENA, new ArenaState());
    this.states.addState(BattalionContext.STATE.PLAY, new PlayState());
    this.states.setNextState(this, BattalionContext.STATE.MAIN_MENU);
    this.timer.start();
}

BattalionContext.prototype.onExit = function() {
    this.teamManager.exit();
    this.portraitHandler.exit();
    this.dialogueHandler.exit();
}