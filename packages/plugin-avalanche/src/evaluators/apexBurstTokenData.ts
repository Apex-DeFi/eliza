import { Evaluator, Memory, IAgentRuntime } from "@elizaos/core";

export const burstTokenDataEvaluator: Evaluator = {
    name: "BURST_TOKEN_DATA",
    similes: [
        "BURST_TOKEN_INFORMATION",
        "TOKEN_INFORMATION",
        "CREATE_TOKEN_INFORMATION",
        "CREATE_TOKEN_DATA",
    ],
    validate: async (_runtime: IAgentRuntime, _message: Memory) => {
        return true;
    },
    handler: async (runtime: IAgentRuntime, message: Memory) => {
        console.log("BURST_TOKEN_DATA handler");
        console.log(message);

        const didSomethingHappen = Math.random() > 0.5;

        return {
            didSomethingHappen,
            action: "BURST_TOKEN",
        };
    },
    description: "Evaluate the data for the BURST_TOKEN action",
    examples: [],
};
