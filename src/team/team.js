import { Objective } from "./objective/objective.js";
import { UnitSurviveObjective } from "./objective/types/unitSurvive.js";
import { LynchpinObjective } from "./objective/types/lynchpin.js";
import { COMMANDER_TYPE, CURRENCY_TYPE, COLOR_TYPE, TEAM_STAT, TRAIT_TYPE, FACTION_TYPE } from "../enums.js";
import { SCORE_BONUS, VICTORY_BONUS } from "../constants.js";
import { createTeamSnapshot } from "../snapshot/teamSnapshot.js";

export const Team = function(id) {
    this.id = id;
    this.roster = [];
    this.faction = FACTION_TYPE._INVALID;
    this.color = COLOR_TYPE.RED;
    this.currency = CURRENCY_TYPE.NONE;
    this.commander = COMMANDER_TYPE.NONE;
    this.customName = null;
    this.name = "MISSING_NAME_TEAM";
    this.cash = 0;
    this.turn = 0;
    this.stats = [];
    this.status = Team.STATUS.IDLE;
    this.isReserved = false;
    this.objectives = [
        new UnitSurviveObjective(),
        new LynchpinObjective()
    ];

    for(let i = 0; i < TEAM_STAT._COUNT; i++) {
        this.stats[i] = 0;
    }
}

Team.STATUS = {
    IDLE: 0,
    WINNER: 1,
    LOSER: 2
};

Team.OBJECTIVE = {
    UNIT_SURVIVE: 0,
    LYNCHPIN: 1
};

Team.prototype.reset = function() {
    this.roster.length = 0;
    this.color = COLOR_TYPE.RED;
    this.currency = CURRENCY_TYPE.NONE;
    this.commander = COMMANDER_TYPE.NONE;
    this.customName = null;
    this.name = "MISSING_NAME_TEAM";
    this.cash = 0;
    this.turn = 0;
    this.status = Team.STATUS.IDLE;
    this.isReserved = false;

    this.objectives[Team.OBJECTIVE.UNIT_SURVIVE].reset();
    this.objectives[Team.OBJECTIVE.LYNCHPIN].reset();
    this.objectives.length = 2;

    for(let i = 0; i < TEAM_STAT._COUNT; i++) {
        this.stats[i] = 0;
    }
}

Team.prototype.save = function() {
    const snapshot = createTeamSnapshot();

    snapshot.stats = this.stats;
    snapshot.cash = this.cash;
    snapshot.turn = this.turn;

    for(let i = 0; i < TEAM_STAT._COUNT; i++) {
        snapshot.stats[i] = this.stats[i];
    }

    for(const objective of this.objectives) {
        snapshot.objectives.push(objective.save());
    }

    return snapshot;
}

Team.prototype.load = function(data) {
    const objectives = data.objectives;

    this.status = data.status;
    this.cash = data.cash;
    this.stats = data.stats;
    this.turn = data.turn;

    if(objectives.length !== this.objectives.length) {
        console.error("Critical! Saved objectives do not align with all objectives!");
        return;
    }

    for(let i = 0; i < this.objectives.length; i++) {
        const objectiveData = objectives[i];

        this.objectives[i].load(objectiveData);
    }
}

Team.prototype.getStatistic = function(statID) {
    if(statID < 0 || statID >= this.stats.length) {
        return 0;
    }

    return this.stats[statID]
}

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

Team.prototype.getRegularCost = function(gameContext, cost) {
    return this.getExchangeRate(gameContext) * cost;
}

Team.prototype.getExchangeRate = function(gameContext) {
    const { typeRegistry } = gameContext;
    const { exchangeRate } = typeRegistry.getCurrencyType(this.currency);

    return exchangeRate;
}

Team.prototype.hasEnoughCash = function(cost) {
    return this.cash >= cost;
}

Team.prototype.loadAsFaction = function(gameContext, factionID) {
    const { typeRegistry } = gameContext;
    const { color, name, currency } = typeRegistry.getFactionType(factionID);

    this.faction = factionID;
    this.name = name;
    this.color = color;
    this.currency = currency;
}

Team.prototype.getDisplayName = function(gameContext) {
    if(this.customName) {
        return this.customName;
    }

    const { language } = gameContext;

    return language.getSystemTranslation(this.name);
}

Team.prototype.getID = function() {
    return this.id;
}

Team.prototype.onEntityDeath = function(entity) {
    const entityID = entity.getID();

    this.removeFromRoster(entityID);

    for(const objective of this.objectives) {
        objective.onEntityDeath(entity);
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

Team.prototype.addGeneratedCash = function(cash) {
    this.cash += cash;
    this.addStatistic(TEAM_STAT.RESOURCES_COLLECTED, cash);

    return this.cash;
}

Team.prototype.addToRoster = function(entity) {
    const entityID = entity.getID();

    if(!this.hasInRoster(entityID)) {
        if(!entity.hasTrait(TRAIT_TYPE.FIXED)) {
            this.objectives[Team.OBJECTIVE.UNIT_SURVIVE].addUnit(entityID);
        }

        if(entity.hasTrait(TRAIT_TYPE.LYNCHPIN)) {
            this.objectives[Team.OBJECTIVE.LYNCHPIN].addLynchpin(entityID);
        }
        
        this.roster.push(entityID);
    }
}

Team.prototype.removeFromRoster = function(entityID) {
    for(let i = 0; i < this.roster.length; i++) {
        if(this.roster[i] === entityID) {
            this.roster[i] = this.roster[this.roster.length - 1];
            this.roster.pop();
            return;
        }
    }
}

Team.prototype.hasInRoster = function(entityID) {
    for(let i = 0; i < this.roster.length; i++) {
        if(this.roster[i] === entityID) {
            return true;
        }
    }

    return false;
}