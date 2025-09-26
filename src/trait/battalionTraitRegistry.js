import { BattalionEntity } from "../entity/battalionEntity.js";
import { Trait } from "./trait.js";
import { TraitRegistry } from "./traitRegistry.js";
import { AbsorberTrait } from "./types/absorber.js";

export const BattalionTraitRegistry = function() {
    TraitRegistry.call(this);

    this.registerTrait(BattalionEntity.TRAIT.ABSORBER, new AbsorberTrait());
    this.registerTrait(BattalionEntity.TRAIT.AIR_TRANSPORT, new Trait());
    this.registerTrait(BattalionEntity.TRAIT.ANTI_AIR, new Trait());
    this.registerTrait(BattalionEntity.TRAIT.ANTI_INFANTRY, new Trait());
    this.registerTrait(BattalionEntity.TRAIT.ANTI_SHIP, new Trait());
    this.registerTrait(BattalionEntity.TRAIT.ANTI_STRUCTURE, new Trait());
    this.registerTrait(BattalionEntity.TRAIT.ANTI_TANK, new Trait());
    this.registerTrait(BattalionEntity.TRAIT.BEWEGUNGSKRIEG, new Trait());
    this.registerTrait(BattalionEntity.TRAIT.CAVITATION_EXPLOSION, new Trait());
    this.registerTrait(BattalionEntity.TRAIT.CEMENTED_STEEL_ARMOR, new Trait());
    this.registerTrait(BattalionEntity.TRAIT.COMMANDO, new Trait());
    this.registerTrait(BattalionEntity.TRAIT.DEPTH_STRIKE, new Trait());
    this.registerTrait(BattalionEntity.TRAIT.DISPERSION, new Trait());
    this.registerTrait(BattalionEntity.TRAIT.INDOMITABLE, new Trait());
    this.registerTrait(BattalionEntity.TRAIT.INFLAMING, new Trait());
    this.registerTrait(BattalionEntity.TRAIT.JUDGEMENT, new Trait());
    this.registerTrait(BattalionEntity.TRAIT.MOBILE_BATTERY, new Trait());
    this.registerTrait(BattalionEntity.TRAIT.NAVAL_TRANSPORT, new Trait());
    this.registerTrait(BattalionEntity.TRAIT.SCHWERPUNKT, new Trait());
    this.registerTrait(BattalionEntity.TRAIT.SEABOUND, new Trait());
    this.registerTrait(BattalionEntity.TRAIT.SKYSWEEPER, new Trait());
    this.registerTrait(BattalionEntity.TRAIT.SONAR, new Trait());
    this.registerTrait(BattalionEntity.TRAIT.STEALTH, new Trait());
    this.registerTrait(BattalionEntity.TRAIT.STEER, new Trait());
    this.registerTrait(BattalionEntity.TRAIT.STREAMBLAST, new Trait());
    this.registerTrait(BattalionEntity.TRAIT.SUBMERGED, new Trait());
    this.registerTrait(BattalionEntity.TRAIT.SUICIDE, new Trait());
    this.registerTrait(BattalionEntity.TRAIT.SUPPLY_DISTRIBUTION, new Trait());
    this.registerTrait(BattalionEntity.TRAIT.TANK_HUNTER, new Trait());
    this.registerTrait(BattalionEntity.TRAIT.TERRIFYING, new Trait());
}

BattalionTraitRegistry.prototype = Object.create(TraitRegistry.prototype);
BattalionTraitRegistry.prototype.constructor = BattalionTraitRegistry;

BattalionTraitRegistry.prototype.handleAttack = function(gameContext, attack) {
    const { attacker, defender } = attack;
    const attackerTraits = attacker.traits;
    const defenderTraits = defender.traits;

    for(let i = 0; i < attackerTraits.length; i++) {
        const trait = this.getTrait(attackerTraits[i]);

        if(trait) {
            trait.onAttack(gameContext, attack);
        }
    }

    for(let i = 0; i < defenderTraits.length; i++) {
        const trait = this.getTrait(defenderTraits[i]);

        if(trait) {
            trait.onDefend(gameContext, attack);
        }
    }
}