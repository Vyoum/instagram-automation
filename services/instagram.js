const axios = require('axios');
const config = require('../config');
const logger = require('./logger');

class InstagramService {
    constructor() {
        this.accessToken = config.instagram.accessToken;
        this.accountId = config.instagram.accountId;
        this.apiVersion = 'v19.0';
        this.baseUrl = `https://graph.instagram.com/${this.apiVersion}`;
    }

    async createPost(content, topic, imageUrl) {
        logger.info(`[Instagram Service] Posting to account ${this.accountId}...`);

        try {
            const containerUrl = `${this.baseUrl}/${this.accountId}/media`;
            const containerParams = {
                image_url: imageUrl,
                caption: content,
                access_token: this.accessToken
            };

            logger.info(`[Instagram Service] Creating media container...`);
            const containerResponse = await axios.post(containerUrl, null, { params: containerParams });

            if (!containerResponse.data || !containerResponse.data.id) {
                throw new Error("Failed to create media container: No ID returned.");
            }

            const creationId = containerResponse.data.id;
            logger.info(`[Instagram Service] Media container created. ID: ${creationId}`);

            // Wait for media to be ready
            await this.waitForMedia(creationId);

            const publishUrl = `${this.baseUrl}/${this.accountId}/media_publish`;
            const publishParams = {
                creation_id: creationId,
                access_token: this.accessToken
            };

            logger.info(`[Instagram Service] Publishing media...`);
            const publishResponse = await axios.post(publishUrl, null, { params: publishParams });

            if (!publishResponse.data || !publishResponse.data.id) {
                throw new Error("Failed to publish media: No ID returned.");
            }

            const postId = publishResponse.data.id;
            logger.info(`[Instagram Service] Successfully posted content! Post ID: ${postId}`);

            return { success: true, timestamp: new Date(), postId: postId };

        } catch (error) {
            if (error.response) {
                logger.error(`[Instagram Service] API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
            } else {
                logger.error(`[Instagram Service] Error creating post: ${error.message}`);
            }
            throw error;
        }
    }

    async waitForMedia(creationId) {
        let attempts = 0;
        const maxAttempts = 10;
        const delay = 3000; // 3 seconds

        logger.info(`[Instagram Service] Waiting for media container ${creationId} to be ready...`);

        while (attempts < maxAttempts) {
            try {
                const statusUrl = `${this.baseUrl}/${creationId}`;
                const statusParams = {
                    fields: 'status_code,status',
                    access_token: this.accessToken
                };

                const response = await axios.get(statusUrl, { params: statusParams });
                const status = response.data.status_code; // FINISHED, IN_PROGRESS, ERROR

                logger.info(`[Instagram Service] Media status: ${status}`);

                if (status === 'FINISHED') {
                    return true;
                } else if (status === 'ERROR') {
                    throw new Error(`Media container verification failed: ${status}`);
                }

                // Wait before next check
                await new Promise(resolve => setTimeout(resolve, delay));
                attempts++;
            } catch (error) {
                logger.error(`[Instagram Service] Error checking status: ${error.message}`);
                throw error;
            }
        }
        throw new Error("Media container timed out processing.");
    }
}

module.exports = new InstagramService();
