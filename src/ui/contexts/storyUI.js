import { TextStyle } from "../../../engine/graphics/textStyle.js";
import { toCenter } from "../../../engine/math/math.js";
import { IM_FLAG, UIContext } from "../../../engine/ui/uiContext.js";
import { TeamOverride } from "../../map/override.js";
import { loadClientScenario } from "../../systems/map.js";
import { mRegenerateLines } from "../helpers.js";
import { START_BUTTON_STYLE, UI_TEXTURE } from "../constants.js";
import { TextureRegion } from "../../../engine/resources/texture/region.js";
import { INTERRUPT_TYPE } from "../../enums.js";
import { InterruptVTable } from "../../action/types/interrupt.js";
import { loadSavedScenario } from "../../systems/save.js";

const DO_SAVED = false;
const DATA = {
    "scenario": "C1M1",
    "turn": {"team":0,"rounds":0,"turns":1},
    "events": [],
    "data": {
        "GROUND": [1,18,2,1,1,9,3,1,1,2,211,1,1,2,208,2,1,1,210,1,1,16,207,1,211,1,1,30,210,1,1,13],
        "DECORATION": [0,2,23,1,114,1,0,5,176,1,0,2,23,1,0,6,177,1,0,2,23,1,0,6,177,1,0,2,22,1,29,1,0,5,177,1,0,3,55,1,30,4,79,1,177,1,0,3,23,1,0,5,177,1,0,3,86,1,0,5,177,1,0,3,23,1,0,5,177,1,154,1,162,1,146,1,82,1,0,5,177,1,127,1,132,1,124,1,89,1,0,1,172,1,174,3,171,1],
        "CLOUD": [0,6,8,1,0,9,5,1,0,3,6,3,11,1,0,2,5,1,0,9,5,1,0,9,5,1,0,9,16,1,6,1,11,1,0,7,5,1,0,3,10,1,6,5,15,1,0,11,20,1,0,11]
    },
    "entities": [
        {"doneMoves":0,"doneActions":0,"allowedMoves":1,"allowedActions":1,"bonusMoves":0,"bonusActions":0,"direction":2,"state":0,"morale":4,"moraleDelta":0,"teamID":0,"turns":0,"cash":0,"flags":8,"renderFlags":32,"health":50,"maxHealth":50,"type":59,"tileX":0,"tileY":0,"tileZ":-1,"transport":-1,"id":-1,"name":0,"desc":-1},
        {"doneMoves":0,"doneActions":0,"allowedMoves":1,"allowedActions":1,"bonusMoves":0,"bonusActions":0,"direction":2,"state":0,"morale":4,"moraleDelta":0,"teamID":0,"turns":0,"cash":0,"flags":8,"renderFlags":32,"health":50,"maxHealth":50,"type":54,"tileX":1,"tileY":0,"tileZ":-1,"transport":-1,"id":-1,"name":-1,"desc":-1},
        {"doneMoves":0,"doneActions":0,"allowedMoves":1,"allowedActions":1,"bonusMoves":0,"bonusActions":0,"direction":2,"state":0,"morale":4,"moraleDelta":0,"teamID":0,"turns":0,"cash":0,"flags":8,"renderFlags":32,"health":30,"maxHealth":30,"type":69,"tileX":2,"tileY":0,"tileZ":-1,"transport":-1,"id":-1,"name":-1,"desc":-1},
        {"doneMoves":0,"doneActions":0,"allowedMoves":1,"allowedActions":1,"bonusMoves":0,"bonusActions":0,"direction":2,"state":0,"morale":4,"moraleDelta":0,"teamID":0,"turns":0,"cash":0,"flags":8,"renderFlags":32,"health":50,"maxHealth":50,"type":26,"tileX":3,"tileY":0,"tileZ":-1,"transport":-1,"id":-1,"name":-1,"desc":-1},
        {"doneMoves":0,"doneActions":0,"allowedMoves":1,"allowedActions":1,"bonusMoves":0,"bonusActions":0,"direction":2,"state":0,"morale":4,"moraleDelta":0,"teamID":0,"turns":0,"cash":0,"flags":8,"renderFlags":32,"health":70,"maxHealth":70,"type":24,"tileX":4,"tileY":0,"tileZ":-1,"transport":-1,"id":-1,"name":-1,"desc":-1},
        {"doneMoves":0,"doneActions":0,"allowedMoves":1,"allowedActions":1,"bonusMoves":0,"bonusActions":0,"direction":2,"state":0,"morale":4,"moraleDelta":0,"teamID":0,"turns":0,"cash":0,"flags":8,"renderFlags":32,"health":50,"maxHealth":50,"type":50,"tileX":5,"tileY":0,"tileZ":-1,"transport":-1,"id":-1,"name":-1,"desc":-1},
        {"doneMoves":0,"doneActions":0,"allowedMoves":1,"allowedActions":1,"bonusMoves":0,"bonusActions":0,"direction":2,"state":0,"morale":4,"moraleDelta":0,"teamID":0,"turns":0,"cash":0,"flags":8,"renderFlags":32,"health":70,"maxHealth":70,"type":28,"tileX":6,"tileY":0,"tileZ":-1,"transport":-1,"id":-1,"name":-1,"desc":-1},
        {"doneMoves":0,"doneActions":0,"allowedMoves":1,"allowedActions":1,"bonusMoves":0,"bonusActions":0,"direction":2,"state":0,"morale":4,"moraleDelta":0,"teamID":0,"turns":0,"cash":0,"flags":8,"renderFlags":32,"health":100,"maxHealth":100,"type":29,"tileX":7,"tileY":0,"tileZ":-1,"transport":-1,"id":-1,"name":-1,"desc":-1},
        {"doneMoves":0,"doneActions":0,"allowedMoves":1,"allowedActions":1,"bonusMoves":0,"bonusActions":0,"direction":2,"state":0,"morale":4,"moraleDelta":0,"teamID":0,"turns":0,"cash":0,"flags":8,"renderFlags":32,"health":100,"maxHealth":100,"type":30,"tileX":8,"tileY":0,"tileZ":-1,"transport":-1,"id":-1,"name":-1,"desc":-1},
        {"doneMoves":0,"doneActions":0,"allowedMoves":1,"allowedActions":1,"bonusMoves":0,"bonusActions":0,"direction":2,"state":0,"morale":4,"moraleDelta":0,"teamID":0,"turns":0,"cash":0,"flags":8,"renderFlags":32,"health":150,"maxHealth":150,"type":63,"tileX":9,"tileY":0,"tileZ":-1,"transport":-1,"id":-1,"name":-1,"desc":-1},
        {"doneMoves":0,"doneActions":0,"allowedMoves":1,"allowedActions":1,"bonusMoves":0,"bonusActions":0,"direction":2,"state":0,"morale":4,"moraleDelta":0,"teamID":0,"turns":0,"cash":0,"flags":8,"renderFlags":32,"health":170,"maxHealth":170,"type":34,"tileX":0,"tileY":1,"tileZ":-1,"transport":-1,"id":-1,"name":-1,"desc":-1},
        {"doneMoves":0,"doneActions":0,"allowedMoves":1,"allowedActions":1,"bonusMoves":0,"bonusActions":0,"direction":1,"state":0,"morale":4,"moraleDelta":0,"teamID":0,"turns":0,"cash":0,"flags":9,"renderFlags":33,"health":70,"maxHealth":70,"type":38,"tileX":1,"tileY":1,"tileZ":-1,"transport":-1,"id":-1,"name":-1,"desc":-1},
        {"doneMoves":0,"doneActions":0,"allowedMoves":1,"allowedActions":1,"bonusMoves":0,"bonusActions":0,"direction":1,"state":0,"morale":4,"moraleDelta":0,"teamID":0,"turns":0,"cash":0,"flags":8,"renderFlags":32,"health":40,"maxHealth":40,"type":13,"tileX":2,"tileY":1,"tileZ":-1,"transport":-1,"id":-1,"name":-1,"desc":-1},
        {"doneMoves":0,"doneActions":0,"allowedMoves":1,"allowedActions":1,"bonusMoves":0,"bonusActions":0,"direction":1,"state":0,"morale":4,"moraleDelta":0,"teamID":0,"turns":0,"cash":0,"flags":8,"renderFlags":32,"health":40,"maxHealth":40,"type":31,"tileX":3,"tileY":1,"tileZ":-1,"transport":-1,"id":-1,"name":-1,"desc":-1},
        {"doneMoves":1,"doneActions":1,"allowedMoves":1,"allowedActions":1,"bonusMoves":0,"bonusActions":0,"direction":1,"state":0,"morale":4,"moraleDelta":0,"teamID":0,"turns":0,"cash":0,"flags":8,"renderFlags":56,"health":110,"maxHealth":110,"type":32,"tileX":4,"tileY":2,"tileZ":-1,"transport":-1,"id":-1,"name":-1,"desc":-1},
        {"doneMoves":1,"doneActions":1,"allowedMoves":1,"allowedActions":1,"bonusMoves":0,"bonusActions":0,"direction":2,"state":0,"morale":4,"moraleDelta":0,"teamID":0,"turns":0,"cash":0,"flags":8,"renderFlags":56,"health":140,"maxHealth":150,"type":10,"tileX":5,"tileY":1,"tileZ":-1,"transport":-1,"id":-1,"name":-1,"desc":-1},
        {"doneMoves":1,"doneActions":1,"allowedMoves":1,"allowedActions":1,"bonusMoves":0,"bonusActions":0,"direction":2,"state":0,"morale":4,"moraleDelta":0,"teamID":0,"turns":0,"cash":0,"flags":8,"renderFlags":56,"health":70,"maxHealth":90,"type":25,"tileX":6,"tileY":1,"tileZ":-1,"transport":-1,"id":-1,"name":-1,"desc":-1},
        {"doneMoves":1,"doneActions":0,"allowedMoves":1,"allowedActions":1,"bonusMoves":0,"bonusActions":0,"direction":2,"state":0,"morale":4,"moraleDelta":0,"teamID":0,"turns":0,"cash":0,"flags":8,"renderFlags":56,"health":75,"maxHealth":75,"type":27,"tileX":7,"tileY":2,"tileZ":-1,"transport":-1,"id":-1,"name":-1,"desc":-1},
        {"doneMoves":0,"doneActions":0,"allowedMoves":1,"allowedActions":1,"bonusMoves":0,"bonusActions":0,"direction":1,"state":0,"morale":4,"moraleDelta":0,"teamID":0,"turns":0,"cash":0,"flags":8,"renderFlags":32,"health":80,"maxHealth":80,"type":2,"tileX":8,"tileY":1,"tileZ":-1,"transport":-1,"id":-1,"name":-1,"desc":-1},
        {"doneMoves":0,"doneActions":0,"allowedMoves":1,"allowedActions":1,"bonusMoves":0,"bonusActions":0,"direction":1,"state":0,"morale":4,"moraleDelta":0,"teamID":0,"turns":0,"cash":0,"flags":8,"renderFlags":32,"health":80,"maxHealth":80,"type":40,"tileX":9,"tileY":1,"tileZ":-1,"transport":-1,"id":-1,"name":-1,"desc":-1},
        {"doneMoves":0,"doneActions":0,"allowedMoves":1,"allowedActions":1,"bonusMoves":0,"bonusActions":0,"direction":1,"state":0,"morale":4,"moraleDelta":0,"teamID":0,"turns":0,"cash":0,"flags":8,"renderFlags":32,"health":70,"maxHealth":70,"type":1,"tileX":0,"tileY":2,"tileZ":-1,"transport":-1,"id":-1,"name":-1,"desc":-1},
        {"doneMoves":0,"doneActions":0,"allowedMoves":1,"allowedActions":1,"bonusMoves":0,"bonusActions":0,"direction":1,"state":0,"morale":4,"moraleDelta":0,"teamID":0,"turns":0,"cash":0,"flags":8,"renderFlags":32,"health":72,"maxHealth":72,"type":53,"tileX":1,"tileY":2,"tileZ":-1,"transport":-1,"id":-1,"name":-1,"desc":-1},
        {"doneMoves":0,"doneActions":0,"allowedMoves":1,"allowedActions":1,"bonusMoves":0,"bonusActions":0,"direction":1,"state":0,"morale":4,"moraleDelta":0,"teamID":0,"turns":0,"cash":0,"flags":8,"renderFlags":32,"health":40,"maxHealth":40,"type":12,"tileX":2,"tileY":2,"tileZ":-1,"transport":-1,"id":-1,"name":-1,"desc":-1},
        {"doneMoves":0,"doneActions":0,"allowedMoves":1,"allowedActions":1,"bonusMoves":0,"bonusActions":0,"direction":1,"state":0,"morale":4,"moraleDelta":0,"teamID":0,"turns":0,"cash":0,"flags":8,"renderFlags":32,"health":40,"maxHealth":40,"type":20,"tileX":0,"tileY":3,"tileZ":-1,"transport":-1,"id":-1,"name":-1,"desc":-1},
        {"doneMoves":0,"doneActions":0,"allowedMoves":1,"allowedActions":1,"bonusMoves":0,"bonusActions":0,"direction":1,"state":0,"morale":4,"moraleDelta":0,"teamID":0,"turns":0,"cash":0,"flags":8,"renderFlags":32,"health":50,"maxHealth":50,"type":19,"tileX":0,"tileY":4,"tileZ":-1,"transport":-1,"id":-1,"name":-1,"desc":-1},
        {"doneMoves":0,"doneActions":0,"allowedMoves":1,"allowedActions":1,"bonusMoves":0,"bonusActions":0,"direction":1,"state":0,"morale":4,"moraleDelta":0,"teamID":0,"turns":0,"cash":0,"flags":8,"renderFlags":32,"health":140,"maxHealth":140,"type":39,"tileX":0,"tileY":5,"tileZ":-1,"transport":-1,"id":-1,"name":-1,"desc":-1},
        {"doneMoves":0,"doneActions":0,"allowedMoves":1,"allowedActions":1,"bonusMoves":0,"bonusActions":0,"direction":1,"state":0,"morale":4,"moraleDelta":0,"teamID":0,"turns":0,"cash":0,"flags":8,"renderFlags":32,"health":32,"maxHealth":32,"type":14,"tileX":0,"tileY":6,"tileZ":-1,"transport":-1,"id":-1,"name":-1,"desc":-1},
        {"doneMoves":0,"doneActions":0,"allowedMoves":1,"allowedActions":1,"bonusMoves":0,"bonusActions":0,"direction":1,"state":0,"morale":4,"moraleDelta":0,"teamID":0,"turns":0,"cash":0,"flags":8,"renderFlags":32,"health":50,"maxHealth":50,"type":15,"tileX":0,"tileY":7,"tileZ":-1,"transport":-1,"id":-1,"name":-1,"desc":-1},
        {"doneMoves":0,"doneActions":0,"allowedMoves":1,"allowedActions":1,"bonusMoves":0,"bonusActions":0,"direction":1,"state":0,"morale":4,"moraleDelta":0,"teamID":0,"turns":0,"cash":0,"flags":13,"renderFlags":35,"health":50,"maxHealth":50,"type":16,"tileX":0,"tileY":8,"tileZ":-1,"transport":-1,"id":-1,"name":-1,"desc":-1},
        {"doneMoves":0,"doneActions":0,"allowedMoves":1,"allowedActions":1,"bonusMoves":0,"bonusActions":0,"direction":1,"state":0,"morale":4,"moraleDelta":0,"teamID":0,"turns":0,"cash":0,"flags":12,"renderFlags":34,"health":80,"maxHealth":80,"type":18,"tileX":0,"tileY":9,"tileZ":-1,"transport":-1,"id":-1,"name":-1,"desc":-1},
        {"doneMoves":0,"doneActions":0,"allowedMoves":1,"allowedActions":1,"bonusMoves":0,"bonusActions":0,"direction":1,"state":0,"morale":4,"moraleDelta":0,"teamID":0,"turns":0,"cash":0,"flags":12,"renderFlags":34,"health":50,"maxHealth":50,"type":0,"tileX":1,"tileY":9,"tileZ":-1,"transport":-1,"id":-1,"name":-1,"desc":-1},
        {"doneMoves":0,"doneActions":0,"allowedMoves":1,"allowedActions":1,"bonusMoves":0,"bonusActions":0,"direction":1,"state":0,"morale":4,"moraleDelta":0,"teamID":0,"turns":0,"cash":0,"flags":12,"renderFlags":34,"health":70,"maxHealth":70,"type":3,"tileX":1,"tileY":8,"tileZ":-1,"transport":-1,"id":-1,"name":-1,"desc":-1},
        {"doneMoves":0,"doneActions":0,"allowedMoves":1,"allowedActions":1,"bonusMoves":0,"bonusActions":0,"direction":1,"state":0,"morale":4,"moraleDelta":0,"teamID":0,"turns":0,"cash":0,"flags":8,"renderFlags":32,"health":80,"maxHealth":80,"type":5,"tileX":1,"tileY":7,"tileZ":-1,"transport":-1,"id":-1,"name":-1,"desc":-1},
        {"doneMoves":0,"doneActions":0,"allowedMoves":1,"allowedActions":1,"bonusMoves":0,"bonusActions":0,"direction":1,"state":0,"morale":4,"moraleDelta":0,"teamID":0,"turns":0,"cash":0,"flags":8,"renderFlags":32,"health":70,"maxHealth":70,"type":6,"tileX":1,"tileY":6,"tileZ":-1,"transport":-1,"id":-1,"name":-1,"desc":-1},
        {"doneMoves":0,"doneActions":0,"allowedMoves":1,"allowedActions":1,"bonusMoves":0,"bonusActions":0,"direction":1,"state":0,"morale":4,"moraleDelta":0,"teamID":0,"turns":0,"cash":0,"flags":8,"renderFlags":32,"health":30,"maxHealth":30,"type":22,"tileX":1,"tileY":5,"tileZ":-1,"transport":-1,"id":-1,"name":-1,"desc":-1},
        {"doneMoves":0,"doneActions":0,"allowedMoves":1,"allowedActions":1,"bonusMoves":0,"bonusActions":0,"direction":1,"state":0,"morale":4,"moraleDelta":0,"teamID":0,"turns":0,"cash":0,"flags":9,"renderFlags":33,"health":50,"maxHealth":50,"type":7,"tileX":2,"tileY":5,"tileZ":-1,"transport":-1,"id":-1,"name":-1,"desc":-1},
        {"doneMoves":0,"doneActions":0,"allowedMoves":1,"allowedActions":1,"bonusMoves":0,"bonusActions":0,"direction":1,"state":0,"morale":4,"moraleDelta":0,"teamID":0,"turns":0,"cash":0,"flags":8,"renderFlags":32,"health":70,"maxHealth":70,"type":4,"tileX":2,"tileY":4,"tileZ":-1,"transport":-1,"id":-1,"name":-1,"desc":-1},
        {"doneMoves":0,"doneActions":0,"allowedMoves":1,"allowedActions":1,"bonusMoves":0,"bonusActions":0,"direction":1,"state":0,"morale":4,"moraleDelta":0,"teamID":0,"turns":0,"cash":1000,"flags":8,"renderFlags":32,"health":75,"maxHealth":75,"type":42,"tileX":2,"tileY":3,"tileZ":-1,"transport":-1,"id":-1,"name":-1,"desc":-1},
        {"doneMoves":0,"doneActions":0,"allowedMoves":0,"allowedActions":0,"bonusMoves":0,"bonusActions":0,"direction":1,"state":0,"morale":4,"moraleDelta":0,"teamID":1,"turns":0,"cash":0,"flags":1,"renderFlags":41,"health":70,"maxHealth":70,"type":38,"tileX":3,"tileY":6,"tileZ":-1,"transport":-1,"id":-1,"name":-1,"desc":-1},
        {"doneMoves":0,"doneActions":0,"allowedMoves":0,"allowedActions":0,"bonusMoves":0,"bonusActions":0,"direction":1,"state":0,"morale":4,"moraleDelta":0,"teamID":1,"turns":0,"cash":0,"flags":0,"renderFlags":40,"health":140,"maxHealth":140,"type":39,"tileX":3,"tileY":7,"tileZ":-1,"transport":-1,"id":-1,"name":-1,"desc":-1},
        {"doneMoves":0,"doneActions":0,"allowedMoves":1,"allowedActions":1,"bonusMoves":0,"bonusActions":0,"direction":2,"state":0,"morale":4,"moraleDelta":0,"teamID":0,"turns":0,"cash":0,"flags":8,"renderFlags":32,"health":50,"maxHealth":50,"type":56,"tileX":5,"tileY":4,"tileZ":-1,"transport":-1,"id":-1,"name":-1,"desc":-1},
        {"doneMoves":0,"doneActions":0,"allowedMoves":1,"allowedActions":1,"bonusMoves":0,"bonusActions":0,"direction":2,"state":0,"morale":4,"moraleDelta":0,"teamID":0,"turns":0,"cash":0,"flags":8,"renderFlags":32,"health":50,"maxHealth":50,"type":45,"tileX":8,"tileY":4,"tileZ":-1,"transport":-1,"id":-1,"name":-1,"desc":-1},
        {"doneMoves":0,"doneActions":0,"allowedMoves":0,"allowedActions":0,"bonusMoves":0,"bonusActions":0,"direction":2,"state":0,"morale":4,"moraleDelta":0,"teamID":1,"turns":0,"cash":0,"flags":0,"renderFlags":40,"health":50,"maxHealth":50,"type":45,"tileX":8,"tileY":3,"tileZ":-1,"transport":-1,"id":0,"name":-1,"desc":-1},
        {"doneMoves":0,"doneActions":0,"allowedMoves":0,"allowedActions":0,"bonusMoves":0,"bonusActions":0,"direction":2,"state":0,"morale":4,"moraleDelta":0,"teamID":1,"turns":0,"cash":0,"flags":3,"renderFlags":41,"health":50,"maxHealth":50,"type":45,"tileX":4,"tileY":4,"tileZ":-1,"transport":-1,"id":-1,"name":-1,"desc":-1},
        {"doneMoves":0,"doneActions":0,"allowedMoves":1,"allowedActions":1,"bonusMoves":0,"bonusActions":0,"direction":2,"state":0,"morale":4,"moraleDelta":0,"teamID":0,"turns":0,"cash":0,"flags":8,"renderFlags":32,"health":90,"maxHealth":90,"type":43,"tileX":3,"tileY":3,"tileZ":-1,"transport":-1,"id":-1,"name":-1,"desc":-1},
        {"doneMoves":0,"doneActions":0,"allowedMoves":1,"allowedActions":1,"bonusMoves":0,"bonusActions":0,"direction":2,"state":0,"morale":4,"moraleDelta":0,"teamID":0,"turns":0,"cash":0,"flags":8,"renderFlags":32,"health":210,"maxHealth":210,"type":49,"tileX":3,"tileY":4,"tileZ":-1,"transport":-1,"id":-1,"name":-1,"desc":-1},
        {"doneMoves":0,"doneActions":0,"allowedMoves":0,"allowedActions":0,"bonusMoves":0,"bonusActions":0,"direction":0,"state":0,"morale":4,"moraleDelta":0,"teamID":1,"turns":0,"cash":0,"flags":0,"renderFlags":40,"health":40,"maxHealth":70,"type":38,"tileX":6,"tileY":2,"tileZ":-1,"transport":-1,"id":-1,"name":-1,"desc":-1},
        {"doneMoves":0,"doneActions":0,"allowedMoves":0,"allowedActions":0,"bonusMoves":0,"bonusActions":0,"direction":1,"state":0,"morale":4,"moraleDelta":0,"teamID":1,"turns":0,"cash":0,"flags":1,"renderFlags":41,"health":70,"maxHealth":70,"type":38,"tileX":4,"tileY":6,"tileZ":-1,"transport":-1,"id":-1,"name":-1,"desc":-1},
        {"doneMoves":0,"doneActions":0,"allowedMoves":0,"allowedActions":0,"bonusMoves":0,"bonusActions":0,"direction":0,"state":0,"morale":4,"moraleDelta":0,"teamID":1,"turns":0,"cash":0,"flags":0,"renderFlags":40,"health":0,"maxHealth":100,"type":29,"tileX":5,"tileY":2,"tileZ":-1,"transport":-1,"id":-1,"name":-1,"desc":-1},
        {"doneMoves":0,"doneActions":0,"allowedMoves":1,"allowedActions":1,"bonusMoves":0,"bonusActions":0,"direction":3,"state":0,"morale":4,"moraleDelta":0,"teamID":0,"turns":0,"cash":0,"flags":8,"renderFlags":32,"health":50,"maxHealth":50,"type":23,"tileX":6,"tileY":7,"tileZ":-1,"transport":-1,"id":-1,"name":-1,"desc":-1},
        {"doneMoves":0,"doneActions":0,"allowedMoves":1,"allowedActions":1,"bonusMoves":0,"bonusActions":0,"direction":3,"state":0,"morale":4,"moraleDelta":0,"teamID":0,"turns":0,"cash":0,"flags":8,"renderFlags":32,"health":40,"maxHealth":40,"type":17,"tileX":6,"tileY":8,"tileZ":-1,"transport":-1,"id":-1,"name":-1,"desc":-1},
        {"doneMoves":0,"doneActions":0,"allowedMoves":1,"allowedActions":1,"bonusMoves":0,"bonusActions":0,"direction":3,"state":0,"morale":4,"moraleDelta":0,"teamID":0,"turns":0,"cash":0,"flags":8,"renderFlags":32,"health":200,"maxHealth":200,"type":37,"tileX":6,"tileY":9,"tileZ":-1,"transport":-1,"id":-1,"name":-1,"desc":-1},
        {"doneMoves":0,"doneActions":0,"allowedMoves":0,"allowedActions":0,"bonusMoves":0,"bonusActions":0,"direction":3,"state":0,"morale":4,"moraleDelta":0,"teamID":1,"turns":0,"cash":0,"flags":0,"renderFlags":40,"health":200,"maxHealth":200,"type":37,"tileX":7,"tileY":8,"tileZ":-1,"transport":-1,"id":-1,"name":-1,"desc":-1},
        {"doneMoves":0,"doneActions":0,"allowedMoves":1,"allowedActions":1,"bonusMoves":0,"bonusActions":0,"direction":3,"state":0,"morale":4,"moraleDelta":0,"teamID":0,"turns":0,"cash":0,"flags":9,"renderFlags":33,"health":70,"maxHealth":70,"type":58,"tileX":4,"tileY":8,"tileZ":-1,"transport":-1,"id":-1,"name":-1,"desc":-1},
        {"doneMoves":0,"doneActions":0,"allowedMoves":1,"allowedActions":1,"bonusMoves":0,"bonusActions":0,"direction":3,"state":0,"morale":4,"moraleDelta":0,"teamID":0,"turns":0,"cash":0,"flags":8,"renderFlags":32,"health":50,"maxHealth":50,"type":56,"tileX":4,"tileY":9,"tileZ":-1,"transport":-1,"id":-1,"name":-1,"desc":-1},
        {"doneMoves":0,"doneActions":0,"allowedMoves":1,"allowedActions":1,"bonusMoves":0,"bonusActions":0,"direction":3,"state":0,"morale":4,"moraleDelta":0,"teamID":0,"turns":0,"cash":0,"flags":8,"renderFlags":32,"health":60,"maxHealth":60,"type":52,"tileX":3,"tileY":9,"tileZ":-1,"transport":-1,"id":-1,"name":-1,"desc":-1},
        {"doneMoves":0,"doneActions":0,"allowedMoves":0,"allowedActions":0,"bonusMoves":0,"bonusActions":0,"direction":3,"state":0,"morale":4,"moraleDelta":0,"teamID":1,"turns":0,"cash":0,"flags":0,"renderFlags":40,"health":100,"maxHealth":50,"type":23,"tileX":7,"tileY":3,"tileZ":-1,"transport":-1,"id":-1,"name":-1,"desc":-1},
        {"doneMoves":0,"doneActions":0,"allowedMoves":0,"allowedActions":0,"bonusMoves":0,"bonusActions":0,"direction":3,"state":0,"morale":4,"moraleDelta":0,"teamID":2,"turns":0,"cash":0,"flags":0,"renderFlags":40,"health":50,"maxHealth":50,"type":23,"tileX":7,"tileY":5,"tileZ":-1,"transport":-1,"id":-1,"name":-1,"desc":-1},
        {"doneMoves":0,"doneActions":0,"allowedMoves":0,"allowedActions":0,"bonusMoves":0,"bonusActions":0,"direction":1,"state":0,"morale":4,"moraleDelta":0,"teamID":2,"turns":0,"cash":0,"flags":1,"renderFlags":41,"health":70,"maxHealth":70,"type":38,"tileX":8,"tileY":5,"tileZ":-1,"transport":-1,"id":-1,"name":-1,"desc":-1},
        {"doneMoves":0,"doneActions":0,"allowedMoves":1,"allowedActions":1,"bonusMoves":0,"bonusActions":0,"direction":1,"state":0,"morale":4,"moraleDelta":0,"teamID":0,"turns":0,"cash":0,"flags":8,"renderFlags":32,"health":100,"maxHealth":100,"type":66,"tileX":8,"tileY":6,"tileZ":-1,"transport":-1,"id":-1,"name":-1,"desc":-1},
        {"doneMoves":0,"doneActions":0,"allowedMoves":1,"allowedActions":1,"bonusMoves":0,"bonusActions":0,"direction":1,"state":0,"morale":4,"moraleDelta":0,"teamID":0,"turns":0,"cash":0,"flags":8,"renderFlags":0,"health":70,"maxHealth":70,"type":64,"tileX":9,"tileY":6,"tileZ":-1,"transport":-1,"id":-1,"name":-1,"desc":-1}
    ],
    "teams": [
        {"status":0,"cash":1600,"stats":[0,1,0,0,0,600,0,0,0,0,0,0,0,0,1,2,0,0],"objectives":[{"status":0},{"status":0},{"status":1},{"status":1},{"status":1}]},
        {"status":0,"cash":600,"stats":[0,0,1,0,0,600,0,0,0,0,0,0,0,0,1,0,0,0],"objectives":[{"status":0},{"status":0},{"status":0}]},
        {"status":0,"cash":400,"stats":[0,0,0,0,0,400,0,0,0,0,0,0,0,0,1,0,0,0],"objectives":[{"status":0},{"status":0}]}
    ],
    "mines": [
        {"type":0,"tileX":6,"tileY":3,"teamID":1,"flags":1}
    ],
    "buildings": [
        {"type":0,"teamID":0,"tileX":0,"tileY":6,"id":-1,"desc":-1,"name":-1,"totalGeneratedCash":200,"color":17,"shop":0},
        {"type":1,"teamID":1,"tileX":1,"tileY":6,"id":-1,"desc":-1,"name":-1,"totalGeneratedCash":200,"color":14,"shop":0},
        {"type":2,"teamID":0,"tileX":2,"tileY":6,"id":-1,"desc":-1,"name":-1,"totalGeneratedCash":200,"color":17,"shop":0},
        {"type":3,"teamID":0,"tileX":3,"tileY":6,"id":-1,"desc":-1,"name":-1,"totalGeneratedCash":200,"color":17,"shop":0},
        {"type":4,"teamID":2,"tileX":4,"tileY":6,"id":-1,"desc":-1,"name":-1,"totalGeneratedCash":200,"color":16,"shop":0},
        {"type":5,"teamID":2,"tileX":5,"tileY":6,"id":-1,"desc":-1,"name":-1,"totalGeneratedCash":200,"color":16,"shop":0},
        {"type":6,"teamID":1,"tileX":6,"tileY":6,"id":-1,"desc":-1,"name":-1,"totalGeneratedCash":200,"color":14,"shop":0},
        {"type":7,"teamID":1,"tileX":7,"tileY":6,"id":-1,"desc":-1,"name":-1,"totalGeneratedCash":200,"color":14,"shop":0}
    ]
};

const EMBLEM_GAP = 20;
const EMBLEM_WIDTH = 70;
const EMBLEM_HEIGHT = 70;

const CHAPTER_ID_REGION = 100;
const MISSION_ID_REGION = 200;
const DIFFICULTY_ID_REGION = 300;

export const StoryUI = function() {
    UIContext.call(this);

    this.doImmediate = true;
    this.lines = [];
    this.lastMission = null;

    this.style = new TextStyle();
    this.style.font = "16px Times New Roman";
    this.style.setAlignment(TextStyle.ALIGN.MIDDLE);

    this.difficultyRect = new TextureRegion(0, 0, 0, 0);
    this.difficultyEasyRect = new TextureRegion(0, 0, 0, 0);
    this.difficultyMediumRect = new TextureRegion(0, 0, 0, 0);
    this.difficultyHardRect = new TextureRegion(0, 0, 0, 0);
    this.hotseatRect = new TextureRegion(0, 0, 0, 0);
    this.titleRect = new TextureRegion(0, 0, 0, 0);
    this.specificationRect = new TextureRegion(0, 0, 0, 0);
}

StoryUI.prototype = Object.create(UIContext.prototype);
StoryUI.prototype.constructor = StoryUI;

StoryUI.prototype.load = function(gameContext) {
    const { uiData, uiManager } = gameContext;
    const panelTexture = uiData.getTexture(UI_TEXTURE.STORY_PANELS);

    this.difficultyRect.copy(panelTexture.getRegionByName("difficulty"));
    this.hotseatRect.copy(panelTexture.getRegionByName("hotseat"));
    this.titleRect.copy(panelTexture.getRegionByName("title"));
    this.specificationRect.copy(panelTexture.getRegionByName("specification"));
    this.difficultyEasyRect.copy(panelTexture.getRegionByName("difficulty_easy"));
    this.difficultyMediumRect.copy(panelTexture.getRegionByName("difficulty_medium"));
    this.difficultyHardRect.copy(panelTexture.getRegionByName("difficulty_hard"));

    uiData.loadStoryTextures();
    uiManager.addContext(this);
}

StoryUI.prototype.onImmediate = function(gameContext, display) {
    const { uiData, gameWindow, missionManager, typeRegistry, language, scenarioRegistry } = gameContext;
    const { currentChapter, currentMission, currentCampaign } = missionManager;
    const { width, height } = gameWindow;
    const { context } = display;

    const mainMenuBorder = uiData.getTexture(UI_TEXTURE.STORY_MAIN_MENU_BORDER);
    const chapterPanel = uiData.getTexture(UI_TEXTURE.STORY_CHAPTER_PANEL);
    const chapterPlaque = uiData.getTexture(UI_TEXTURE.PLAQUE);
    const chapterPlaqueDisabled = uiData.getTexture(UI_TEXTURE.PLAQUE_DISABLED);
    const emblemTexture = uiData.getTexture(UI_TEXTURE.STORY_EMBLEMS);
    const emblemSlot = uiData.getTexture(UI_TEXTURE.STORY_EMBLEM_SLOT);
    const startButtonTexture = uiData.getTexture(UI_TEXTURE.STORY_START);
    const chapterArrowTexture = uiData.getTexture(UI_TEXTURE.ARROW);
    const missionPanel = uiData.getTexture(UI_TEXTURE.STORY_MISSION_PANEL);
    const panelTexture = uiData.getTexture(UI_TEXTURE.STORY_PANELS);
    
    const borderX = toCenter(width, mainMenuBorder.width);
    const borderY = toCenter(height, mainMenuBorder.height);
    const chapterPanelX = borderX + 100;
    const chapterPanelY = borderY + 100;
    const missionPanelX = borderX + toCenter(mainMenuBorder.width, missionPanel.width);
    const missionPanelY = borderY + toCenter(mainMenuBorder.height, missionPanel.height);
    const PLAQUE_WIDTH = chapterPlaque.width;
    const PLAQUE_HEIGHT = chapterPlaque.height;

    context.fillStyle = "#222222";
    context.fillRect(borderX, borderY, mainMenuBorder.width, mainMenuBorder.height);

    this.style.apply(context);

    mainMenuBorder.draw(display, borderX, borderY);
    chapterPanel.draw(display, chapterPanelX, chapterPanelY);
    missionPanel.draw(display, missionPanelX, missionPanelY);

    if(currentCampaign) {
        const { chapters, nation, startButton } = currentCampaign;
        const { emblem, nonEmblem } = typeRegistry.getNationType(nation);

        const plaqueX = chapterPanelX + toCenter(chapterPanel.width, PLAQUE_WIDTH);
        const plaqueY = chapterPanelY + 11;
        const offsetY = PLAQUE_HEIGHT + 2;
        const nextIndex = currentCampaign.getNextChapterIndex();

        for(let i = 0; i < chapters.length; i++) {
            const drawY = plaqueY + offsetY * i;

            if(i <= nextIndex) {
                chapterPlaque.draw(display, plaqueX, drawY);
                
                if(this.doButton(
                    gameContext,
                    CHAPTER_ID_REGION + i,
                    plaqueX,
                    drawY,
                    PLAQUE_WIDTH,
                    PLAQUE_HEIGHT
                ) & IM_FLAG.CLICKED) {
                    missionManager.selectChapterIfPossible(i);
                    missionManager.selectMissionIfPossible(missionManager.getNextMissionIndex());
                }
            } else {
                chapterPlaqueDisabled.draw(display, plaqueX, drawY);
            }
            
            const textX = plaqueX + Math.floor(PLAQUE_WIDTH / 2);
            const textY = Math.floor(PLAQUE_HEIGHT / 2);
            const chapterName = language.getSystemTranslation("STORY_CHAPTER_PLAQUE");

            context.fillText(chapterName + ` ${i + 1}`, textX, drawY + textY);
        }

        if(currentChapter) {
            const { missions, name } = currentChapter;
            const totalEmblemWidth = EMBLEM_WIDTH * missions.length + EMBLEM_GAP * (missions.length - 1);
            const emblemX = missionPanelX + toCenter(missionPanel.width, totalEmblemWidth);
            const emblemY = missionPanelY - EMBLEM_HEIGHT;
            const nextIndex = currentChapter.getNextMissionIndex();

            //Draw title
            const titleX = borderX + toCenter(mainMenuBorder.width, this.titleRect.w);
            const titleY = borderY - 20;
            const titleTextX = Math.floor(titleX + this.titleRect.w / 2);
            const titleTextY = Math.floor(titleY + this.titleRect.h / 2);

            panelTexture.drawRect(display, this.titleRect, titleX, titleY);
            context.fillText(language.getSystemTranslation(name), titleTextX, titleTextY);

            //TODO: This is cursed.
            {
                const index = currentCampaign.getChapterIndex(currentChapter.id);
                const arrowX = plaqueX - 50;
                const arrowY = plaqueY + offsetY * index - PLAQUE_HEIGHT / 2;

                chapterArrowTexture.draw(display, arrowX, arrowY);
            }

            if(currentMission) {
                const { id, name, desc, scenarioID } = currentMission;
                const missionPanelTextX = Math.floor(missionPanelX + missionPanel.width / 2);
                const missionPanelTextY = missionPanelY + 32;

                const index = currentChapter.getMissionIndex(currentMission.id);
                const drawX = emblemX + (EMBLEM_WIDTH + EMBLEM_GAP) * index - 16;

                emblemSlot.draw(display, drawX, emblemY - 22);
                context.fillText(language.getSystemTranslation(name), missionPanelTextX, missionPanelTextY);

                if(this.lastMission !== id) {
                    this.lastMission = id;
                    this.lines.length = 0;

                    mRegenerateLines(this.lines, context, language.getSystemTranslation(desc), 480);
                }

                for(let i = 0; i < this.lines.length; i++) {
                    const textY = missionPanelTextY + 40 + 20 * i;

                    context.fillText(this.lines[i], missionPanelTextX, textY);
                }

                const startX = missionPanelX + toCenter(missionPanel.width, START_BUTTON_STYLE.width);
                const startY = missionPanelY + missionPanel.height - START_BUTTON_STYLE.halfHeight;
                const startTextX = startX + START_BUTTON_STYLE.halfWidth;
                const startTextY = startY + START_BUTTON_STYLE.halfHeight;
                const startFlags = this.doButton(
                    gameContext,
                    2,
                    startX,
                    startY,
                    START_BUTTON_STYLE.width,
                    START_BUTTON_STYLE.height
                );

                if(startFlags & IM_FLAG.HOT) {
                    startButtonTexture.drawRegion(display, START_BUTTON_STYLE.hot, startX, startY);
                } else {
                    startButtonTexture.drawRegion(display, START_BUTTON_STYLE.enabled, startX, startY);
                }

                context.fillText(language.getSystemTranslation(startButton), startTextX, startTextY);

                if(startFlags & IM_FLAG.CLICKED) {
                    const over = new TeamOverride("SOMERTIN");

                    over.color = {
                        "0x661A5E": [105, 125, 108],
                        "0xAA162C": [197, 171, 159],
                        "0xE9332E": [66, 65, 68],
                        "0xFF9085": [71, 75, 136]
                    };

                    if(DO_SAVED) {
                        loadSavedScenario(gameContext, DATA, [over]).then(() => this.hide())
                    } else {
                        loadClientScenario(gameContext, scenarioID)
                        .then(loader => {
                            const { actionRouter } = gameContext;

                            loader.createDefaultMatch(gameContext, [over]);
                            actionRouter.forceEnqueue(gameContext, InterruptVTable.createIntent(INTERRUPT_TYPE.START_GAME, -1));

                            this.hide();
                        })
                        .catch(() => {
                            //TODO(neyn): Log error.
                        });
                    }
                }
            }

            for(let i = 0; i < missions.length; i++) {
                const drawX = emblemX + (EMBLEM_WIDTH + EMBLEM_GAP) * i;

                if(i <= nextIndex) {
                    emblemTexture.drawRegion(display, emblem, drawX, emblemY);

                    if(this.doButton(
                        gameContext,
                        MISSION_ID_REGION + i,
                        drawX,
                        emblemY,
                        EMBLEM_WIDTH,
                        EMBLEM_HEIGHT
                    ) & IM_FLAG.CLICKED) {
                        missionManager.selectMissionIfPossible(i);
                    }
                } else {
                    emblemTexture.drawRegion(display, nonEmblem, drawX, emblemY);
                }
            }

            const panelX = borderX + mainMenuBorder.width - this.specificationRect.w - 50;
            const panelY = borderY + mainMenuBorder.height - this.specificationRect.h - 50;

            panelTexture.drawRect(display, this.specificationRect, panelX, panelY);

            const hotseatX = chapterPanelX + toCenter(chapterPanel.width, this.hotseatRect.w);
            const hotseatY = chapterPanelY + chapterPanel.height + 2;

            panelTexture.drawRect(display, this.hotseatRect, hotseatX, hotseatY);

            const difficultyX = chapterPanelX + toCenter(chapterPanel.width, this.difficultyRect.w);
            const difficultyY = hotseatY + this.hotseatRect.h + 4;

            this.drawDifficulty(gameContext, display, difficultyX, difficultyY);
        }
    }
}

StoryUI.prototype.drawDifficulty = function(gameContext, display, screenX, screenY) {
    const { uiData, language } = gameContext;
    const { context } = display;
    const panelTexture = uiData.getTexture(UI_TEXTURE.STORY_PANELS);

    const difficultyX = screenX + 15;
    const easyY = screenY + 40;
    const mediumY = easyY + this.difficultyEasyRect.h + 5;
    const hardY = mediumY + this.difficultyMediumRect.h + 5;

    const textX = screenX + Math.floor(this.difficultyRect.w / 2);
    const textY = screenY + 25;
    const textOffsetX = 15;
    const textOffsetY = Math.floor(this.difficultyEasyRect.h / 2);

    panelTexture.drawRect(display, this.difficultyRect, screenX, screenY);
    panelTexture.drawRect(display, this.difficultyEasyRect, difficultyX, easyY);
    panelTexture.drawRect(display, this.difficultyMediumRect, difficultyX, mediumY);
    panelTexture.drawRect(display, this.difficultyHardRect, difficultyX, hardY);

    context.fillText(language.getSystemTranslation("STORY_DIFFICULTY_TITLE"), textX, textY);
    context.fillText(language.getSystemTranslation("STORY_DIFFICULTY_EASY"), textX + textOffsetX, easyY + textOffsetY);
    context.fillText(language.getSystemTranslation("STORY_DIFFICULTY_MEDIUM"), textX + textOffsetX, mediumY + textOffsetY);
    context.fillText(language.getSystemTranslation("STORY_DIFFICULTY_HARD"), textX + textOffsetX, hardY + textOffsetY);

    const easyID = DIFFICULTY_ID_REGION;
    const mediumID = DIFFICULTY_ID_REGION + 1;
    const hardID = DIFFICULTY_ID_REGION + 2;

    if(this.doButton(
        gameContext,
        easyID, 
        screenX,
        easyY,
        this.difficultyRect.w,
        this.difficultyEasyRect.h
    ) & IM_FLAG.CLICKED) {
        console.log("EASY_MODE!");
    }

    if(this.doButton(
        gameContext,
        mediumID,
        screenX,
        mediumY,
        this.difficultyRect.w,
        this.difficultyMediumRect.h
    ) & IM_FLAG.CLICKED) {
        console.log("MEDIUM_MODE!");
    }

    if(this.doButton(
        gameContext,
        hardID,
        screenX,
        hardY,
        this.difficultyRect.w,
        this.difficultyHardRect.h
    ) & IM_FLAG.CLICKED) {
        console.log("HARD_MODE!");
    }
}