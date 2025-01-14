import { getAccount, getPublicClient, getWalletClient } from "./index";
import { APEX_CONFIG } from "./constants";
import { IAgentRuntime, elizaLogger } from "@elizaos/core";
import { DexAllocation } from "../types";
import { Address, isHex, parseEther, parseEventLogs, zeroAddress } from "viem";
import { burstFactoryAbi } from "../abi";

export const createApexBurstToken = async (
    runtime: IAgentRuntime,
    name: string,
    symbol: string,
    totalSupply: number,
    tradingFee: number,
    maxWalletPercent: number,
    metadataURI: string,
    curveIndex: number,
    salt: string,
    dexAllocations: DexAllocation[],
    creator: Address
) => {
    const account = getAccount(runtime);
    const publicClient = getPublicClient(runtime);

    if (name.length == 0) {
        throw new Error("Name must be provided");
    }

    if (name.length > 50) {
        throw new Error("Name must be less than 12 characters");
    }

    if (symbol.length == 0) {
        throw new Error("Symbol must be provided");
    }

    if (symbol.length > 10) {
        throw new Error("Symbol must be less than 8 characters");
    }

    if (creator === zeroAddress) {
        creator = account.address;
    }

    if (totalSupply > 0 && parseEther(totalSupply.toString()) === 0n) {
        throw new Error("Supply must be greater than 0");
    }

    if (tradingFee < 0 || tradingFee > 500) {
        throw new Error("Trading fee must be between 0 and 500");
    }

    if (maxWalletPercent < 0 || maxWalletPercent > 10000) {
        throw new Error("Max wallet percent must be between 0 and 10000");
    }

    if (salt.length === 0) {
        salt =
            "0x0000000000000000000000000000000000000000000000000000000000000000";
    } else {
        // Verify that the salt is a valid hex value and of bytes32
        if (!isHex(salt) || salt.length !== 66) {
            throw new Error("Salt must be a valid hex value of bytes32");
        }
    }

    // verify that dexAllocations is not empty and that the sum of allocations is 10000
    // also verify that only 1 dex is marked as a reward
    if (dexAllocations.length === 0) {
        throw new Error("Dex allocations must be provided");
    } else {
        let totalAllocation = 0;
        let rewardCount = 0;
        for (let i = 0; i < dexAllocations.length; i++) {
            totalAllocation += dexAllocations[i].allocation;
            if (dexAllocations[i].isReward === true) {
                rewardCount++;
            }
        }
        if (totalAllocation !== 10000) {
            throw new Error("Dex allocations must sum to 10000");
        }
        if (rewardCount !== 1) {
            throw new Error("Only 1 dex can be marked as a reward");
        }
    }

    const dexAllocationParams = dexAllocations.map((alloc) => ({
        dex: alloc.dex,
        isReward: alloc.isReward,
        allocation: BigInt(alloc.allocation),
    }));

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
        name,
        symbol,
        parseEther(totalSupply.toString()),
        BigInt(tradingFee),
        BigInt(maxWalletPercent),
        metadataURI,
        curveIndex,
        salt as `0x${string}`,
        dexAllocationParams,
        creator,
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
        tx: zeroAddress,
        tokenAddress: tokenAddress,
    };
};
