import { getRandomElement } from "../../engine/math/math.js";
import { SpriteHelper } from "../../engine/sprite/spriteHelper.js";
import { SpriteManager } from "../../engine/sprite/spriteManager.js";
import { BattalionEntity } from "./battalionEntity.js";
import { BattalionSprite } from "./battalionSprite.js";

const SCHEMAS = {
    "BLUE": {
        0x661A5E: [61, 49, 127],
        0xAA162C: [43, 95, 199],
        0xE9332E: [69, 164, 225],
        0xFF9085: [169, 207, 255]
    },
    "GREEN": {
        0x661A5E: [30, 91, 35],
        0xAA162C: [95, 147, 95],
        0xE9332E: [143, 222, 101],
        0xFF9085: [241, 246, 95]
    },
    "YELLOW": {
        0x661A5E: [134, 114, 52],
        0xAA162C: [217, 164, 73],
        0xE9332E: [242, 225, 104],
        0xFF9085: [255, 255, 160]
    },
    "DARK_RED": {
        0x661A5E: [42, 33, 52],
        0xAA162C: [78, 12, 35],
        0xE9332E: [138, 26, 17],
        0xFF9085: [220, 86, 86]
    },
    "DARK_BLUE": {
        0x661A5E: [30, 28, 59],
        0xAA162C: [22, 39, 117],
        0xE9332E: [65, 68, 147],
        0xFF9085: [99, 112, 173]
    },
    "BRONZE": {
        0x661A5E: [50, 42, 50],
        0xAA162C: [95, 69, 104],
        0xE9332E: [150, 125, 41],
        0xFF9085: [216, 147, 69]
    },
    "DARK_GREEN": {
        0x661A5E: [53, 61, 25],
        0xAA162C: [65, 91, 13],
        0xE9332E: [130, 156, 39],
        0xFF9085: [203, 212, 68]
    },
    "GOLD": {
        0x661A5E: [95, 56, 65],
        0xAA162C: [199, 65, 52],
        0xE9332E: [255, 182, 14],
        0xFF9085: [255, 255, 69]
    },
    "CYAN": {
        0x661A5E: [95, 86, 151],
        0xAA162C: [69, 147, 99],
        0xE9332E: [151, 216, 238],
        0xFF9085: [255, 255, 203]
    },
    "PINK": {
        0x661A5E: [114, 36, 82],
        0xAA162C: [196, 84, 129],
        0xE9332E: [255, 143, 182],
        0xFF9085: [255, 215, 220]
    },
    "WHITE": {
        0x661A5E: [106, 103, 141],
        0xAA162C: [179, 193, 220],
        0xE9332E: [229, 232, 255],
        0xFF9085: [245, 245, 255]
    },
    "PURPLE": {
        0x661A5E: [39, 43, 49],
        0xAA162C: [86, 69, 160],
        0xE9332E: [147, 130, 225],
        0xFF9085: [203, 194, 255]
    },
    "BLACK": {
        0x661A5E: [28, 29, 39],
        0xAA162C: [40, 44, 50],
        0xE9332E: [66, 65, 68],
        0xFF9085: [71, 75, 136]
    },
    "GRAY": {
        0x661A5E: [43, 49, 52],
        0xAA162C: [66, 67, 91],
        0xE9332E: [155, 151, 151],
        0xFF9085: [200, 190, 163]
    },
    "CREAM": {
        0x661A5E: [105, 125, 108],
        0xAA162C: [197, 171, 159],
        0xE9332E: [232, 223, 192],
        0xFF9085: [255, 255, 255]
    },
    "LIME": {
        0x661A5E: [92, 107, 42],
        0xAA162C: [49, 166, 26],
        0xE9332E: [55, 225, 54],
        0xFF9085: [121, 255, 128]
    }
};

export const EntitySpawner = {
    createEntityConfig: function(type, tileX, tileY) {
        return {
            "type": type,
            "x": tileX,
            "y": tileY
        };
    },
    createEntity: function(gameContext, config, spriteID) {
        const { world, transform2D } = gameContext;
        const { entityManager } = world;
        const { id, type, x, y } = config;
        const entity = entityManager.createEntity((entityID, entityType) => {
            const entitySprite = new BattalionSprite();
            const sprite = SpriteHelper.createColoredSprite(gameContext, spriteID, getRandomElement(Object.keys(SCHEMAS)), SCHEMAS, SpriteManager.LAYER.MIDDLE);
            const spawnPosition = transform2D.transformTileToWorld(x, y);
            const entityObject = new BattalionEntity(entityID, entityType, entitySprite);

            sprite.addChild(entitySprite);
            entityObject.setSpritePosition(spawnPosition);

            return entityObject;
        }, type, id);
    
        return entity;
    },
    debugEntities: function(gameContext) {
        const NAME = "stealth_tank";

        for(let i = 0; i < 1; i++) {
            for(let j = 0; j < 1; j++) {
                EntitySpawner.createEntity(gameContext, EntitySpawner.createEntityConfig("scorpion_tank", 3, 3), NAME + "_idle_right");
                EntitySpawner.createEntity(gameContext, EntitySpawner.createEntityConfig("scorpion_tank", 5, 3), NAME + "_fire_right");
            }
        }
    }
};