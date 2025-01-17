import {
    Action,
    ActionExample,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    State,
    elizaLogger,
    generateImage,
} from "@elizaos/core";
import { validateAvalancheConfig } from "../environment";
import { emptyCreateBurstTokenData } from "../types/apex";
import { getBurstTokenDataCacheKey } from "../providers/apexCreateBurstToken";
import { ApexCreateBurstTokenData } from "../types/apex";
import { createApexBurstToken } from "../utils/apexBurst";

export default {
    name: "CREATE_BURST_TOKEN",
    similes: [
        "EXECUTE_TOKEN_CREATION",
        "DEPLOY_BURST_TOKEN",
        "FINALIZE_TOKEN_CREATION",
        "CONFIRM_TOKEN_LAUNCH",
        "PROCEED_WITH_TOKEN_CREATION",
    ],
    description: `
        CRITICAL: This action should ONLY be used when responding to an explicit confirmation request.

        The action will ONLY trigger when:
        1. All required token data is present AND
        2. The user is responding to that confirmation request

        Common trigger phrases in response to confirmation request:
        - "Yes"
        - "Confirm"
        - "Let's do it"
        - "Launch it"
        - "Create it"
        - "Proceed"
    `,
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        try {
            await validateAvalancheConfig(runtime);
            const cacheKey = getBurstTokenDataCacheKey(runtime, message.userId);
            const cachedData =
                (await runtime.cacheManager.get<ApexCreateBurstTokenData>(
                    cacheKey
                )) || { ...emptyCreateBurstTokenData };

            const result =
                cachedData.hasRequestedConfirmation && cachedData.isConfirmed;
            elizaLogger.log(
                `[CREATE_BURST_TOKEN] hasRequestedConfirmation: ${cachedData.hasRequestedConfirmation}, isConfirmed: ${cachedData.isConfirmed}`
            );

            return result;
        } catch (error) {
            elizaLogger.error(
                `Error in apexCreateBurstToken action: ${error.message}`
            );
            return false;
        }
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        _state?: State,
        _options?: { [key: string]: unknown },
        callback?: HandlerCallback
    ) => {
        elizaLogger.log("CREATE_BURST_TOKEN action triggered");
        callback?.({
            text: "🔄 Creating Apex Burst token...",
            action: "BURST_TOKEN",
            type: "processing",
        });

        const cacheKey = getBurstTokenDataCacheKey(runtime, message.userId);
        const cachedData =
            (await runtime.cacheManager.get<ApexCreateBurstTokenData>(
                cacheKey
            )) || { ...emptyCreateBurstTokenData };

        try {
            elizaLogger.info("[CREATE_BURST_TOKEN] creating burst token");
            elizaLogger.info("[CREATE_BURST_TOKEN] cachedData", cachedData);

            const imageResult = await generateImage(
                {
                    hideWatermark: true,
                    prompt: `logo for (${cachedData.symbol}) token - ${cachedData.imageDescription}`,
                    width: 256,
                    height: 256,
                    count: 1,
                },
                runtime
            );

            elizaLogger.info("[CREATE_BURST_TOKEN] imageResult", imageResult);

            if (imageResult.success) {
                const imageBuffer = Buffer.from(imageResult.data[0], "base64");
                callback?.({
                    text: "🔄 Generating image...",
                    content: { imageBuffer },
                    action: "BURST_TOKEN",
                    type: "processing",
                });
            }

            const { tx, tokenAddress } = await createApexBurstToken(
                runtime,
                cachedData
            );
            const messageText =
                `Created token for ${cachedData.creatorAddress}\n` +
                `Name: ${cachedData.name}\n` +
                `Symbol: ${cachedData.symbol}\n` +
                `CA: https://snowtrace.io/address/${tokenAddress}\n` +
                `TX: https://snowtrace.io/tx/${tx}`;

            elizaLogger.info("[CREATE_BURST_TOKEN] messageText", messageText);

            callback?.({
                text: messageText,
                content: { tx, tokenAddress },
                inReplyTo: message.id,
            });

            // Clear the cached data after the token has been created
            await runtime.cacheManager.delete(cacheKey);

            return true;
        } catch (error) {
            elizaLogger.error("Error creating burst token:", error.message);
            callback?.({
                text: "Error creating burst token:",
                content: { cachedData },
            });

            return false;
        }
    },
    examples: [
        [
            {
                user: "{{agent}}",
                content: {
                    text: "All data is collected. Please review and confirm if you want to create this token.",
                },
            },
            {
                user: "{{user1}}",
                content: {
                    text: "Yes, let's create it!",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    action: "CREATE_BURST_TOKEN",
                    text: "Creating your token with the confirmed details...",
                },
            },
        ],
        [
            {
                user: "{{agent}}",
                content: {
                    text: "Everything looks ready! Please verify and confirm if you want to proceed with token creation.",
                },
            },
            {
                user: "{{user1}}",
                content: {
                    text: "Confirm!",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    action: "CREATE_BURST_TOKEN",
                    text: "Excellent! Creating your token now...",
                },
            },
        ],
        [
            {
                user: "{{agent}}",
                content: {
                    text: "All data is collected. Please review and confirm if you want to create this token.",
                },
            },
            {
                user: "{{user1}}",
                content: {
                    text: "Looks great! Let's create it!",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    action: "CREATE_BURST_TOKEN",
                    text: "Creating your token now...",
                },
            },
        ],
    ] as ActionExample[][],
} as Action;
