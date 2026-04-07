import { NATION_TYPE } from "../../enums.js";
import { COMPLETION_STATE } from "../constants.js";

export const Campaign = function(id) {
    this.id = id;
    this.name = "";
    this.desc = "";
    this.nation = NATION_TYPE.SOMERTIN;
    this.isHidden = false;
    this.chapters = [];
    this.state = COMPLETION_STATE.NOT_COMPLETED;
}

Campaign.prototype.isChapterAvailableAsNext = function(index) {
    if(index < 0 || index >= this.chapters.length) {
        return false;
    }

    for(let i = 0; i < index; i++) {
        if(this.chapters[i].state === COMPLETION_STATE.NOT_COMPLETED) {
            return false;
        }
    }

    return true;
}

Campaign.prototype.getNextChapterIndex = function() {
    for(let i = 0; i < this.chapters.length; i++) {
        if(this.chapters[i].state === COMPLETION_STATE.NOT_COMPLETED) {
            return i;
        }
    }

    return -1;
}

Campaign.prototype.complete = function() {
    this.state = COMPLETION_STATE.COMPLETED;

    for(const chapter of this.chapters) {
        chapter.complete();
    }
}

Campaign.prototype.isCompleted = function() {
    for(const { state } of this.chapters) {
        if(state !== COMPLETION_STATE.COMPLETED) {
            return false;
        }
    }

    return true;
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