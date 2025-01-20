import { getAccount, getPublicClient, getWalletClient } from "./index";
import { APEX_CONFIG } from "./constants";
import {
    IAgentRuntime,
    ModelClass,
    elizaLogger,
    generateText,
} from "@elizaos/core";
import {
    Address,
    formatEther,
    isAddress,
    parseEther,
    parseEventLogs,
    zeroAddress,
} from "viem";
import { burstFactoryAbi } from "../abi";
import {
    ApexBurstInternalField,
    ApexBurstOptionalFields,
    ApexBurstRequiredFields,
    ApexCreateBurstTokenData,
    BURST_TOKEN_FIELD_GUIDANCE,
    CurveDetails,
} from "../types/apex";

export const canBeConfirmed = (data: ApexCreateBurstTokenData) => {
    const totalAllocation = data.dexAllocations?.reduce(
        (acc, dex) => acc + dex.allocation,
        0
    );

    if (
        data.name !== undefined &&
        data.name.length > 0 &&
        data.symbol !== undefined &&
        data.symbol.length > 0 &&
        data.description !== undefined &&
        data.description.length > 0 &&
        data.totalSupply !== undefined &&
        data.burstAmount !== undefined &&
        data.dexAllocations !== undefined &&
        data.dexAllocations.length > 0 &&
        data.dexAllocations.every((dex) => dex.dex !== undefined) &&
        data.dexAllocations.every((dex) => dex.allocation !== undefined) &&
        totalAllocation === 10000 &&
        data.rewardDex !== undefined &&
        data.creatorAddress !== undefined
    ) {
        return true;
    }
    return false;
};

export const createApexBurstToken = async (
    runtime: IAgentRuntime,
    apexBurstTokenData: ApexCreateBurstTokenData,
    metadataUrl: string
) => {
    const account = getAccount(runtime);
    const publicClient = getPublicClient(runtime);
    const burstFactoryAddress: Address = APEX_CONFIG.burstFactory as Address;
    elizaLogger.info(
        "[createApexBurstToken] apexBurstTokenData",
        apexBurstTokenData
    );
    // Make sure all required fields are provided
    const missingFields = getMissingRequiredFields(apexBurstTokenData);

    elizaLogger.info("[createApexBurstToken] missingFields", missingFields);

    if (missingFields.length > 0) {
        throw new Error(`Missing fields: ${missingFields.join(", ")}`);
    }

    if (apexBurstTokenData.name.length == 0) {
        throw new Error("Name must be provided");
    }

    if (apexBurstTokenData.name.length > 50) {
        throw new Error("Name must be less than 12 characters");
    }

    if (apexBurstTokenData.symbol.length == 0) {
        throw new Error("Symbol must be provided");
    }

    if (apexBurstTokenData.symbol.length > 10) {
        throw new Error("Symbol must be less than 8 characters");
    }

    if (apexBurstTokenData.creatorAddress === zeroAddress) {
        apexBurstTokenData.creatorAddress = account.address;
    }

    // Ensure creator address is a valid address
    if (!isAddress(apexBurstTokenData.creatorAddress)) {
        throw new Error("Creator address is not a valid address");
    }

    if (
        apexBurstTokenData.totalSupply &&
        parseEther(apexBurstTokenData.totalSupply.toString()) === 0n
    ) {
        throw new Error("Supply must be greater than 0");
    }

    if (
        apexBurstTokenData.tradingFee &&
        (apexBurstTokenData.tradingFee < 0 ||
            apexBurstTokenData.tradingFee > 500)
    ) {
        throw new Error("Trading fee must be between 0 and 500");
    }

    if (
        apexBurstTokenData.maxWalletPercent &&
        (apexBurstTokenData.maxWalletPercent < 0 ||
            apexBurstTokenData.maxWalletPercent > 10000)
    ) {
        throw new Error("Max wallet percent must be between 0 and 10000");
    }

    const salt: `0x${string}` =
        "0x0000000000000000000000000000000000000000000000000000000000000000";

    const metadataURI = metadataUrl;
    // get the curve details
    const curveDetails = await getCurveV2Details(burstFactoryAddress, runtime);
    // get the curve index
    const curveIndex = await getCurveIndex(
        apexBurstTokenData.burstAmount,
        curveDetails,
        2
    );

    // verify that dexAllocations is not empty and that the sum of allocations is 10000
    // also verify that only 1 dex is marked as a reward
    if (apexBurstTokenData.dexAllocations.length === 0) {
        throw new Error("Dex allocations must be provided");
    } else {
        let totalAllocation = 0;
        for (let i = 0; i < apexBurstTokenData.dexAllocations.length; i++) {
            totalAllocation += apexBurstTokenData.dexAllocations[i].allocation;
        }
        if (totalAllocation !== 10000) {
            throw new Error("Dex allocations must sum to 10000");
        }
    }

    // get the reward dex
    const dexAllocationParams = apexBurstTokenData.dexAllocations.map(
        (alloc) => ({
            dex: alloc.dex,
            isReward: alloc.dex === apexBurstTokenData.rewardDex,
            allocation: BigInt(alloc.allocation),
        })
    );

    const params: [
        string,
        string,
        bigint,
        bigint,
        bigint,
        string,
        number,
        `0x${string}`,
        { dex: number; isReward: boolean; allocation: bigint }[],
        `0x${string}`,
    ] = [
        apexBurstTokenData.name,
        apexBurstTokenData.symbol,
        parseEther(apexBurstTokenData.totalSupply.toString()),
        BigInt(apexBurstTokenData.tradingFee ?? 0),
        BigInt(apexBurstTokenData.maxWalletPercent ?? 0),
        metadataURI,
        curveIndex,
        salt,
        dexAllocationParams,
        apexBurstTokenData.creatorAddress,
    ];

    elizaLogger.log("Params:", params);

    const { result, request } = await publicClient.simulateContract({
        account,
        address: burstFactoryAddress,
        abi: burstFactoryAbi,
        functionName: "burstTokenWithCreator",
        args: params,
    });

    if (!result) {
        throw new Error("Create failed");
    }

    elizaLogger.debug("request", request);
    elizaLogger.debug("result", result);

    let tokenAddress = zeroAddress as Address;

    const walletClient = getWalletClient(runtime);
    const tx = await walletClient.writeContract(request);
    elizaLogger.log("Transaction:", tx);
    const receipt = await publicClient.waitForTransactionReceipt({
        hash: tx,
        confirmations: 4,
    });
    elizaLogger.debug("Receipt:", receipt);

    const logs = parseEventLogs({
        abi: burstFactoryAbi,
        eventName: "TokenCreated",
        logs: receipt.logs,
    });

    if (logs.length > 0) {
        tokenAddress = logs[0].args.token;
    }

    return {
        tx: tx,
        tokenAddress: tokenAddress,
    };
};

const getCurveIndex = async (
    burstAmount: number,
    curveDetails: CurveDetails[],
    curveStyleIndex: number
): Promise<number> => {
    if (!curveDetails) return 0;
    if (curveDetails.length === 0) return 0;

    const curveIndex = curveDetails.find((curveDetail) => {
        if (curveDetail && curveDetail.avaxAtLaunch) {
            const formattedAmount = Number(
                formatEther(curveDetail.avaxAtLaunch)
            );
            // Round to the nearest 5
            const roundedAmount = Math.round(formattedAmount / 5) * 5;

            return (
                roundedAmount === burstAmount &&
                curveStyleIndex === curveDetail.curveStyle
            );
        }
        return false;
    });

    elizaLogger.log("curveIndex", curveIndex);
    // if no curve is found, return the default curve index (250 Avax - Curve Style 2)
    return curveIndex?.index || 37;
};

const getCurveV2Details = async (
    burstFactoryAddress: Address,
    runtime: IAgentRuntime
): Promise<CurveDetails[]> => {
    const publicClient = getPublicClient(runtime);
    const data = await publicClient.readContract({
        address: burstFactoryAddress,
        abi: burstFactoryAbi,
        functionName: "getAllCurves",
    });

    const curveDetails: CurveDetails[] = data.map((curveDetail) => {
        if (curveDetail) {
            return {
                index: curveDetail.index,
                curveStyle: curveDetail.curveData.curveStyle,
                distribution: curveDetail.distribution as bigint[],
                binStepScaleFactor: curveDetail.curveData
                    .binStepScaleFactor as bigint[],
                percentOfLP: curveDetail.curveData.percentOfLP as bigint,
                avaxAtLaunch: curveDetail.curveData.avaxAtLaunch as bigint,
                basePrice: curveDetail.curveData.basePrice as bigint,
            };
        } else {
            return null;
        }
    });

    return curveDetails.filter((curve) => curve !== null);
};

export async function getImagePrompt(
    runtime: IAgentRuntime,
    imagePrompt: string
) {
    const CONTENT = imagePrompt;
    const IMAGE_SYSTEM_PROMPT = `You are an expert in writing prompts for AI art generation. You excel at creating detailed and creative visual descriptions. Incorporating specific elements naturally. Always aim for clear, descriptive language that generates a creative picture. Your output should only contain the description of the image contents, but NOT an instruction like "create an image that..."`;
    const STYLE = "futuristic with vibrant colors";

    const IMAGE_PROMPT_INPUT = `You are tasked with generating an image prompt based on a content and a specified style.
            Your goal is to create a detailed and vivid image prompt that captures the essence of the content while incorporating an appropriate subject based on your analysis of the content.\n\nYou will be given the following inputs:\n<content>\n${CONTENT}\n</content>\n\n<style>\n${STYLE}\n</style>\n\nA good image prompt consists of the following elements:\n\n

1. Main subject
2. Detailed description
3. Style
4. Lighting
5. Composition
6. Quality modifiers

To generate the image prompt, follow these steps:\n\n1. Analyze the content text carefully, identifying key themes, emotions, and visual elements mentioned or implied.
\n\n

2. Determine the most appropriate main subject by:
   - Identifying concrete objects or persons mentioned in the content
   - Analyzing the central theme or message
   - Considering metaphorical representations of abstract concepts
   - Selecting a subject that best captures the content's essence

3. Determine an appropriate environment or setting based on the content's context and your chosen subject.

4. Decide on suitable lighting that enhances the mood or atmosphere of the scene.

5. Choose a color palette that reflects the content's tone and complements the subject.

6. Identify the overall mood or emotion conveyed by the content.

7. Plan a composition that effectively showcases the subject and captures the content's essence.

8. Incorporate the specified style into your description, considering how it affects the overall look and feel of the image.

9. Use concrete nouns and avoid abstract concepts when describing the main subject and elements of the scene.

Construct your image prompt using the following structure:\n\n
1. Main subject: Describe the primary focus of the image based on your analysis
2. Environment: Detail the setting or background
3. Lighting: Specify the type and quality of light in the scene
4. Colors: Mention the key colors and their relationships
5. Mood: Convey the overall emotional tone
6. Composition: Describe how elements are arranged in the frame
7. Style: Incorporate the given style into the description

Ensure that your prompt is detailed, vivid, and incorporates all the elements mentioned above while staying true to the content and the specified style. LIMIT the image prompt 50 words or less. \n\nWrite a prompt. Only include the prompt and nothing else.`;

    return await generateText({
        runtime,
        context: IMAGE_PROMPT_INPUT,
        modelClass: ModelClass.MEDIUM,
        customSystemPrompt: IMAGE_SYSTEM_PROMPT,
    });
}

// Simplified guidance to reduce token usage
export const getMinimalFieldGuidance = (
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
    return ApexBurstRequiredFields.filter((field) => {
        const value =
            cachedData[
                field as keyof Omit<
                    ApexCreateBurstTokenData,
                    ApexBurstInternalField
                >
            ];
        return (
            value === null ||
            value === undefined ||
            (typeof value === "string" && value.length === 0)
        );
    });
};

export const getMissingOptionalFields = (
    cachedData: ApexCreateBurstTokenData
): Array<keyof Omit<ApexCreateBurstTokenData, ApexBurstInternalField>> => {
    return ApexBurstOptionalFields.filter((field) => {
        const value =
            cachedData[
                field as keyof Omit<
                    ApexCreateBurstTokenData,
                    ApexBurstInternalField
                >
            ];
        return (
            value === null ||
            value === undefined ||
            (typeof value === "string" && value.length === 0)
        );
    });
};
