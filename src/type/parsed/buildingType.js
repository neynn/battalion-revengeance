export const BuildingType = function(id, config) {
    const {
        name = BuildingType.MISSING_NAME,
        desc = BuildingType.MISSING_DESC,
        sprite = null,
        traits = []
    } = config;

    this.id = id;
    this.name = name;
    this.desc = desc;
    this.sprite = sprite;
    this.traits = traits;
}

BuildingType.MISSING_NAME = "MISSING_NAME_BUILDING";
BuildingType.MISSING_DESC = "MISSING_DESC_BUILDING";