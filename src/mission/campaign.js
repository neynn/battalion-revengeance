import { NATION_TYPE } from "../enums.js";

export const Campaign = function(id) {
    this.id = id;
    this.name = "";
    this.desc = "";
    this.nation = NATION_TYPE.SOMERTIN;
    this.isHidden = false;
    this.chapters = [];
}