import { TRAIT_TYPE } from "../enums.js";

const checkEnum = function(enumValues, count) {
    const seenValues = new Set();
    const missingEnums = [];
    const doubleValues = [];

    for(let i = 0; i < count; i++) {
        if(!enumValues.includes(i)) {
            missingEnums.push(i);
        }
    }

    for(const value of enumValues) {
        if(seenValues.has(value)) {
            doubleValues.push(value);
        } else {
            seenValues.add(value);
        }
    }

    return {
        "missing": missingEnums,
        "double": doubleValues
    }
}

export const validateTraitTypes = function(rTraitTypes) {
    const missingEntries = [];

    for(const traitID in rTraitTypes) {
        const index = TRAIT_TYPE[traitID];

        if(index === undefined) {
            missingEntries.push(traitID);
        }
    }

    const { missing, double } = checkEnum(Object.values(TRAIT_TYPE), TRAIT_TYPE._COUNT);

    console.log("Trait Type Report:", {
        "Missing Entries": missingEntries,
        "Missing Enums": missing,
        "Double Enums": double
    });
}