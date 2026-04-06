import { NATION_TYPE } from "../enums.js";

export const Campaign = function(id) {
    this.id = id;
    this.name = "";
    this.desc = "";
    this.nation = NATION_TYPE.SOMERTIN;
    this.isHidden = false;
    this.chapters = [];
}

Campaign.prototype.getChapterIndex = function(chapterID) {
    for(let i = 0; i < this.chapters.length; i++) {
        if(this.chapters[i].id === chapterID) {
            return i;
        }
    }

    return -1;
}

Campaign.prototype.hasChapter = function(chapterID) {
    return this.getChapterIndex(chapterID) !== -1;
}