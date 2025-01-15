import { DexAllocation } from ".";
import { BurstDEXs } from "./enums";

export const ApexBurstFields = [
    "name",
    "symbol",
    "totalSupply",
    "image",
    "banner",
    "swapSound",
    "description",
    "tradingFee",
    "maxWalletPercent",
    "burstAmount",
    "dexAllocations",
    "rewardDex",
    "creatorAddress",
    "website",
    "twitter",
    "telegram",
    "discord",
] as const;

// This is the information that is to be gathered from the user to be able to create a burst token
// Some of these fields are not required, but they are here to make the user experience better
export interface ApexCreateBurstTokenData {
    name: string | undefined;
    symbol: string | undefined;
    totalSupply: number | undefined;
    image: string | undefined;
    banner: string | undefined;
    swapSound: string | undefined;
    description: string | undefined;
    tradingFee: number | undefined;
    maxWalletPercent: number | undefined;
    burstAmount: number | undefined;
    dexAllocations: DexAllocation[] | undefined;
    rewardDex: BurstDEXs | undefined;
    creatorAddress: string | undefined;
    website: string | undefined;
    twitter: string | undefined;
    telegram: string | undefined;
    discord: string | undefined;
    isConfirmed: boolean | undefined;
    isBurstTokenCreated: boolean | undefined;
    lastUpdated: number | undefined;
}

export const emptyCreateBurstTokenData: ApexCreateBurstTokenData = {
    name: undefined,
    symbol: undefined,
    totalSupply: undefined,
    image: undefined,
    banner: undefined,
    swapSound: undefined,
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
    isConfirmed: undefined,
    isBurstTokenCreated: undefined,
    lastUpdated: undefined,
};

export type BurstTokenFieldGuidance = {
    description: string;
    valid: string;
    invalid: string;
    instructions: string;
};

export const BURST_TOKEN_FIELD_GUIDANCE: {
    [key: string]: BurstTokenFieldGuidance;
} = {
    name: {
        description: "The name of the token",
        valid: "Apex DeFi, ApexDeFi, Bitcoin, Avax, sAVAX, ggAVAX. Must be alphanumeric and no special characters",
        invalid:
            "names longer than 50 characters, or names with special characters",
        instructions:
            "Extract the name of the token from the user's message only when the user directly states the token name",
    },
    symbol: {
        description: "The symbol of the token",
        valid: "APEX, BTC, AVAX, sAVAX, ggAVAX. Must be alphanumeric and no special characters",
        invalid:
            "symbols longer than 10 characters, or symbols with special characters",
        instructions:
            "Extract the symbol of the token from the user's message only when the user directly states the token symbol",
    },
    totalSupply: {
        description: "The total supply of the token",
        valid: "100, 1000000, 1000000000, 314, 314000, 314k, 1million, 1m, 100 billion, 100b. Must be a positive integer",
        invalid:
            "-1, 100.5, 100.5k, 100.5m, 100.5b. Must be a positive integer",
        instructions:
            "Extract the total supply of the token from the user's message only when the user directly states the token total supply",
    },
    image: {
        description:
            "The image of the token as an attachment or uploaded image or url",
        valid: "https://example.com/image.png, https://example.com/image.jpg, https://example.com/image.jpeg, https://example.com/image.gif, https://example.com/image.webp. Could also be an attachment or uploaded image",
        invalid: "image.png, image.jpg, image.jpeg, image.gif, image.webp",
        instructions:
            "Extract the image URI of the token from the user's message only when the user directly states the token image URI",
    },
    banner: {
        description:
            "The banner of the token as an attachment or uploaded image or url",
        valid: "https://example.com/banner.png, https://example.com/banner.jpg, https://example.com/banner.jpeg, https://example.com/banner.gif, https://example.com/banner.webp. Could also be an attachment or uploaded image",
        invalid: "banner.png, banner.jpg, banner.jpeg, banner.gif, banner.webp",
        instructions:
            "Extract the banner URI of the token from the user's message only when the user directly states the token banner URI",
    },
    swapSound: {
        description:
            "The swap sound of the token as an attachment or uploaded sound or url",
        valid: "https://example.com/swap.mp3, https://example.com/swap.wav, https://example.com/swap.ogg. Could also be an attachment or uploaded sound",
        invalid: "swap.mp3, swap.wav, swap.ogg",
        instructions:
            "Extract the swap sound URI of the token from the user's message only when the user directly states the token swap sound URI",
    },
    description: {
        description: "The description of the token",
        valid: "The description of the token must be a string",
        invalid:
            "A link or url to a website, twitter, telegram, discord, or other social media.",
        instructions:
            "Extract the description of the token from the user's message only when the user directly states the token description",
    },
    tradingFee: {
        description: "The trading fee of the token",
        valid: "0%-5%, 1.25%, 4.1%. Must be within the range of 0-5",
        invalid: "-1, 6, 10.5, 10.5k, 10.5m, 10.5b, 10.5%, 6%, -1%, 100%",
        instructions:
            "Extract the trading fee of the token from the user's message only when the user directly states the token trading fee",
    },
    maxWalletPercent: {
        description: "The max wallet percent of the token",
        valid: "0-100%, 1.25%, 4.1%, 90%, 100%. Must be within the range of 0-100",
        invalid: "-1, 101, 10.5, 10.5k, 10.5m, 10.5b, -1%, 100%",
        instructions:
            "Extract the max wallet percent of the token from the user's message only when the user directly states the token max wallet percent",
    },
    burstAmount: {
        description: "The amount of Avax required for tokens to Burst",
        valid: "50-2000 with increments of 5. 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150, 155, 160, 165, 170, 175, 180, 185, 190, 195, 2000",
        invalid:
            "4, 45, 2001, 2005, 2006, 2007, 2008, 2009, 2010, 3000, -1, 0, 45.5",
        instructions:
            "Extract the burst amount of the token from the user's message only when the user directly states the token burst amount",
    },
    dexAllocations: {
        description: "The dex allocations for the token's liquidity",
        valid: "APEX 50%, JOE 20%, PHARAOH 20%, PANGOLIN 10%. Must be a positive number and within the range of 0-100. Must be a percentage. Must be APEX, JOE, PHARAOH, and/or PANGOLIN. The total must equal 100%",
        invalid:
            "APEX -1%, JOE 101%, PHARAOH 100.5%, PANGOLIN 100.5k. UNISWAP, SUSHI",
        instructions:
            "Extract the dex allocations of the token from the user's message only when the user directly states the token dex allocations",
    },
    rewardDex: {
        description:
            "The DEXs LP tokens that will be used as the single sided staking rewards",
        valid: "APEX, JOE, PHARAOH, PANGOLIN. Must be APEX, JOE, PHARAOH, and/or PANGOLIN. User can only choose one of these.",
        invalid: "UNISWAP, SUSHI, DEX",
        instructions:
            "Extract the reward dex of the token from the user's message only when the user directly states the token reward dex",
    },
    creatorAddress: {
        description: "The address of the creator of the token",
        valid: "0x1234567890123456789012345678901234567890",
        invalid:
            "0x1234567890123456789012345678901234567890123456789012345678901234",
        instructions:
            "Extract the creator address of the token from the user's message only when the user directly states the token creator address",
    },
    website: {
        description: "The website of the token",
        valid: "https://example.com, https://www.example.com, https://www.example.com/subpage",
        invalid: "example.com, www.example.com, www.example.com/subpage",
        instructions:
            "Extract the website of the token from the user's message only when the user directly states the token website",
    },
    twitter: {
        description: "The twitter of the token",
        valid: "https://x.com/example, https://www.x.com/example, https://x.com/example/subpage, https://twitter.com/example, https://www.twitter.com/example, https://www.twitter.com/example/subpage, @example, @big_rig",
        invalid: "example, www.example, www.example/subpage",
        instructions:
            "Extract the twitter of the token from the user's message only when the user directly states the token twitter",
    },
    telegram: {
        description: "The telegram of the token",
        valid: "https://t.me/example, https://www.t.me/example, https://www.t.me/example/subpage, @example, @big_rig",
        invalid: "example, www.example, www.example/subpage",
        instructions:
            "Extract the telegram of the token from the user's message only when the user directly states the token telegram",
    },
    discord: {
        description: "The discord of the token",
        valid: "https://discord.gg/example, https://www.discord.gg/example, https://www.discord.gg/example/subpage",
        invalid: "example, www.example, www.example/subpage",
        instructions:
            "Extract the discord of the token from the user's message only when the user directly states the token discord",
    },
};
