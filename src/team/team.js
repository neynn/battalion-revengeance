import { createDeathIntent, createUncloakIntent } from "../action/actionHelper.js";
import { Objective } from "./objective/objective.js";
import { UnitSurviveObjective } from "./objective/types/unitSurvive.js";
import { LynchpinObjective } from "./objective/types/lynchpin.js";
import { getGlobalGeneratedCash } from "../systems/cash.js";
import { SCHEMA_TYPE, TEAM_STAT, TRAIT_TYPE } from "../enums.js";
import { SCORE_BONUS, VICTORY_BONUS } from "../constants.js";

export const Team = function(id) {
    this.id = id;
    this.allies = [];
    this.buildings = [];
    this.entities = [];
    this.colorID = SCHEMA_TYPE.RED;
    this.color = null;
    this.status = Team.STATUS.IDLE;
    this.exchangeRate = 1;
    this.funds = 0;
    this.name = "MISSING_NAME_TEAM";
    this.desc = "MISSING_DESC_TEAM";
    this.flags = Team.FLAG.NONE;
    this.stats = [];
    this.objectives = [
        new UnitSurviveObjective(),
        new LynchpinObjective()
    ];

    for(let i = 0; i < TEAM_STAT.COUNT; i++) {
        this.stats[i] = 0;
    }
}

Team.FLAG = {
    NONE: 0,
    IS_NATION: 1 << 0
};

Team.OBJECTIVE = {
    UNIT_SURVIVE: 0,
    LYNCHPIN: 1
};

Team.STATUS = {
    IDLE: 0,
    WINNER: 1,
    LOSER: 2
};

Team.prototype.addStatistic = function(statID, value) {
    if(statID < 0 || statID >= this.stats.length) {
        return;
    }

    this.stats[statID] += value;
}

Team.prototype.calculateFinalScore = function() {
    let score = 0;

    score += this.stats[TEAM_STAT.UNITS_BUILT] * SCORE_BONUS[TEAM_STAT.UNITS_BUILT];
    score += this.stats[TEAM_STAT.UNITS_KILLED] * SCORE_BONUS[TEAM_STAT.UNITS_KILLED];
    score += this.stats[TEAM_STAT.UNITS_LOST] * SCORE_BONUS[TEAM_STAT.UNITS_LOST];
    score += this.stats[TEAM_STAT.STRUCTURES_CAPTURED] * SCORE_BONUS[TEAM_STAT.STRUCTURES_CAPTURED];
    score += this.stats[TEAM_STAT.STRUCTURES_LOST] * SCORE_BONUS[TEAM_STAT.STRUCTURES_LOST];
    score += this.stats[TEAM_STAT.RESOURCES_COLLECTED] * SCORE_BONUS[TEAM_STAT.RESOURCES_COLLECTED];

    if(this.status === Team.STATUS.WINNER) {
        score += VICTORY_BONUS;
    }

    score /= this.stats[TEAM_STAT.ROUNDS_TAKEN];

    //ROUNDS_TAKEN gets +1 for EVERY team.
    //Difficulty modifier: 0.5 for easy, 2 for hard.

    if(score < 0) {
        score = 0;
    }

    this.stats[TEAM_STAT.FINAL_SCORE] = score;

    return score;
}

Team.prototype.reduceCash = function(cash) {
    this.cash -= cash;
}

Team.prototype.hasEnoughCash = function(cash) {
    return this.cash >= cash;
}

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
    const { name, desc, color, faction, currency } = typeRegistry.getNationType(nationID);
    const factionType = typeRegistry.getFactionType(faction);
    const currencyType = typeRegistry.getCurrencyType(currency);
    const isColorSet = this.setColor(gameContext, color);

    this.name = name;
    this.desc = desc;
    this.flags |= Team.FLAG.IS_NATION;

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
    const { color, name, desc }  = typeRegistry.getFactionType(factionID);

    if((this.flags & Team.FLAG.IS_NATION) === 0) {
        this.name = name;
        this.desc = desc;
    }

    this.setColor(gameContext, color);
}

Team.prototype.getDisplayDesc = function(gameContext) {
    const { language } = gameContext;

    return language.getSystemTranslation(this.desc);
}

Team.prototype.getDisplayName = function(gameContext) {
    const { language } = gameContext;

    return language.getSystemTranslation(this.name);
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

    //Edge case: Team was created with NO units(automatically lose).
    if(this.objectives[Team.OBJECTIVE.UNIT_SURVIVE].isEmpty()) {
        this.status = Team.STATUS.LOSER;
    }
}

Team.prototype.addObjective = function(objective) {
    this.objectives.push(objective);
}

Team.prototype.endTurn = function(gameContext) {
    const { world } = gameContext;
    const { entityManager } = world;
    const turn = this.stats[TEAM_STAT.ROUNDS_TAKEN];

    for(const entityID of this.entities) {
        const entity = entityManager.getEntity(entityID);

        if(entity) {
            entity.onTurnEnd(gameContext);
        }
    }

    for(const objective of this.objectives) {
        objective.onTurnEnd(turn);
    }
}

Team.prototype.generateBuildingCash = function(gameContext) {
    let totalCash = 0;

    for(const building of this.buildings) {
        const cash = getGlobalGeneratedCash(gameContext, building.config.traits);

        totalCash += cash;
    }

    this.funds += totalCash;
    this.addStatistic(TEAM_STAT.RESOURCES_COLLECTED, totalCash);

    return totalCash;
}

Team.prototype.startTurn = function(gameContext) {
    const { world, actionRouter } = gameContext;
    const { entityManager } = world;
    const deadEntities = [];
    const uncloakedEntities = [];

    for(const entityID of this.entities) {
        const entity = entityManager.getEntity(entityID);

        if(entity) {
            entity.onTurnStart();  

            //Entities are immune to taking damage/proccing on their first turn.
            if(entity.turns > 1) {
                entity.takeTerrainDamage(gameContext);

                if(entity.isDead()) {
                    deadEntities.push(entityID);
                } else {
                    if(entity.hasTrait(TRAIT_TYPE.RADAR)) {
                        const uncloaked = entity.getUncloakedEntitiesAtSelf(gameContext);

                        for(const uEntity of uncloaked) {
                            const uEntityID = uEntity.getID();

                            if(!uncloakedEntities.includes(uEntityID)) {
                                uncloakedEntities.push(uEntityID);
                            }
                        }
                    }
                }
            }
        }
    }

    if(deadEntities.length !== 0) {
        actionRouter.forceEnqueue(gameContext, createDeathIntent(deadEntities));
    }

    if(uncloakedEntities.length !== 0) {
        actionRouter.forceEnqueue(gameContext, createUncloakIntent(uncloakedEntities));
    }
}

Team.prototype.addEntity = function(entity) {
    const entityID = entity.getID();

    if(!this.hasEntity(entityID)) {
        if(!entity.hasTrait(TRAIT_TYPE.FIXED)) {
            this.objectives[Team.OBJECTIVE.UNIT_SURVIVE].addUnit(entityID);
        }

        if(entity.hasTrait(TRAIT_TYPE.LYNCHPIN)) {
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