import { z } from "zod";
import { BurstDEXs } from "./enums";

export const burstSchema = z.object({
    name: z.string().describe("The name of the token"),
    symbol: z.string().describe("The symbol/ticker of the token"),
    totalSupply: z
        .number()
        .min(1, { message: "Total supply must be greater than 0" })
        .default(1000000000) // 1 billion
        .describe("The total supply of tokens (must be greater than 0)"),
    tradingFee: z
        .number()
        .default(0)
        .describe("The trading fee percentage (default: 0, range 0-500)"),
    maxWalletPercent: z
        .number()
        .min(0, {
            message: "Max wallet percentage must be between 0 and 10000",
        })
        .max(10000, {
            message: "Max wallet percentage must be between 0 and 10000",
        })
        .default(0)
        .describe(
            "The maximum wallet percentage (default: 0, range 0-10000, 0-100%, 0 means no limit)"
        ),
    metadataURI: z
        .string()
        .default("")
        .describe(
            "The metadata URI for the token. Defaults to empty string. Needs to be an IPFS URI with a JSON file that matches the format found at https://ipfs.io/ipfs/bafkreidixobg2hy7zx7ufmb446fgu6pauexw5jye76ow37txjsxgp5vase."
        ),
    curveIndex: z
        .number()
        .min(1, { message: "Curve index must be between 1 and 120" })
        .max(120, { message: "Curve index must be between 1 and 120" })
        .default(37)
        .describe("The curve index for the token (default: 37, range 1-120)"),
    salt: z
        .string()
        .default(
            "0x0000000000000000000000000000000000000000000000000000000000000000"
        )
        .describe(
            `The salt for the token (default: ${0x0000000000000000000000000000000000000000000000000000000000000000})`
        ),
    dexAllocations: z
        .array(
            z.object({
                dex: z.nativeEnum(BurstDEXs).describe("The DEX to allocate to"),
                isReward: z.boolean().describe("Whether this DEX gets rewards"),
                allocation: z
                    .number()
                    .describe("The allocation weight (must sum to 10000)"),
            })
        )
        .default([
            { dex: BurstDEXs.APEX, isReward: true, allocation: 10000 },
            { dex: BurstDEXs.JOE, isReward: false, allocation: 0 },
            { dex: BurstDEXs.PHARAOH, isReward: false, allocation: 0 },
            { dex: BurstDEXs.PANGOLIN, isReward: false, allocation: 0 },
        ])
        .describe("The DEX allocations"),
    creator: z
        .string()
        .describe("The creator address of the token. Format: 0x..."),
});
