const { StateGraph, END, START, MemorySaver } = require("@langchain/langgraph");
const geminiService = require("../services/gemini");
const instagramService = require("../services/instagram");
const imageGenService = require("../services/imageGen");

// Define State
const agentState = {
    topic: {
        value: (x, y) => y ? y : x,
        default: () => ""
    },
    generated_content: {
        value: (x, y) => y ? y : x,
        default: () => ""
    },
    image_prompt: {
        value: (x, y) => y ? y : x,
        default: () => ""
    },
    image_url: {
        value: (x, y) => y ? y : x,
        default: () => ""
    },
    approved: {
        value: (x, y) => y,
        default: () => false
    },
    feedback: {
        value: (x, y) => y ? y : x,
        default: () => ""
    },
    iterations: {
        value: (x, y) => x + y,
        default: () => 0
    },
    review_count: {
        value: (x, y) => x + y,
        default: () => 0
    },
    reviewer_feedback: {
        value: (x, y) => y ? y : x,
        default: () => ""
    }
};

// Node: Generate Post
async function generatePostNode(state) {
    const topic = state.topic;
    const feedback = state.feedback;
    const reviewerFeedback = state.reviewer_feedback;
    const iterations = state.iterations || 0;
    const reviewCount = state.review_count || 0;

    console.log(`\n[Agent] Generating Post (Attempt ${iterations + 1}, Review Loop ${reviewCount}) ---`);

    let promptTopic = topic;
    if (feedback) {
        promptTopic = `${topic}. Feedback from human: ${feedback}. Please improve based on this.`;
    }
    else if (reviewerFeedback) {
        promptTopic = `${topic}. Feedback from reviewer: ${reviewerFeedback}. Please improve based on this.`;
    }

    const response = await geminiService.generatePost(promptTopic);

    const hashtags = Array.isArray(response.hashtags) ? response.hashtags.join(' ') : (response.hashtags || '');
    const caption = `${response.caption}\n\n${hashtags}`;
    const imagePrompt = response.imageDescription || topic;
    return {
        generated_content: caption,
        image_prompt: imagePrompt,
        approved: false,
        iterations: 1
    };
}

// Node: Automated Reviewer
async function reviewerNode(state) {
    const content = state.generated_content;
    const topic = state.topic;
    const currentReviewCount = state.review_count || 0;

    console.log(`\n[Agent] Automated Review (Cycle ${currentReviewCount + 1}) ---`);
    console.log(`[Agent] Current Draft Caption: ${content.substring(0, 50)}...`);
    const reviewResult = await geminiService.reviewPost(topic, {
        caption: content,
        hashtags: [],
        imageDescription: state.image_prompt
    });

    console.log(`[Agent] Reviewer Approved: ${reviewResult.approved}`);
    if (!reviewResult.approved) {
        console.log(`[Agent] Reviewer Feedback: ${reviewResult.feedback}`);
    }

    return {
        approved: reviewResult.approved,
        reviewer_feedback: reviewResult.feedback,
        review_count: 1
    };
}


// Node: Generate Image
async function generateImageNode(state) {
    const prompt = state.image_prompt;
    if (!prompt) {
        console.warn("[Agent] No image prompt found, skipping generation.");
        return { image_url: "Error: No Prompt" };
    }
    const imageUrl = await imageGenService.generateImage(prompt);
    return { image_url: imageUrl };
}

async function humanApprovalNode(state) {
    console.log("[Agent] Waiting for human approval...");
    return {};
}

// Node: Publish Post
async function publishPostNode(state) {
    console.log("\n[Agent] Publishing to Instagram ---");
    try {
        await instagramService.createPost(state.generated_content, state.topic, state.image_url);
        return {};
    } catch (error) {
        console.error("[Agent] Failed to publish:", error);
        return {};
    }
}

// Conditional Edge Logic: Automated Review Loop
function shouldContinueReview(state) {
    const maxReviews = 3;
    const reviewCount = state.review_count || 0;
    if (state.approved) {
        return "generate_image";
    }
    if (reviewCount < maxReviews) {
        return "generate_post";
    }
    console.log("[Agent] Max review cycles reached. Proceeding to human review.");
    return "generate_image";
}


function checkHumanApproval(state) {
    if (state.approved) {
        return "publish_post";
    }
    return "generate_post";
}

// Initialize Memory Saver
const checkpointer = new MemorySaver();

// Define Graph
const workflow = new StateGraph({
    channels: agentState
})
    .addNode("generate_post", generatePostNode)
    .addNode("reviewer", reviewerNode)
    .addNode("generate_image", generateImageNode)
    .addNode("human_approval", humanApprovalNode)
    .addNode("publish_post", publishPostNode)

    .addEdge(START, "generate_post")
    .addEdge("generate_post", "reviewer")
    .addConditionalEdges("reviewer", shouldContinueReview)
    .addEdge("generate_image", "human_approval")
    .addConditionalEdges("human_approval", checkHumanApproval)
    .addEdge("publish_post", END);

const app = workflow.compile({
    checkpointer: checkpointer,
    interruptBefore: ["human_approval"]
});

module.exports = app;
