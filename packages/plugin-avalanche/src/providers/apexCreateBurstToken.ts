import {
    elizaLogger,
    IAgentRuntime,
    Provider,
    type Memory,
} from "@elizaos/core";
import {
    ApexBurstFields,
    ApexCreateBurstTokenData,
    BURST_TOKEN_FIELD_GUIDANCE,
    emptyCreateBurstTokenData,
} from "../types/apex";

export const getBurstTokenDataCacheKey = (
    runtime: IAgentRuntime,
    userId: string
): string => {
    return `${runtime.agentId}/${userId}/burstTokenData`;
};

export const getMissingFields = (
    cachedData: ApexCreateBurstTokenData
): Array<
    keyof Omit<
        ApexCreateBurstTokenData,
        "isBurstTokenCreated" | "lastUpdated" | "isConfirmed"
    >
> => {
    return ApexBurstFields.filter(
        (field) =>
            !cachedData[
                field as keyof Omit<
                    ApexCreateBurstTokenData,
                    "isBurstTokenCreated" | "lastUpdated" | "isConfirmed"
                >
            ]
    );
};

export const apexCreateBurstTokenProvider: Provider = {
    get: async (runtime: IAgentRuntime, message: Memory) => {
        try {
            const cacheKey = getBurstTokenDataCacheKey(runtime, message.userId);
            elizaLogger.info("Getting burst token data for user", {
                cacheKey,
                message,
            });
            const cachedData =
                (await runtime.cacheManager.get<ApexCreateBurstTokenData>(
                    cacheKey
                )) || { ...emptyCreateBurstTokenData };

            elizaLogger.info("Burst token data", {
                cachedData,
            });

            let response = "Create Burst Token Status:\n\n";

            // Show current information if any exists
            const knownFields = Object.entries(cachedData)
                .filter(
                    ([key, value]) =>
                        key !== "isBurstTokenCreated" &&
                        key !== "lastUpdated" &&
                        key !== "isConfirmed" &&
                        value !== undefined
                )
                .map(
                    ([key, value]) =>
                        `${key.charAt(0).toUpperCase() + key.slice(1)}: ${
                            Array.isArray(value)
                                ? value.join(", ")
                                : typeof value === "object"
                                  ? JSON.stringify(value)
                                  : value
                        }`
                );

            if (knownFields.length > 0) {
                response += "Current Information:\n";
                response += knownFields.map((field) => `✓ ${field}`).join("\n");
                response += "\n\n";
            }

            const missingFields = getMissingFields(cachedData);

            if (missingFields.length > 0) {
                // First, provide a clear, concise bulleted list of all missing fields
                response += "Required Information:\n\n";
                missingFields.forEach((field) => {
                    const fieldGuidance = BURST_TOKEN_FIELD_GUIDANCE[field];
                    const fieldName =
                        field.charAt(0).toUpperCase() + field.slice(1);
                    response += `• ${fieldName}: ${fieldGuidance.description}\n`;
                    response += `  Example: ${fieldGuidance.valid}\n`;
                });
                response += "\n";

                // Then, provide the detailed guidance for reference
                response += "Detailed Field Requirements:\n\n";
                missingFields.forEach((field) => {
                    const fieldGuidance = BURST_TOKEN_FIELD_GUIDANCE[field];
                    const fieldName =
                        field.charAt(0).toUpperCase() + field.slice(1);
                    response += `${fieldName}:\n`;
                    response += `- Description: ${fieldGuidance.description}\n`;
                    response += `- Valid Examples: ${fieldGuidance.valid}\n`;
                    response += `- Do Not Include: ${fieldGuidance.invalid}\n`;
                    response += `- Instructions: ${fieldGuidance.instructions}\n\n`;
                });

                // Add clear instructions for the agent
                response += "Agent Instructions:\n";
                response +=
                    "1. Present the above list of ALL required information to the user at once.\n";
                response +=
                    "2. Ask the user to provide ANY or ALL of the missing information.\n";
                response +=
                    "3. Extract information from user responses when clearly stated.\n";
                response +=
                    "4. After each user response, show updated status with remaining missing fields.\n";
                response +=
                    "5. Verify extracted information matches requirements before storing.\n";
            } else {
                response +=
                    "Status: ✓ All necessary information has been collected.\n";
                response +=
                    "Please review and confirm the token details above.\n";
            }

            elizaLogger.debug("Response", {
                response,
            });

            return response;
        } catch (error) {
            elizaLogger.error(
                "Error getting create burst token details:",
                error
            );
            return "Error getting create burst token details. Continuing conversation normally.";
        }
    },
};
