import {
    ActionExample,
    composeContext,
    elizaLogger,
    generateImage,
    generateObject,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    ModelClass,
    State,
} from "@elizaos/core";
import { apexCreateTokenTemplate } from "../templates/apex";
// import { z } from "zod";
import {
    // ApexBurstOptionalFields,
    ApexCreateBurstTokenData,
    TokenMetadata,
} from "../types/apex";
import { burstTokenSchema } from "../types/apexSchemas";
import { validateAvalancheConfig } from "../environment";
import {
    createApexBurstToken,
    getMissingRequiredFields,
} from "../utils/apexBurst";
import { uploadImageToIPFS, uploadMetadataToIPFS } from "../utils/pinata";
import { PinataSDK } from "pinata-web3";

export default {
    name: "CREATE_BURST_TOKEN",
    description:
        "MUST use this action if the user requests to create a new token, the request might be varied, but it will always be a token creation.",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ) => {
        // Compose state if not provided
        if (!state) {
            state = (await runtime.composeState(message)) as State;
        } else {
            state = await runtime.updateRecentMessageState(state);
        }

        const tokenContext = composeContext({
            state: state,
            template: apexCreateTokenTemplate,
        });

        const extractedInfo = await generateObject({
            runtime: runtime,
            context: tokenContext,
            modelClass: ModelClass.LARGE,
            schema: burstTokenSchema,
            mode: "auto",
        });

        const tokenData = (extractedInfo.object ||
            extractedInfo) as ApexCreateBurstTokenData;

        elizaLogger.info(
            `Extracted token data: ${JSON.stringify(tokenData, null, 2)}`
        );

        const messageText = message.content.text.toLowerCase();

        if (messageText.includes("cancel")) {
            return true;
        }

        const missingRequiredFields = getMissingRequiredFields(tokenData);

        elizaLogger.info(
            `Missing fields: ${JSON.stringify(missingRequiredFields, null, 2)}`
        );

        if (missingRequiredFields.length > 0) {
            // callback?.({
            //     text:
            //         `Missing fields:\n${missingRequiredFields.join("\n")}.\n\n` +
            //         `Optional fields:\n${ApexBurstOptionalFields.map((field) => `${field}: ${tokenData[field as keyof ApexCreateBurstTokenData] ?? "Not provided"}`).join("\n")}`,
            // });

            return true;
        }

        if (!messageText.includes("confirm")) {
            callback?.({
                text: `Please confirm these token details:\n${JSON.stringify(
                    tokenData,
                    null,
                    2
                )}\n\nType "confirm" to create the token or "cancel" to clear the data and start over.`,
            });

            return true;
        }

        try {
            callback?.({
                text: `Creating token ${tokenData.name} (${tokenData.symbol})...`,
            });

            const imagePrompt = tokenData.imagePrompt ?? tokenData.description;

            // const logoPrompt = await getImagePrompt(
            //     runtime,
            //     `${imagePrompt}`
            // );

            // const bannerPrompt = await getImagePrompt(
            //     runtime,
            //     `banner style image ${imagePrompt}`
            // );

            // elizaLogger.info("[CREATE_BURST_TOKEN] logoPrompt", logoPrompt);

            const tokenLogoResult = await generateImage(
                {
                    hideWatermark: true,
                    prompt: `image for ${tokenData.name} (${tokenData.symbol}) token - ${imagePrompt}`,
                    width: 256,
                    height: 256,
                    count: 1,
                },
                runtime
            );

            const bannerImageResult = await generateImage(
                {
                    hideWatermark: true,
                    prompt: `banner style image for ${tokenData.name} (${tokenData.symbol}) token - ${imagePrompt}`,
                    width: 1500,
                    height: 500,
                    count: 1,
                },
                runtime
            );

            let logoIpfsHash = null;
            let bannerIpfsHash = null;

            // Initialize Pinata
            const pinata = new PinataSDK({
                pinataJwt: runtime.getSetting("PINATA_JWT"),
                pinataGateway: runtime.getSetting("PINATA_GATEWAY_URL"),
            });

            if (tokenLogoResult.success && tokenLogoResult.data?.[0]) {
                logoIpfsHash = await uploadImageToIPFS(
                    pinata,
                    tokenLogoResult.data[0],
                    `${tokenData.symbol}_logo.png`
                );
                elizaLogger.info(
                    "[CREATE_BURST_TOKEN] Logo uploaded to IPFS:",
                    logoIpfsHash
                );
            }

            if (bannerImageResult.success && bannerImageResult.data?.[0]) {
                bannerIpfsHash = await uploadImageToIPFS(
                    pinata,
                    bannerImageResult.data[0],
                    `${tokenData.symbol}_banner.png`
                );
                elizaLogger.info(
                    "[CREATE_BURST_TOKEN] Banner uploaded to IPFS:",
                    bannerIpfsHash
                );
            }

            // Create and upload metadata
            const metadata: TokenMetadata = {
                name: tokenData.name,
                ticker: tokenData.symbol,
                logo: logoIpfsHash,
                banner: bannerIpfsHash,
                website: tokenData?.website ?? "",
                x: tokenData?.twitter ?? "",
                telegram: tokenData?.telegram ?? "",
                discord: tokenData?.discord ?? "",
                description: tokenData?.description ?? "",
                decimals: 18,
                burstAudio: {
                    name: null,
                    ipfsURI: null,
                },
            };

            const metadataUri = await uploadMetadataToIPFS(pinata, metadata);
            elizaLogger.info(
                "[CREATE_BURST_TOKEN] Metadata uploaded to IPFS:",
                metadataUri
            );

            const { tx, tokenAddress } = await createApexBurstToken(
                runtime,
                tokenData,
                metadataUri
            );
            const messageText =
                `Created token for ${tokenData.creatorAddress}\n` +
                `Name: ${tokenData.name}\n` +
                `Symbol: ${tokenData.symbol}\n` +
                `CA: https://snowtrace.io/address/${tokenAddress}\n` +
                `TX: https://snowtrace.io/tx/${tx}\n` +
                `Apex: https://apexdefi.xyz/burst/${tokenAddress}`;

            elizaLogger.info("[CREATE_BURST_TOKEN] messageText", messageText);

            callback?.({
                text: messageText,
                content: { tx, tokenAddress },
                inReplyTo: message.id,
            });

            const newMemory: Memory = {
                userId: message.agentId,
                agentId: message.agentId,
                roomId: message.roomId,
                content: {
                    text: `${messageText} with ${JSON.stringify(
                        tokenData,
                        null,
                        2
                    )}.`,
                },
            };

            await runtime.messageManager.createMemory(newMemory);

            return true;
        } catch (error) {
            console.error("Error during token creation:", error);

            callback?.({
                text: `Error creating token: ${error.message}`,
                content: { error: error.message },
            });

            const newMemory: Memory = {
                userId: message.agentId,
                agentId: message.agentId,
                roomId: message.roomId,
                content: {
                    text: `Token creation for ${tokenData.name} (${tokenData.symbol}) (${JSON.stringify(
                        tokenData,
                        null,
                        2
                    )}) failed.`,
                },
            };

            await runtime.messageManager.createMemory(newMemory);

            return false;
        }
    },
    validate: async (runtime: IAgentRuntime) => {
        await validateAvalancheConfig(runtime);
        return true;
    },
    examples: [
        // Scenario 1: Initial creation with suggestions
        [
            {
                user: "{{user1}}",
                content: {
                    text: "I want to create a meme token about grumpy cats",
                    action: "CREATE_BURST_TOKEN",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: 'I\'ll help you create your grumpy cat token! Let me suggest some initial values:\n\nSuggesting these values:\n- Name: "GRUMPY"\n- Symbol: "GRUMP"\n- Description: "A meme token celebrating the internet\'s grumpiest cats"\n- Total Supply: 100000000\n\nPlease confirm if you\'d like to use these values.\n\nAfter confirmation, we\'ll need:\n- Burst Amount (50-2000 AVAX)\n- DEX Allocations (must total 100%)\n- Reward DEX\n- Creator Address',
                    action: "CREATE_BURST_TOKEN",
                },
            },
            {
                user: "{{user1}}",
                content: {
                    text: "Yes those work! For DEX let's do 60% APEX, 40% JOE with APEX rewards",
                    action: "CREATE_BURST_TOKEN",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: 'Setting previously confirmed values:\n- Name: "GRUMPY"\n- Symbol: "GRUMP"\n- Description: "A meme token celebrating the internet\'s grumpiest cats"\n- Total Supply: 100000000\n\nSetting new values:\n- DEX Allocations: APEX(60%), JOE(40%)\n- Reward DEX: APEX\n\nStill needed:\n- Burst Amount (50-2000 AVAX)\n- Creator Address (42 character hex starting with 0x)',
                    action: "CREATE_BURST_TOKEN",
                },
            },
        ],

        // Scenario 2: Updates and corrections
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Actually let's change the name to GRUMPYCAT and set burst to 300 AVAX",
                    action: "CREATE_BURST_TOKEN",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: 'Updating values:\n- Name: "GRUMPYCAT"\n- Burst Amount: 300\n\nCurrent token details:\n- Name: "GRUMPYCAT"\n- Symbol: "GRUMP"\n- Description: "A meme token celebrating the internet\'s grumpiest cats"\n- Total Supply: 100000000\n- DEX Allocations: APEX(60%), JOE(40%)\n- Reward DEX: APEX\n- Burst Amount: 300\n\nStill needed:\n- Creator Address (42 character hex starting with 0x)',
                    action: "CREATE_BURST_TOKEN",
                },
            },
        ],

        // Scenario 3: Optional fields and validation
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Let's add a 2% trading fee and website grumpycat.fi",
                    action: "CREATE_BURST_TOKEN",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: 'Setting optional values:\n- Trading Fee: 2\n- Website: "grumpycat.fi"\n\nCurrent token details:\n[previous values...]\n- Trading Fee: 2\n- Website: "grumpycat.fi"\n\nStill needed:\n- Creator Address (42 character hex starting with 0x)',
                    action: "CREATE_BURST_TOKEN",
                },
            },
        ],

        // Scenario 4: Invalid inputs
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Set creator address 0x123 and trading fee 10%",
                    action: "CREATE_BURST_TOKEN",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I notice some validation issues:\n\n- Creator address '0x123' is invalid (must be 42 characters starting with 0x)\n- Trading fee 10% exceeds maximum of 5%\n\nNo values have been updated. Please provide:\n- A valid 42-character creator address\n- A trading fee between 0-5%\n\nCurrent token details remain unchanged.",
                    action: "CREATE_BURST_TOKEN",
                },
            },
        ],
        // Scenario 5: Completion and confirmation
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Creator address is 0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
                    action: "CREATE_BURST_TOKEN",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: 'Setting value:\n- Creator Address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"\n\nAll required fields are now complete! Please confirm these final details:\n\nToken Configuration:\n- Name: "GRUMPYCAT"\n- Symbol: "GRUMP"\n- Description: "A meme token celebrating the internet\'s grumpiest cats"\n- Total Supply: 100000000\n- DEX Allocations: APEX(60%), JOE(40%)\n- Reward DEX: APEX\n- Burst Amount: 300\n- Creator Address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"\n- Trading Fee: 2\n- Website: "grumpycat.fi"\n\nType \'confirm\' to create the token or \'cancel\' to start over.',
                    action: "CREATE_BURST_TOKEN",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Actually cancel this, I want to start over",
                    action: "CREATE_BURST_TOKEN",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Token creation cancelled. You can start over whenever you're ready.",
                    action: "",
                },
            },
            {
                user: "{{user1}}",
                content: {
                    text: "Okay let's make a new token called MOON",
                    action: "CREATE_BURST_TOKEN",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: 'Starting fresh! Let me suggest some initial values:\n\nSuggesting these values:\n- Name: "MOON"\n- Symbol: "MOON"\n- Total Supply: 100000000\n\nPlease confirm if you\'d like to use these values.\n\nWe\'ll also need:\n- Description\n- Burst Amount (50-2000 AVAX)\n- DEX Allocations (must total 100%)\n- Reward DEX\n- Creator Address',
                    action: "CREATE_BURST_TOKEN",
                },
            },
        ],
        // Scenario 7: Cancel during confirmation
        [
            {
                user: "{{user1}}",
                content: {
                    text: "cancel this, the allocations aren't right",
                    action: "CREATE_BURST_TOKEN",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Token creation cancelled. All values have been cleared. When you're ready to start over, just let me know what allocations you'd prefer.",
                    action: "",
                },
            },
        ],
        // Scenario 8: Generic creation
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Let's create a new token",
                    action: "CREATE_BURST_TOKEN",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll help you create a new token! To get started, I'll need some information:\n\nPlease provide:\n- Name\n- Symbol\n- Total Supply\n- Description\n- Burst Amount (50-2000 AVAX)\n- DEX Allocations (must total 100%)\n- Reward DEX\n- Creator Address",
                    action: "CREATE_BURST_TOKEN",
                },
            },
        ],
    ] as ActionExample[][],
    similes: ["CREATE_TOKEN", "MAKE_TOKEN", "LAUNCH_TOKEN", "DEPLOY_TOKEN"],
};
