require('dotenv').config();

const config = {
    gemini: {
        apiKey: process.env.GEMINI_API_KEY,
        modelName: process.env.GEMINI_MODEL_NAME,
    },
    instagram: {
        accessToken: process.env.INSTAGRAM_ACCESS_TOKEN,
        accountId: process.env.INSTAGRAM_ACCOUNT_ID,
    },
    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        apiSecret: process.env.CLOUDINARY_API_SECRET
    }
};

module.exports = config;
