export const Attack = function(attacker, defender) {
    this.attacker = attacker;
    this.defender = defender;
    this.damage = 0;
}

Attack.prototype.handleTraits = function(gameContext) {
    const { traitRegistry } = gameContext;
    const attackerTraits = this.attacker.traits;
    const defenderTraits = this.defender.traits;

    for(let i = 0; i < attackerTraits.length; i++) {
        const trait = traitRegistry.getTrait(attackerTraits[i]);

        if(trait) {
            trait.handleAttack(gameContext, this);
        }
    }

    for(let i = 0; i < defenderTraits.length; i++) {
        const trait = traitRegistry.getTrait(defenderTraits[i]);

        if(trait) {
            trait.handleAttack(gameContext, this);
        }
    }
}