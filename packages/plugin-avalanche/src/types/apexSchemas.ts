import { z } from "zod";
import { BurstDEXs } from "./enums";
import { elizaLogger } from "@elizaos/core";

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
                dex: z
                    .nativeEnum(BurstDEXs)
                    .or(z.string())
                    .transform((val) => {
                        if (typeof val === "number") return val;
                        const enumVal =
                            BurstDEXs[val as keyof typeof BurstDEXs];
                        if (enumVal === undefined) {
                            throw new Error(
                                `Invalid DEX value: ${val}. Must be one of: ${Object.keys(
                                    BurstDEXs
                                )
                                    .filter((k) => isNaN(Number(k)))
                                    .join(", ")}`
                            );
                        }
                        return enumVal;
                    })
                    .describe("The DEX to allocate to"),
                allocation: z
                    .number()
                    .describe("The allocation weight (must sum to 10000)"),
            })
        )
        .default([
            { dex: BurstDEXs.APEX, allocation: 10000 },
            { dex: BurstDEXs.JOE, allocation: 0 },
            { dex: BurstDEXs.PHARAOH, allocation: 0 },
            { dex: BurstDEXs.PANGOLIN, allocation: 0 },
        ])
        .describe("The DEX allocations"),
    creator: z
        .string()
        .describe("The creator address of the token. Format: 0x..."),
});

export const burstTokenSchema = z.object({
    name: z.string().optional().describe("The name of the token"),
    symbol: z.string().optional().describe("The symbol/ticker of the token"),
    totalSupply: z
        .number()
        .optional()
        .describe("The total supply of the token"),
    imageURI: z.string().optional().describe("The image URI of the token"),
    bannerURI: z.string().optional().describe("The banner URI of the token"),
    swapSoundURI: z
        .string()
        .optional()
        .describe("The swap sound URI of the token"),
    description: z.string().optional().describe("The description of the token"),
    tradingFee: z
        .number()
        .min(0, { message: "Trading fee cannot be negative" })
        .max(500, {
            message: "Trading fee must be less than 500 basis points (5%)",
        })
        .optional()
        .describe(
            "The trading fee of the token in basis points (e.g. 250 for 2.5%, max 500, 0 means no fee)"
        ),
    maxWalletPercent: z
        .number()
        .min(0, { message: "Max wallet percentage cannot be negative" })
        .max(10000, {
            message:
                "Max wallet percentage must be less than or equal to 10000 basis points (100%)",
        })
        .optional()
        .describe(
            "The max wallet percent of the token in basis points (e.g. 250 for 2.5%, max 10000, 0 means no limit)"
        ),
    burstAmount: z
        .number()
        .optional()
        .describe("The burst amount of the token"),
    dexAllocations: z
        .array(
            z
                .object({
                    dex: z
                        .nativeEnum(BurstDEXs)
                        .or(z.string())
                        .transform((val) => {
                            if (typeof val === "number") return val;
                            const enumVal =
                                BurstDEXs[
                                    val.toUpperCase() as keyof typeof BurstDEXs
                                ];
                            if (enumVal === undefined) {
                                elizaLogger.warn(
                                    `Invalid DEX value provided: ${val}`
                                );
                                return undefined;
                            }
                            return enumVal;
                        }),
                    allocation: z.number().min(0).max(10000),
                })
                .optional()
        )
        .optional()
        .describe("The DEX allocations"),
    rewardDex: z
        .nativeEnum(BurstDEXs)
        .or(z.string())
        .transform((val) => {
            if (typeof val === "number") return val;
            const enumVal =
                BurstDEXs[val.toUpperCase() as keyof typeof BurstDEXs];
            if (enumVal === undefined) {
                elizaLogger.warn(`Invalid DEX value provided: ${val}`);
                return undefined;
            }
            return enumVal;
        })
        .optional()
        .describe("The reward DEX of the token"),
    creatorAddress: z
        .string()
        .optional()
        .describe("The creator address of the token"),
    website: z.string().optional().describe("The website of the token"),
    twitter: z.string().optional().describe("The twitter of the token"),
    telegram: z.string().optional().describe("The telegram of the token"),
    discord: z.string().optional().describe("The discord of the token"),
});
