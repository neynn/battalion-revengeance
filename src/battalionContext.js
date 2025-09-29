import { EntityManager } from "../engine/entity/entityManager.js";
import { GameContext } from "../engine/gameContext.js";
import { LanguageHandler } from "../engine/language/languageHandler.js";
import { PortraitHandler } from "./actors/portraitHandler.js";
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

    //Entities need to be removed from the actors as the last step.
    //This ensures that actors can iterate over their entities during updates.
    //E.g. a removal during onTurnStart will cause a skip!
    this.world.entityManager.events.on(EntityManager.EVENT.ENTITY_DESTROY, (id) => {
        this.world.turnManager.forAllActors(actor => actor.removeEntity(id));
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

    this.states.addState(BattalionContext.STATE.MAIN_MENU, new MainMenuState());
    this.states.addState(BattalionContext.STATE.MAP_EDITOR, new MapEditorState());
    this.states.addState(BattalionContext.STATE.PLAY, new PlayState());
    this.states.setNextState(this, BattalionContext.STATE.MAIN_MENU);
    this.timer.start();
}

BattalionContext.prototype.onExit = function() {
    this.teamManager.exit();
}