import { PlayerCursor } from "./playerCursor.js";
import { RangeVisualizer } from "./rangeVisualizer.js";
import { Inventory } from "./inventory/inventory.js";
import { PlayerIdleState } from "./states/idle.js";
import { PlayerSelectedState } from "./states/selected.js";
import { PlayerFireMissionState } from "./states/fireMission.js";
import { PlayerSpectateState } from "./states/spectate.js";
import { Actor } from "../../../engine/turn/actor.js";
import { StateMachine } from "../../../engine/state/stateMachine.js";
import { Queue } from "../../../engine/util/queue.js";
import { ArmyEventHandler } from "../../armyEventHandler.js";
import { AttackVisualizer } from "./attackVisualizer.js";
import { PlayerHealState } from "./states/heal.js";
import { AttackAction } from "../../actions/attackAction.js";
import { MissionHandler } from "./mission/missionHandler.js";
import { PlayerSellState } from "./states/sell.js";
import { PlayerDebugState } from "./states/debug.js";
import { PlayerPlaceState } from "./states/place.js";
import { MissionGroup } from "./mission/missionGroup.js";
import { ArmyContext } from "../../armyContext.js";
import { UnitLimitHandler } from "./unitLimit/unitLimitHandler.js";
import { ActionRequestEvent } from "../../events/actionRequest.js";
import { MissionCompleteEvent } from "../../events/missionComplete.js";

export const Player = function(id, camera) {
    Actor.call(this, id);

    this.camera = camera;
    this.teamID = null;
    this.inventory = new Inventory();
    this.inputQueue = new Queue(10);
    this.hover = new PlayerCursor();
    this.attackVisualizer = new AttackVisualizer();
    this.rangeVisualizer = new RangeVisualizer();
    this.missions = new MissionHandler();
    this.limits = new UnitLimitHandler();
    
    this.states = new StateMachine(this);
    this.states.addState(Player.STATE.SPECTATE, new PlayerSpectateState());
    this.states.addState(Player.STATE.IDLE, new PlayerIdleState());
    this.states.addState(Player.STATE.SELL, new PlayerSellState());
    this.states.addState(Player.STATE.SELECTED, new PlayerSelectedState());
    this.states.addState(Player.STATE.FIRE_MISSION, new PlayerFireMissionState());
    this.states.addState(Player.STATE.PLACE, new PlayerPlaceState());
    this.states.addState(Player.STATE.HEAL, new PlayerHealState());
    this.states.addState(Player.STATE.DEBUG, new PlayerDebugState());
}

Player.COMMAND = {
    CLICK: "CLICK",
    TOGGLE_RANGE: "TOGGLE_RANGE"
};

Player.EVENT = {
    CLICK: 0,
    TILE_CHANGE: 1,
    TARGET_CHANGE: 2
};

Player.STATE = {
    SPECTATE: "SPECTATE",
    IDLE: "IDLE",
    SELECTED: "SELECTED",
    FIRE_MISSION: "FIRE_MISSION",
    PLACE: "PLACE",
    HEAL: "HEAL",
    SELL: "SELL",
    DEBUG: "DEBUG"
};

Player.SPRITE_TYPE = {
    MOVE: "move",
    SELECT: "select",
    ATTACK: "attack",
    FIRE_MISSION: "powerup",
    REPAIR: "repair",
    PLACE: "place",
    DEBRIS: "debris"
};

Player.prototype = Object.create(Actor.prototype);
Player.prototype.constructor = Player;

Player.prototype.save = function() {
    return {
        "id": this.id,
        "missions": this.missions.save(),
        "inventory": this.inventory.save()
    }
}

Player.prototype.getSpriteType = function(typeID, spriteKey) {
    const spriteType = this.config.sprites[typeID];
    const spriteID = spriteType[spriteKey];

    return spriteID;
}

Player.prototype.selectFireMission = function(gameContext, fireMissionID) {
    const fireMission = gameContext.getFireMissionType(fireMissionID);

    if(!fireMission) {
        return;
    }

    this.states.setNextState(gameContext, Player.STATE.FIRE_MISSION, { "mission": fireMissionID });
}

Player.prototype.queueAttack = function(entityID) {
    const request = AttackAction.createRequest(this.id, entityID);

    this.inputQueue.enqueueLast(request);
}

Player.prototype.onClick = function(gameContext) {    
    this.hover.update(gameContext);
    this.states.eventEnter(gameContext, Player.EVENT.CLICK, null);
}

Player.prototype.onMakeChoice = function(gameContext, actionsLeft) {
    const { world } = gameContext;
    const { actionQueue, eventBus } = world;

    this.inputQueue.filterUntilFirstHit((request) => {
        const executionRequest = actionQueue.createExecutionRequest(gameContext, request);

        if(!executionRequest) {
            return Queue.FILTER.NO_SUCCESS;
        }

        eventBus.emit(ArmyEventHandler.TYPE.ACTION_REQUEST, ActionRequestEvent.createEvent(this.id, request, executionRequest));

        return Queue.FILTER.SUCCESS;
    });
}

Player.prototype.onTurnStart = function(gameContext) {
    this.states.setNextState(gameContext, Player.STATE.IDLE);
}

Player.prototype.onTurnEnd = function(gameContext) {
    this.states.setNextState(gameContext, Player.STATE.SPECTATE);
}

Player.prototype.update = function(gameContext) {
    this.hover.update(gameContext);

    if(this.hover.tileChanged) {
        this.states.eventEnter(gameContext, Player.EVENT.TILE_CHANGE, null);
    }

    if(this.hover.targetChanged) {
        this.states.eventEnter(gameContext, Player.EVENT.TARGET_CHANGE, null);
    }

    this.attackVisualizer.update(gameContext, this);
    this.rangeVisualizer.update(gameContext, this);
    this.states.update(gameContext);
}

Player.prototype.onMapCreate = function(mapID, mapData) {
    if(mapData.missions) {
        this.limits.createGroup(mapID);
        this.missions.createGroup(mapID, mapData.missions);
    }
}

Player.prototype.onMapEnable = function(gameContext, mapID, worldMap) {
    this.missions.selectGroup(mapID);
    this.limits.selectGroup(mapID);

    if(worldMap.music && gameContext.modeID !== ArmyContext.GAME_MODE.EDIT) {
        gameContext.client.musicPlayer.playTrack(worldMap.music);
    }
}

Player.prototype.showRange = function() {
    this.rangeVisualizer.enable();
}

Player.prototype.hideRange = function(gameContext) {
    this.rangeVisualizer.disable(gameContext, this.camera);
}

Player.prototype.toggleRange = function(gameContext) {
    this.rangeVisualizer.toggle(gameContext, this.camera);
}

Player.prototype.showAttackers = function() {
    this.attackVisualizer.enable();
}

Player.prototype.hideAttackers = function(gameContext) {
    this.attackVisualizer.disable(gameContext, this.camera);
}

Player.prototype.getCursorType = function(sizeX, sizeY) {
    if(this.attackVisualizer.attackers.current.size > 0) {
        if(this.attackVisualizer.isShowable) {
            return this.getSpriteType(Player.SPRITE_TYPE.ATTACK, `${sizeX}-${sizeY}`);
        }
    }

    return this.getSpriteType(Player.SPRITE_TYPE.SELECT, `${sizeX}-${sizeY}`);
}