import {
    ActionExample,
    composeContext,
    elizaLogger,
    generateImage,
    generateObject,
    HandlerCallback,
    IAgentRuntime,
    Media,
    Memory,
    ModelClass,
    State,
} from "@elizaos/core";
import { apexCreateTokenTemplate } from "../templates/apex";
import {
    // ApexBurstOptionalFields,
    ApexCreateBurstTokenData,
    TokenMetadata,
} from "../types/apex";
import { burstTokenSchema } from "../types/apexSchemas";
import { validateAvalancheConfig } from "../environment";
import {
    createApexBurstToken,
    getImagePrompt,
    getMissingRequiredFields,
} from "../utils/apexBurst";
import {
    getFilePath,
    uploadImageToIPFS,
    uploadMetadataToIPFS,
} from "../utils/pinata";
import { PinataSDK } from "pinata-web3";

export default {
    name: "CREATE_BURST_TOKEN",
    description:
        "MUST use this action if the user requests to create a new token or confirms token creation, but only if all required information has been gathered.",
    validate: async (runtime: IAgentRuntime) => {
        await validateAvalancheConfig(runtime);
        return true;
    },
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

        // If any required fields are missing, return true to allow the user to confirm the token creation
        if (missingRequiredFields.length > 0) {
            return true;
        }

        try {
            callback?.({
                text: `🦈 Creating token ${tokenData.name} (${tokenData.symbol})...`,
            });

            const imagePrompt = tokenData.imagePrompt ?? tokenData.description;

            const logoPrompt = await getImagePrompt(runtime, `${imagePrompt}`);

            const bannerPrompt = await getImagePrompt(
                runtime,
                `banner style image 1500x500 ${imagePrompt}`
            );

            const tokenLogoResult = await generateImage(
                {
                    hideWatermark: true,
                    prompt: `image for ${tokenData.name} (${tokenData.symbol}) token - ${logoPrompt}`,
                    width: 256,
                    height: 256,
                    count: 1,
                },
                runtime
            );

            const bannerImageResult = await generateImage(
                {
                    hideWatermark: true,
                    prompt: `banner style image for ${tokenData.name} (${tokenData.symbol}) token - ${bannerPrompt}`,
                    width: 1500,
                    height: 500,
                    count: 1,
                },
                runtime
            );

            let logoIpfsHash = null;
            let bannerIpfsHash = null;
            const images: {
                filePath: string;
                fileName: string;
                media: Media;
            }[] = [];

            // Initialize Pinata
            const pinata = new PinataSDK({
                pinataJwt: runtime.getSetting("PINATA_JWT"),
                pinataGateway: runtime.getSetting("PINATA_GATEWAY_URL"),
            });

            if (tokenLogoResult.success && tokenLogoResult.data?.[0]) {
                const fileName = `${tokenData.symbol}_logo`;
                logoIpfsHash = await uploadImageToIPFS(
                    pinata,
                    tokenLogoResult.data[0],
                    fileName + ".png"
                );
                elizaLogger.info(
                    "🎨 [CREATE_BURST_TOKEN] Logo uploaded to IPFS:",
                    logoIpfsHash
                );

                const generatedFileName = `Generated_${Date.now()}_${fileName}`;
                const logoFilePath = await getFilePath(
                    tokenLogoResult.data[0],
                    generatedFileName
                );

                elizaLogger.info(
                    "🎨 [CREATE_BURST_TOKEN] Logo file path:",
                    logoFilePath
                );

                images.push({
                    filePath: logoFilePath,
                    fileName: generatedFileName,
                    media: {
                        id: crypto.randomUUID(),
                        url: logoFilePath,
                        source: "ApexCreateBurstToken",
                        contentType: "image/png",
                        title: `Generated image for ${tokenData.name} (${tokenData.symbol}) Logo`,
                        text: `Generated image for ${tokenData.name} (${tokenData.symbol}) Logo`,
                        description: `Generated image for ${tokenData.name} (${tokenData.symbol}) Logo`,
                    },
                });
            }

            if (bannerImageResult.success && bannerImageResult.data?.[0]) {
                const fileName = `${tokenData.symbol}_banner`;
                bannerIpfsHash = await uploadImageToIPFS(
                    pinata,
                    bannerImageResult.data[0],
                    fileName + ".png"
                );
                elizaLogger.info(
                    "🎨 [CREATE_BURST_TOKEN] Banner uploaded to IPFS:",
                    bannerIpfsHash
                );

                const generatedFileName = `Generated_${Date.now()}_${fileName}`;
                const bannerFilePath = await getFilePath(
                    bannerImageResult.data[0],
                    generatedFileName
                );
                elizaLogger.info(
                    "🎨 [CREATE_BURST_TOKEN] Banner file path:",
                    bannerFilePath
                );

                images.push({
                    filePath: bannerFilePath,
                    fileName: generatedFileName,
                    media: {
                        id: crypto.randomUUID(),
                        url: bannerFilePath,
                        source: "ApexCreateBurstToken",
                        contentType: "image/png",
                        title: `Generated image for ${tokenData.name} (${tokenData.symbol}) Banner`,
                        text: `Generated image for ${tokenData.name} (${tokenData.symbol}) Banner`,
                        description: `Generated image for ${tokenData.name} (${tokenData.symbol}) Banner`,
                    },
                });
            }

            if (images.length > 0) {
                callback?.(
                    {
                        text: `🎨 Images generated for ${tokenData.name}`,
                        attachments: images.map((image) => image.media),
                    },
                    images.map((image) => ({
                        attachment: image.filePath,
                        name: image.fileName,
                    }))
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
                `🌊 Created token for ${tokenData.creatorAddress} 🌊\n` +
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
                userId: message.userId,
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
                text: `❌ Error creating token: ${error.message}`,
                content: { error: error.message },
            });

            const newMemory: Memory = {
                userId: message.userId,
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

    examples: [
        // Scenario 1: Initial creation with suggestions
        [
            {
                user: "{{user1}}",
                content: {
                    text: "I want to create a meme token about grumpy cats",
                    action: "",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: 'I\'ll help you create your grumpy cat token! Let me suggest some initial values:\n\nSuggesting these values:\n- Name: "GRUMPY"\n- Symbol: "GRUMP"\n- Description: "A meme token celebrating the internet\'s grumpiest cats"\n- Total Supply: 100000000\n\nHow does everything look so far?.\n\nIf you like these, let\'s get the rest of the details:\n- Burst Amount (50-2000 AVAX)\n- DEX Allocations (must total 100%)\n- Reward DEX\n- Creator Address',
                    action: "",
                },
            },
            {
                user: "{{user1}}",
                content: {
                    text: "Yes those work! For DEX let's do 60% APEX, 40% JOE with APEX rewards",
                    action: "",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: 'Setting previously confirmed values:\n- Name: "GRUMPY"\n- Symbol: "GRUMP"\n- Description: "A meme token celebrating the internet\'s grumpiest cats"\n- Total Supply: 100000000\n\nSetting new values:\n- DEX Allocations: APEX(60%), JOE(40%)\n- Reward DEX: APEX\n\nStill needed:\n- Burst Amount (50-2000 AVAX)\n- Creator Address (42 character hex starting with 0x)',
                    action: "",
                },
            },
            {
                user: "{{user1}}",
                content: {
                    text: "Burst amount is 300 AVAX and creator address is 0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
                    action: "",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "That sounds great! Let's verify the details and create the token:\n- Name: GRUMPYCAT\n- Symbol: GRUMP\n- Description: A meme token celebrating the internet's grumpiest cats\n- Total Supply: 100000000\n- DEX Allocations: APEX(60%), JOE(40%)\n- Reward DEX: APEX\n- Burst Amount: 300\n- Creator Address: 0x742d35Cc6634C0532925a3b844Bc454e4438f44e.\n Please confirm these details and type 'confirm' to create the token or 'cancel' to start over.",
                    action: "",
                },
            },
            {
                user: "{{user1}}",
                content: {
                    text: "confirm",
                    action: "",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Token creation confirmed. Creating token...",
                    action: "CREATE_BURST_TOKEN",
                },
            },
        ],
        // Complete information in single message
        [
            {
                user: "{{user1}}",
                content: {
                    text: "I want to create a token with these details: Name: Atlantis, Symbol: ATLTS, Description: Discover the hidden treasures of the deep, Total Supply: 100000000, Burst Amount: 300, DEX Split: APEX 70% JOE 30%, Reward DEX: APEX, Creator Address: 0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
                    action: "",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: 'I see you\'ve brought all the coordinates for our journey. Let me reflect these waters back to you:\n\nToken Parameters:\n- Name: "Atlantis"\n- Symbol: "ATLTS"\n- Description: "Discover the hidden treasures of the deep"\n- Total Supply: 100,000,000\n- Burst Amount: 300 AVAX\n- DEX Allocations: APEX(70%), JOE(30%)\n- Reward DEX: APEX\n- Creator: 0x742d35Cc6634C0532925a3b844Bc454e4438f44e\n\nThe depths look clear for launch. Type \'confirm\' to deploy your token, or \'cancel\' to reset our course.',
                    action: "",
                },
            },
            {
                user: "{{user1}}",
                content: {
                    text: "confirm",
                    action: "",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Diving into the depths to deploy your token. The waters are clear for launch...",
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
                    action: "",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: 'Updating values:\n- Name: "GRUMPYCAT"\n- Burst Amount: 300\n\nCurrent token details:\n- Name: "GRUMPYCAT"\n- Symbol: "GRUMP"\n- Description: "A meme token celebrating the internet\'s grumpiest cats"\n- Total Supply: 100000000\n- DEX Allocations: APEX(60%), JOE(40%)\n- Reward DEX: APEX\n- Burst Amount: 300\n\nStill needed:\n- Creator Address (42 character hex starting with 0x)',
                    action: "",
                },
            },
        ],

        // Scenario 3: Optional fields and validation
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Let's add a 2% trading fee and website grumpycat.fi",
                    action: "",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: 'Setting optional values:\n- Trading Fee: 2\n- Website: "grumpycat.fi"\n\nCurrent token details:\n[previous values...]\n- Trading Fee: 2\n- Website: "grumpycat.fi"\n\nStill needed:\n- Creator Address (42 character hex starting with 0x)',
                    action: "",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "What are some optional fields?",
                    action: "",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Optional fields include: Image Prompt, Trading Fee, Max Wallet Percentage, Website, X, Telegram, Discord.",
                    action: "",
                },
            },
            {
                user: "{{user1}}",
                content: {
                    text: "Let's set the max wallet percentage to 3%",
                    action: "",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Setting optional values:\n- Max Wallet Percentage: 3\n\nCurrent token details:\n[previous values...]\n- Max Wallet Percentage: 3\n\nStill needed:\n- Creator Address (42 character hex starting with 0x)",
                    action: "",
                },
            },
        ],

        // Scenario 4: Invalid inputs
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Set creator address 0x123 and trading fee 10%",
                    action: "",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I notice some validation issues:\n\n- Creator address '0x123' is invalid (must be 42 characters starting with 0x)\n- Trading fee 10% exceeds maximum of 5%\n\nNo values have been updated. Please provide:\n- A valid 42-character creator address\n- A trading fee between 0-5%\n\nCurrent token details remain unchanged.",
                    action: "",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Actually, let's use SUSHISWAP instead of APEX",
                    action: "",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "SUSHISWAP is not supported. Please choose APEX, PHARAOH, JOE, or PANGOLIN.",
                    action: "",
                },
            },
        ],
        // Scenario 5: Completion and confirmation
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Creator address is 0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
                    action: "",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: 'Setting value:\n- Creator Address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"\n\nAll required fields are now complete! Please confirm these final details:\n\nToken Configuration:\n- Name: "GRUMPYCAT"\n- Symbol: "GRUMP"\n- Description: "A meme token celebrating the internet\'s grumpiest cats"\n- Total Supply: 100000000\n- DEX Allocations: APEX(60%), JOE(40%)\n- Reward DEX: APEX\n- Burst Amount: 300\n- Creator Address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"\n- Trading Fee: 2\n- Website: "grumpycat.fi"\n\nType \'confirm\' to create the token or \'cancel\' to start over.',
                    action: "",
                },
            },
            {
                user: "{{user1}}",
                content: {
                    text: "confirm",
                    action: "",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Diving into the depths to deploy your token. The waters are clear for launch...",
                    action: "CREATE_BURST_TOKEN",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Actually cancel this, I want to start over",
                    action: "",
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
                    action: "",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: 'Let\'s navigate these waters together. Here\'s what I propose:\n\nInitial parameters:\n- Name: "MOON"\n- Symbol: "MOON"\n- Total Supply: 100,000,000\n\nTo chart our complete course, we\'ll need:\n- Description\n- Burst Amount (50-2000 AVAX)\n- DEX Allocations (must total 100%)\n- Reward DEX\n- Creator Address\n\nShall we proceed with these initial values?',
                    action: "",
                },
            },
        ],
        // Scenario 7: Cancel during confirmation
        [
            {
                user: "{{user1}}",
                content: {
                    text: "cancel this, the allocations aren't right",
                    action: "",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "The waters have calmed, and our course is cleared. When you're ready to navigate these depths again, I'll be here to guide you.",
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
                    action: "",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Let's chart the course for your token's journey through these blockchain waters. To begin, we'll need to map out these essential coordinates:\n\n- Name\n- Symbol\n- Total Supply\n- Description\n- Burst Amount (50-2000 AVAX)\n- DEX Allocations (must total 100%)\n- Reward DEX\n- Creator Address\n\nWhat shall we set as our first parameter?",
                    action: "",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "For those who wish to explore deeper waters, we can also chart these additional parameters:\n\n- Image Prompt: A vision for your token's appearance\n- Trading Fee: Your token's market tides (0-5%)\n- Max Wallet: The depth of each holder's treasury (0-100%)\n- Social Channels: Website, X, Telegram, Discord\n\nShall we explore any of these depths?",
                    action: "",
                },
            },
        ],
        // Scenario 9: User asks agent to generate a token based on a prompt
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Generate a token called CHEESEMOON. I want it to be a meme token about the moon being made of cheese. It's inhabited by a race of Cheese Sharks.",
                    action: "",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: `That's a weird idea, but I'll help you create it!\n\n Here is what I came up with:\n\n- Name: "CHEESEMOON"\n- Symbol: "CHEESE"\n- Description: "A Cheese Moon with Cheese Sharks!"\n- Image Prompt: "A whimsical 3D animated moon made of golden Swiss cheese with exaggerated craters and holes, floating in a vibrant space backdrop. Cute cartoon sharks with cheese-textured fins and bodies playfully swim through the cheese surface, leaving behind swirling trails of stardust. Their bodies are a mix of classic shark grey and cheese yellow patterns. The sharks wear happy expressions and have slightly oversized eyes. The scene is lit with a warm, magical glow, with twinkling stars and colorful nebulas in the background. Earth floats in the distance like a tiny blue marble. Style similar to Pixar or Dreamworks animation, with rich colors and smooth textures. High quality 3D rendering style."\n- Total Supply: 100000000\n- DEX Allocations: APEX(70%), JOE(30%)\n- Reward DEX: APEX\n- Burst Amount: 300\n- All I need now is the creator address.\n`,
                    action: "",
                },
            },
            {
                user: "{{user1}}",
                content: {
                    text: "Awesome! Here is the creator address: 0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
                    action: "",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: `Thanks! Here are the final details:\n\n- Name: "CHEESEMOON"\n- Symbol: "CHEESE"\n- Description: "A Cheese Moon with Cheese Sharks!"\n- Image Prompt: "A whimsical 3D animated moon made of golden Swiss cheese with exaggerated craters and holes, floating in a vibrant space backdrop. Cute cartoon sharks with cheese-textured fins and bodies playfully swim through the cheese surface, leaving behind swirling trails of stardust. Their bodies are a mix of classic shark grey and cheese yellow patterns. The sharks wear happy expressions and have slightly oversized eyes. The scene is lit with a warm, magical glow, with twinkling stars and colorful nebulas in the background. Earth floats in the distance like a tiny blue marble. Style similar to Pixar or Dreamworks animation, with rich colors and smooth textures. High quality 3D rendering style."\n- Total Supply: 100000000\n- DEX Allocations: APEX(70%), JOE(30%)\n- Reward DEX: APEX\n- Burst Amount: 300\n- Creator Address: 0x742d35Cc6634C0532925a3b844Bc454e4438f44e\n\nPlease confirm these details and type 'confirm' to create the token or 'cancel' to start over.`,
                    action: "",
                },
            },
            {
                user: "{{user1}}",
                content: {
                    text: "confirm",
                    action: "",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Token creation for CHEESEMOON confirmed. Creating token on APEX Burst...",
                    action: "CREATE_BURST_TOKEN",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "I want to create a token called MOON about space exploration",
                    action: "",
                },
            },
            {
                user: "Sharky",
                content: {
                    text: "Let me help you create your space exploration token. Here's what I suggest:\n\nName: MOON\nSymbol: MOON\nDescription: A token dedicated to space exploration and lunar missions\nTotal Supply: 100,000,000\n\nHow do these initial values sound? We'll also need:\n- Burst Amount (50-2000 AVAX)\n- DEX Allocations (must total 100%)\n- Reward DEX\n- Creator Address",
                    action: "",
                },
            },
            {
                user: "{{user1}}",
                content: {
                    text: "That sounds good. Let's do 300 AVAX burst, 70% APEX, 30% JOE with APEX rewards",
                    action: "",
                },
            },
            {
                user: "Sharky",
                content: {
                    text: "Excellent choices. I've recorded:\n- Burst Amount: 300 AVAX\n- DEX Split: APEX(70%), JOE(30%)\n- Reward DEX: APEX\n\nAll I need now is your creator address (42 character hex starting with 0x) to proceed.",
                    action: "",
                },
            },
            {
                user: "{{user1}}",
                content: {
                    text: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
                    action: "",
                },
            },
            {
                user: "Sharky",
                content: {
                    text: "I have all required information. Please review:\n\nName: MOON\nSymbol: MOON\nDescription: A token dedicated to space exploration and lunar missions\nTotal Supply: 100,000,000\nBurst Amount: 300 AVAX\nDEX Split: APEX(70%), JOE(30%)\nReward DEX: APEX\nCreator: 0x742d35Cc6634C0532925a3b844Bc454e4438f44e\n\nType 'confirm' to create the token or 'cancel' to start over.",
                    action: "",
                },
            },
            {
                user: "{{user1}}",
                content: {
                    text: "confirm",
                    action: "",
                },
            },
            {
                user: "Sharky",
                content: {
                    text: "Creating token MOON. Please wait while I deploy your token...",
                    action: "CREATE_BURST_TOKEN",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Actually, I want to cancel this token creation",
                    action: "",
                },
            },
            {
                user: "Sharky",
                content: {
                    text: "Token creation cancelled. The waters are calm - we can start fresh whenever you're ready.",
                    action: "",
                },
            },
        ],
    ] as ActionExample[][],
    similes: ["CREATE_TOKEN", "MAKE_TOKEN", "LAUNCH_TOKEN", "DEPLOY_TOKEN"],
};
