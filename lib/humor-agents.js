const { GoogleGenerativeAI } = require('@google/generative-ai');
const { searchWeb } = require('./search-service');
const prisma = require('./prisma'); // Import Prisma Client

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

/**
 * Base Agent Class
 */
class Agent {
    constructor(name, persona) {
        this.name = name;
        this.persona = persona;
        this.model = genAI.getGenerativeModel({ model: MODEL_NAME });
    }

    async generateAdvice(context, lessonsLearned = []) {
        let learningContext = "";
        if (lessonsLearned.length > 0) {
            learningContext = `
LESSONS LEARNED FROM PAST SUCCESSFUL INTERVENTIONS:
${lessonsLearned.map(l => `- Situation: ${l.context}\n  Successful Suggestion: ${l.suggestion}`).join('\n')}

Use these past successes as inspiration for your advice.
`;
        }

        const prompt = `
You are ${this.name}.
Your Persona: ${this.persona}

${learningContext}

Meeting Context (including transcript):
${context}

Based on the meeting context, provide CONCRETE ADVICE for the presenter on:
1. How to improve the atmosphere
2. Suggested phrasing or remarks the presenter can use

Keep your advice concise (2-3 sentences max).
【重要】必ず日本語で回答してください。会議の言語スタイルに合わせてください。
Return ONLY the advice text.
`;
        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            return response.text().trim();
        } catch (error) {
            console.error(`Error in ${this.name}:`, error);
            return "アドバイスの生成に失敗しました。";
        }
    }
}

/**
 * Kansai Agent (Osaka dialect specialist)
 */
class KansaiAgent extends Agent {
    constructor() {
        super("関西エージェント", `
            あなたは大阪出身の明るくエネルギッシュなアシスタントです。
            関西弁（大阪弁）で話します。
            会議の雰囲気を和らげるのが得意です。
            親しみやすく、ユーモアを交えたアドバイスをします。
            例: 「ちょっと空気重いなぁ。ここで一回、笑いとったらええねん！」
        `);
    }
}

/**
 * Kanto Agent (Standard Japanese specialist)
 */
class KantoAgent extends Agent {
    constructor() {
        super("関東エージェント", `
            あなたは東京出身の落ち着いた論理的なアシスタントです。
            標準語（丁寧語）で話します。
            冷静で的確なアドバイスをします。
            礼儀正しく、建設的な提案をします。
            例: 「参加者の集中力が落ちているようです。ここで一度質問を投げかけてみてはいかがでしょうか。」
        `);
    }
}

/**
 * Host Agent (Analyzer and Router)
 */
class HostAgent {
    constructor() {
        this.model = genAI.getGenerativeModel({ model: MODEL_NAME });
    }

    /**
     * Retrieve successful past interventions from DB (Self-Improvement / Fine-tuning via RAG)
     */
    async learnFromHistory() {
        try {
            const successfulLogs = await prisma.interventionLog.findMany({
                where: {
                    successRating: {
                        gte: 4
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

    /**
     * Detect the dialect used in the meeting context
     * @param {string} context Meeting transcript/context
     * @returns {Promise<string>} "kansai" or "standard"
     */
    async detectDialect(context) {
        const prompt = `
以下の会議の発言内容を分析し、使用されている日本語の方言を判定してください。

会議内容:
${context}

判定基準:
- 関西弁の特徴: 「やねん」「やで」「〜やん」「ほんま」「なんでやねん」「ちゃう」など
- 標準語の特徴: 「です」「ます」「ですね」「でしょう」など丁寧語

回答は "kansai" または "standard" のどちらか一語のみで答えてください。
`;
        try {
            const result = await this.model.generateContent(prompt);
            const text = (await result.response.text()).toLowerCase().trim();
            if (text.includes("kansai")) return "kansai";
            return "standard";
        } catch (e) {
            console.error("Dialect detection failed:", e);
            return "standard"; // Default to standard
        }
    }

    /**
     * Summarize the agent's advice into a short warning/alert
     * @param {string} context Original meeting context
     * @param {string} agentName Name of the agent who provided advice
     * @param {string} advice The advice from the agent
     * @returns {Promise<string>} Short warning message
     */
    async createWarning(context, agentName, advice) {
        const prompt = `
あなたは会議のファシリテーション補助AIです。

会議の状況:
${context}

${agentName}からのアドバイス:
${advice}

上記のアドバイスを踏まえて、発表者に表示する「短い警告・提案メッセージ」を作成してください。

ルール:
- 1〜2文で簡潔に
- 具体的なアクションまたはセリフを含める
- 会議の言語スタイル（関西弁 or 標準語）に合わせる
- 「⚠️」などの絵文字を先頭に1つ付けてもよい

例:
⚠️ 参加者の反応が薄いです。「ここまでで質問ありますか？」と問いかけてみましょう。
`;
        try {
            const result = await this.model.generateContent(prompt);
            return (await result.response.text()).trim();
        } catch (e) {
            console.error("Warning creation failed:", e);
            return "⚠️ 雰囲気が悪化しています。対応を検討してください。";
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
     * Run the intervention flow
     * @param {string} moodContext Description of the current situation including transcript
     * @returns {Promise<Object>} The agent used, advice, and final warning
     */
    async intervene(moodContext) {
        // Step 1: Host learns from past successful interventions
        const lessonsLearned = await this.host.learnFromHistory();

        // Step 2: Host detects the dialect used in the meeting
        const dialect = await this.host.detectDialect(moodContext);
        const selectedAgent = dialect === "kansai" ? this.kansai : this.kanto;

        // Step 3: Selected agent provides advice
        const advice = await selectedAgent.generateAdvice(moodContext, lessonsLearned);

        // Step 4: Host summarizes as a short warning
        const warning = await this.host.createWarning(moodContext, selectedAgent.name, advice);

        return {
            dialect: dialect,
            agentUsed: selectedAgent.name,
            advice: advice,
            warning: warning
        };
    }
}

module.exports = { HumorOrchestrator };

