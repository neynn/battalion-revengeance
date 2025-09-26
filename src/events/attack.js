export const Attack = function(attacker, defender) {
    this.attacker = attacker;
    this.defender = defender;
    this.damage = 0;
    this.result = Attack.RESULT_STATE.ALIVE;
    this.isCounterable = false;
}

Attack.RESULT_STATE = {
    ALIVE: 0,
    DEAD: 1
};

Attack.prototype.toJSON = function() {
    return {
        "attacker": this.attacker.getID(),
        "defender": this.defender.getID(),
        "damage": this.damage,
        "result": this.result,
        "isCounterable": this.isCounterable
    }
}

Attack.prototype.fromJSON = function(gameContext, json) {
    const { world } = gameContext;
    const { entityManager } = world;
    
    this.attacker = entityManager.getEntity(json.attacker);
    this.defender = entityManager.getEntity(json.defender);
    this.damage = json.damage;
    this.result = json.result;
    this.isCounterable = json.isCounterable;
}