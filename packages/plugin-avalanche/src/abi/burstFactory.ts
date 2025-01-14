export const burstFactoryAbi = [
    {
        inputs: [],
        name: "AccessControlBadConfirmation",
        type: "error",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "account",
                type: "address",
            },
            {
                internalType: "bytes32",
                name: "neededRole",
                type: "bytes32",
            },
        ],
        name: "AccessControlUnauthorizedAccount",
        type: "error",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "target",
                type: "address",
            },
        ],
        name: "AddressEmptyCode",
        type: "error",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "account",
                type: "address",
            },
        ],
        name: "AddressInsufficientBalance",
        type: "error",
    },
    {
        inputs: [],
        name: "AlreadyLaunched",
        type: "error",
    },
    {
        inputs: [],
        name: "CreatorRewardsTooHigh",
        type: "error",
    },
    {
        inputs: [],
        name: "CurveAlreadyInUse",
        type: "error",
    },
    {
        inputs: [],
        name: "CurveDoesNotExist",
        type: "error",
    },
    {
        inputs: [
            {
                internalType: "uint8",
                name: "index",
                type: "uint8",
            },
        ],
        name: "CurveStyleDoesNotExist",
        type: "error",
    },
    {
        inputs: [],
        name: "DivisionByZero",
        type: "error",
    },
    {
        inputs: [],
        name: "ERC1167FailedCreateClone",
        type: "error",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "implementation",
                type: "address",
            },
        ],
        name: "ERC1967InvalidImplementation",
        type: "error",
    },
    {
        inputs: [],
        name: "ERC1967NonPayable",
        type: "error",
    },
    {
        inputs: [],
        name: "EnforcedPause",
        type: "error",
    },
    {
        inputs: [],
        name: "ExpectedPause",
        type: "error",
    },
    {
        inputs: [],
        name: "FailedInnerCall",
        type: "error",
    },
    {
        inputs: [],
        name: "FailedToSendNativeCurrency",
        type: "error",
    },
    {
        inputs: [],
        name: "FractionTooHigh",
        type: "error",
    },
    {
        inputs: [],
        name: "FractionTooLow",
        type: "error",
    },
    {
        inputs: [],
        name: "InvalidAddress",
        type: "error",
    },
    {
        inputs: [],
        name: "InvalidAllocations",
        type: "error",
    },
    {
        inputs: [],
        name: "InvalidAmount",
        type: "error",
    },
    {
        inputs: [],
        name: "InvalidApexAllocation",
        type: "error",
    },
    {
        inputs: [],
        name: "InvalidBin",
        type: "error",
    },
    {
        inputs: [],
        name: "InvalidFeeRate",
        type: "error",
    },
    {
        inputs: [],
        name: "InvalidInitialization",
        type: "error",
    },
    {
        inputs: [],
        name: "InvalidTotalDistribution",
        type: "error",
    },
    {
        inputs: [],
        name: "LaunchFeeTooHigh",
        type: "error",
    },
    {
        inputs: [],
        name: "NotEnoughFunds",
        type: "error",
    },
    {
        inputs: [],
        name: "NotInitializing",
        type: "error",
    },
    {
        inputs: [],
        name: "ReentrancyGuardReentrantCall",
        type: "error",
    },
    {
        inputs: [],
        name: "RewardDexAlreadySet",
        type: "error",
    },
    {
        inputs: [],
        name: "RewardDexNotSet",
        type: "error",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "token",
                type: "address",
            },
        ],
        name: "SafeERC20FailedOperation",
        type: "error",
    },
    {
        inputs: [],
        name: "SlippageLimit",
        type: "error",
    },
    {
        inputs: [],
        name: "TokenDoesNotExist",
        type: "error",
    },
    {
        inputs: [],
        name: "TooMuchFunds",
        type: "error",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "totalSupply",
                type: "uint256",
            },
        ],
        name: "TotalSupplyTooLow",
        type: "error",
    },
    {
        inputs: [],
        name: "UUPSUnauthorizedCallContext",
        type: "error",
    },
    {
        inputs: [
            {
                internalType: "bytes32",
                name: "slot",
                type: "bytes32",
            },
        ],
        name: "UUPSUnsupportedProxiableUUID",
        type: "error",
    },
    {
        inputs: [],
        name: "UnauthorizedOnlyCreator",
        type: "error",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "address",
                name: "token",
                type: "address",
            },
            {
                indexed: true,
                internalType: "address",
                name: "sender",
                type: "address",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "amount0In",
                type: "uint256",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "amount0Out",
                type: "uint256",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "amount1In",
                type: "uint256",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "amount1Out",
                type: "uint256",
            },
        ],
        name: "BurstSwap",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "address",
                name: "token0",
                type: "address",
            },
            {
                indexed: true,
                internalType: "address",
                name: "dist",
                type: "address",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "launchFee",
                type: "uint256",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "creatorRewards",
                type: "uint256",
            },
        ],
        name: "CurveCompleted",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "uint256",
                name: "curveIndex",
                type: "uint256",
            },
        ],
        name: "CurveCreated",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "uint64",
                name: "version",
                type: "uint64",
            },
        ],
        name: "Initialized",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "address",
                name: "token",
                type: "address",
            },
            {
                indexed: true,
                internalType: "address",
                name: "pair",
                type: "address",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "amountToken",
                type: "uint256",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "amountAVAX",
                type: "uint256",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "amountLP",
                type: "uint256",
            },
        ],
        name: "LiquidityAdded",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "address",
                name: "account",
                type: "address",
            },
        ],
        name: "Paused",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "bytes32",
                name: "role",
                type: "bytes32",
            },
            {
                indexed: true,
                internalType: "bytes32",
                name: "previousAdminRole",
                type: "bytes32",
            },
            {
                indexed: true,
                internalType: "bytes32",
                name: "newAdminRole",
                type: "bytes32",
            },
        ],
        name: "RoleAdminChanged",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "bytes32",
                name: "role",
                type: "bytes32",
            },
            {
                indexed: true,
                internalType: "address",
                name: "account",
                type: "address",
            },
            {
                indexed: true,
                internalType: "address",
                name: "sender",
                type: "address",
            },
        ],
        name: "RoleGranted",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "bytes32",
                name: "role",
                type: "bytes32",
            },
            {
                indexed: true,
                internalType: "address",
                name: "account",
                type: "address",
            },
            {
                indexed: true,
                internalType: "address",
                name: "sender",
                type: "address",
            },
        ],
        name: "RoleRevoked",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "address",
                name: "token",
                type: "address",
            },
            {
                indexed: true,
                internalType: "address",
                name: "creator",
                type: "address",
            },
            {
                indexed: false,
                internalType: "bool",
                name: "whitelistEnabled",
                type: "bool",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "curveIndex",
                type: "uint256",
            },
        ],
        name: "TokenCreated",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "address",
                name: "account",
                type: "address",
            },
        ],
        name: "Unpaused",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "address",
                name: "implementation",
                type: "address",
            },
        ],
        name: "Upgraded",
        type: "event",
    },
    {
        inputs: [],
        name: "BASIS_POINTS",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "DEAD_ADDRESS",
        outputs: [
            {
                internalType: "address",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "DEFAULT_ADMIN_ROLE",
        outputs: [
            {
                internalType: "bytes32",
                name: "",
                type: "bytes32",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "JOE_ROUTER",
        outputs: [
            {
                internalType: "address",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "MANAGER_ROLE",
        outputs: [
            {
                internalType: "bytes32",
                name: "",
                type: "bytes32",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "MAX_CREATOR_REWARDS",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "MAX_LAUNCH_FEE",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "PANGOLIN_ROUTER",
        outputs: [
            {
                internalType: "address",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "PHARAOH_ROUTER",
        outputs: [
            {
                internalType: "address",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "UPGRADER_ROLE",
        outputs: [
            {
                internalType: "bytes32",
                name: "",
                type: "bytes32",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "UPGRADE_INTERFACE_VERSION",
        outputs: [
            {
                internalType: "string",
                name: "",
                type: "string",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint8",
                name: "index",
                type: "uint8",
            },
            {
                internalType: "uint256[]",
                name: "curveStyle",
                type: "uint256[]",
            },
        ],
        name: "addCurveStyle",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        name: "allCurves",
        outputs: [
            {
                internalType: "uint8",
                name: "",
                type: "uint8",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        name: "allTokens",
        outputs: [
            {
                internalType: "address",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "allTokensLength",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "bifknChef",
        outputs: [
            {
                internalType: "contract IBIFKNChefV2",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "bifknFactory",
        outputs: [
            {
                internalType: "contract IBIFKN314FactoryV2",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "burstAllocation",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "string",
                name: "tokenName",
                type: "string",
            },
            {
                internalType: "string",
                name: "tokenSymbol",
                type: "string",
            },
            {
                internalType: "uint256",
                name: "totalSupply_",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "tradingFee",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "maxWalletPercent_",
                type: "uint256",
            },
            {
                internalType: "string",
                name: "metadataURI",
                type: "string",
            },
            {
                internalType: "uint8",
                name: "curveIndex_",
                type: "uint8",
            },
            {
                internalType: "bytes32",
                name: "salt",
                type: "bytes32",
            },
            {
                components: [
                    {
                        internalType: "enum DexTypes.DEX",
                        name: "dex",
                        type: "uint8",
                    },
                    {
                        internalType: "bool",
                        name: "isReward",
                        type: "bool",
                    },
                    {
                        internalType: "uint256",
                        name: "allocation",
                        type: "uint256",
                    },
                ],
                internalType: "struct DexTypes.DexAllocation[]",
                name: "dexAllocations",
                type: "tuple[]",
            },
        ],
        name: "burstToken",
        outputs: [
            {
                internalType: "address",
                name: "burstAddress",
                type: "address",
            },
        ],
        stateMutability: "payable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "string",
                name: "tokenName",
                type: "string",
            },
            {
                internalType: "string",
                name: "tokenSymbol",
                type: "string",
            },
            {
                internalType: "uint256",
                name: "totalSupply_",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "tradingFee",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "maxWalletPercent_",
                type: "uint256",
            },
            {
                internalType: "string",
                name: "metadataURI",
                type: "string",
            },
            {
                internalType: "uint8",
                name: "curveIndex_",
                type: "uint8",
            },
            {
                internalType: "bytes32",
                name: "salt",
                type: "bytes32",
            },
            {
                components: [
                    {
                        internalType: "enum DexTypes.DEX",
                        name: "dex",
                        type: "uint8",
                    },
                    {
                        internalType: "bool",
                        name: "isReward",
                        type: "bool",
                    },
                    {
                        internalType: "uint256",
                        name: "allocation",
                        type: "uint256",
                    },
                ],
                internalType: "struct DexTypes.DexAllocation[]",
                name: "dexAllocations",
                type: "tuple[]",
            },
            {
                internalType: "address",
                name: "creator",
                type: "address",
            },
        ],
        name: "burstTokenWithCreator",
        outputs: [
            {
                internalType: "address",
                name: "burstAddress",
                type: "address",
            },
        ],
        stateMutability: "payable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "token_",
                type: "address",
            },
            {
                internalType: "uint8",
                name: "minBin",
                type: "uint8",
            },
        ],
        name: "buy",
        outputs: [],
        stateMutability: "payable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint8",
                name: "curveIndex",
                type: "uint8",
            },
            {
                internalType: "uint8",
                name: "curveStyleIndex",
                type: "uint8",
            },
            {
                internalType: "uint256",
                name: "basePriceInAVAX",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "incrementFactor",
                type: "uint256",
            },
        ],
        name: "createCurve",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [],
        name: "creatorFeeRate",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "creatorRewards",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint8",
                name: "",
                type: "uint8",
            },
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        name: "curveStyles",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint8",
                name: "",
                type: "uint8",
            },
        ],
        name: "curves",
        outputs: [
            {
                internalType: "uint256",
                name: "percentOfLP",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "avaxAtLaunch",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "basePrice",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint8",
                name: "",
                type: "uint8",
            },
        ],
        name: "curvesV2",
        outputs: [
            {
                internalType: "uint8",
                name: "curveStyle",
                type: "uint8",
            },
            {
                internalType: "uint256",
                name: "percentOfLP",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "avaxAtLaunch",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "basePrice",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "distributorImplementation",
        outputs: [
            {
                internalType: "address",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "epochsToWithdraw",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "feeRate",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "feeTo",
        outputs: [
            {
                internalType: "address",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "feeToSetter",
        outputs: [
            {
                internalType: "address",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "getAllCurves",
        outputs: [
            {
                components: [
                    {
                        internalType: "uint8",
                        name: "index",
                        type: "uint8",
                    },
                    {
                        internalType: "uint256[]",
                        name: "distribution",
                        type: "uint256[]",
                    },
                    {
                        components: [
                            {
                                internalType: "uint8",
                                name: "curveStyle",
                                type: "uint8",
                            },
                            {
                                internalType: "uint256[]",
                                name: "binStepScaleFactor",
                                type: "uint256[]",
                            },
                            {
                                internalType: "uint256",
                                name: "percentOfLP",
                                type: "uint256",
                            },
                            {
                                internalType: "uint256",
                                name: "avaxAtLaunch",
                                type: "uint256",
                            },
                            {
                                internalType: "uint256",
                                name: "basePrice",
                                type: "uint256",
                            },
                        ],
                        internalType: "struct BurstFactoryV6.CurveV2",
                        name: "curveData",
                        type: "tuple",
                    },
                ],
                internalType: "struct BurstFactoryV6.CurveWithIndex[]",
                name: "",
                type: "tuple[]",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "getAllTokens",
        outputs: [
            {
                internalType: "address[]",
                name: "",
                type: "address[]",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "token_",
                type: "address",
            },
        ],
        name: "getBinDetails",
        outputs: [
            {
                internalType: "uint256[]",
                name: "binTokens",
                type: "uint256[]",
            },
            {
                internalType: "uint256[]",
                name: "binAVAX",
                type: "uint256[]",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint8",
                name: "index",
                type: "uint8",
            },
        ],
        name: "getCurve",
        outputs: [
            {
                internalType: "uint256[]",
                name: "distribution",
                type: "uint256[]",
            },
            {
                internalType: "uint256[]",
                name: "binStepScaleFactor",
                type: "uint256[]",
            },
            {
                internalType: "uint256",
                name: "percentOfLP",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "avaxAtLaunch",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "basePrice",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint8",
                name: "index",
                type: "uint8",
            },
        ],
        name: "getCurveStyle",
        outputs: [
            {
                internalType: "uint256[]",
                name: "",
                type: "uint256[]",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "bytes32",
                name: "role",
                type: "bytes32",
            },
        ],
        name: "getRoleAdmin",
        outputs: [
            {
                internalType: "bytes32",
                name: "",
                type: "bytes32",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "tokenAddress",
                type: "address",
            },
        ],
        name: "getToken",
        outputs: [
            {
                internalType: "address",
                name: "creator",
                type: "address",
            },
            {
                internalType: "uint8",
                name: "curveIndex",
                type: "uint8",
            },
            {
                internalType: "uint256",
                name: "currentIndex",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "currentValue",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "initialSupply",
                type: "uint256",
            },
            {
                internalType: "bool",
                name: "hasLaunched",
                type: "bool",
            },
            {
                internalType: "uint256",
                name: "launchTime",
                type: "uint256",
            },
            {
                components: [
                    {
                        internalType: "enum DexTypes.DEX",
                        name: "dex",
                        type: "uint8",
                    },
                    {
                        internalType: "bool",
                        name: "isReward",
                        type: "bool",
                    },
                    {
                        internalType: "uint256",
                        name: "allocation",
                        type: "uint256",
                    },
                ],
                internalType: "struct DexTypes.DexAllocation[]",
                name: "dexAllocations",
                type: "tuple[]",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "bytes32",
                name: "role",
                type: "bytes32",
            },
            {
                internalType: "address",
                name: "account",
                type: "address",
            },
        ],
        name: "grantRole",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "bytes32",
                name: "role",
                type: "bytes32",
            },
            {
                internalType: "address",
                name: "account",
                type: "address",
            },
        ],
        name: "hasRole",
        outputs: [
            {
                internalType: "bool",
                name: "",
                type: "bool",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "joeAllocation",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "launchFee",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "launchFeeTo",
        outputs: [
            {
                internalType: "address",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "maxBuyAmount",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "minApexAllocation",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "minBuyAmount",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "pangolinAllocation",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "pause",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [],
        name: "paused",
        outputs: [
            {
                internalType: "bool",
                name: "",
                type: "bool",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "percentDistributedPerEpoch",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "pharaohAllocation",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "proxiableUUID",
        outputs: [
            {
                internalType: "bytes32",
                name: "",
                type: "bytes32",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "bytes32",
                name: "role",
                type: "bytes32",
            },
            {
                internalType: "address",
                name: "callerConfirmation",
                type: "address",
            },
        ],
        name: "renounceRole",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "bytes32",
                name: "role",
                type: "bytes32",
            },
            {
                internalType: "address",
                name: "account",
                type: "address",
            },
        ],
        name: "revokeRole",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "contract IERC20",
                name: "token_",
                type: "address",
            },
            {
                internalType: "uint256",
                name: "amount0In",
                type: "uint256",
            },
            {
                internalType: "uint8",
                name: "minBin",
                type: "uint8",
            },
        ],
        name: "sell",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "distributor",
                type: "address",
            },
        ],
        name: "setDistributorImplementation",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "epochsToWithdraw_",
                type: "uint256",
            },
        ],
        name: "setEpochsToWithdraw",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "feeRate_",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "creatorFeeRate_",
                type: "uint256",
            },
        ],
        name: "setFeeRates",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "feeTo_",
                type: "address",
            },
            {
                internalType: "address",
                name: "launchFeeTo_",
                type: "address",
            },
        ],
        name: "setFeeTos",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "launchFee_",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "creatorRewards_",
                type: "uint256",
            },
        ],
        name: "setLaunchFeeAndCreatorRewards",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "token_",
                type: "address",
            },
            {
                internalType: "uint256",
                name: "maxWalletPercent_",
                type: "uint256",
            },
        ],
        name: "setMaxWalletPercent",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "token_",
                type: "address",
            },
            {
                internalType: "string",
                name: "newURI_",
                type: "string",
            },
        ],
        name: "setMetadataURI",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "minApexAllocation_",
                type: "uint256",
            },
        ],
        name: "setMinApexAllocation",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "minBuyAmount_",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "maxBuyAmount_",
                type: "uint256",
            },
        ],
        name: "setMinMaxBuyAmounts",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "token_",
                type: "address",
            },
            {
                components: [
                    {
                        internalType: "enum DexTypes.DEX",
                        name: "dex",
                        type: "uint8",
                    },
                    {
                        internalType: "bool",
                        name: "isReward",
                        type: "bool",
                    },
                    {
                        internalType: "uint256",
                        name: "allocation",
                        type: "uint256",
                    },
                ],
                internalType: "struct DexTypes.DexAllocation[]",
                name: "dexAllocations",
                type: "tuple[]",
            },
        ],
        name: "setTokenDexAllocations",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "bytes4",
                name: "interfaceId",
                type: "bytes4",
            },
        ],
        name: "supportsInterface",
        outputs: [
            {
                internalType: "bool",
                name: "",
                type: "bool",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "",
                type: "address",
            },
        ],
        name: "tokenToNursery",
        outputs: [
            {
                internalType: "address",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "",
                type: "address",
            },
        ],
        name: "tokens",
        outputs: [
            {
                internalType: "address",
                name: "creator",
                type: "address",
            },
            {
                internalType: "uint8",
                name: "curveIndex",
                type: "uint8",
            },
            {
                internalType: "uint256",
                name: "currentIndex",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "currentValue",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "initialSupply",
                type: "uint256",
            },
            {
                internalType: "bool",
                name: "hasLaunched",
                type: "bool",
            },
            {
                internalType: "uint256",
                name: "launchTime",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "unpause",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "newImplementation",
                type: "address",
            },
            {
                internalType: "bytes",
                name: "data",
                type: "bytes",
            },
        ],
        name: "upgradeToAndCall",
        outputs: [],
        stateMutability: "payable",
        type: "function",
    },
] as const;
