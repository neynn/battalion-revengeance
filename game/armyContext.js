import { GameContext } from "../engine/gameContext.js";
import { ACTION_TYPE, DEBRIS_TYPE, getTeamID, getTeamName, TEAM_TYPE, TILE_TYPE } from "./enums.js";
import { AttackAction } from "./actions/attackAction.js";
import { MoveAction } from "./actions/moveAction.js";
import { ArmorComponent } from "./components/armor.js";
import { AttackComponent } from "./components/attack.js";
import { ConstructionComponent } from "./components/construction.js";
import { MoveComponent } from "./components/move.js";
import { MainMenuState } from "./states/context/mainMenu.js";
import { MapEditorState } from "./states/context/mapEditor.js";
import { StoryModeState } from "./states/context/storyMode.js";
import { VersusModeState } from "./states/context/versusMode.js";
import { AvianComponent } from "./components/avian.js";
import { ConstructionAction } from "./actions/constructionAction.js";
import { ReviveableComponent } from "./components/reviveable.js";
import { CounterAttackAction } from "./actions/counterAttackAction.js";
import { CounterMoveAction } from "./actions/counterMoveAction.js";
import { ArmyEntity } from "./init/armyEntity.js";
import { ProductionComponent } from "./components/production.js";
import { TileManager } from "../engine/tile/tileManager.js";
import { ArmyEventHandler } from "./armyEventHandler.js";
import { FireMissionAction } from "./actions/fireMissionAction.js";
import { ClearDebrisAction } from "./actions/clearDebrisAction.js";
import { HealAction } from "./actions/healAction.js";
import { ArmyResources } from "./armyResources.js";
import { CollectAction } from "./actions/collectAction.js";
import { TownComponent } from "./components/town.js";

export const ArmyContext = function() {
    GameContext.call(this);

    this.settings = {};
    this.resources = new ArmyResources();
    this.eventHandler = new ArmyEventHandler();
    this.modeID = ArmyContext.GAME_MODE.NONE;
}

ArmyContext.prototype = Object.create(GameContext.prototype);
ArmyContext.prototype.constructor = ArmyContext;

ArmyContext.STATE = {
    MAIN_MENU: 0,
    STORY_MODE: 1,
    STORY_MODE_INTRO: 2,
    STORY_MODE_PLAY: 3,
    VERSUS_MODE: 4,
    VERSUS_MODE_LOBBY: 5,
    VERSUS_MODE_PLAY: 6,
    EDIT_MODE: 7
};

ArmyContext.GAME_MODE = {
    NONE: 0,
    STORY: 1,
    VERSUS: 2,
    EDIT: 3
};

ArmyContext.GAME_MODE_NAME = {
    [ArmyContext.GAME_MODE.NONE]: "none",
    [ArmyContext.GAME_MODE.STORY]: "story",
    [ArmyContext.GAME_MODE.VERSUS]: "versus",
    [ArmyContext.GAME_MODE.EDIT]: "edit"
};

ArmyContext.prototype.getGameModeName = function() {
    return ArmyContext.GAME_MODE_NAME[this.modeID];
}

ArmyContext.prototype.init = function(resources) {
    this.resources.load(this, resources);
    this.settings = resources.settings;
    this.transform2D.setSize(resources.settings.tileWidth, resources.settings.tileHeight);

    this.world.actionQueue.registerAction(ACTION_TYPE.ATTACK, new AttackAction());
    this.world.actionQueue.registerAction(ACTION_TYPE.CONSTRUCTION, new ConstructionAction());
    this.world.actionQueue.registerAction(ACTION_TYPE.COUNTER_ATTACK, new CounterAttackAction());
    this.world.actionQueue.registerAction(ACTION_TYPE.COUNTER_MOVE, new CounterMoveAction());
    this.world.actionQueue.registerAction(ACTION_TYPE.MOVE, new MoveAction());
    this.world.actionQueue.registerAction(ACTION_TYPE.FIRE_MISSION, new FireMissionAction());
    this.world.actionQueue.registerAction(ACTION_TYPE.CLEAR_DEBRIS, new ClearDebrisAction());
    this.world.actionQueue.registerAction(ACTION_TYPE.HEAL, new HealAction());
    this.world.actionQueue.registerAction(ACTION_TYPE.COLLECT, new CollectAction());
    
    this.world.entityManager.registerComponent(ArmyEntity.COMPONENT.ARMOR, ArmorComponent);
    this.world.entityManager.registerComponent(ArmyEntity.COMPONENT.ATTACK, AttackComponent);
    this.world.entityManager.registerComponent(ArmyEntity.COMPONENT.AVIAN, AvianComponent);
    this.world.entityManager.registerComponent(ArmyEntity.COMPONENT.CONSTRUCTION, ConstructionComponent);
    this.world.entityManager.registerComponent(ArmyEntity.COMPONENT.MOVE, MoveComponent);
    this.world.entityManager.registerComponent(ArmyEntity.COMPONENT.PRODUCTION, ProductionComponent);
    this.world.entityManager.registerComponent(ArmyEntity.COMPONENT.REVIVEABLE, ReviveableComponent);
    this.world.entityManager.registerComponent(ArmyEntity.COMPONENT.TOWN, TownComponent);

    this.eventHandler.createEvents();
    this.eventHandler.addEventExecutor(this);
    
    this.states.addState(ArmyContext.STATE.MAIN_MENU, new MainMenuState());
    this.states.addState(ArmyContext.STATE.STORY_MODE, new StoryModeState());
    this.states.addState(ArmyContext.STATE.VERSUS_MODE, new VersusModeState());
    this.states.addState(ArmyContext.STATE.EDIT_MODE, new MapEditorState());
    this.states.setNextState(this, ArmyContext.STATE.MAIN_MENU);
    this.timer.start();
}

ArmyContext.prototype.setGameMode = function(modeID) {
    const EVENT_TABLE = {};

    for(const eventID in ArmyEventHandler.TYPE) {
        EVENT_TABLE[ArmyEventHandler.TYPE[eventID]] = 1;
    }

    switch(modeID) {
        case ArmyContext.GAME_MODE.NONE: {
            this.modeID = ArmyContext.GAME_MODE.NONE;
            this.eventHandler.mode = ArmyEventHandler.MODE.NONE;
            break;
        }
        case ArmyContext.GAME_MODE.STORY: {
            this.modeID = ArmyContext.GAME_MODE.STORY;
            this.eventHandler.mode = ArmyEventHandler.MODE.STORY;
            this.world.eventBus.setEmitableTable(EVENT_TABLE);
            break;
        }
        case ArmyContext.GAME_MODE.EDIT: {
            this.modeID = ArmyContext.GAME_MODE.EDIT;
            this.eventHandler.mode = ArmyEventHandler.MODE.NONE;
            break;
        }
        case ArmyContext.GAME_MODE.VERSUS: {
            this.modeID = ArmyContext.GAME_MODE.VERSUS;
            this.eventHandler.mode = ArmyEventHandler.MODE.VERSUS;
            break;
        }
    }
}

ArmyContext.prototype.getConversionID = function(tileID, teamID) {
    const teamConversions = this.resources.tileConversions[getTeamName(teamID)];

    if(!teamConversions) {
        return TileManager.TILE_ID.EMPTY;
    }

    const convertedID = teamConversions[tileID];
    
    if(!convertedID) {
        return TileManager.TILE_ID.EMPTY;
    }

    return convertedID;
} 

ArmyContext.prototype.getAnimationForm = function(tileID) {
    const tileMeta = this.tileManager.getTile(tileID);

    if(tileMeta) {
        const { texture, tile } = tileMeta;
        const setForm = this.resources.tileFormConditions[texture];

        if(setForm) {
            const animationForm = setForm[tile];

            if(animationForm) {
                return animationForm;
            }
        }
    }

    return null;
}

ArmyContext.prototype.getTileType = function(id) {
    switch(id) {
        case TILE_TYPE.GROUND: return this.resources.tileTypes.Ground;
        case TILE_TYPE.MOUNTAIN: return this.resources.tileTypes.Mountain;
        case TILE_TYPE.SEA: return this.resources.tileTypes.Sea;
        case TILE_TYPE.SHORE: return this.resources.tileTypes.Shore;
        default: return this.resources.tileTypes.Error;
    }
}

ArmyContext.prototype.getTeamType = function(id) {
    switch(id) {
        case TEAM_TYPE.CRIMSON: return this.resources.teamTypes.Crimson;
        case TEAM_TYPE.ALLIES: return this.resources.teamTypes.Allies;
        case TEAM_TYPE.NEUTRAL: return this.resources.teamTypes.Neutral;
        case TEAM_TYPE.VERSUS: return this.resources.teamTypes.Versus;
        default: return this.resources.teamTypes.Neutral;
    }
}

ArmyContext.prototype.getDebrisType = function(id) {
    switch(id) {
        case DEBRIS_TYPE.DEBRIS: return this.resources.debrisTypes.Debris;
        case DEBRIS_TYPE.SCORCHED_GROUND: return this.resources.debrisTypes.ScorchedGround;
        default: return this.resources.debrisTypes.Error;
    }
}

ArmyContext.prototype.getAllianceType = function(allianceName) {
    const alliance = this.resources.allianceTypes[allianceName];

    if(!alliance) {
        return this.resources.allianceTypes.Error;
    }

    return alliance;
}

ArmyContext.prototype.getAlliance = function(teamA, teamB) {
    const teamID = getTeamID(teamA);
    const teamType = this.getTeamType(teamID);
    const allianceID = teamType.alliances[teamB];
    const alliance = this.getAllianceType(allianceID);

    return alliance;
}

ArmyContext.prototype.getFireMissionType = function(name) {
    const fireMission = this.resources.fireCallTypes[name];

    if(!fireMission) {
        return null;
    }

    return fireMission;
}

ArmyContext.prototype.getProductionType = function(name) {
    const productionType = this.resources.productionTypes[name];

    if(!productionType) {
        return this.resources.productionTypes.Error;
    }

    return productionType;
}