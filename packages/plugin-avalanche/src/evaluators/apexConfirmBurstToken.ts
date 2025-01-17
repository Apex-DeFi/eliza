import {
    elizaLogger,
    EvaluationExample,
    Evaluator,
    generateObject,
    IAgentRuntime,
    Memory,
    ModelClass,
} from "@elizaos/core";
import { getBurstTokenDataCacheKey } from "../providers/apexCreateBurstToken";
import {
    ApexCreateBurstTokenData,
    emptyCreateBurstTokenData,
} from "../types/apex";
import { z } from "zod";
// import { createApexBurstToken } from "../utils/apexBurst";

const canBeConfirmed = (data: ApexCreateBurstTokenData) => {
    const totalAllocation = data.dexAllocations?.reduce(
        (acc, dex) => acc + dex.allocation,
        0
    );

    if (
        data.name &&
        data.symbol &&
        data.description &&
        data.totalSupply &&
        data.burstAmount &&
        data.dexAllocations &&
        data.dexAllocations.length > 0 &&
        data.dexAllocations.every((dex) => dex.dex !== undefined) && // dex is a valid enum value
        data.dexAllocations.every((dex) => dex.allocation !== undefined) && // allocation is a valid number
        totalAllocation === 10000 && // total allocation is 100%
        data.rewardDex && // reward dex is a valid enum value
        data.creatorAddress
    ) {
        return true;
    }
    return false;
};

export const apexConfirmBurstTokenEvaluator: Evaluator = {
    name: "CONFIRM_BURST_TOKEN",
    similes: ["CONFIRM_DETAILS", "CONFIRM_TOKEN", "CONFIRM_TOKEN_DATA"],
    description: `
        Evaluates user responses for token creation confirmation or cancellation.
        Triggers when all token data is collected and waiting for final user approval.
        Handles both explicit (yes/no) and implicit ("let's launch it") confirmations.
        The user response can be:
        - Confirmation: "yes", "confirm", "launch", "create", "let's do it", "I'm ready", "make it happen", "let's launch!", "proceed"
        - Cancellation: "no", "cancel", "stop", "wait", "not yet", "maybe later", "let me think"
    `,
    alwaysRun: true,
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        try {
            const cacheKey = getBurstTokenDataCacheKey(runtime, message.userId);
            const cachedData =
                (await runtime.cacheManager.get<ApexCreateBurstTokenData>(
                    cacheKey
                )) || { ...emptyCreateBurstTokenData };

            // Run if the data is complete and the token hasn't been created
            return (
                canBeConfirmed(cachedData) &&
                cachedData.hasRequestedConfirmation
            );
        } catch (error) {
            elizaLogger.error(
                `Error in apexCreateBurstTokenEvaluator: ${error.message}`
            );
            return false;
        }
    },
    handler: async (runtime: IAgentRuntime, message: Memory) => {
        elizaLogger.info("CONFIRM_BURST_TOKEN handler");
        try {
            const cacheKey = getBurstTokenDataCacheKey(runtime, message.userId);
            const cachedData =
                await runtime.cacheManager.get<ApexCreateBurstTokenData>(
                    cacheKey
                );

            // Extract confirmation from message using template/schema
            const confirmationTemplate = `
Analyze if the user is confirming or cancelling a token creation.

Confirmation indicators:
    - Explicit: "yes", "confirm", "launch", "create"
    - Implicit: "lets do it", "looks good", "ready to go"
    - Enthusiastic: "lets launch", "lets go"

Cancellation indicators:
    - Explicit: "no", "cancel", "stop"
    - Implicit: "need time", "not sure", "wait"
    - Hesitant: "maybe later", "let me think"

Conversation:
${message.content.text}

Return a JSON object with isConfirmed field set to true or false based on the analysis.

\`\`\`json
{
    "isConfirmed": boolean
}
\`\`\`
`;

            elizaLogger.info("[CONFIRM_BURST_TOKEN] cachedData", cachedData);

            const result = await generateObject({
                runtime,
                context: confirmationTemplate,
                modelClass: ModelClass.SMALL,
                schema: z.object({
                    isConfirmed: z
                        .boolean()
                        .optional()
                        .describe(
                            "true if the user is confirming the token creation, false if they are cancelling"
                        ),
                }),
                mode: "auto",
            });

            elizaLogger.info(
                "[CONFIRM_BURST_TOKEN] result",
                result.object || "No result"
            );

            // Update cache with confirmation status
            if (result.object && result.object["isConfirmed"] !== undefined) {
                const userConfirmed = result.object["isConfirmed"];
                // update the cached data with the new confirmation status
                cachedData.isConfirmed = userConfirmed;
                cachedData.lastUpdated = Date.now();
                await runtime.cacheManager.set(cacheKey, cachedData, {
                    expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 1 week
                });

                elizaLogger.info(
                    `[CONFIRM_BURST_TOKEN] cachedData after update set isConfirmed to ${cachedData.isConfirmed}`,
                    cachedData
                );
                if (!userConfirmed) {
                    elizaLogger.info(
                        "[CONFIRM_BURST_TOKEN] user cancelled token creation"
                    );
                    // User cancelled the token creation, clear the cached data
                    await runtime.cacheManager.delete(cacheKey);
                }
            }
        } catch (error) {
            elizaLogger.error(
                "Error in apexConfirmBurstTokenEvaluator handler:",
                error
            );
        }
    },
    examples: [
        {
            context: "User explicitly confirms token creation",
            messages: [
                {
                    user: "{{user1}}",
                    content: {
                        text: "Yes, I want to create the token",
                    },
                },
            ],
            outcome: `{
                "isConfirmed": "true"
            }`,
        },
        {
            context: "User explicitly cancels token creation",
            messages: [
                {
                    user: "{{user1}}",
                    content: {
                        text: "No, I don't want to create the token",
                    },
                },
            ],
            outcome: `{
                "isConfirmed": "false"
            }`,
        },
        {
            context: "User implicitly confirms with enthusiasm",
            messages: [
                {
                    user: "{{user1}}",
                    content: {
                        text: "Let's launch this token!",
                    },
                },
            ],
            outcome: `{
                "isConfirmed": "true"
            }`,
        },
        {
            context: "User wants to delay/cancel implicitly",
            messages: [
                {
                    user: "{{user1}}",
                    content: {
                        text: "I need more time to think about it",
                    },
                },
            ],
            outcome: `{
                "isConfirmed": "false"
            }`,
        },
        {
            context: "User confirms after reviewing details",
            messages: [
                {
                    user: "{{agent}}",
                    content: {
                        text: "Please review the token details above. Would you like to proceed with creation?",
                    },
                },
                {
                    user: "{{user1}}",
                    content: {
                        text: "Everything looks good, let's proceed",
                    },
                },
            ],
            outcome: `{
                "isConfirmed": "true"
            }`,
        },
        {
            context: "User confirms after reviewing details",
            messages: [
                {
                    user: "{{agent}}",
                    content: {
                        text: "Please review the token details above. Would you like to proceed with creation?",
                    },
                },
                {
                    user: "{{user1}}",
                    content: {
                        text: "yeah",
                    },
                },
            ],
            outcome: `{
                "isConfirmed": "true"
            }`,
        },
    ] as EvaluationExample[],
};
