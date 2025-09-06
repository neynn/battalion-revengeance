export const AttackComponent = function() {
    this.damage = 0;
    this.range = 0;
    this.type = AttackComponent.ATTACK_TYPE.PASSIVE;
    this.counter = AttackComponent.COUNTER_TYPE.NONE;
    this.bulldoze = AttackComponent.BULLDOZE_TYPE.NONE;
}

AttackComponent.BULLDOZE_TYPE = {
    NONE: 0,
    UNIT: 1 << 0,
    DECO: 1 << 1,
    BUILDING: 1 << 2
};

AttackComponent.COUNTER_TYPE = {
    NONE: 0,
    MOVE: 1 << 0,
    ATTACK: 1 << 1
};

AttackComponent.ATTACK_TYPE = {
    PASSIVE: 0,
    ACTIVE: 1
};

AttackComponent.BULLDOZE_FLAG_MAP = {
    "Unit": AttackComponent.BULLDOZE_TYPE.UNIT,
    "Deco": AttackComponent.BULLDOZE_TYPE.DECO,
    "Building": AttackComponent.BULLDOZE_TYPE.BUILDING
};

AttackComponent.COUNTER_FLAG_MAP = {
    "Move": AttackComponent.COUNTER_TYPE.MOVE,
    "Attack": AttackComponent.COUNTER_TYPE.ATTACK
};

AttackComponent.prototype.isActive = function() {
    return this.type === AttackComponent.ATTACK_TYPE.ACTIVE;
}

AttackComponent.prototype.isBulldozed = function(archetype) {
    const property = AttackComponent.BULLDOZE_FLAG_MAP[archetype];

    if(property === undefined) {
        return false;
    }

    return (this.bulldoze & property) !== 0;
}

AttackComponent.prototype.isAttackCounterable = function() {
    return (this.counter & AttackComponent.COUNTER_TYPE.ATTACK) !== 0;
}

AttackComponent.prototype.isMoveCounterable = function() {
    return (this.counter & AttackComponent.COUNTER_TYPE.MOVE) !== 0;
}

AttackComponent.prototype.toPassive = function() {
    this.type = AttackComponent.ATTACK_TYPE.PASSIVE;
}

AttackComponent.prototype.toActive = function() {
    this.type = AttackComponent.ATTACK_TYPE.ACTIVE;
}

AttackComponent.prototype.getDamage = function(armor) {
    const damage = this.damage - armor;

    if(damage < 0) {
        return 0;
    }

    return damage;
}

AttackComponent.prototype.init = function(config) {
    const { counter, bulldoze, active } = config;

    if(active) {
        this.type = AttackComponent.ATTACK_TYPE.ACTIVE;
    }

    if(counter) {
        for(let i = 0; i < counter.length; i++) {
            const flagID = counter[i];
            const flag = AttackComponent.COUNTER_FLAG_MAP[flagID];

            if(flag !== undefined) {
                this.counter |= flag;
            }
        } 
    }

    if(bulldoze) {
        for(let i = 0; i < bulldoze.length; i++) {
            const flagID = bulldoze[i];
            const flag = AttackComponent.BULLDOZE_FLAG_MAP[flagID];

            if(flag !== undefined) {
                this.bulldoze |= flag;
            }
        } 
    }
}