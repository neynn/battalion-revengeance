import { NATION_TYPE } from "../enums.js";

export const Campaign = function(id) {
    this.id = id;
    this.name = "";
    this.desc = "";
    this.nation = NATION_TYPE.SOMERTIN;
    this.isHidden = false;
    this.chapters = [];
}

Campaign.prototype.hasChapter = function(chapterID) {
    for(const { id } of this.chapters) {
        if(id === chapterID) {
            return true;
        }
    }

    return false;
}