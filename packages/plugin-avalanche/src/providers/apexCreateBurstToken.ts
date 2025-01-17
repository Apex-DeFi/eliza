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
    ApexBurstInternalFields,
    ApexBurstInternalField,
} from "../types/apex";

// Simplified guidance to reduce token usage
const getMinimalFieldGuidance = (
    field: keyof typeof BURST_TOKEN_FIELD_GUIDANCE
) => ({
    description: BURST_TOKEN_FIELD_GUIDANCE[field].description,
    valid: BURST_TOKEN_FIELD_GUIDANCE[field].valid.split(".")[0], // Only first example
});

export const getBurstTokenDataCacheKey = (
    runtime: IAgentRuntime,
    userId: string
): string => {
    return `${runtime.agentId}/${userId}/burstTokenData`;
};

export const getMissingRequiredFields = (
    cachedData: ApexCreateBurstTokenData
): Array<keyof Omit<ApexCreateBurstTokenData, ApexBurstInternalField>> => {
    return ApexBurstRequiredFields.filter(
        (field) =>
            !cachedData[
                field as keyof Omit<
                    ApexCreateBurstTokenData,
                    ApexBurstInternalField
                >
            ]
    );
};

export const getMissingOptionalFields = (
    cachedData: ApexCreateBurstTokenData
): Array<keyof Omit<ApexCreateBurstTokenData, ApexBurstInternalField>> => {
    return ApexBurstOptionalFields.filter(
        (field) =>
            !cachedData[
                field as keyof Omit<
                    ApexCreateBurstTokenData,
                    ApexBurstInternalField
                >
            ]
    );
};

export const apexCreateBurstTokenProvider: Provider = {
    get: async (runtime: IAgentRuntime, message: Memory) => {
        try {
            const cacheKey = getBurstTokenDataCacheKey(runtime, message.userId);
            const cachedData =
                (await runtime.cacheManager.get<ApexCreateBurstTokenData>(
                    cacheKey
                )) || { ...emptyCreateBurstTokenData };

            // Show current information if any exists
            const knownFields = Object.entries(cachedData)
                .filter(
                    ([key, value]) =>
                        !ApexBurstInternalFields.has(
                            key as ApexBurstInternalField
                        ) && value !== undefined
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

            // Check if this is a token creation message
            const isTokenCreationMessage =
                /\b(create|make|launch|start|burst|deploy|mint|build|new)\b.*\b(token|coin)\b/i.test(
                    message.content.text
                );

            if (!isTokenCreationMessage && knownFields.length === 0) {
                return "";
            }

            elizaLogger.debug("knownFields", knownFields);

            let response = "Create Burst Token Status:\n\n";

            if (knownFields.length > 0) {
                response += "Current Information:\n";
                response += knownFields.map((field) => `✓ ${field}`).join("\n");
                response += "\n\n";
            }

            const missingRequiredFields = getMissingRequiredFields(cachedData);
            // const missingOptionalFields = getMissingOptionalFields(cachedData);

            // Check if user is asking for detailed guidance
            const isAskingForHelp = /what|how|explain|help|guide/i.test(
                message.content.text
            );

            if (missingRequiredFields.length > 0) {
                response += `CURRENT TASK FOR ${runtime.character.name} IS TO COLLECT THE FOLLOWING INFORMATION.\n\n`;

                if (isAskingForHelp) {
                    // Provide full guidance when help is requested
                    response += "Required Information and Instructions:\n\n";
                    missingRequiredFields.forEach((field) => {
                        const fieldGuidance = BURST_TOKEN_FIELD_GUIDANCE[field];
                        const fieldName =
                            field.charAt(0).toUpperCase() + field.slice(1);
                        response += `${fieldName}:\n`;
                        response += `- Description: ${fieldGuidance.description}\n`;
                        response += `- Valid Examples: ${fieldGuidance.valid}\n`;
                        response += `- Do Not Include: ${fieldGuidance.invalid}\n`;
                        response += `- Instructions: ${fieldGuidance.instructions}\n`;
                    });
                } else {
                    // Provide minimal guidance by default
                    response += "Required Information:\n";
                    missingRequiredFields.forEach((field) => {
                        const guidance = getMinimalFieldGuidance(field);
                        const fieldName =
                            field.charAt(0).toUpperCase() + field.slice(1);
                        response += `${fieldName}:\n`;
                        response += `- ${guidance.description}\n`;
                        response += `- Example: ${guidance.valid}\n`;
                    });
                }
                response += "\n";

                // Only show optional fields if specifically requested
                if (isAskingForHelp) {
                    response +=
                        "Optional Information Available - Ask for details if interested.\n\n";
                }
            }

            if (missingRequiredFields.length === 0) {
                if (!cachedData.isConfirmed) {
                    cachedData.hasRequestedConfirmation = true;
                    await runtime.cacheManager.set(cacheKey, cachedData, {
                        expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 1 week
                    });

                    response +=
                        "Status: ✓ All necessary information collected.\n";
                    response += "Please review the details above!\n";
                    response +=
                        "Type 'confirm' to create your token or 'cancel' to start over.\n";
                } else {
                    response +=
                        "Status: ✓ Token creation confirmed! Please wait for the token to be created...\n";
                }
            }

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
