import { DexAllocation } from ".";
import { BurstDEXs } from "./enums";

export interface TokenMetadata {
    name: string;
    ticker: string;
    logo: string | null;
    banner: string | null;
    website: string;
    x: string;
    telegram: string;
    discord: string;
    description: string;
    decimals: number;
    burstAudio: BurstAudioMetaData;
}

export interface BurstAudioMetaData {
    name: string | null;
    ipfsURI: string | null;
}

export const ApexBurstRequiredFields = [
    "name",
    "symbol",
    "totalSupply",
    "description",
    "burstAmount",
    "dexAllocations",
    "rewardDex",
    "creatorAddress",
] as const;

export const ApexBurstOptionalFields = [
    "tradingFee",
    "maxWalletPercent",
    "imagePrompt",
    // "banner",
    // "swapSound",
    "website",
    "twitter",
    "telegram",
    "discord",
] as const;

export type ApexBurstInternalField = keyof Pick<
    ApexCreateBurstTokenData,
    | "lastUpdated"
    | "isConfirmed"
    | "hasRequestedConfirmation"
    | "receivedTokenRequest"
>;

export const ApexBurstInternalFields = new Set<ApexBurstInternalField>([
    "lastUpdated",
    "isConfirmed",
    "hasRequestedConfirmation",
    "receivedTokenRequest",
]);

// This is the information that is to be gathered from the user to be able to create a burst token
// Some of these fields are not required, but they are here to make the user experience better
export interface ApexCreateBurstTokenData {
    // Required fields
    name: string | undefined;
    symbol: string | undefined;
    totalSupply: number | undefined;
    description: string | undefined;
    burstAmount: number | undefined;
    dexAllocations: DexAllocation[] | undefined;
    rewardDex: BurstDEXs | undefined;
    creatorAddress: string | undefined;
    // Optional fields
    tradingFee: number | undefined;
    maxWalletPercent: number | undefined;
    imagePrompt: string | undefined;
    // banner: string | undefined;
    // swapSound: string | undefined;
    // Optional fields for social media
    website: string | undefined;
    twitter: string | undefined;
    telegram: string | undefined;
    discord: string | undefined;
    // Confirmation fields
    receivedTokenRequest: boolean;
    hasRequestedConfirmation: boolean;
    isConfirmed: boolean;
    lastUpdated: number | undefined;
}

export const emptyCreateBurstTokenData: ApexCreateBurstTokenData = {
    name: undefined,
    symbol: undefined,
    totalSupply: undefined,
    imagePrompt: undefined,
    // banner: undefined,
    // swapSound: undefined,
    description: undefined,
    tradingFee: undefined,
    maxWalletPercent: undefined,
    burstAmount: undefined,
    dexAllocations: undefined,
    rewardDex: undefined,
    creatorAddress: undefined,
    website: undefined,
    twitter: undefined,
    telegram: undefined,
    discord: undefined,
    receivedTokenRequest: false,
    hasRequestedConfirmation: false,
    isConfirmed: false,
    lastUpdated: undefined,
};

export type CurveDetails = {
    index: number;
    curveStyle?: number;
    distribution: bigint[];
    binStepScaleFactor: bigint[];
    percentOfLP: bigint;
    avaxAtLaunch: bigint;
    basePrice: bigint;
} | null;

export type BurstTokenFieldGuidance = {
    description: string;
    valid: string;
    invalid: string;
    instructions: string;
};
