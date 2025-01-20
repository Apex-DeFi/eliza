import {
    ActionExample,
    composeContext,
    elizaLogger,
    generateObject,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    ModelClass,
    State,
} from "@elizaos/core";
import { apexCreateTokenTemplate } from "../templates/apex";
// import { z } from "zod";
import {
    // ApexBurstOptionalFields,
    ApexCreateBurstTokenData,
} from "../types/apex";
import { burstTokenSchema } from "../types/apexSchemas";
import { validateAvalancheConfig } from "../environment";
import { getMissingRequiredFields } from "../utils/apexBurst";

// const apexCreateTokenSchema = z.object({
//     // Required fields
//     name: z.string().optional().describe("The name of the token"),
//     symbol: z.string().optional().describe("The symbol of the token"),
//     totalSupply: z
//         .number()
//         .optional()
//         .describe("The total supply of the token"),
//     description: z.string().optional().describe("The description of the token"),
//     burstAmount: z
//         .number()
//         .optional()
//         .describe("The amount of avax required to burst the token"),
//     dexAllocations: z
//         .array(
//             z
//                 .object({
//                     dex: z
//                         .enum(["APEX", "JOE", "PHARAOH", "PANGOLIN"])
//                         .describe(
//                             "The dex to allocate a portion of the liquidity"
//                         ),
//                     allocation: z
//                         .number()
//                         .describe(
//                             "The allocation of liquidity to the dex in basis points (10000 = 100%)"
//                         ),
//                 })
//                 .optional()
//                 .describe(
//                     "The DEX and its associated allocation of liquidity in basis points (10000 = 100%)"
//                 )
//         )
//         .optional()
//         .describe(
//             "An array of DEXs and their associated allocation of liquidity in basis points (10000 = 100%)"
//         ),
//     rewardDex: z
//         .enum(["APEX", "JOE", "PHARAOH", "PANGOLIN"])
//         .optional()
//         .describe(
//             "The DEX for which LP tokens will be used as rewards for single-sided staking"
//         ),
//     creatorAddress: z
//         .string()
//         .optional()
//         .describe(
//             "The address of the creator of the token. Must be a valid EVM address"
//         ),
//     // Optional fields
//     tradingFee: z
//         .number()
//         .optional()
//         .describe(
//             "The trading fee for the token in basis points (10000 = 100%). 0-500"
//         ),
//     maxWalletPercent: z
//         .number()
//         .optional()
//         .describe(
//             "The maximum wallet percent for the token in basis points (10000 = 100%). 0-10000"
//         ),
//     imagePrompt: z
//         .string()
//         .optional()
//         .describe("The prompt for the image for the token"),
//     website: z.string().optional().describe("The website of the token"),
//     twitter: z.string().optional().describe("The twitter of the token"),
//     telegram: z.string().optional().describe("The telegram of the token"),
//     discord: z.string().optional().describe("The discord of the token"),
// });

// type ApexCreateTokenParams = z.infer<typeof apexCreateTokenSchema>;

export default {
    name: "CREATE_BURST_TOKEN",
    description:
        "MUST use this action if the user requests to create a new token, the request might be varied, but it will always be a token creation.",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ) => {
        // Compose state if not provided
        if (!state) {
            state = (await runtime.composeState(message)) as State;
        } else {
            state = await runtime.updateRecentMessageState(state);
        }

        const tokenContext = composeContext({
            state: state,
            template: apexCreateTokenTemplate,
        });

        const extractedInfo = await generateObject({
            runtime: runtime,
            context: tokenContext,
            modelClass: ModelClass.LARGE,
            schema: burstTokenSchema,
            mode: "auto",
        });

        const tokenData = (extractedInfo.object ||
            extractedInfo) as ApexCreateBurstTokenData;

        elizaLogger.info(
            `Extracted token data: ${JSON.stringify(tokenData, null, 2)}`
        );

        const missingRequiredFields = getMissingRequiredFields(tokenData);

        elizaLogger.info(
            `Missing fields: ${JSON.stringify(missingRequiredFields, null, 2)}`
        );

        const messageText = message.content.text.toLowerCase();

        if (messageText.includes("cancel")) {
            callback?.({
                text: "Token creation cancelled. You can start over whenever you're ready.",
            });
            return true;
        }

        if (!messageText.includes("confirm")) {
            if (missingRequiredFields.length > 0) {
                // callback?.({
                //     text:
                //         `Missing fields:\n${missingRequiredFields.join("\n")}.\n\n` +
                //         `Optional fields:\n${ApexBurstOptionalFields.map((field) => `${field}: ${tokenData[field as keyof ApexCreateBurstTokenData] ?? "Not provided"}`).join("\n")}`,
                // });

                return true;
            } else {
                callback?.({
                    text: `Please confirm these token details:\n${JSON.stringify(
                        tokenData,
                        null,
                        2
                    )}\n\nType "confirm" to create the token or "cancel" to clear the data and start over.`,
                });

                return true;
            }
        }

        try {
            // Placeholder for token creation logic
            console.log("Would create token with data:", tokenData);

            callback?.({
                text: `Token ${tokenData.name} (${tokenData.symbol}) created successfully!\nTotal Supply: ${tokenData.totalSupply}\nBurst Amount: ${tokenData.burstAmount}`,
                content: {
                    success: true,
                    tokenData,
                },
            });

            const newMemory: Memory = {
                userId: message.agentId,
                agentId: message.agentId,
                roomId: message.roomId,
                content: {
                    text: `Token ${tokenData.name} (${tokenData.symbol}) was successfully created with ${JSON.stringify(
                        tokenData,
                        null,
                        2
                    )}.`,
                },
            };

            await runtime.messageManager.createMemory(newMemory);

            return true;
        } catch (error) {
            console.error("Error during token creation:", error);

            callback?.({
                text: `Error creating token: ${error.message}`,
                content: { error: error.message },
            });

            const newMemory: Memory = {
                userId: message.agentId,
                agentId: message.agentId,
                roomId: message.roomId,
                content: {
                    text: `Token creation for ${tokenData.name} (${tokenData.symbol}) (${JSON.stringify(
                        tokenData,
                        null,
                        2
                    )}) failed.`,
                },
            };

            await runtime.messageManager.createMemory(newMemory);

            return false;
        }
    },
    validate: async (runtime: IAgentRuntime) => {
        await validateAvalancheConfig(runtime);
        return true;
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Create token MOON with 1M supply, 100% on APEX, 300 Avax, Reward APEX",
                    action: "CREATE_BURST_TOKEN",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Please confirm these token details:\nName: MOON\nSupply: 1,000,000\nBurst: 300 Avax\nDEX: APEX 100%\nReward: APEX",
                    action: "CREATE_BURST_TOKEN",
                },
            },
            {
                user: "{{user1}}",
                content: {
                    text: "Yes",
                    action: "CREATE_BURST_TOKEN",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Token MOON created successfully!",
                    action: "CREATE_BURST_TOKEN",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Create token called Pepe, symbol PEPE, 100M supply, 50% on APEX and 50% on JOE",
                    action: "CREATE_BURST_TOKEN",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Please provide a description for the token and your creator address.",
                    action: "CREATE_BURST_TOKEN",
                },
            },
            {
                user: "{{user1}}",
                content: {
                    text: "Description: Meme token for the community, creator: 0x123...abc",
                    action: "CREATE_BURST_TOKEN",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Please confirm these token details:\nName: Pepe\nSymbol: PEPE\nSupply: 100,000,000\nBurst: 250 Avax\nDEX: APEX(25%), JOE(25%) PHARAOH(50%)\nDescription: Meme token for the community\nCreator: 0x123...abc",
                    action: "CREATE_BURST_TOKEN",
                },
            },
            {
                user: "{{user1}}",
                content: {
                    text: "Confirm",
                    action: "CREATE_BURST_TOKEN",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Token PEPE created successfully!",
                    action: "CREATE_BURST_TOKEN",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "I want to launch new token on APEX",
                    action: "CREATE_BURST_TOKEN",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Here are all the required fields for creating a new token on APEX.\n\nName: The name of the token\nSymbol: The symbol of the token\nTotal Supply: The total supply of the token\nDescription: The description of the token\nBurst Amount: The amount of avax required to burst the token\nDEX Allocations: The DEXs and their associated allocation\nReward Dex: The DEX for which LP tokens will be used as rewards for single-sided staking\nCreator Address: The address of the creator of the token. Must be a valid EVM address\n\nOptionally you can provide a trading fee, max wallet percent, image prompt, website, twitter, telegram, and discord.",
                    action: "CREATE_BURST_TOKEN",
                },
            },
            {
                user: "{{user1}}",
                content: {
                    text: "Name: Pepe, Symbol: PEPE, Supply: 100,000,000",
                    action: "CREATE_BURST_TOKEN",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Got it, looking great!\nName: Pepe, Symbol: PEPE, Supply: 100,000,000\n\nPlease provide a description for the token and your creator address as well as the dex allocations, reward dex, and burst amount.",
                    action: "CREATE_BURST_TOKEN",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "I want to create a new token",
                    action: "CREATE_BURST_TOKEN",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "To start off please provide a name, symbol, and total supply for the token.",
                    action: "CREATE_BURST_TOKEN",
                },
            },
            {
                user: "{{user1}}",
                content: {
                    text: "Name: Pepe, Symbol: PEPE, Supply: 100,000,000",
                    action: "CREATE_BURST_TOKEN",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Awesome, now please provide a description for the token and your creator address.",
                    action: "CREATE_BURST_TOKEN",
                },
            },
            {
                user: "{{user1}}",
                content: {
                    text: "Description: Meme token for the community, creator: 0x123...abc",
                    action: "CREATE_BURST_TOKEN",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "To finish up what do you want for the Dex allocations, reward dex, and burst amount?",
                    action: "CREATE_BURST_TOKEN",
                },
            },
            {
                user: "{{user1}}",
                content: {
                    text: "DEX: APEX(25%), JOE(25%) PHARAOH(50%), Reward: APEX, Burst: 250 Avax",
                    action: "CREATE_BURST_TOKEN",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Please confirm these token details:\nName: Pepe\nSymbol: PEPE\nSupply: 100,000,000\nBurst: 250 Avax\nDEX: APEX(25%), JOE(25%) PHARAOH(50%)\nDescription: Meme token for the community\nCreator: 0x123...abc",
                    action: "CREATE_BURST_TOKEN",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Create token MOON with 1M supply, 100% on APEX, 300 Avax, Reward APEX",
                    action: "CREATE_BURST_TOKEN",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I need a few more details:\n- Description\n- Creator address\n\nPlease provide these required fields.",
                    action: "CREATE_BURST_TOKEN",
                },
            },
        ],
        // Invalid input handling
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Create token with 110% allocation on APEX",
                    action: "CREATE_BURST_TOKEN",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "DEX allocation cannot exceed 100%. Please provide valid allocations that total 100%.",
                    action: "CREATE_BURST_TOKEN",
                },
            },
        ],
        // Optional fields example
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Create PEPE token with 100M supply, trading fee 3%, max wallet 5%, website pepe.com",
                    action: "CREATE_BURST_TOKEN",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I need the required fields first:\n- Burst amount\n- DEX allocations\n- Reward DEX\n- Description\n- Creator address",
                    action: "CREATE_BURST_TOKEN",
                },
            },
        ],
        // Confirmation and cancellation
        [
            {
                user: "{{user1}}",
                content: {
                    text: "cancel",
                    action: "CREATE_BURST_TOKEN",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Token creation cancelled. You can start over whenever you're ready.",
                    action: "CREATE_BURST_TOKEN",
                },
            },
        ],
    ] as ActionExample[][],
    similes: ["CREATE_TOKEN", "MAKE_TOKEN", "LAUNCH_TOKEN", "DEPLOY_TOKEN"],
};
