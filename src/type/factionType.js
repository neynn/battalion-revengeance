export const FactionType = function(id, config) {
    const {
        name = FactionType.MISSING_NAME,
        desc = FactionType.MISSING_DESC,
        color = "WHITE"
    } = config;

    this.id = id;
    this.name = name;
    this.desc = desc;
    this.color = color;
}

FactionType.MISSING_NAME = "MISSING_NAME_FACTION";
FactionType.MISSING_DESC = "MISSING_DESC_FACTION";