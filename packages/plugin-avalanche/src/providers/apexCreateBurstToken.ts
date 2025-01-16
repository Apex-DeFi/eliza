import {
    elizaLogger,
    IAgentRuntime,
    Provider,
    type Memory,
} from "@elizaos/core";
import {
    ApexBurstRequiredFields,
    ApexBurstOptionalFields,
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

export const getMissingRequiredFields = (
    cachedData: ApexCreateBurstTokenData
): Array<
    keyof Omit<ApexCreateBurstTokenData, "isBurstTokenCreated" | "lastUpdated">
> => {
    return ApexBurstRequiredFields.filter(
        (field) =>
            !cachedData[
                field as keyof Omit<
                    ApexCreateBurstTokenData,
                    "isBurstTokenCreated" | "lastUpdated"
                >
            ]
    );
};

export const getMissingOptionalFields = (
    cachedData: ApexCreateBurstTokenData
): Array<
    keyof Omit<ApexCreateBurstTokenData, "isBurstTokenCreated" | "lastUpdated">
> => {
    return ApexBurstOptionalFields.filter(
        (field) =>
            !cachedData[
                field as keyof Omit<
                    ApexCreateBurstTokenData,
                    "isBurstTokenCreated" | "lastUpdated"
                >
            ]
    );
};

export const apexCreateBurstTokenProvider: Provider = {
    get: async (runtime: IAgentRuntime, message: Memory) => {
        try {
            const cacheKey = getBurstTokenDataCacheKey(runtime, message.userId);
            elizaLogger.info("[Provider] Getting burst token data for user", {
                cacheKey,
                message,
            });
            const cachedData =
                (await runtime.cacheManager.get<ApexCreateBurstTokenData>(
                    cacheKey
                )) || { ...emptyCreateBurstTokenData };

            elizaLogger.info("[Provider] Cached data", {
                cachedData,
            });

            if (cachedData.isBurstTokenCreated) {
                // if the token has been created, let the user know
                return `${cachedData.name} has already been created!`;
            }

            let response = "Create Burst Token Status:\n\n";

            // Show current information if any exists
            const knownFields = Object.entries(cachedData)
                .filter(
                    ([key, value]) =>
                        key !== "isBurstTokenCreated" &&
                        key !== "lastUpdated" &&
                        value !== undefined
                )
                .map(([key, value]) => {
                    const fieldName =
                        key.charAt(0).toUpperCase() + key.slice(1);
                    const fieldValue = Array.isArray(value)
                        ? JSON.stringify(value)
                        : typeof value === "object"
                          ? JSON.stringify(value)
                          : value;
                    return `${fieldName}: ${fieldValue}`;
                });

            if (knownFields.length > 0) {
                response += "Current Information:\n";
                response += knownFields.map((field) => `✓ ${field}`).join("\n");
                response += "\n\n";
            }

            elizaLogger.info("[Provider] Known fields", {
                knownFields,
            });

            const missingRequiredFields = getMissingRequiredFields(cachedData);
            const missingOptionalFields = getMissingOptionalFields(cachedData);

            elizaLogger.info("[Provider] Missing fields", {
                missingRequiredFields,
                missingOptionalFields,
            });

            // If there are missing required fields, provide a clear, concise bulleted list of all missing fields
            if (missingRequiredFields.length > 0) {
                response += "Required Information and Instructions:\n\n";
                missingRequiredFields.forEach((field) => {
                    const fieldGuidance = BURST_TOKEN_FIELD_GUIDANCE[field];
                    const fieldName =
                        field.charAt(0).toUpperCase() + field.slice(1);
                    response += `${fieldName}:\n`;
                    response += `- Description: ${fieldGuidance.description}\n`;
                    response += `- Valid Examples: ${fieldGuidance.valid}\n`;
                    response += `- Do Not Include: ${fieldGuidance.invalid}\n`;
                    response += `- Instructions: ${fieldGuidance.instructions}\n\n`;
                });
                response += "\n";

                response += "Optional Information and Instructions:\n\n";
                missingOptionalFields.forEach((field) => {
                    const fieldGuidance = BURST_TOKEN_FIELD_GUIDANCE[field];
                    const fieldName =
                        field.charAt(0).toUpperCase() + field.slice(1);
                    response += `${fieldName}:\n`;
                    response += `- Description: ${fieldGuidance.description}\n`;
                    response += `- Valid Examples: ${fieldGuidance.valid}\n`;
                    response += `- Do Not Include: ${fieldGuidance.invalid}\n`;
                    response += `- Instructions: ${fieldGuidance.instructions}\n\n`;
                });
                response += "\n";

                // Add clear instructions for the agent
                response += "Agent Instructions:\n";
                response +=
                    "1. Present the above list of ALL information to the user at once, including required and optional fields.\n";
                response +=
                    "2. Ask the user to provide ANY or ALL of the missing information, including optional fields.\n";
                response +=
                    "3. Extract information from user responses when clearly stated.\n";
                response +=
                    "4. After each user response, show updated status with remaining missing fields, including optional fields.\n";
                response +=
                    "5. Verify extracted information matches requirements before storing.\n";
            }

            if (missingRequiredFields.length === 0) {
                // All required fields are collected
                // If the user hasn't confirmed the creation, ask them to review the details and confirm
                if (!cachedData.isConfirmed) {
                    response +=
                        "Status: ✓ All necessary information has been collected.\n";
                    response += "Please review the details carefully!\n";
                    response +=
                        "Type 'confirm' to create your token or 'cancel' to start over.\n";
                } else if (!cachedData.isBurstTokenCreated) {
                    response +=
                        "Token creation confirmed! Proceeding with on-chain deployment...\n";
                }
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
