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
    evaluators: [],
    providers: [walletProvider],
};

export default avalanchePlugin;
