import { ArmyContext } from "../armyContext.js";
import { ArmyEntity } from "../init/armyEntity.js";
import { MapSystem } from "./map.js";
import { UnitLimitSystem } from "./unitLimit.js";

const BLOCKED_SPRITES = [
    "airdrop"
];

const createSprite = function(gameContext, config, tileX, tileY) {
    const { spriteManager, transform2D } = gameContext;
    const spriteType = config.sprites[ArmyEntity.SPRITE_TYPE.IDLE];
    const sprite = spriteManager.createSprite(spriteType, 1);
    const { x, y } = transform2D.transformTileToWorldCenter(tileX, tileY);

    sprite.setPosition(x, y);

    return sprite;
}

const adjustComponents = function(entity, stats) {
    const attackComponent = entity.getComponent(ArmyEntity.COMPONENT.ATTACK);

    if(attackComponent) {
        const {
            damage = 0,
            attackRange = 0
        } = stats;

        attackComponent.damage = damage;
        attackComponent.range = attackRange;
    }

    const moveComponent = entity.getComponent(ArmyEntity.COMPONENT.MOVE);

    if(moveComponent) {
        const {
            moveRange = 10,
            moveSpeed = 480
        } = stats;

        moveComponent.range = moveRange;
        moveComponent.speed = moveSpeed;
    }
}

const createEntity = function(gameContext, config, entityID) {
    const { world, spriteManager } = gameContext;
    const { entityManager } = world;
    const { tileX = -1, tileY = -1, team = null, type = null, health } = config;
    const entityType = entityManager.getEntityType(type);

    if(!entityType) {
        return null;
    }

    const modeID = gameContext.getGameModeName();
    const { archetype, stats } = entityType;
    const statConfig = stats[modeID];

    if(!statConfig) {
        return null;
    }

    const sprite = createSprite(gameContext, entityType, tileX, tileY);
    const entity = new ArmyEntity(entityID, type);
    
    sprite.addChild(entity.sprite);
    entity.setConfig(entityType);
    entity.tileX = tileX;
    entity.tileY = tileY;
    entity.teamID = team;
    entity.health = health !== undefined ? health : statConfig.health;
    entity.maxHealth = statConfig.health;

    entityManager.addArchetypeComponents(entity, archetype);
    entityManager.addTraitComponents(entity, statConfig.traits);

    adjustComponents(entity, statConfig);

    if(entity.hasComponent(ArmyEntity.COMPONENT.CONSTRUCTION)) {
        sprite.freeze();
        sprite.setFrame(0);
    }

    if(entity.isType(ArmyEntity.TYPE.HFE)) {
        entity.getComponent(ArmyEntity.COMPONENT.PRODUCTION).plantHFE("HFE_Oilwell");
    }

    if(entity.isType(ArmyEntity.TYPE.UNIT)) {
        entity.sprite.isFlippable = true;
    }
    
    return entity;
}

/**
 * Preloads the sounds an entity uses.
 * 
 * @param {ArmyContext} gameContext 
 * @param {ArmyEntity} entity 
 */
const loadEntitySounds = function(gameContext, entity) {
    const { client } = gameContext;
    const { soundPlayer } = client;
    const { sounds } = entity.config;

    for(const soundType in sounds) {
        const soundList = sounds[soundType];

        for(let i = 0; i < soundList.length; i++) {
            const soundID = soundList[i];

            soundPlayer.bufferAudio(soundID);
        }
    }
}

/**
 * Removes a reference from each sprite the entity uses.
 * 
 * @param {ArmyContext} gameContext 
 * @param {ArmyEntity} entity 
 */
const unloadEntitySprites = function(gameContext, entity) {
    const { spriteManager } = gameContext;
    const { sprites } = entity.config;

    for(const spriteType in sprites) {
        const spriteID = sprites[spriteType];

        spriteManager.removeReference(spriteID);
    }
}

/**
 * Preloads the sprites an entity uses.
 * 
 * @param {ArmyContext} gameContext 
 * @param {ArmyEntity} entity 
 */
const loadEntitySprites = function(gameContext, entity) {
    const { spriteManager } = gameContext;
    const { sprites } = entity.config;

    for(const spriteType in sprites) {
        if(!BLOCKED_SPRITES.includes(spriteType)) {
            spriteManager.loadBitmap(sprites[spriteType]);
        }
    }
}

/**
 * Adds the id of the entity to the owners.
 * 
 * @param {ArmyContext} gameContext 
 * @param {string[] | string} owners 
 * @param {ArmyEntity} entityID 
 */
const registerOwners = function(gameContext, owners, entity) {
    const { world } = gameContext;
    const { turnManager } = world;
    const entityID = entity.getID();

    switch(typeof owners) {
        case "number": {
            turnManager.addEntity(owners, entityID);
            break;
        }
        case "string": {
            turnManager.addEntity(owners, entityID);
            break;
        }
        case "object": {
            for(const ownerID of owners) {
                turnManager.addEntity(ownerID, entityID);
            }
            break;
        }
    }
}

/**
 * Collection of functions revolving around the spawning and despawning of entities.
 */
export const SpawnSystem = function() {}

/**
 * Creates an entity based on the specified config.
 * 
 * @param {ArmyContext} gameContext 
 * @param {SpawnConfigType} config 
 * @returns
 */
SpawnSystem.createEntity = function(gameContext, config) {
    if(!config) {
        return null;
    }

    const { world } = gameContext;
    const { entityManager } = world;
    const { owners, id, data } = config;
    const entity = entityManager.createEntity((entityID) => createEntity(gameContext, config, entityID), id);

    if(!entity) {
        return null;
    }
    
    if(data) {
        entity.load(data);
    }

    registerOwners(gameContext, owners, entity);
    loadEntitySprites(gameContext, entity);

    entity.determineSprite(gameContext);
    entity.generateStatCard(gameContext);
    MapSystem.placeEntity(gameContext, entity);
    UnitLimitSystem.addEntity(gameContext, entity);
    
    return entity;
}

/**
 * Destroys an entity, the sprite and removes it from the current map.
 * 
 * @param {ArmyContext} gameContext 
 * @param {ArmyEntity} entity 
 */
SpawnSystem.destroyEntity = function(gameContext, entity) {
    MapSystem.removeEntity(gameContext, entity);
    UnitLimitSystem.removeEntity(gameContext, entity);
    entity.sprite.destroy(gameContext);
    entity.destroy();

    unloadEntitySprites(gameContext, entity);
}

SpawnSystem.getSpawnConfig = function(gameContext, entity) {
    const { world } = gameContext;
    const { turnManager } = world;
    const entityID = entity.getID();
    const savedData = entity.save();
    const owners = turnManager.getOwnersOf(entityID).map(actor => actor.getID());
    
    return {
        "type": entity.config.id,
        "tileX": entity.tileX,
        "tileY": entity.tileY,
        "team": entity.teamID,
        "health": entity.health,
        "owners": owners,
        "data": savedData
    };
}