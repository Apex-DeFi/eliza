import {
    Action,
    ActionExample,
    IAgentRuntime,
    Memory,
    elizaLogger,
} from "@elizaos/core";
import { validateAvalancheConfig } from "../environment";

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
        CRITICAL: This action MUST be used when:
        1. User has provided all required token data AND
        2. User has explicitly confirmed they want to create the token

        This is the FINAL step in token creation process.
        Do NOT use this action for collecting token data or asking for confirmation.
        Only use when ready for actual token deployment.

        Common trigger phrases:
        - "Yes, create the token"
        - "Proceed with launch"
        - "Let's deploy it"
        - "I confirm"
        - "Go ahead with creation"
    `,
    validate: async (runtime: IAgentRuntime, _message: Memory) => {
        await validateAvalancheConfig(runtime);
        return true;
    },

    handler: async (runtime: IAgentRuntime, message: Memory) => {
        elizaLogger.log("CREATE_BURST_TOKEN action triggered");
        elizaLogger.log("Message content:", message.content);

        // For now, just log that we would create a token
        elizaLogger.log("Would create token with cached data...");

        return true;
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Yes, I confirm. Create the token with these details.",
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
                user: "{{user1}}",
                content: {
                    text: "Everything looks good, let's launch it! 🚀",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    action: "CREATE_BURST_TOKEN",
                    text: "Proceeding with token creation...",
                },
            },
        ],
    ] as ActionExample[][],
} as Action;
