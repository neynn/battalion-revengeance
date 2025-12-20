import { ActionHelper } from "../action/actionHelper.js";
import { Objective } from "./objective/objective.js";
import { CaptureObjective } from "./objective/types/capture.js";
import { DefeatObjective } from "./objective/types/defeat.js";
import { DefendObjective } from "./objective/types/defend.js";
import { ProtectObjective } from "./objective/types/protect.js";
import { SurviveObjective } from "./objective/types/survive.js";
import { TimeLimitObjective } from "./objective/types/timeLimit.js";
import { TypeRegistry } from "../type/typeRegistry.js";

export const Team = function(id) {
    this.id = id;
    this.allies = [];
    this.buildings = [];
    this.entities = [];
    this.units = new Set();
    this.lynchpins = new Set();
    this.faction = null;
    this.nation = null;
    this.actor = null;
    this.colorID = null;
    this.color = null;
    this.status = Team.STATUS.IDLE;
    this.exchangeRate = 1;
    this.funds = 0;
    this.flags = Team.FLAG.NONE;
    this.objectives = [
        new ProtectObjective(),
        new DefeatObjective(),
        new CaptureObjective(),
        new DefendObjective(),
        new TimeLimitObjective(),
        new SurviveObjective()
    ];
}

Team.FLAG = {
    NONE: 0,
    HAS_LYNCHPIN: 1 << 0
};

Team.OBJECTIVE_TYPE = {
    PROTECT: 0,
    DEFEAT: 1,
    CAPTURE: 2,
    DEFEND: 3,
    TIME_LIMIT: 4,
    SURVIVE: 5
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

Team.prototype.hasAnyObjective = function() {
    for(let i = 0; i < this.objectives.length; i++) {
        if(this.objectives[i].hasAnyTarget()) {
            return true;
        }
    }

    return false;
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
    this.objectives[Team.OBJECTIVE_TYPE.CAPTURE].onMove(gameContext, entity, this.id);
    this.objectives[Team.OBJECTIVE_TYPE.DEFEND].onMove(gameContext, entity, this.id);
}

Team.prototype.onEntityDeath = function(gameContext, entity) {
    const entityID = entity.getID();

    if(this.hasEntity(entityID)) {
        if(this.units.has(entityID)) {
            this.units.delete(entityID);
        }

        if(this.lynchpins.has(entityID)) {
            this.lynchpins.delete(entityID);
        }

        this.removeEntity(entityID);
    }

    this.objectives[Team.OBJECTIVE_TYPE.DEFEAT].onDeath(entity);
    this.objectives[Team.OBJECTIVE_TYPE.PROTECT].onDeath(entity);
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
        return this.status;
    }

    if(this.units.size === 0 || this.lynchpins.size === 0 && (this.flags & Team.FLAG.HAS_LYNCHPIN)) {
        this.status = Team.STATUS.LOSER;

        return this.status;
    }

    let objectivesWon = 0;
    let necessaryObjectives = 0;

    for(const objective of this.objectives) {
        const { status, targets } = objective;

        if(targets.length > 0) {
            switch(status) {
                case Objective.STATUS.IDLE: {
                    objectivesWon += objective.allTargetsComplete() ? 1 : 0;
                    break;
                }
                case Objective.STATUS.FAILURE: {
                    this.status = Team.STATUS.LOSER;  
                    return this.status;
                }
                case Objective.STATUS.SUCCESS: {
                    objectivesWon++;
                    break;
                }
            }

            necessaryObjectives++;
        }
    }

    if(necessaryObjectives === objectivesWon) {
        this.status = Team.STATUS.WINNER;
    }

    return this.status;
}

Team.prototype.loadObjectives = function(teamObjectives, allObjectives) {
    for(const objectiveID of teamObjectives) {
        const config = allObjectives[objectiveID];

        if(config) {
            const { type } = config;
            const index = Team.OBJECTIVE_TYPE[type];

            if(index !== undefined && index >= 0 && index < this.objectives.length) {
                this.objectives[index].addTarget(config);
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

    this.objectives[Team.OBJECTIVE_TYPE.SURVIVE].onTurnEnd(turn);
    this.objectives[Team.OBJECTIVE_TYPE.TIME_LIMIT].onTurnEnd(turn);

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
            this.units.add(entityID);
        }

        if(entity.hasTrait(TypeRegistry.TRAIT_TYPE.LYNCHPIN)) {
            this.lynchpins.add(entityID);
            this.flags |= Team.FLAG.HAS_LYNCHPIN;
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