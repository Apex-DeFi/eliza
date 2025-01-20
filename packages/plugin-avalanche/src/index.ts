import { Plugin } from "@elizaos/core";
import { walletProvider } from "./providers/wallet";
import {
    TOKEN_ADDRESSES,
    STRATEGY_ADDRESSES,
    YAK_SWAP_CONFIG,
    TOKEN_MILL_CONFIG,
    APEX_CONFIG,
} from "./utils/constants";
import apexCreateToken from "./actions/apexCreateToken";
// import { apexGetBurstTokenDataEvaluator } from "./evaluators/apexGetBurstTokenData";
// import { apexCreateBurstTokenProvider } from "./providers/apexCreateBurstToken";
// import { apexConfirmBurstTokenEvaluator } from "./evaluators/apexConfirmBurstToken";
// import apexCreateBurstToken from "./actions/apexCreateBurstToken";

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
    actions: [apexCreateToken],
    evaluators: [
        // apexGetBurstTokenDataEvaluator,
        // apexConfirmBurstTokenEvaluator,
    ],
    providers: [
        walletProvider,
        // apexCreateBurstTokenProvider,
    ],
};

export default avalanchePlugin;
