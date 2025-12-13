const { GoogleGenerativeAI } = require('@google/generative-ai');
const { searchWeb } = require('./search-service');
const prisma = require('./prisma'); // Import Prisma Client

// Initialize Gemini API
// Note: Reusing the same env var as openai-service.js for consistency
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-2.5-pro';

/**
 * Base Agent Class
 */
class Agent {
    constructor(name, persona) {
        this.name = name;
        this.persona = persona;
        this.model = genAI.getGenerativeModel({ model: MODEL_NAME });
    }

    async generateResponse(context, history = [], searchResults = [], lessonsLearned = []) {
        let searchContext = "";
        if (searchResults.length > 0) {
            searchContext = `
Latest News/Trends (Use these for humor/metaphors if applicable):
${searchResults.map(s => `- ${s.title}: ${s.snippet}`).join('\n')}
`;
        }

        let learningContext = "";
        if (lessonsLearned.length > 0) {
            learningContext = `
LESSONS LEARNED FROM PAST SUCCESSFUL INTERVENTIONS:
${lessonsLearned.map(l => `- Situation: ${l.context}\n  Successful Suggestion: ${l.suggestion}`).join('\n')}

Use these past successes as inspiration for your response style.
`;
        }

        const prompt = `
You are ${this.name}.
Your Persona: ${this.persona}

${learningContext}

Context of the meeting:
${context}
${searchContext}

Conversation History:
${history.map(h => `${h.agent}: ${h.content}`).join('\n')}

Based on the context, history, latest trends, and lessons learned, provide your response.
Keep it short (1-2 sentences).
【重要】必ず日本語で回答してください。
Return ONLY the text of your response.
`;
        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            return response.text().trim();
        } catch (error) {
            console.error(`Error in ${this.name}:`, error);
            return "...";
        }
    }
}

/**
 * Kansai Agent (The "Boke" / Energetic / Kansai Dialect)
 */
class KansaiAgent extends Agent {
    constructor() {
        super("KansaiAgent", `
            You are a cheerful, energetic assistant from Osaka, Japan.
            You speak in strong Kansai dialect (Kansai-ben).
            You are the "Boke" (funny man) in a comedy duo.
            You try to lighten the mood with jokes, exaggeration, and friendly teasing.
            If the mood is bad, you try to blow it away with laughter.
            Example: "なんでやねん！暗い顔してたら福も逃げるで！"
        `);
    }
}

/**
 * Kanto Agent (The "Tsukkomi" / Cool / Standard Dialect)
 */
class KantoAgent extends Agent {
    constructor() {
        super("KantoAgent", `
            You are a calm, logical, and polite assistant from Tokyo, Japan.
            You speak in standard Japanese (Hyojungo).
            You are the "Tsukkomi" (straight man) or the cool-headed advisor.
            You acknowledge the Kansai Agent's jokes but bring the focus back to constructive solutions.
            You use dry wit or polite sarcasm.
            Example: "まあ、確かにその通りですが、少し落ち着きましょう。"
        `);
    }
}

/**
 * Host Agent (The MC / Router)
 */
class HostAgent extends Agent {
    constructor() {
        super("HostAgent", `
            You are the MC (Master of Ceremonies) of a comedy show.
            Your job is to analyze the situation and decide who should speak first to fix the mood.
            You have two assistants:
            1. KansaiAgent: Funny, energetic, Osaka dialect. Good for cheering up gloomy moods.
            2. KantoAgent: Calm, logical, Tokyo dialect. Good for calming down chaotic or tense moods.
        `);
    }

    /**
     * Retrieve successful past interventions from DB (Self-Improvement / Fine-tuning via RAG)
     */
    async learnFromHistory() {
        try {
            // Get top 3 rated interventions
            const successfulLogs = await prisma.interventionLog.findMany({
                where: {
                    successRating: {
                        gte: 4 // Only learn from high ratings (4 or 5)
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                },
                take: 3
            });
            return successfulLogs;
        } catch (error) {
            console.error("Failed to learn from history:", error);
            return [];
        }
    }

    async decideNextSpeaker(context, history = []) {
        const prompt = `
You are the HostAgent.
Context: ${context}
History: ${JSON.stringify(history)}

Who should speak next to improve the situation?
Return ONLY "KansaiAgent" or "KantoAgent".
`;
        try {
            const result = await this.model.generateContent(prompt);
            const text = await result.response.text();
            if (text.includes("Kansai")) return "KansaiAgent";
            if (text.includes("Kanto")) return "KantoAgent";
            return "KansaiAgent"; // Default
        } catch (e) {
            return "KansaiAgent";
        }
    }
}

/**
 * Multi-Agent Orchestrator
 */
class HumorOrchestrator {
    constructor() {
        this.host = new HostAgent();
        this.kansai = new KansaiAgent();
        this.kanto = new KantoAgent();
    }

    /**
     * Run the A2A interaction flow
     * @param {string} moodContext Description of the current bad atmosphere
     * @returns {Promise<Object>} The dialogue and final suggestion
     */
    async intervene(moodContext) {
        const history = [];

        // Step 0a: Search for latest trends/news
        const searchResults = await searchWeb("最近の面白いニュース トレンド");

        // Step 0b: Host learns from past successful interventions (Self-Improvement)
        const lessonsLearned = await this.host.learnFromHistory();

        // Step 1: Host decides who speaks first
        const firstSpeakerName = await this.host.decideNextSpeaker(moodContext, history);
        const firstSpeaker = firstSpeakerName === "KansaiAgent" ? this.kansai : this.kanto;

        // Host introduces the situation (Internal thought, not added to history yet)
        // We let the first speaker speak.
        const response1 = await firstSpeaker.generateResponse(moodContext, history, searchResults, lessonsLearned);
        history.push({ agent: firstSpeaker.name, content: response1 });

        // Step 2: The other agent responds (A2A interaction)
        const secondSpeaker = firstSpeakerName === "KansaiAgent" ? this.kanto : this.kansai;
        const response2 = await secondSpeaker.generateResponse(moodContext, history, searchResults, lessonsLearned);
        history.push({ agent: secondSpeaker.name, content: response2 });

        // Step 3: Host synthesizes the final suggestion
        const synthesizerModel = genAI.getGenerativeModel({ model: MODEL_NAME });
        const synthesisPrompt = `
The following is a conversation between AI agents trying to fix a bad atmosphere in a meeting.

Context: ${moodContext}

Dialogue:
${history.map(h => `${h.agent}: ${h.content}`).join('\n')}

As the HostAgent, summarize their points and suggest ONE concrete, humorous action or remark the presenter can say.
【重要】必ず日本語で回答してください。
Format:
アクション: [具体的な行動]
セリフ: 「[発表者が言うべきセリフ]」
`;

        let suggestion = {};
        try {
            const result = await synthesizerModel.generateContent(synthesisPrompt);
            const text = result.response.text();
            suggestion = { text };
        } catch (e) {
            suggestion = { text: "Error generating synthesis." };
        }

        return {
            dialogue: history,
            suggestion: suggestion
        };
    }
}

module.exports = { HumorOrchestrator };
