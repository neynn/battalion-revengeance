export const BuildingType = function(id, config) {
    const {
        name = "MISSING_NAME_BUILDING",
        desc = "MISSING_DESC_BUILDING",
        sprite = null,
        traits = []
    } = config;

    this.id = id;
    this.name = name;
    this.desc = desc;
    this.sprite = sprite;
    this.traits = traits;
}

BuildingType.prototype.hasTrait = function(traitID) {
    for(let i = 0; i < this.traits.length; i++) {
        if(this.traits[i] === traitID) {
            return true;
        }
    }

    return false;
}