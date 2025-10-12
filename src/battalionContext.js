import { EntityManager } from "../engine/entity/entityManager.js";
import { GameContext } from "../engine/gameContext.js";
import { LanguageHandler } from "../engine/language/languageHandler.js";
import { TurnManager } from "../engine/turn/turnManager.js";
import { AttackAction } from "./action/types/attack.js";
import { CloakAction } from "./action/types/cloak.js";
import { DialogueAction } from "./action/types/dialogue.js";
import { MoveAction } from "./action/types/move.js";
import { PortraitHandler } from "./actors/portraitHandler.js";
import { DialogueHandler } from "./dialogue/dialogueHandler.js";
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

    this.world.entityManager.events.on(EntityManager.EVENT.ENTITY_DESTROY, (id) => {
        this.world.turnManager.forAllActors(actor => actor.removeEntity(id));
    }, { permanent: true });

    this.world.turnManager.events.on(TurnManager.EVENT.NEXT_TURN, (turn) => {
        this.eventHandler.onTurn(this, turn);
    }, { permanent: true} );

    this.world.turnManager.events.on(TurnManager.EVENT.NEXT_ROUND, (round) => {
        this.eventHandler.onRound(this, round);
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
    for(let i = 0; i < TypeRegistry.LAYER_TYPE.COUNT; i++) {
        this.spriteManager.addLayer();
    }

    this.world.actionQueue.registerAction(TypeRegistry.ACTION_TYPE.MOVE, new MoveAction());
    this.world.actionQueue.registerAction(TypeRegistry.ACTION_TYPE.ATTACK, new AttackAction());
    this.world.actionQueue.registerAction(TypeRegistry.ACTION_TYPE.CLOAK, new CloakAction());
    this.world.actionQueue.registerAction(TypeRegistry.ACTION_TYPE.DIALOGUE, new DialogueAction());

    this.language.registerLanguage(LanguageHandler.LANGUAGE.ENGLISH, {});
    this.language.selectLanguage(LanguageHandler.LANGUAGE.ENGLISH);

    this.portraitHandler.load(resources.portraits);

    this.typeRegistry.loadCategory(resources.armorTypes, TypeRegistry.CATEGORY.ARMOR);
    this.typeRegistry.loadCategory(resources.climateTypes, TypeRegistry.CATEGORY.CLIMATE);
    this.typeRegistry.loadCategory(resources.movementTypes, TypeRegistry.CATEGORY.MOVEMENT);
    this.typeRegistry.loadCategory(resources.terrainTypes, TypeRegistry.CATEGORY.TERRAIN);
    this.typeRegistry.loadCategory(resources.tileTypes, TypeRegistry.CATEGORY.TILE);
    this.typeRegistry.loadCategory(resources.traitTypes, TypeRegistry.CATEGORY.TRAIT);
    this.typeRegistry.loadCategory(resources.weaponTypes, TypeRegistry.CATEGORY.WEAPON);
    this.typeRegistry.loadCategory(resources.nationTypes, TypeRegistry.CATEGORY.NATION);
    this.typeRegistry.loadCategory(resources.powerTypes, TypeRegistry.CATEGORY.POWER);
    this.typeRegistry.loadCategory(resources.currencyTypes, TypeRegistry.CATEGORY.CURRENCY);
    this.typeRegistry.loadCategory(resources.factionTypes, TypeRegistry.CATEGORY.FACTION);
    this.typeRegistry.loadCategory(resources.buildingTypes, TypeRegistry.CATEGORY.BUILDING);
    this.typeRegistry.loadCategory(resources.moraleTypes, TypeRegistry.CATEGORY.MORALE);
    this.typeRegistry.loadCategory(resources.commanderTypes, TypeRegistry.CATEGORY.COMMANDER);

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