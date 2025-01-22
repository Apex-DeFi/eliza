import {
    getAccount,
    getNetwork,
    getPublicClient,
    getWalletClient,
} from "./index";
import { APEX_BURST_FACTORY_ADDRESSES } from "./constants";
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
    const network = getNetwork(runtime).id === 43113 ? "fuji" : "avalanche";
    const burstFactoryAddress: Address = APEX_BURST_FACTORY_ADDRESSES[
        network
    ] as Address;
    elizaLogger.info(
        "[createApexBurstToken] network and burstFactoryAddress",
        network,
        burstFactoryAddress
    );

    elizaLogger.debug(
        "[createApexBurstToken] apexBurstTokenData",
        apexBurstTokenData
    );
    // Make sure all required fields are provided
    const missingFields = getMissingRequiredFields(apexBurstTokenData);

    elizaLogger.debug("[createApexBurstToken] missingFields", missingFields);

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

    let tx = zeroAddress as Address;
    let tokenAddress = zeroAddress as Address;

    const walletClient = getWalletClient(runtime);
    tx = await walletClient.writeContract(request);
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
    const IMAGE_SYSTEM_PROMPT = `You are an expert in writing prompts for AI art generation, with a deep understanding of crypto and blockchain themes. You excel at creating detailed and creative visual descriptions that resonate with token branding. Your output should only contain the description of the image contents, but NOT an instruction like "create an image that..."`;

    const IMAGE_PROMPT_INPUT = `You are tasked with generating an image prompt based on the given content. First, analyze the token concept to determine the most fitting artistic style.

Content to analyze:
<content>
${CONTENT}
</content>

A good image prompt consists of these elements:
1. Main subject
2. Detailed description
3. Artistic style (chosen based on token concept)
4. Lighting
5. Composition
6. Quality modifiers (colors, mood, etc.)

Steps to generate the prompt:
1. Analyze the token concept to determine:
   - Core theme (meme, utility, finance, etc.)
   - Target audience
   - Brand personality
   - Market positioning

2. Choose an appropriate artistic style that:
   - Matches the token's purpose
   - Appeals to the target audience
   - Stands out in the crypto space
   - Creates memorable branding

3. Create a detailed scene that:
   - Captures the token's essence
   - Works well as a token logo
   - Scales well at different sizes
   - Remains clear and distinctive

Construct your prompt using:
1. Main subject: Clear focal point
2. Environment: Supporting elements
3. Lighting: Enhances mood
4. Colors: Brand-appropriate palette
5. Mood: Matches token purpose
6. Composition: Works as token logo
7. Style: Chosen based on analysis

Keep the final prompt under 50 words while maintaining impact and clarity. Write only the prompt, nothing else.`;

    return await generateText({
        runtime,
        context: IMAGE_PROMPT_INPUT,
        modelClass: ModelClass.MEDIUM,
        customSystemPrompt: IMAGE_SYSTEM_PROMPT,
    });
}

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
