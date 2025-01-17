import { PinataSDK } from "pinata-web3";
import { TokenMetadata } from "../types/apex";
import { elizaLogger } from "@elizaos/core";

// Default IPFS URIs to use as fallbacks
const DEFAULT_METADATA_IPFS_URI =
    "ipfs://bafkreic5j5qiaubsc3xclslyc7envnmevsw35pw2uxeulhjfoidfdtpzka";

export async function uploadImageToIPFS(
    pinata: PinataSDK,
    imageData: string,
    fileName: string
): Promise<string> {
    try {
        elizaLogger.info(`Image data prefix: ${imageData.substring(0, 50)}`);
        const base64Data = imageData.split(",")[1];
        const imageBuffer = Buffer.from(base64Data, "base64");
        const blob = new Blob([imageBuffer], { type: "image/png" });
        const file = new File([blob], fileName, {
            type: "image/png",
        });
        const result = await pinata.upload.file(file, {
            cidVersion: 1,
            metadata: { name: fileName },
        });
        return `ipfs://${result.IpfsHash}`;
    } catch (error) {
        elizaLogger.error(
            `Failed to upload image ${fileName} to IPFS:`,
            error.message
        );
        return null; // Return null if the upload fails
    }
}

export async function uploadMetadataToIPFS(
    pinata: PinataSDK,
    metadata: TokenMetadata
): Promise<string> {
    try {
        const result = await pinata.upload.json(metadata, {
            cidVersion: 1,
            metadata: { name: `${metadata.name}.json` },
        });
        return `ipfs://${result.IpfsHash}`;
    } catch (error) {
        elizaLogger.error(
            `Failed to upload metadata for ${metadata.name} to IPFS:`,
            error.message
        );
        return DEFAULT_METADATA_IPFS_URI;
    }
}
