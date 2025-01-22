import { PinataSDK } from "pinata-web3";
import { TokenMetadata } from "../types/apex";
import { elizaLogger } from "@elizaos/core";
import fs from "fs";
import path from "path";

// Default IPFS URIs to use as fallbacks
const DEFAULT_METADATA_IPFS_URI =
    "ipfs://bafkreic5j5qiaubsc3xclslyc7envnmevsw35pw2uxeulhjfoidfdtpzka";

export async function uploadImageToIPFS(
    pinata: PinataSDK,
    imageData: string,
    fileName: string
): Promise<string> {
    try {
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

export function saveBase64Image(base64Data: string, filename: string): string {
    // Create generatedImages directory if it doesn't exist
    const imageDir = path.join(process.cwd(), "generatedImages");
    if (!fs.existsSync(imageDir)) {
        fs.mkdirSync(imageDir, { recursive: true });
    }

    // Remove the data:image/png;base64 prefix if it exists
    const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, "");

    // Create a buffer from the base64 string
    const imageBuffer = Buffer.from(base64Image, "base64");

    // Create full file path
    const filepath = path.join(imageDir, `${filename}.png`);

    // Save the file
    fs.writeFileSync(filepath, imageBuffer);

    return filepath;
}

export async function saveHeuristImage(
    imageUrl: string,
    filename: string
): Promise<string> {
    const imageDir = path.join(process.cwd(), "generatedImages");
    if (!fs.existsSync(imageDir)) {
        fs.mkdirSync(imageDir, { recursive: true });
    }

    // Fetch image from URL
    const response = await fetch(imageUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    // Create full file path
    const filepath = path.join(imageDir, `${filename}.png`);

    // Save the file
    fs.writeFileSync(filepath, imageBuffer);

    return filepath;
}

export async function getFilePath(
    imageInfo: string,
    filename: string
): Promise<string> {
    if (imageInfo.startsWith("http")) {
        return await saveHeuristImage(imageInfo, filename);
    } else {
        return saveBase64Image(imageInfo, filename);
    }
}
