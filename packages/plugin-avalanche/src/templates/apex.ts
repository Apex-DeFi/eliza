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

CRITICAL VALIDATION RULES:
MOST IMPORTANT: NEVER generate or insert ANY default, example, or placeholder values. ONLY extract information that was EXPLICITLY stated by the user in their message.

1. ZERO HALLUCINATION POLICY:
   - NEVER generate ANY default, example, or placeholder values
   - NEVER include fields unless they were EXPLICITLY mentioned in the user's message
   - NEVER infer or assume values
   - NEVER copy values from examples into the output
   - If unsure about a value, exclude it completely
   - Return {} if user is just asking questions or speaking hypothetically

2. EXTRACTION RULES:
   - Only extract information from the CURRENT message
   - Ignore all previous context or examples
   - If a field isn't explicitly stated, DO NOT include it
   - Return empty object {} for vague statements like "I want to create a token"
   - Verify that the extracted information meets ALL validation rules before storing it

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
   - Minimum: 50
   - Maximum: 2000
   - Examples: 50, 55, 60, 65, ... 195, 200
   - May or may not have 'AVAX' or 'Avax' at the end of the number
   - Can be null or undefined if not provided
   - DO NOT include if not meeting these criteria

5. DEX Allocations:
   - ONLY valid DEXs: APEX, JOE, PHARAOH, PANGOLIN
   - Total allocation MUST equal 100%
   - DO NOT include invalid DEXs or incomplete allocations

6. Reward DEX:
   - ONLY valid DEXs: APEX, JOE, PHARAOH, PANGOLIN
   - Invalid DEXs: UNISWAP, SUSHI, SushiSwap, Uniswap etc.
   - Can be null or undefined if not provided
   - DO NOT include if not meeting these criteria

7. totalSupply:
   - MUST be a positive number
   - Examples (User might say): 1000000, 1000000000, 1million, 1billion, 314 million
   - Can be null or undefined if not provided
   - DO NOT include if not meeting these criteria

BAD BEHAVIOR TO AVOID:
- DON'T include any fields not explicitly mentioned
- DON'T generate example or default values
- DON'T include social media unless specifically provided
- DON'T assume any allocations or amounts
- DON'T copy values from examples

Conversation:
${text}

Return a JSON object containing ONLY fields that were EXPLICITLY stated AND meet all validation rules:


\`\`\`json
{
    "name": string | undefined,
    "symbol": string | undefined,
    "totalSupply": number | undefined,
    "imageDescription": string | undefined,
    "description": string | undefined,
    "tradingFee": number | undefined,
    "maxWalletPercent": number | undefined,
    "burstAmount": number | undefined,
    "dexAllocations": [
        {
            "dex": string,
            "allocation": number
        }
    ] | undefined,
    "rewardDex": string | undefined,
    "creatorAddress": string | undefined,
    "website": string | undefined,
    "twitter": string | undefined,
    "telegram": string | undefined,
    "discord": string | undefined
}
\`\`\`

Only include fields where the information is explicitly stated AND valid according to the rules above.
Omit any fields that don't meet the validation criteria or are unclear/hypothetical.
If the user is confirming or cancelling the token creation, return an empty object {}.`;
};

export const apexCreateTokenTemplate = `
Given the recent messages below:
{{recentMessages}}

CRITICAL VALIDATION RULES:
MOST IMPORTANT: NEVER generate or insert ANY default, example, or placeholder values. ONLY extract information that was EXPLICITLY stated.

1. ZERO HALLUCINATION POLICY:
   - NEVER generate ANY default, example, or placeholder values
   - NEVER include fields unless they were EXPLICITLY mentioned in the user's message
   - NEVER infer or assume values
   - NEVER copy values from examples into the output
   - If unsure about a value, exclude it completely
   - Return {} if user is just asking questions or speaking hypothetically

2. EXTRACTION RULES:
   - Only extract information from the CURRENT message
   - Ignore all previous context or examples
   - If a field isn't explicitly stated, DO NOT include it
   - Return empty object {} for vague statements like "I want to create a token"
   - Verify that the extracted information meets ALL validation rules before storing it

1. Creator Address:
   - MUST be exactly 42 characters (0x + 40 hex characters)
   - MUST start with "0x"
   - MUST only contain hex characters (0-9, a-f, A-F)
   - Example valid: 0x742d35Cc6634C0532925a3b844Bc454e4438f44e
   - DO NOT include any address that doesn't meet ALL these criteria

2. Trading Fee:
   - MUST be between 0-5%
   - Examples: 2.5%, 4.1%, 5%
   - DO NOT include if outside this range

3. Max Wallet:
   - MUST be between 0-100%
   - Examples: 2.5%, 90%, 100%
   - DO NOT include if outside this range

4. Burst Amount:
   - MUST be a multiple of 5
   - Minimum: 50
   - Maximum: 2000
   - Examples: 50, 55, 60, 65, ... 195, 200
   - May or may not have 'AVAX' or 'Avax' at the end of the number
   - DO NOT include if not meeting these criteria

5. DEX Allocations:
   - ONLY valid DEXs: APEX, JOE, PHARAOH, PANGOLIN
   - Total allocation MUST equal 100%
   - 50% = 5000
   - 25% = 2500
   - 10% = 1000
   - 5% = 500
   - 2.5% = 250
   - 1% = 100
   - DO NOT include invalid DEXs or incomplete allocations

6. Reward DEX:
   - ONLY valid DEXs: APEX, JOE, PHARAOH, PANGOLIN
   - Invalid DEXs: UNISWAP, SUSHI, SushiSwap, Uniswap etc.
   - Can be null or undefined if not provided
   - DO NOT include if not meeting these criteria

7. totalSupply:
   - MUST be a positive number
   - Examples (User might say): 1000000, 1000000000, 1million, 1billion, 314 million
   - Can be null or undefined if not provided
   - DO NOT include if not meeting these criteria

8. Symbol:
    - MUST be 2-10 characters
    - MUST be uppercase
    - NO special characters except underscore
    - Examples: BTC, ETH, PEPE, DOGE_V2

9. Name:
   - MUST be 1-50 characters
   - NO special characters except spaces and underscores
   - Examples: Bitcoin, Pepe Token, My_Token

BAD BEHAVIOR TO AVOID:
- DON'T include any fields not explicitly mentioned
- DON'T generate example or default values
- DON'T include social media unless specifically provided
- DON'T assume any allocations or amounts
- DON'T copy values from examples

Return a JSON markdown block containing ONLY fields that were EXPLICITLY stated AND meet all validation rules:

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
`;
