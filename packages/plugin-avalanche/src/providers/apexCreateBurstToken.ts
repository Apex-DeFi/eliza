import {
    elizaLogger,
    IAgentRuntime,
    Provider,
    type Memory,
} from "@elizaos/core";
import {
    ApexCreateBurstTokenData,
    BURST_TOKEN_FIELD_GUIDANCE,
    emptyCreateBurstTokenData,
    ApexBurstInternalFields,
    ApexBurstInternalField,
} from "../types/apex";
import {
    getBurstTokenDataCacheKey,
    getMinimalFieldGuidance,
    getMissingRequiredFields,
} from "../utils/apexBurst";

export const apexCreateBurstTokenProvider: Provider = {
    get: async (runtime: IAgentRuntime, message: Memory) => {
        try {
            const cacheKey = getBurstTokenDataCacheKey(runtime, message.userId);
            const cachedData =
                (await runtime.cacheManager.get<ApexCreateBurstTokenData>(
                    cacheKey
                )) || { ...emptyCreateBurstTokenData };

            elizaLogger.info(
                "[CREATE_BURST_TOKEN Provider] Getting create burst token data",
                cachedData
            );

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
            // ... existing code ...
            const isTokenCreationMessage =
                /\b(create|make|launch|start|burst|deploy|mint|build|new)\b.*?\b(token|coin)\b/i.test(
                    message.content.text
                );

            // If the user is not asking to create a token and there is no known information, return an empty string
            if (
                !isTokenCreationMessage &&
                knownFields.length === 0 &&
                !cachedData.receivedTokenRequest
            ) {
                elizaLogger.info(
                    "[CREATE_BURST_TOKEN Provider] No known information and not asking to create a token"
                );
                return "";
            }

            elizaLogger.info("knownFields", knownFields);

            // receivedTokenRequest is used to determine if the user has asked to create a token
            cachedData.receivedTokenRequest = true;
            await runtime.cacheManager.set(cacheKey, cachedData, {
                expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 1 week
            });

            let response = "Create Burst Token Status:\n\n";

            if (knownFields.length > 0) {
                response += "Current Information:\n";
                response += knownFields.map((field) => `✓ ${field}`).join("\n");
                response += "\n\n";
            }

            const missingRequiredFields = getMissingRequiredFields(cachedData);
            // const missingOptionalFields = getMissingOptionalFields(cachedData);
            elizaLogger.info("missingRequiredFields", missingRequiredFields);

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

                        // Add clear instructions for the agent
                        response += "Agent Instructions:\n";
                        response +=
                            "1. Present the above lists of information to the user ALL at once.\n";
                        response +=
                            "2. Ask the user to provide ANY or ALL of the missing information.\n";
                        response +=
                            "3. Extract information from user responses when clearly stated.\n";
                        response +=
                            "4. After each user response, show updated status with remaining missing fields.\n";
                        response +=
                            "5. Verify extracted information matches requirements before storing.\n";
                        response +=
                            "6. Inform user they must explicitly state the necessary information for each field.\n";
                    });
                }
                response += "\n";

                // Only show optional fields if specifically requested
                if (isAskingForHelp) {
                    response +=
                        "Optional Information Available - Ask for details if interested.\n\n";
                }
            }

            if (
                missingRequiredFields.length === 0 ||
                cachedData.hasRequestedConfirmation
            ) {
                // if (!cachedData.isConfirmed) {
                elizaLogger.info(
                    "[CREATE_BURST_TOKEN Provider] Requesting confirmation"
                );
                cachedData.hasRequestedConfirmation = true;
                await runtime.cacheManager.set(cacheKey, cachedData, {
                    expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 1 week
                });

                response += "Status: ✓ All necessary information collected.\n";
                response += "Please review the details above!\n";
                response +=
                    "Type 'confirm' to create your token or 'cancel' to start over.\n";
                response += "You MUST ask the user to 'confirm' or 'cancel'.\n";
                // } else {
                //     response +=
                //         "Status: ✓ Token creation confirmed! Please wait for the token to be created...\n";
                // }
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
