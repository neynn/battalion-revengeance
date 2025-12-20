import { ActionHelper } from "../action/actionHelper.js";
import { Objective } from "./objective/objective.js";
import { CaptureObjective } from "./objective/types/capture.js";
import { DefeatObjective } from "./objective/types/defeat.js";
import { DefendObjective } from "./objective/types/defend.js";
import { ProtectObjective } from "./objective/types/protect.js";
import { SurviveObjective } from "./objective/types/survive.js";
import { TimeLimitObjective } from "./objective/types/timeLimit.js";
import { TypeRegistry } from "../type/typeRegistry.js";
import { UnitSurviveObjective } from "./objective/types/unitSurvive.js";
import { LynchpinObjective } from "./objective/types/lynchpin.js";

export const Team = function(id) {
    this.id = id;
    this.allies = [];
    this.buildings = [];
    this.entities = [];
    this.faction = null;
    this.nation = null;
    this.actor = null;
    this.colorID = null;
    this.color = null;
    this.status = Team.STATUS.IDLE;
    this.exchangeRate = 1;
    this.funds = 0;
    this.objectives = [
        new UnitSurviveObjective(),
        new LynchpinObjective()
    ];
}

Team.OBJECTIVE = {
    UNIT_SURVIVE: 0,
    LYNCHPIN: 1
};

Team.STATUS = {
    IDLE: 0,
    WINNER: 1,
    LOSER: 2
};

Team.prototype.addBuilding = function(building) {
    const buildingID = building.getID();

    for(let i = 0; i < this.buildings.length; i++) {
        if(this.buildings[i].getID() === buildingID) {
            return;
        }
    }

    this.buildings.push(building);
}

Team.prototype.removeBuilding = function(building) {
    const buildingID = building.getID();

    for(let i = 0; i < this.buildings.length; i++) {
        if(this.buildings[i].getID() === buildingID) {
            this.buildings[i] = this.buildings[this.buildings.length - 1];
            this.buildings.pop();
            break;
        }
    }
}

Team.prototype.loadAsNation = function(gameContext, nationID) {
    const { typeRegistry } = gameContext;
    const nationType = typeRegistry.getNationType(nationID);
    const { color, faction, currency } = nationType;

    const factionType = typeRegistry.getFactionType(faction);
    const currencyType = typeRegistry.getCurrencyType(currency);
    const isColorSet = this.setColor(gameContext, color);

    this.nation = nationType;
    this.faction = factionType;

    if(!isColorSet) {
        this.setColor(gameContext, factionType.color);
    }

    if(currencyType) {
        const { exchangeRate } = currencyType;

        this.exchangeRate = exchangeRate;
    }
}

Team.prototype.loadAsFaction = function(gameContext, factionID) {
    const { typeRegistry } = gameContext;
    const factionType = typeRegistry.getFactionType(factionID);
    const { color } = factionType;

    this.faction = factionType;
    this.setColor(gameContext, color);
}

Team.prototype.getDisplayName = function(gameContext) {
    const { language } = gameContext;

    if(this.nation) {
        return language.getSystemTranslation(this.nation.name);
    }

    if(this.faction) {
        return language.getSystemTranslation(this.faction.name);
    }

    return language.getSystemTranslation("MISSING_NAME");
}

Team.prototype.hasActor = function() {
    return this.actor !== null
}

Team.prototype.setActor = function(actorID) {
    this.actor = actorID;
}

Team.prototype.getID = function() {
    return this.id;
}

Team.prototype.onEntityMove = function(gameContext, entity) {
    for(const objective of this.objectives) {
        objective.onEntityMove(gameContext, entity, this.id);
    }
}

Team.prototype.onEntityDeath = function(entity) {
    const entityID = entity.getID();

    this.removeEntity(entityID);

    for(const objective of this.objectives) {
        objective.onEntityDeath(entity);
    }
}

Team.prototype.setCustomColor = function(color) {
    this.colorID = "CUSTOM_" + this.id;
    this.color = color;
}

Team.prototype.setColor = function(gameContext, colorID) {
    const { typeRegistry } = gameContext;
    const color = typeRegistry.getSchemaType(colorID);

    if(color) {
        this.colorID = colorID;
        this.color = color;

        return true;
    }

    return false;
}

Team.prototype.isAlly = function(teamID) {
    if(this.id === teamID) {
        return true;
    }
    
    for(let i = 0; i < this.allies.length; i++) {
        if(this.allies[i] === teamID) {
            return true;
        }
    }

    return false;
}

Team.prototype.addAlly = function(teamID) {
    if(!this.isAlly(teamID)) {
        this.allies.push(teamID);
    }
}

Team.prototype.isLoser = function() {
    return this.status === Team.STATUS.LOSER;
}

Team.prototype.isWinner = function() {
    return this.status === Team.STATUS.WINNER;
}

Team.prototype.updateStatus = function() {
    if(this.status !== Team.STATUS.IDLE) {
        return;
    }

    let objectivesWon = 0;
    let necessaryObjectives = 0;

    for(const objective of this.objectives) {
        const { status } = objective;

        switch(status) {
            case Objective.STATUS.ACTIVE: {     
                necessaryObjectives++;
                break;
            }
            case Objective.STATUS.SUCCESS: {
                necessaryObjectives++;
                objectivesWon++;
                break;
            }
            case Objective.STATUS.FAILURE: {
                this.status = Team.STATUS.LOSER;
                return;
            }
        }
    }

    if(necessaryObjectives !== 0 && objectivesWon === necessaryObjectives) {
        this.status = Team.STATUS.WINNER;
    }
}

Team.prototype.loadObjectives = function(teamObjectives, allObjectives) {
    for(const objectiveID of teamObjectives) {
        const config = allObjectives[objectiveID];

        if(!config) {
            continue;
        }

        const { type } = config;

        switch(type) {
            case TypeRegistry.OBJECTIVE_TYPE.DEFEAT: {
                this.objectives.push(new DefeatObjective(config.target));
                break;
            }
            case TypeRegistry.OBJECTIVE_TYPE.PROTECT: {
                this.objectives.push(new ProtectObjective(config.targets));
                break;
            }
            case TypeRegistry.OBJECTIVE_TYPE.CAPTURE: {
                this.objectives.push(new CaptureObjective(config.tiles));
                break;
            }
            case TypeRegistry.OBJECTIVE_TYPE.DEFEND: {
                this.objectives.push(new DefendObjective(config.tiles));
                break;
            }
            case TypeRegistry.OBJECTIVE_TYPE.SURVIVE: {
                this.objectives.push(new SurviveObjective(config.turn));
                break;
            }
            case TypeRegistry.OBJECTIVE_TYPE.TIME_LIMIT: {
                this.objectives.push(new TimeLimitObjective(config.turn));
                break;
            }
            default: {
                console.error("UNKNOWN OBJECTIVE TYPE!", type);
                break;
            }
        }
    }
}

Team.prototype.onTurnEnd = function(gameContext, turn) {
    const { world, teamManager } = gameContext;
    const { entityManager } = world;

    for(const entityID of this.entities) {
        const entity = entityManager.getEntity(entityID);

        if(entity) {
            entity.onTurnEnd(gameContext);
        }
    }

    for(const objective of this.objectives) {
        objective.onTurnEnd(turn);
    }

    teamManager.updateStatus(gameContext);
}

Team.prototype.onTurnStart = function(gameContext, turn) {
    const { world, actionRouter } = gameContext;
    const { entityManager } = world;
    const deadEntities = [];

    for(const entityID of this.entities) {
        const entity = entityManager.getEntity(entityID);

        if(entity) {
            entity.onTurnStart(gameContext);

            if(entity.isDead()) {
                deadEntities.push(entityID);
            }
        }
    }

    if(deadEntities.length !== 0) {
        actionRouter.forceEnqueue(gameContext, ActionHelper.createDeathRequest(gameContext, deadEntities));
    }
}

Team.prototype.addEntity = function(entity) {
    const entityID = entity.getID();

    if(!this.hasEntity(entityID)) {
        if(!entity.hasTrait(TypeRegistry.TRAIT_TYPE.FIXED)) {
            this.objectives[Team.OBJECTIVE.UNIT_SURVIVE].addUnit(entityID);
        }

        if(entity.hasTrait(TypeRegistry.TRAIT_TYPE.LYNCHPIN)) {
            this.objectives[Team.OBJECTIVE.LYNCHPIN].addLynchpin(entityID);
        }
        
        this.entities.push(entityID);
    }
}

Team.prototype.removeEntity = function(entityID) {
    for(let i = 0; i < this.entities.length; i++) {
        if(this.entities[i] === entityID) {
            this.entities[i] = this.entities[this.entities.length - 1];
            this.entities.pop();
            return;
        }
    }
}

Team.prototype.hasEntity = function(entityID) {
    for(let i = 0; i < this.entities.length; i++) {
        if(this.entities[i] === entityID) {
            return true;
        }
    }

    return false;
}