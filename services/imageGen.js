const { GoogleGenAI } = require("@google/genai");
const fs = require("fs");
const path = require("path");
const config = require("../config");
const cloudinary = require('cloudinary').v2;
const logger = require("./logger");

// Configure Cloudinary
cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret
});

class ImageGenService {
    constructor() {
        this.client = new GoogleGenAI({ apiKey: config.gemini.apiKey });
        // Use environment variable or default to gemini-3-pro-image-preview (Nano Banana Pro)
        const envModel = process.env.IMAGE_MODEL_NAME;
        this.modelName = (envModel && envModel.trim().length > 0) ? envModel : "gemini-3-pro-image-preview";
    }

    async generateImage(prompt) {
        logger.info(`[Image Generation Service] Generating image using model: "${this.modelName}"...`);
        logger.info(`[Image Generation Service] Prompt: "${prompt}"`);

        try {
            const response = await this.client.models.generateContent({
                model: this.modelName,
                contents: prompt,
                config: {
                    responseModalities: ['IMAGE'],
                    imageConfig: {
                        aspectRatio: '1:1',
                        count: 1
                    }
                }
            });

            let generatedPart = null;
            if (response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts) {
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData) {
                        generatedPart = part;
                        break;
                    }
                }
            }

            if (!generatedPart) {
                logger.error("Full Response:", JSON.stringify(response, null, 2));
                throw new Error("No image data found in response.");
            }

            const imageBytes = generatedPart.inlineData.data;
            const buffer = Buffer.from(imageBytes, "base64");
            const timestamp = Date.now();
            const seed = Math.floor(Math.random() * 1000000);
            const filename = `generated-${timestamp}-${seed}.png`;
            const filepath = path.join(__dirname, "..", "public", "generated-images", filename);
            const dir = path.dirname(filepath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            fs.writeFileSync(filepath, buffer);
            logger.info(`[Image Generation Service] Image saved locally to: ${filepath}`);
            logger.info(`[Image Generation Service] Uploading to Cloudinary...`);
            const uploadResult = await cloudinary.uploader.upload(filepath, {
                folder: "instagram_automation",
                public_id: `gen_${timestamp}_${seed}`
            });
            logger.info(`[Image Generation Service] Uploaded to Cloudinary: ${uploadResult.secure_url}`);
            return uploadResult.secure_url;

        } catch (error) {
            logger.error("[Image Generation Service] Error generating/uploading image:", error);
            throw error;
        }
    }
}

module.exports = new ImageGenService();
