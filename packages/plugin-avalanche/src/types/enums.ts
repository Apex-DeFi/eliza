// enums.ts
export enum BurstDEXs {
    APEX = "APEX",
    JOE = "JOE",
    PHARAOH = "PHARAOH",
    PANGOLIN = "PANGOLIN",
}

export const convertBurstDEXToNumber = (dex: BurstDEXs) => {
    return Object.values(BurstDEXs).indexOf(dex);
};
