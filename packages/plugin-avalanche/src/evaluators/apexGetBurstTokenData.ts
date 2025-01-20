import {
    Evaluator,
    Memory,
    IAgentRuntime,
    elizaLogger,
    generateObject,
    EvaluationExample,
} from "@elizaos/core";
import {
    emptyCreateBurstTokenData,
    ApexCreateBurstTokenData,
    ApexBurstInternalFields,
    ApexBurstInternalField,
} from "../types/apex";
import {
    getBurstTokenDataCacheKey,
    getMissingRequiredFields,
    getMissingOptionalFields,
} from "../providers/apexCreateBurstToken";
import { ModelClass } from "@elizaos/core";
import { burstTokenSchema } from "../types/apexSchemas";
import { getBurstTokenDataTemplate } from "../templates/apex";
// import { canBeConfirmed } from "../utils/apexBurst";

const isDataComplete = (data: ApexCreateBurstTokenData) => {
    return (
        getMissingRequiredFields(data).length === 0 &&
        getMissingOptionalFields(data).length === 0
    );
};

export const apexGetBurstTokenDataEvaluator: Evaluator = {
    name: "GET_BURST_TOKEN_DATA",
    similes: [
        "BURST_TOKEN_INFORMATION",
        "EXTRACT_BURST_TOKEN_DATA",
        "EXTRACT_BURST_TOKEN_DETAILS",
        "COLLECT_BURST_TOKEN_DATA",
        "COLLECT_BURST_TOKEN_DETAILS",
        "GET_BURST_TOKEN_DETAILS",
        "GET_BURST_TOKEN_DATA",
        "BURST_TOKEN_DETAILS",
        "BURST_TOKEN_DATA",
        "MAKE_BURST_TOKEN",
        "MAKE_BURST_TOKEN_DATA",
        "MAKE_TOKEN_DATA",
        "MAKE_TOKEN_DETAILS",
        "LAUNCH_BURST_TOKEN",
        "LAUNCH_BURST_TOKEN_DATA",
        "LAUNCH_TOKEN_DATA",
        "LAUNCH_TOKEN_DETAILS",
    ],
    description:
        "Extract the burst token data (name, symbol, decimals, total supply, dex allocations etc.) from the user's messages when the user is trying to create a token and it's clearly stated.",
    alwaysRun: true,
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        try {
            const cacheKey = getBurstTokenDataCacheKey(runtime, message.userId);
            const cachedData =
                (await runtime.cacheManager.get<ApexCreateBurstTokenData>(
                    cacheKey
                )) || { ...emptyCreateBurstTokenData };

            // Run if the data is incomplete and the user hasn't confirmed the creation
            const isDataIncomplete = !isDataComplete(cachedData);
            elizaLogger.log(
                `[GET_BURST_TOKEN_DATA Evaluator] isDataIncomplete: ${isDataIncomplete} hasRequestedConfirmation: ${cachedData.hasRequestedConfirmation} receivedTokenRequest: ${cachedData.receivedTokenRequest}`
            );
            return (
                !isDataComplete(cachedData) &&
                !cachedData.hasRequestedConfirmation &&
                cachedData.receivedTokenRequest
            );
        } catch (error) {
            elizaLogger.error(
                `Error in apexGetBurstTokenDataEvaluator: ${error.message}`
            );
            return false;
        }
    },
    handler: async (runtime: IAgentRuntime, message: Memory) => {
        elizaLogger.info("GET_BURST_TOKEN_DATA handler");
        try {
            const cacheKey = getBurstTokenDataCacheKey(runtime, message.userId);
            const cachedData =
                (await runtime.cacheManager.get<ApexCreateBurstTokenData>(
                    cacheKey
                )) || { ...emptyCreateBurstTokenData };

            elizaLogger.log("Evaluator cached data", {
                cachedData,
            });

            const burstTokenDataExtractionTemplate = getBurstTokenDataTemplate(
                message.content.text
            );

            const generatedContent = await generateObject({
                runtime,
                context: burstTokenDataExtractionTemplate,
                modelClass: ModelClass.LARGE,
                schema: burstTokenSchema,
                mode: "auto",
            });

            let dataUpdated = false;

            const extractedInfo = (generatedContent.object ||
                generatedContent) as ApexCreateBurstTokenData;

            elizaLogger.log("Extracted info", {
                extractedInfo,
            });

            // Update all fields with new data
            Object.entries(extractedInfo).forEach(([field, value]) => {
                // Skip internal fields that shouldn't be copied
                if (
                    ApexBurstInternalFields.has(field as ApexBurstInternalField)
                ) {
                    return;
                }

                // Need to update values even if they are already set in the cached data
                // in the event that the user changes their mind
                if (
                    value !== null &&
                    value !== undefined &&
                    (typeof value !== "string" || value.length > 0)
                ) {
                    cachedData[field] = value;
                    dataUpdated = true;
                }
            });

            if (dataUpdated) {
                // const canBeConfirmedResult = canBeConfirmed(cachedData);
                // elizaLogger.log(
                //     "[GET_BURST_TOKEN_DATA Evaluator] canBeConfirmedResult",
                //     {
                //         canBeConfirmedResult,
                //     }
                // );
                // if (canBeConfirmedResult) {
                //     elizaLogger.info(
                //         "[GET_BURST_TOKEN_DATA Evaluator] Requesting confirmation"
                //     );
                //     cachedData.hasRequestedConfirmation = true;
                // }

                cachedData.lastUpdated = Date.now();
                await runtime.cacheManager.set(cacheKey, cachedData, {
                    expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 1 week
                });

                elizaLogger.log("Evaluator updated cached data", {
                    cachedData,
                });
            }
        } catch (error) {
            elizaLogger.error(
                `Error in apexGetBurstTokenDataEvaluator: ${error.message}`
            );
        }
    },
    examples: [
        {
            context: "Complete information provided clearly",
            messages: [
                {
                    user: "{{user1}}",
                    content: {
                        text: "I want to create a token called Apex Rewards with symbol APR. Total supply should be 1000000 tokens. Set trading fee to 2.5%, max wallet to 5%. Allocate 60% to APEX as reward pool, 20% to JOE, and 20% to PHARAOH. Burst amount is 325. Website is apexrewards.io, Twitter @apexrewards, Telegram @apexrewards_tg, Discord apexrewards. Here's my creator address: 0x742d35Cc6634C0532925a3b844Bc454e4438f44e. Description: First community-driven rewards token on Apex. Image Prompt: a logo of a shark with the word Apex Rewards in the middle",
                    },
                },
            ],
            outcome: `{
                "name": "Apex Rewards",
                "symbol": "APR",
                "totalSupply": 1000000,
                "imagePrompt": "a logo of a shark with the word Apex Rewards in the middle",
                "description": "First community-driven rewards token on Apex",
                "tradingFee": 250,
                "maxWalletPercent": 500,
                "burstAmount": 325,
                "dexAllocations": [
                    { "dex": "APEX", "allocation": 6000 },
                    { "dex": "JOE", "allocation": 2000 },
                    { "dex": "PHARAOH", "allocation": 2000 },
                    { "dex": "PANGOLIN", "allocation": 0 }
                ],
                "rewardDex": "APEX",
                "creatorAddress": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
                "website": "www.apexrewards.io",
                "twitter": "@apexrewards",
                "telegram": "@apexrewards_tg",
                "discord": "apexrewards"
            }`,
        },
        {
            context: "Partial information provided",
            messages: [
                {
                    user: "{{user1}}",
                    content: {
                        text: "I'm thinking of launching a token called Sharky with 2% trading fee. Not sure about other details yet but the symbol will be SHARK. Amount is 115.",
                    },
                },
            ],
            outcome: `{
                "name": "Sharky",
                "symbol": "SHARK",
                "tradingFee": 200,
                "burstAmount": 115
            }`,
        },
        {
            context: "Partial information with just image prompt",
            messages: [
                {
                    user: "{{user1}}",
                    content: {
                        text: "image prompt a logo of a shark with the word Sharky in the middle",
                    },
                },
            ],
            outcome: `{
                "imagePrompt": "a logo of a shark with the word Sharky in the middle"
            }`,
        },
        {
            context: "Partial information with additional details",
            messages: [
                {
                    user: "{{user1}}",
                    content: {
                        text: "I'm thinking of launching a token called Sharky with 2% trading fee. Not sure about other details yet but the symbol will be SHARK. Amount is 115.",
                    },
                },
            ],
            outcome: `{
                "name": "Sharky",
                "symbol": "SHARK",
                "tradingFee": 200,
                "burstAmount": 115
            }`,
        },
        {
            context: "Discussing existing tokens without creation intent",
            messages: [
                {
                    user: "{{user1}}",
                    content: {
                        text: "What do you think about the PEPE token? It has a 2% trading fee and 1% max wallet. The allocations are split between various DEXes.",
                    },
                },
            ],
            outcome: `{}`,
        },
        {
            context: "Multiple messages with evolving information",
            messages: [
                {
                    user: "{{user1}}",
                    content: {
                        text: "I want to create a new token called Space Mission",
                    },
                },
                {
                    user: "{{user1}}",
                    content: {
                        text: "The symbol will be SPACE, with 1.5% trading fee",
                    },
                },
                {
                    user: "{{user1}}",
                    content: {
                        text: "For socials, add telegram @spacemission and discord space-mission-official",
                    },
                },
            ],
            outcome: `{
                "name": "Space Mission",
                "symbol": "SPACE",
                "tradingFee": 150,
                "telegram": "@spacemission",
                "discord": "space-mission-official"
            }`,
        },
        {
            context: "Irrelevant conversation",
            messages: [
                {
                    user: "{{user1}}",
                    content: {
                        text: "Hey, how's the market doing today? I saw BTC is up quite a bit!",
                    },
                },
            ],
            outcome: `{}`,
        },
        {
            context: "Mixed information with clear intent",
            messages: [
                {
                    user: "{{user1}}",
                    content: {
                        text: "The market is crazy today! Anyway, I want to launch my token MetaVerse Explorer (MVE). Set max wallet to 3%, and make APEX the reward DEX with 45% allocation. Add 30% to JOE and 25% to PANGOLIN. Our website is meta-explorer.io",
                    },
                },
            ],
            outcome: `{
                "name": "Shark Waters",
                "symbol": "SHARK",
                "maxWalletPercent": 300,
                "website": "meta-explorer.io",
                "dexAllocations": [
                    { "dex": "APEX", "allocation": 4500 },
                    { "dex": "JOE", "allocation": 3000 },
                    { "dex": "PANGOLIN", "allocation": 2500 },
                    { "dex": "PHARAOH", "allocation": 0 }
                ]
            }`,
        },
        {
            context: "Full token details with media URIs",
            messages: [
                {
                    user: "{{user1}}",
                    content: {
                        text: "Launch token GameFi Hub (GFH). Trading fee 2.5%, max wallet 4.25%. Split 50% APEX (reward), 25% each JOE and PANGOLIN. Image Prompt: a logo of a shark with the word GameFi Hub in the middle. Description: GameFi Hub is the ultimate gaming token. Twitter @gamefihub, Telegram @gfhub",
                    },
                },
            ],
            outcome: `{
                "name": "GameFi Hub",
                "symbol": "GFH",
                "tradingFee": 250,
                "maxWalletPercent": 425,
                "imagePrompt": "a logo of a shark with the word GameFi Hub in the middle",
                "description": "GameFi Hub is the ultimate gaming token",
                "twitter": "@gamefihub",
                "telegram": "@gfhub",
                "dexAllocations": [
                    { "dex": "APEX", "allocation": 5000 },
                    { "dex": "JOE", "allocation": 2500 },
                    { "dex": "PANGOLIN", "allocation": 2500 },
                    { "dex": "PHARAOH", "allocation": 0 }
                ]
            }`,
        },
        {
            context: "Hypothetical discussion without clear intent",
            messages: [
                {
                    user: "{{user1}}",
                    content: {
                        text: "If I were to create a token, I might call it DogeCoin2 with 1% fee. What do you think about that name? Or maybe CatCoin would be better?",
                    },
                },
            ],
            outcome: `{}`,
        },
        {
            context: "Token creation with imgur and direct image links",
            messages: [
                {
                    user: "{{user1}}",
                    content: {
                        text: "Creating new token DigiDragon (DDRG). Trading fee 3%, max wallet 2.5%. Allocations: 60% APEX as reward, 20% JOE, 20% PANGOLIN. Image Prompt: a logo of a dragon with the word DigiDragon in the middle",
                    },
                },
            ],
            outcome: `{
                "name": "DigiDragon",
                "symbol": "DDRG",
                "tradingFee": 300,
                "maxWalletPercent": 250,
                "imagePrompt": "a logo of a dragon with the word DigiDragon in the middle",
                "dexAllocations": [
                    { "dex": "APEX", "allocation": 6000 },
                    { "dex": "JOE", "allocation": 2000 },
                    { "dex": "PANGOLIN", "allocation": 2000 },
                    { "dex": "PHARAOH", "allocation": 0 }
                ]
            }`,
        },
        {
            context: "Token creation with image prompt",
            messages: [
                {
                    user: "{{user1}}",
                    content: {
                        text: "Let's create token CyberPunk (PUNK). 2% trading fee, 3% max wallet. Split 40% APEX (reward), 30% each for JOE and PANGOLIN. Image Prompt: a logo of a shark with the word CyberPunk in the middle",
                    },
                },
            ],
            outcome: `{
                "name": "CyberPunk",
                "symbol": "PUNK",
                "tradingFee": 200,
                "maxWalletPercent": 300,
                "imagePrompt": "a logo of a shark with the word CyberPunk in the middle",
                "dexAllocations": [
                    { "dex": "APEX", "allocation": 4000 },
                    { "dex": "JOE", "allocation": 3000 },
                    { "dex": "PANGOLIN", "allocation": 3000 },
                    { "dex": "PHARAOH", "allocation": 0 }
                ]
            }`,
        },
        {
            context: "Token creation with image prompt",
            messages: [
                {
                    user: "{{user1}}",
                    content: {
                        text: "Creating MetaWars token (MWAR). Fee 2.5%, max wallet 4%. 45% APEX (reward), 30% JOE, 25% PANGOLIN. Image Prompt: a logo of a shark with the word MetaWars in the middle",
                    },
                },
            ],
            outcome: `{
                "name": "MetaWars",
                "symbol": "MWAR",
                "tradingFee": 250,
                "maxWalletPercent": 400,
                "imagePrompt": "a logo of a shark with the word MetaWars in the middle",
                "dexAllocations": [
                    { "dex": "APEX", "allocation": 4500 },
                    { "dex": "JOE", "allocation": 3000 },
                    { "dex": "PANGOLIN", "allocation": 2500 },
                    { "dex": "PHARAOH", "allocation": 0 }
                ]
            }`,
        },
        {
            context: "Invalid DEXs and excessive fees",
            messages: [
                {
                    user: "{{user1}}",
                    content: {
                        text: "Creating my token SCAM with 10% trading fee, max wallet 200%. Split between Uniswap (50%) and SushiSwap (50%) as reward pools.",
                        attachments: [
                            {
                                type: "image",
                                id: "logo-123",
                                url: "agent-storage://logo-123.png",
                            },
                        ],
                    },
                },
                {
                    user: "{{user2}}",
                    content: {
                        text: "The trading fee is too high, let's reduce it to 2% and max wallet to 5%. Those are invalid DEXs, let's remove them.",
                    },
                },
            ],
            outcome: `{}`,
        },
        {
            context: "Changing existing DEX allocation",
            messages: [
                {
                    user: "{{user1}}",
                    content: {
                        text: "I want to change the APEX allocation to 30% instead of 45%",
                    },
                },
            ],
            outcome: `{
                "dexAllocations": [
                    { "dex": "APEX", "allocation": 3000 },
                    { "dex": "JOE", "allocation": 3000 },
                    { "dex": "PANGOLIN", "allocation": 2500 },
                    { "dex": "PHARAOH", "allocation": 1500 }
                ]
            }`,
        },
        {
            context: "Adding new DEX allocation",
            messages: [
                {
                    user: "{{user1}}",
                    content: {
                        text: "Let's add 15% allocation to PHARAOH",
                    },
                },
            ],
            outcome: `{
                "dexAllocations": [
                    { "dex": "APEX", "allocation": 4500 },
                    { "dex": "JOE", "allocation": 3000 },
                    { "dex": "PANGOLIN", "allocation": 1000 },
                    { "dex": "PHARAOH", "allocation": 1500 }
                ]
            }`,
        },
        {
            context: "Changing reward DEX",
            messages: [
                {
                    user: "{{user1}}",
                    content: {
                        text: "I want to change the reward DEX to JOE instead of APEX",
                    },
                },
            ],
            outcome: `{
                "dexAllocations": [
                    { "dex": "APEX", "allocation": 4500 },
                    { "dex": "JOE", "allocation": 3000 },
                    { "dex": "PANGOLIN", "allocation": 2500 },
                    { "dex": "PHARAOH", "allocation": 0 }
                ],
                "rewardDex": "JOE"
            }`,
        },
        {
            context: "User indicates no additional fields",
            messages: [
                {
                    user: "{{user1}}",
                    content: {
                        text: "no other extras",
                    },
                },
            ],
            outcome: `{}`, // Empty object - no changes
        },
        {
            context: "User declines optional fields",
            messages: [
                {
                    user: "{{user1}}",
                    content: {
                        text: "skip the rest",
                    },
                },
            ],
            outcome: `{}`,
        },
        {
            context: "User wants to proceed without optional fields",
            messages: [
                {
                    user: "{{user1}}",
                    content: {
                        text: "that's all I want to add",
                    },
                },
            ],
            outcome: `{}`,
        },
        {
            context: "User explicitly skips optional fields",
            messages: [
                {
                    user: "{{user1}}",
                    content: {
                        text: "no optional features needed",
                    },
                },
            ],
            outcome: `{}`,
        },
    ] as EvaluationExample[],
};
