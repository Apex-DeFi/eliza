import {
    elizaLogger,
    IAgentRuntime,
    Provider,
    type Memory,
} from "@elizaos/core";
import { ApexCreateBurstTokenData } from "../types/apex";

const getBurstTokenDetailsCacheKey = (
    runtime: IAgentRuntime,
    userId: string
): string => {
    return `${runtime.agentId}/${userId}/burst-token-details`;
};

export const apexBurstTokenDataProvider: Provider = {
    get: async (runtime: IAgentRuntime, message: Memory) => {
        // This provider is responsible for getting the create burst token details from the user.
        // We want to make sure the intent is to create a burst token, and if not we don't want to push the user to provide this information.
        // 1. Check the state to see if the intent is to create a burst token
        // 2. If the intent is not to create a burst token, return nothing
        // 3. If the intent is to create a burst token, get the create burst token details from the user
        // 4. Check the state to see if we have all the required information
        // 5. If we have all the required information, ask the user to confirm the token details
        // 6. if we do not have all the required information, ask the user for the missing information
        // 6. If the user confirms, return the create burst token details
        // 7. If the user does not confirm, ask the user to clarify any details
        // 8. If the user clarifies any details, update the state with the new information

        try {
            const cacheKey = getBurstTokenDetailsCacheKey(
                runtime,
                message.userId
            );
            const cachedDetails =
                await runtime.cacheManager.get<ApexCreateBurstTokenData>(
                    cacheKey
                );

            if (cachedDetails) {
                return cachedDetails;
            }
        } catch (error) {
            elizaLogger.error(
                "Error getting create burst token details:",
                error
            );
            return null;
        }
    },
};
