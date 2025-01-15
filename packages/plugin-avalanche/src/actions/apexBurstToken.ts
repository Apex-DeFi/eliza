import {
    Action,
    ActionExample,
    IAgentRuntime,
    type Memory,
    State,
    HandlerCallback,
    elizaLogger,
    composeContext,
    generateObject,
    ModelClass,
    Content,
} from "@elizaos/core";
import { validateAvalancheConfig } from "../environment";
import { DexAllocation } from "../types";
import { createApexBurstToken } from "../utils/apexBurst";
import { isAddress } from "viem";
import { burstTokenTemplate } from "../templates/apex";
import { burstSchema } from "../types/apexSchemas";
import { BurstDEXs } from "../types/enums";

export interface ApexBurstTokenContent extends Content {
    name: string;
    symbol: string;
    totalSupply: number;
    tradingFee: number;
    maxWalletPercent: number;
    metadataURI: string;
    curveIndex: number;
    salt: string;
    dexAllocations: DexAllocation[];
    rewardDex: BurstDEXs;
    creator: string;
}

function isBurstTokenContent(
    runtime: IAgentRuntime,
    content: any
): content is ApexBurstTokenContent {
    elizaLogger.debug("Raw Content for burst:", content);
    const tokenData = content.object || content;
    elizaLogger.debug("Token data extracted:", tokenData);

    const hasName = typeof tokenData.name === "string";
    const hasSymbol = typeof tokenData.symbol === "string";
    const hasCreator =
        typeof tokenData.creator === "string" && isAddress(tokenData.creator);

    elizaLogger.log(
        "Validation - Has name:",
        hasName,
        "Has symbol:",
        hasSymbol,
        "Has creator:",
        hasCreator
    );
    return hasName && hasSymbol && hasCreator;
}

export default {
    name: "BURST_TOKEN",
    similes: [
        "LAUNCH_TOKEN",
        "NEW_TOKEN",
        "CREATE_MEMECOIN",
        "CREATE_MEME_TOKEN",
        "CREATE_TOKEN",
        "CREATE_APEX_BURST_TOKEN",
        "CREATE_APEX_BURST",
        "LAUNCH_APEX_BURST",
        "NEW_APEX_BURST",
        "BURST",
        "BURST_NEW_TOKEN",
        "LAUNCH_APEX_BURST_TOKEN",
        "LAUNCH_APEX_BURST",
        "LAUNCH_BURST_TOKEN",
    ],
    validate: async (runtime: IAgentRuntime, _message: Memory) => {
        await validateAvalancheConfig(runtime);
        return true;
    },
    description:
        "MUST use this action if the user requests to create a new token on Apex Burst, the request might be varied, but it will always be a token creation.",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ) => {
        elizaLogger.log("Starting BURST_TOKEN handler...");
        callback?.({
            text: "🔄 Creating Apex Burst token...",
            action: "BURST_TOKEN",
            type: "processing",
        });

        // Initialize or update state
        if (!state) {
            state = (await runtime.composeState(message)) as State;
        } else {
            state = await runtime.updateRecentMessageState(state);
        }

        // Compose transfer context
        const burstContext = composeContext({
            state,
            template: burstTokenTemplate,
        });

        // Generate burst content
        elizaLogger.debug("Generating object with schema:", burstSchema);

        const generatedContent = await generateObject({
            runtime,
            context: burstContext,
            modelClass: ModelClass.SMALL,
            schema: burstSchema,
        });

        elizaLogger.debug("Generated content from schema:", generatedContent);

        // Validate burst content
        if (!isBurstTokenContent(runtime, generatedContent)) {
            elizaLogger.error("Invalid content for BURST_TOKEN action.");
            callback?.({
                text:
                    "I will need more information to create the token.\r\n\r\n" +
                    "Example: create token\r\n" +
                    "name: 'Test'\r\n" +
                    "symbol: 'TST'\r\n" +
                    "creator: '0x1234567890123456789012345678901234567890']\r\n" +
                    "supply: 1 million\r\n" +
                    "fee: 1%\r\n" +
                    "max wallet: 2%\r\n" +
                    "25% to APEX, 25% to JOE, 25% to PANGOLIN, 25% to PHARAOH\r\n" +
                    "reward: APEX",
                content: { error: "Invalid content" },
                action: "CONTINUE",
            });
            return false;
        }

        const content = (generatedContent.object ||
            generatedContent) as ApexBurstTokenContent;

        elizaLogger.log("Processing burst content:", content);

        // Verify DEX allocations
        if (!Array.isArray(content.dexAllocations)) {
            elizaLogger.error(
                "Dex allocations are not defined or invalid:",
                content.dexAllocations
            );
            callback?.({
                text: "Dex allocations are missing or invalid.",
                content: { error: "Invalid dex allocations" },
                action: "CONTINUE",
            });
            return false;
        }

        // Verify DEX allocations and sum to 10000. Only 1 dex can be marked as a reward. Default DEX allocation is APEX 100%.
        let totalAllocation = 0;
        for (let i = 0; i < content.dexAllocations.length; i++) {
            totalAllocation += content.dexAllocations[i].allocation;
        }
        if (totalAllocation !== 10000) {
            callback?.({
                text: "Dex allocations must sum to 10000",
                content: { error: "Invalid dex allocations" },
                action: "CONTINUE",
            });
            return false;
        }
        // make sure rewardDex is set
        if (!content.rewardDex) {
            callback?.({
                text: "Reward dex is not set",
                content: { error: "Invalid reward dex" },
                action: "CONTINUE",
            });
            return false;
        }

        const { tx, tokenAddress } = await createApexBurstToken(
            runtime,
            content.name,
            content.symbol,
            content.totalSupply,
            content.tradingFee,
            content.maxWalletPercent,
            content.metadataURI,
            content.curveIndex,
            content.salt,
            content.dexAllocations,
            content.rewardDex,
            content.creator as `0x${string}`
        );

        const messageText = `Created token for ${content.creator} ${content.name} with symbol ${content.symbol}. CA: ${tokenAddress}`;

        // // Store the token creation as a memory, this way the same token won't be created again
        // const tokenMemory: Memory = {
        //     userId: message.agentId,
        //     agentId: message.agentId,
        //     content: {
        //         text: `Created token at ${tokenAddress}`,
        //         tx,
        //         tokenAddress,
        //     },
        //     roomId: message.roomId,
        //     createdAt: Date.now(),
        // };

        // const memoryManager = runtime.getMemoryManager("apex_burst_tokens");
        // await memoryManager.createMemory(tokenMemory);

        callback?.({
            text: messageText,
            content: { tx, tokenAddress },
        });

        return true;
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Burst a token called 'Test' with symbol 'TST'",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    action: "BURST_TOKEN",
                    name: "Test",
                    symbol: "TST",
                    totalSupply: "1000000000",
                    tradingFee: 0,
                    maxWalletPercent: 0,
                    dexAllocations: [{ dex: "APEX", allocation: 10000 }],
                    rewardDex: "APEX",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Burst a token called 'Pepe' with symbol 'PEPE', max wallet 5%, trading fee 2%, and allocate 50% to APEX, 25% to JOE, 25% to PANGOLIN",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    action: "BURST_TOKEN",
                    name: "Pepe",
                    symbol: "PEPE",
                    totalSupply: "1000000000",
                    tradingFee: 200,
                    maxWalletPercent: 5000,
                    dexAllocations: [
                        { dex: "APEX", allocation: 5000 },
                        { dex: "JOE", allocation: 2500 },
                        { dex: "PHARAOH", allocation: 2500 },
                        { dex: "PANGOLIN", allocation: 2500 },
                    ],
                    rewardDex: "APEX",
                },
            },
        ],
    ] as ActionExample[][],
} as Action;
