const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const { z } = require("zod");
const config = require("../config");
const { captions } = require("../prompts/index");
const logger = require("./logger");

if (!config.gemini.apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set.");
}

const llm = new ChatGoogleGenerativeAI({
    model: config.gemini.modelName,
    apiKey: config.gemini.apiKey,
    temperature: 0.7
});

const postSchema = z.object({
    caption: z.string().describe("The engaging Instagram post caption"),
    hashtags: z.array(z.string()).describe("List of 5-10 relevant hashtags"),
    imageDescription: z.string().describe("Detailed description for AI image generator")
});

const reviewSchema = z.object({
    approved: z.boolean().describe("Whether the post is approved"),
    feedback: z.string().describe("Feedback for improvement if not approved, or empty string if approved")
});

class GeminiService {
    async generatePost(topic) {
        logger.info(`[Gemini Service] Generating post for topic: "${topic}"...`);

        const structuredLlm = llm.withStructuredOutput(postSchema);
        const prompt = captions.generatePost(topic);

        try {
            const response = await structuredLlm.invoke(prompt);
            return response;
        } catch (error) {
            logger.error("[Gemini Service] Error generating content:", error);
            throw error;
        }
    }

    async reviewPost(topic, postContent) {
        logger.info(`[Gemini Service] Reviewing post for topic: "${topic}"...`);

        const structuredLlm = llm.withStructuredOutput(reviewSchema);
        const prompt = captions.reviewPrompt(topic, postContent);

        try {
            const response = await structuredLlm.invoke(prompt);
            return response;
        } catch (error) {
            logger.error("[Gemini Service] Error reviewing content:", error);
            return { approved: false, feedback: "System error during review." };
        }
    }
}

module.exports = new GeminiService();
