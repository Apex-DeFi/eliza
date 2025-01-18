export const getConfirmationTemplate = (text: string) => {
    return `
Analyze if the user is confirming or cancelling a token creation.

Confirmation indicators:
    - Explicit: "yes", "confirm", "launch", "create"
    - Implicit: "lets do it", "looks good", "ready to go"
    - Enthusiastic: "lets launch", "lets go"

Cancellation indicators:
    - Explicit: "no", "cancel", "stop"
    - Implicit: "need time", "not sure", "wait"
    - Hesitant: "maybe later", "let me think"

Conversation:
${text}

Return a JSON object with isConfirmed field set to true or false based on the analysis.

\`\`\`json
{
    "isConfirmed": boolean
}
\`\`\`
`;
};

export const getBurstTokenDataTemplate = (text: string) => {
    return `
Analyze the following conversation and extract the token details.
Only extract information when it is explicitly and clearly stated by the user about a token they want to create.

CRITICAL VALIDATION RULES:
1. Creator Address:
   - MUST be exactly 42 characters (0x + 40 hex characters)
   - MUST start with "0x"
   - MUST only contain hex characters (0-9, a-f, A-F)
   - Example valid: 0x742d35Cc6634C0532925a3b844Bc454e4438f44e
   - DO NOT include any address that doesn't meet ALL these criteria

2. Trading Fee:
   - MUST be between 0-5%
   - Examples: 2.5%, 4.1%, 5%
   - Can be null or undefined if not provided
   - DO NOT include if outside this range

3. Max Wallet:
   - MUST be between 0-100%
   - Examples: 2.5%, 90%, 100%
   - Can be null or undefined if not provided
   - DO NOT include if outside this range

4. Burst Amount:
   - MUST be a multiple of 5
   - Can be between 50 and 2000
   - Examples: 50, 55, 60, 65, ... 195, 200
   - Can be null or undefined if not provided
   - DO NOT include if not meeting these criteria

5. DEX Allocations:
   - ONLY valid DEXs: APEX, JOE, PHARAOH, PANGOLIN
   - Total allocation MUST equal 100%
   - DO NOT include invalid DEXs or incomplete allocations

6. Reward DEX:
   - ONLY valid DEXs: APEX, JOE, PHARAOH, PANGOLIN
   - Invalid DEXs: UNISWAP, SUSHI, etc.
   - Can be null or undefined if not provided
   - DO NOT include if not meeting these criteria

   7. totalSupply:
   - MUST be a positive number
   - Examples (User might say): 1000000, 1000000000, 1million, 1billion, 314 million
   - Can be null or undefined if not provided
   - DO NOT include if not meeting these criteria

IMPORTANT: If the user indicates they don't want to add any more information (e.g., "no more", "no extras", "skip", "no thanks", etc.) or they are confirming or cancelling the token creation (e.g., "yes", "confirm", "launch", "create", "let's do it", "I'm ready", "make it happen", "let's launch!", "proceed"), return an empty object {}. Do not fill in example values under any circumstances.

Conversation:
${text}

Return a JSON object containing only the fields where information was clearly found AND meets all validation rules:

\`\`\`json
{
    "name": string,
    "symbol": string,
    "totalSupply": number,
    "imageDescription": string,
    "description": string,
    "tradingFee": number,
    "maxWalletPercent": number,
    "burstAmount": number,
    "dexAllocations": [
        {
            "dex": string,
            "allocation": number
        }
    ],
    "rewardDex": string,
    "creatorAddress": string,
    "website": string,
    "twitter": string,
    "telegram": string,
    "discord": string
}
\`\`\`

Only include fields where the information is explicitly stated AND valid according to the rules above.
Omit any fields that don't meet the validation criteria or are unclear/hypothetical.
If the user is confirming or cancelling the token creation, return an empty object {}.`;
};
