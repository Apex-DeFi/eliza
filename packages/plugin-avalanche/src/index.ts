import { Plugin } from "@elizaos/core";
import transfer from "./actions/transfer";
import yakSwap from "./actions/yakSwap";
import yakStrategy from "./actions/yakStrategy";
import { tokensProvider } from "./providers/tokens";
import { strategiesProvider } from "./providers/strategies";
import { walletProvider } from "./providers/wallet";
import {
    TOKEN_ADDRESSES,
    STRATEGY_ADDRESSES,
    YAK_SWAP_CONFIG,
    TOKEN_MILL_CONFIG,
    APEX_CONFIG,
} from "./utils/constants";
import { apexGetBurstTokenDataEvaluator } from "./evaluators/apexGetBurstTokenData";
import { apexCreateBurstTokenProvider } from "./providers/apexCreateBurstToken";
// import { apexConfirmBurstTokenEvaluator } from "./evaluators/apexConfirmBurstToken";
import apexCreateBurstToken from "./actions/apexCreateBurstToken";

export const PROVIDER_CONFIG = {
    TOKEN_ADDRESSES: TOKEN_ADDRESSES,
    STRATEGY_ADDRESSES: STRATEGY_ADDRESSES,
    YAK_SWAP_CONFIG: YAK_SWAP_CONFIG,
    TOKEN_MILL_CONFIG: TOKEN_MILL_CONFIG,
    APEX_CONFIG: APEX_CONFIG,
};

export const avalanchePlugin: Plugin = {
    name: "avalanche",
    description: "Avalanche Plugin for Eliza",
    actions: [transfer, yakSwap, yakStrategy, apexCreateBurstToken],
    evaluators: [
        apexGetBurstTokenDataEvaluator,
        // apexConfirmBurstTokenEvaluator,
    ],
    providers: [
        tokensProvider,
        strategiesProvider,
        walletProvider,
        apexCreateBurstTokenProvider,
    ],
};

export default avalanchePlugin;
