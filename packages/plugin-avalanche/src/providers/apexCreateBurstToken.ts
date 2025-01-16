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

            let response = "Create Burst Token Status:\n\n";

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

            let action = "NONE";

            // If there are missing required fields, provide a clear, concise bulleted list of all missing fields
            if (missingRequiredFields.length > 0) {
                response +=
                    "CURRENT TASK FOR " +
                    runtime.character.name +
                    " IS TO COLLECT THE FOLLOWING INFORMATION.\n\n";
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
                    response += `- Instructions: ${fieldGuidance.instructions}\n`;
                });
                response += "\n";

                // Add clear instructions for the agent
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
                    // This needs to be more explicit and clear as the agent doesn't always request confirmation
                    // Especially if the users follow up was to add an optional field
                    // If we are in this block always ask for confirmation
                    cachedData.hasRequestedConfirmation = true;
                    await runtime.cacheManager.set(cacheKey, cachedData, {
                        expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 1 week
                    });
                    action = "CREATE_BURST_TOKEN";
                    response +=
                        "Status: ✓ All necessary information has been collected.\n";
                    response += "Please review the details carefully!\n";
                    response += "Rules:\n";
                    response +=
                        "1. You must always inform the user they can type 'confirm' or 'cancel' to confirm or cancel the token creation.\n";
                    response +=
                        "Type 'confirm' to create your token or 'cancel' to start over.\n";
                } else {
                    // If the user has confirmed the creation, let them know the token has been created
                    response +=
                        "Status: ✓ Token creation confirmed! Please wait for the token to be created...\n";
                    action = "NONE";
                }
            }

            return {
                text: response,
                action,
            };
        } catch (error) {
            elizaLogger.error(
                "Error getting create burst token details:",
                error
            );
            return "Error getting create burst token details. Continuing conversation normally.";
        }
    },
};
