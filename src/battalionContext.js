import { GameContext } from "../engine/gameContext.js";
import { LanguageHandler } from "../engine/language/languageHandler.js";
import { TurnManager } from "../engine/turn/turnManager.js";
import { AttackAction } from "./action/types/attack.js";
import { CloakAction } from "./action/types/cloak.js";
import { DeathAction } from "./action/types/death.js";
import { DialogueAction } from "./action/types/dialogue.js";
import { EndTurnAction } from "./action/types/endTurn.js";
import { MoveAction } from "./action/types/move.js";
import { UncloakAction } from "./action/types/uncloak.js";
import { PortraitHandler } from "./portrait/portraitHandler.js";
import { DialogueHandler } from "./dialogue/dialogueHandler.js";
import { LAYER_TYPE } from "./enums.js";
import { EventHandler } from "./event/eventHandler.js";
import { MainMenuState } from "./states/mainMenu.js";
import { MapEditorState } from "./states/mapEditor.js";
import { PlayState } from "./states/play.js";
import { TeamManager } from "./team/teamManager.js";
import { TypeRegistry } from "./type/typeRegistry.js";

export const BattalionContext = function() {
    GameContext.call(this);

    this.transform2D.setSize(56, 56);
    this.typeRegistry = new TypeRegistry();
    this.teamManager = new TeamManager();
    this.portraitHandler = new PortraitHandler();
    this.eventHandler = new EventHandler();
    this.dialogueHandler = new DialogueHandler();

    this.world.turnManager.events.on(TurnManager.EVENT.NEXT_TURN, ({ turn }) => {
        this.eventHandler.onTurnChange(this, turn);
    }, { permanent: true });

    this.world.turnManager.events.on(TurnManager.EVENT.NEXT_ROUND, ({ round }) => {
        this.eventHandler.onRoundChange(this, round);
    }, { permanent: true });
}

BattalionContext.STATE = {
    PLAY: "PLAY",
    MAIN_MENU: "MAIN_MENU",
    MAP_EDITOR: "MAP_EDITOR"
};

BattalionContext.prototype = Object.create(GameContext.prototype);
BattalionContext.prototype.constructor = BattalionContext;

BattalionContext.prototype.init = function(resources) {
    for(let i = 0; i < LAYER_TYPE.COUNT; i++) {
        this.spriteManager.addLayer();
    }

    this.typeRegistry.load(resources);

    this.world.actionQueue.registerAction(TypeRegistry.ACTION_TYPE.MOVE, new MoveAction());
    this.world.actionQueue.registerAction(TypeRegistry.ACTION_TYPE.ATTACK, new AttackAction());
    this.world.actionQueue.registerAction(TypeRegistry.ACTION_TYPE.CLOAK, new CloakAction());
    this.world.actionQueue.registerAction(TypeRegistry.ACTION_TYPE.DIALOGUE, new DialogueAction());
    this.world.actionQueue.registerAction(TypeRegistry.ACTION_TYPE.DEATH, new DeathAction());
    this.world.actionQueue.registerAction(TypeRegistry.ACTION_TYPE.UNCLOAK, new UncloakAction());
    this.world.actionQueue.registerAction(TypeRegistry.ACTION_TYPE.END_TURN, new EndTurnAction());

    this.language.selectLanguage(LanguageHandler.LANGUAGE.ENGLISH);
    this.portraitHandler.load(resources.portraits);

    this.states.addState(BattalionContext.STATE.MAIN_MENU, new MainMenuState());
    this.states.addState(BattalionContext.STATE.MAP_EDITOR, new MapEditorState());
    this.states.addState(BattalionContext.STATE.PLAY, new PlayState());
    this.states.setNextState(this, BattalionContext.STATE.MAIN_MENU);
    this.timer.start();
}

BattalionContext.prototype.onExit = function() {
    this.teamManager.exit();
    this.portraitHandler.exit();
    this.eventHandler.exit();
    this.dialogueHandler.exit();
}