import { z } from "zod";
import { BurstDEXs } from "./enums";
import { elizaLogger } from "@elizaos/core";

export const burstTokenSchema = z
    .object({
        name: z
            .preprocess(
                (val) =>
                    val === null || val === undefined || val === ""
                        ? undefined
                        : val,
                z.string().optional()
            )
            .describe("The name of the token"),
        symbol: z
            .preprocess(
                (val) =>
                    val === null || val === undefined || val === ""
                        ? undefined
                        : val,
                z.string().optional()
            )
            .describe("The symbol/ticker of the token"),
        totalSupply: z
            .preprocess(
                (val) =>
                    val === null || val === undefined ? undefined : Number(val),
                z.number().optional()
            )
            .describe("The total supply of the token"),
        description: z
            .preprocess(
                (val) =>
                    val === null || val === undefined || val === ""
                        ? undefined
                        : val,
                z.string().optional()
            )
            .describe("The description of the token"),
        tradingFee: z
            .preprocess(
                (val) =>
                    val === null || val === undefined ? undefined : Number(val),
                z
                    .number()
                    .min(0, { message: "Trading fee cannot be negative" })
                    .max(500, {
                        message:
                            "Trading fee must be less than 500 basis points (5%)",
                    })
                    .optional()
            )
            .describe(
                "The trading fee of the token in basis points (e.g. 250 for 2.5%, max 500, 0 means no fee)"
            ),
        maxWalletPercent: z
            .preprocess(
                (val) =>
                    val === null || val === undefined ? undefined : Number(val),
                z
                    .number()
                    .min(0, {
                        message: "Max wallet percentage cannot be negative",
                    })
                    .max(10000, {
                        message:
                            "Max wallet percentage must be less than or equal to 10000 basis points (100%)",
                    })
                    .optional()
            )
            .describe(
                "The max wallet percent of the token in basis points (e.g. 250 for 2.5%, max 10000, 0 means no limit)"
            ),
        burstAmount: z
            .preprocess(
                (val) =>
                    val === null || val === undefined ? undefined : Number(val),
                z.number().optional()
            )
            .describe("The burst amount of the token"),
        dexAllocations: z
            .preprocess(
                (val) => {
                    if (val === null || val === undefined) return undefined;
                    if (Array.isArray(val) && val.length === 0)
                        return undefined;
                    return val;
                },
                z
                    .array(
                        z.object({
                            dex: z.preprocess((val) => {
                                if (val === null || val === undefined)
                                    return undefined;
                                if (typeof val === "number") return val;
                                if (typeof val !== "string") return undefined;
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
                            }, z.nativeEnum(BurstDEXs).optional()),
                            allocation: z.preprocess(
                                (val) =>
                                    val === null || val === undefined
                                        ? undefined
                                        : Number(val),
                                z.number().min(0).max(10000)
                            ),
                        })
                    )
                    .optional()
            )
            .describe("The DEX allocations"),
        rewardDex: z
            .preprocess((val) => {
                if (val === null || val === undefined) return undefined;
                if (typeof val === "number") return val;
                if (typeof val !== "string") return undefined;
                const enumVal =
                    BurstDEXs[val.toUpperCase() as keyof typeof BurstDEXs];
                if (enumVal === undefined) {
                    elizaLogger.warn(`Invalid DEX value provided: ${val}`);
                    return undefined;
                }
                return enumVal;
            }, z.nativeEnum(BurstDEXs).optional())
            .describe("The reward DEX of the token"),
        creatorAddress: z
            .preprocess((val) => {
                if (val === null || val === undefined || val === "")
                    return undefined;
                if (typeof val !== "string") return undefined;
                return val.match(/^0x[a-fA-F0-9]{40}$/) ? val : undefined;
            }, z.string().optional())
            .describe("The creator address of the token"),
        website: z
            .preprocess(
                (val) =>
                    val === null || val === undefined || val === ""
                        ? undefined
                        : val,
                z.string().optional()
            )
            .describe("The website of the token"),
        twitter: z
            .preprocess(
                (val) =>
                    val === null || val === undefined || val === ""
                        ? undefined
                        : val,
                z.string().optional()
            )
            .describe("The twitter of the token"),
        telegram: z
            .preprocess(
                (val) =>
                    val === null || val === undefined || val === ""
                        ? undefined
                        : val,
                z.string().optional()
            )
            .describe("The telegram of the token"),
        discord: z
            .preprocess(
                (val) =>
                    val === null || val === undefined || val === ""
                        ? undefined
                        : val,
                z.string().optional()
            )
            .describe("The discord of the token"),
    })
    .transform((data) => {
        // Remove all null, undefined, empty strings, and empty arrays
        return Object.fromEntries(
            Object.entries(data).filter(([_, v]) => {
                if (v === null || v === undefined) return false;
                if (typeof v === "string" && v === "") return false;
                if (Array.isArray(v) && v.length === 0) return false;
                return true;
            })
        );
    });
