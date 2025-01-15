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
} from "../types/apex";
import {
    getBurstTokenDataCacheKey,
    getMissingFields,
} from "../providers/apexCreateBurstToken";
import { ModelClass } from "@elizaos/core";
import { burstTokenSchema } from "../types/apexSchemas";

const isDataComplete = (data: ApexCreateBurstTokenData) => {
    return getMissingFields(data).length === 0;
};

export const burstTokenDataEvaluator: Evaluator = {
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
    ],
    description:
        "Extract the burst token data (name, symbol, decimals, total supply, dex allocations etc.) from the user's messages when the user is trying to create a burst token and it's clearly stated.",
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        try {
            const cacheKey = getBurstTokenDataCacheKey(runtime, message.userId);
            const cachedData =
                (await runtime.cacheManager.get<ApexCreateBurstTokenData>(
                    cacheKey
                )) || { ...emptyCreateBurstTokenData };

            // Check if the message indicates token creation intent
            const tokenCreationIntent = /token|burst|create|launch/i.test(
                message.content.text
            );

            // Run if there's creation intent OR incomplete data
            return (
                tokenCreationIntent ||
                !isDataComplete(cachedData) ||
                !cachedData.isBurstTokenCreated
            );
        } catch (error) {
            elizaLogger.error(
                `Error in burstTokenDataEvaluator: ${error.message}`
            );
            return false;
        }
    },
    handler: async (runtime: IAgentRuntime, message: Memory) => {
        elizaLogger.info("GET_BURST_TOKEN_DATA handler");
        elizaLogger.debug(message);
        try {
            const cacheKey = getBurstTokenDataCacheKey(runtime, message.userId);
            const cachedData =
                (await runtime.cacheManager.get<ApexCreateBurstTokenData>(
                    cacheKey
                )) || { ...emptyCreateBurstTokenData };

            elizaLogger.debug("Evaluator cached data", {
                cachedData,
            });

            const burstTokenDataExtractionTemplate = `
Analyze the following conversation and extract the token details.
Only extract information (name, symbol, totalSupply, tradingFee, maxWalletPercent, metadataURI, curveIndex, dexAllocations, creator) when it is explicitly and clearly stated by the user about a token they want to create.

Conversation:
${message.content.text}

Return a JSON object containing only the fields where information was clearly found:

\`\`\`json
{
    "name": "string",
    "symbol": string,
    "totalSupply": number,
    "imageURI": string,
    "bannerURI": string,
    "swapSoundURI": string,
    "description": string,
    "tradingFee": number,
    "maxWalletPercent": number,
    "burstAmount": number,
    "dexAllocations": [
        {
            "dex": string,
            "allocation": number
        }
    ],
    "rewardDex": string,
    "creatorAddress": string,
    "website": string,
    "twitter": string,
    "telegram": string,
    "discord": string,
    "isConfirmed": boolean
}
\`\`\`

Only include fields where the information is explicitly and clearly stated by the user.
Omit fields if the information is unclear, hypothetical, or not explicitly stated.
`;

            const generatedContent = await generateObject({
                runtime,
                context: burstTokenDataExtractionTemplate,
                modelClass: ModelClass.LARGE,
                schema: burstTokenSchema,
            });

            let dataUpdated = false;

            const extractedInfo = (generatedContent.object ||
                generatedContent) as ApexCreateBurstTokenData;

            elizaLogger.log("Extracted info", {
                extractedInfo,
            });

            // Update only undefined fields with new data
            Object.entries(extractedInfo).forEach(([field, value]) => {
                // Skip internal fields that shouldn't be copied
                if (
                    field === "isBurstTokenCreated" ||
                    field === "lastUpdated" ||
                    field === "isConfirmed"
                ) {
                    return;
                }

                // Need to update values even if they are already set in the cached data
                // in the event that the user changes their mind
                if (value) {
                    // TypeScript will ensure field is a valid key of ApexCreateBurstTokenData
                    cachedData[field] = value;
                    dataUpdated = true;
                }
            });

            if (dataUpdated) {
                cachedData.lastUpdated = Date.now();
                await runtime.cacheManager.set(cacheKey, cachedData, {
                    expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 1 week
                });
            }

            elizaLogger.log("Evaluator cached data", {
                cachedData,
            });

            if (isDataComplete(cachedData)) {
                elizaLogger.log("Data is complete, creating burst token...");
            }
        } catch (error) {
            elizaLogger.error(
                `Error in burstTokenDataEvaluator: ${error.message}`
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
                        text: "I want to create a token called Apex Rewards with symbol APR. Total supply should be 1000000 tokens. Set trading fee to 2.5%, max wallet to 5%. Allocate 60% to APEX as reward pool, 20% to JOE, and 20% to PHARAOH. Burst amount is 100000. Website is apexrewards.io, Twitter @apexrewards, Telegram @apexrewards_tg, Discord apexrewards. Here's my creator address: 0x742d35Cc6634C0532925a3b844Bc454e4438f44e. Description: First community-driven rewards token on Apex. Image URI: ipfs://Qm..., Banner URI: ipfs://Qm..., Swap sound: ipfs://Qm...",
                    },
                },
            ],
            outcome: `{
                "name": "Apex Rewards",
                "symbol": "APR",
                "totalSupply": 1000000,
                "imageURI": "ipfs://Qm...",
                "bannerURI": "ipfs://Qm...",
                "swapSoundURI": "ipfs://Qm...",
                "description": "First community-driven rewards token on Apex",
                "tradingFee": 250,
                "maxWalletPercent": 500,
                "burstAmount": 100000,
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
                        text: "I'm thinking of launching a token called CryptoKitties with 2% trading fee. Not sure about other details yet but the symbol will be KITY",
                    },
                },
            ],
            outcome: `{
                "name": "CryptoKitties",
                "symbol": "KITY",
                "tradingFee": 200
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
                "name": "MetaVerse Explorer",
                "symbol": "MVE",
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
                        text: "Launch token GameFi Hub (GFH). Trading fee 2.5%, max wallet 4.25%. Split 50% APEX (reward), 25% each JOE and PANGOLIN. Banner: ipfs://Qm..., Image: ipfs://Qm..., Swap sound: ipfs://Qm... Description: GameFi Hub is the ultimate gaming token. Twitter @gamefihub, Telegram @gfhub",
                    },
                },
            ],
            outcome: `{
                "name": "GameFi Hub",
                "symbol": "GFH",
                "tradingFee": 250,
                "maxWalletPercent": 425,
                "bannerURI": "ipfs://Qm...",
                "imageURI": "ipfs://Qm...",
                "swapSoundURI": "ipfs://Qm...",
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
                        text: "Creating new token DigiDragon (DDRG). Trading fee 3%, max wallet 2.5%. Allocations: 60% APEX as reward, 20% JOE, 20% PANGOLIN. Banner image: https://imgur.com/a/ABC123, token logo: https://i.imgur.com/XYZ789.png, and the swap sound is https://direct.link/sound.mp3",
                    },
                },
            ],
            outcome: `{
                "name": "DigiDragon",
                "symbol": "DDRG",
                "tradingFee": 300,
                "maxWalletPercent": 250,
                "bannerURI": "https://imgur.com/a/ABC123",
                "imageURI": "https://i.imgur.com/XYZ789.png",
                "swapSoundURI": "https://direct.link/sound.mp3",
                "dexAllocations": [
                    { "dex": "APEX", "allocation": 6000 },
                    { "dex": "JOE", "allocation": 2000 },
                    { "dex": "PANGOLIN", "allocation": 2000 },
                    { "dex": "PHARAOH", "allocation": 0 }
                ]
            }`,
        },
        {
            context: "Token creation with agent-attached media",
            messages: [
                {
                    user: "{{user1}}",
                    content: {
                        text: "Let's create token CyberPunk (PUNK). 2% trading fee, 3% max wallet. Split 40% APEX (reward), 30% each for JOE and PANGOLIN.",
                        attachments: [
                            {
                                type: "image",
                                id: "banner-123",
                                url: "agent-storage://banner-123.png",
                            },
                            {
                                type: "image",
                                id: "logo-456",
                                url: "agent-storage://logo-456.png",
                            },
                            {
                                type: "audio",
                                id: "swap-789",
                                url: "agent-storage://swap-789.mp3",
                            },
                        ],
                    },
                },
            ],
            outcome: `{
                "name": "CyberPunk",
                "symbol": "PUNK",
                "tradingFee": 200,
                "maxWalletPercent": 300,
                "bannerURI": "agent-storage://banner-123.png",
                "imageURI": "agent-storage://logo-456.png",
                "swapSoundURI": "agent-storage://swap-789.mp3",
                "dexAllocations": [
                    { "dex": "APEX", "allocation": 4000 },
                    { "dex": "JOE", "allocation": 3000 },
                    { "dex": "PANGOLIN", "allocation": 3000 },
                    { "dex": "PHARAOH", "allocation": 0 }
                ]
            }`,
        },
        {
            context: "Mixed media sources with partial attachments",
            messages: [
                {
                    user: "{{user1}}",
                    content: {
                        text: "Creating MetaWars token (MWAR). Fee 2.5%, max wallet 4%. 45% APEX (reward), 30% JOE, 25% PANGOLIN. Banner is https://imgur.com/a/DEF456",
                        attachments: [
                            {
                                type: "image",
                                id: "logo-789",
                                url: "agent-storage://logo-789.png",
                            },
                            {
                                type: "audio",
                                id: "swap-101",
                                url: "agent-storage://swap-101.mp3",
                            },
                        ],
                    },
                },
            ],
            outcome: `{
                "name": "MetaWars",
                "symbol": "MWAR",
                "tradingFee": 250,
                "maxWalletPercent": 400,
                "bannerURI": "https://imgur.com/a/DEF456",
                "imageURI": "agent-storage://logo-789.png",
                "swapSoundURI": "agent-storage://swap-101.mp3",
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
    ] as EvaluationExample[],
};
