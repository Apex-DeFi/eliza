import { getAccount, getPublicClient, getWalletClient } from "./index";
import { APEX_CONFIG } from "./constants";
import { IAgentRuntime, elizaLogger } from "@elizaos/core";
import {
    Address,
    isAddress,
    parseEther,
    parseEventLogs,
    zeroAddress,
} from "viem";
import { burstFactoryAbi } from "../abi";
import { ApexCreateBurstTokenData } from "../types/apex";
import { getMissingRequiredFields } from "../providers/apexCreateBurstToken";

export const createApexBurstToken = async (
    runtime: IAgentRuntime,
    apexBurstTokenData: ApexCreateBurstTokenData,
    metadataUrl: string
) => {
    const account = getAccount(runtime);
    const publicClient = getPublicClient(runtime);
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
    const curveIndex = 37;

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
        address: APEX_CONFIG.burstFactory as Address,
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
