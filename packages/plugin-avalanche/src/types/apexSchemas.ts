import { z } from "zod";
import { BurstDEXs } from "./enums";
import { elizaLogger } from "@elizaos/core";

export const burstTokenSchema = z.object({
    name: z.string().optional().describe("The name of the token"),
    symbol: z.string().optional().describe("The symbol/ticker of the token"),
    totalSupply: z
        .number()
        .optional()
        .describe("The total supply of the token"),
    imageDescription: z
        .string()
        .optional()
        .describe("The description of the image for the token"),
    // image: z.string().optional().describe("The image URI of the token"),
    // banner: z.string().optional().describe("The banner URI of the token"),
    // swapSound: z
    //     .string()
    //     .optional()
    //     .describe("The swap sound URI of the token"),
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
        .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid EVM address format")
        .optional(),
    website: z.string().optional().describe("The website of the token"),
    twitter: z.string().optional().describe("The twitter of the token"),
    telegram: z.string().optional().describe("The telegram of the token"),
    discord: z.string().optional().describe("The discord of the token"),
});
