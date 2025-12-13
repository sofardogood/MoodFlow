const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function summarizeText(text) {
    if (!text || text.length < 50) {
        return "Not enough conversation to summarize.";
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

        const prompt = `あなたは会議のファシリテーター兼書記です。
与えられた会話テキストから、現在どのようなトピックについて話されているかを箇条書きで抽出してください。
要約ではなく、「議題のリスト」として出力してください。

制約:
- 各行は「・」で始めてください。
- 簡潔に（1行20文字以内）。
- 最大5つまで。
- 日本語で出力。

テキスト:
${text}

議題リスト:`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("AI Summarization Error:", error);
        return "AI summarization failed: " + error.message;
    }
}

module.exports = { summarizeText };
