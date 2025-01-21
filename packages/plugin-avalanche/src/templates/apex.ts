export const apexCreateTokenTemplate = `
Given the recent messages below:
{{recentMessages}}

CRITICAL VALIDATION RULES:
MOST IMPORTANT: Build a complete token creation object from ALL conversation context.

1. CONTEXT POLICY:
   - Extract information from ALL messages in the conversation
   - Maintain previously validated fields from earlier messages
   - Only update fields when explicitly mentioned in newer messages
   - Combine all valid fields into a complete token object
   - Return {} if only seeing questions or hypothetical discussion

2. EXTRACTION RULES:
   - Look through ALL recent messages for valid token information
   - Keep existing valid fields unless explicitly updated
   - NEVER extract values from examples or documentation
   - Validate all fields against the rules below
   - Build complete token object from entire conversation
   - Return full object combining all valid fields found

3. REQUIRED FIELDS:
    - Name (name)
    - Symbol (symbol)
    - Total Supply (totalSupply)
    - Description (description)
    - DEX Allocations (dexAllocations)
    - Reward DEX (rewardDex)
    - Burst Amount (burstAmount)
    - Creator Address (creatorAddress)

1. Creator Address:
   - MUST be exactly 42 characters (0x + 40 hex characters)
   - MUST start with "0x"
   - MUST only contain hex characters (0-9, a-f, A-F)
   - EXAMPLE (DO NOT EXTRACT): 0x742d35Cc6634C0532925a3b844Bc454e4438f44e
   - DO NOT include any address that doesn't meet ALL these criteria

2. Trading Fee:
   - MUST be between 0-5%
   - Examples (DO NOT EXTRACT): 2.5%, 4.1%, 5%
   - DO NOT include if outside this range

3. Max Wallet:
   - MUST be between 0-100%
   - Examples (DO NOT EXTRACT): 2.5%, 90%, 100%
   - DO NOT include if outside this range

4. Burst Amount:
   - MUST be a multiple of 5
   - Minimum: 50
   - Maximum: 2000
   - Examples (DO NOT EXTRACT): 50, 55, 60, 65, ... 195, 200
   - May or may not have 'AVAX' or 'Avax' at the end of the number
   - DO NOT include if not meeting these criteria

5. DEX Allocations:
   - ONLY valid DEXs: APEX, JOE, PHARAOH, PANGOLIN
   - Invalid DEXs: UNISWAP, SUSHI, SushiSwap, Uniswap etc. (NEVER EXTRACT THESE)
   - Total allocation MUST equal 100%
   - Examples (DO NOT EXTRACT): 50% = 5000, 25% = 2500, 10% = 1000, 5% = 500, 2.5% = 250, 1% = 100
   - DO NOT include invalid DEXs or incomplete allocations

6. Reward DEX:
   - ONLY valid DEXs: APEX, JOE, PHARAOH, PANGOLIN
   - Invalid DEXs: UNISWAP, SUSHI, SushiSwap, Uniswap etc.
   - Can be null or undefined if not provided
   - DO NOT include if not meeting these criteria

7. totalSupply:
   - MUST be a positive number
   - Examples (DO NOT EXTRACT): 1000000, 1000000000, 1million, 1billion, 314 million
   - Can be null or undefined if not provided
   - DO NOT include if not meeting these criteria

8. Symbol:
    - MUST be 2-10 characters
    - MUST be uppercase
    - NO special characters except underscore
    - Examples (DO NOT EXTRACT): BTC, ETH, PEPE, DOGE_V2

9. Name:
   - MUST be 1-50 characters
   - NO special characters except spaces and underscores
   - Examples (DO NOT EXTRACT): Bitcoin, Pepe Token, My_Token

Return a JSON markdown block containing ONLY fields that were EXPLICITLY stated AND meet all validation rules:

\`\`\`json
{
    "name": string,
    "symbol": string,
    "totalSupply": number,
    "imagePrompt": string,
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
