# Instagram Automation Tool

This project automates the creation and publishing of Instagram posts using AI.

## Features

- Generates captions and hashtags using Gemini Nano 3 Pro.
- Generates images using Gemini Nano 3 Pro.
- Automated review loop to improve content quality.
- Human-in-the-loop approval process via a web interface.
- Publishes posts to Instagram using the Instagram Graph API.
- Hosts images on Cloudinary.
- Comprehensive logging system.

## Prerequisites

- Node.js (v20 or later)
- Instagram Business Account connected to a Facebook Page
- Gemini API Key
- Cloudinary Account

## Setup

1. Clone the repository.
2. Install dependencies:
   npm install

3. Configure environment variables in a .env file:
   PORT=3000
   GEMINI_API_KEY=your_gemini_key
   INSTAGRAM_ACCESS_TOKEN=your_instagram_token
   INSTAGRAM_ACCOUNT_ID=your_account_id
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret

4. Run the application:
   npm start

## Explanation

The system operates in a sequential workflow:
1. Input: You provide a topic.
2. Draft Generation: The AI creates a caption and image description.
3. Automated Review: An internal AI reviewer critiques the draft. If it finds issues, it sends it back for revision. This cycle repeats up to 3 times to ensure high quality.
4. Image Generation: Once the text is approved by the AI, it generates a matching image.
5. Human Review: The process pauses and presents the final draft (text and image) to you.
6. Deployment: Upon your approval, the system uploads the image to Cloudinary and publishes the post to your Instagram account.

## Usage

1. Open your browser and navigate to http://localhost:3000.
2. Enter a topic for your post.
3. The AI will generate a draft, review it, and improve it automatically.
4. Once ready, you will see a review page with the generated image and caption.
5. You can Approve to publish immediately or Request Revision to make changes.

## Project Structure

- agents/: Contains the LangGraph agent logic.
- controllers/: Handles web requests and interactions with the agent.
- services/: External services (Gemini, Instagram, Cloudinary, Logger).
- routes/: Express API routes.
- views/: EJS templates for the web interface.
