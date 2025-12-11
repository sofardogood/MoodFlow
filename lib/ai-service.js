const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function summarizeText(text) {
    if (!text || text.length < 50) {
        return "Not enough conversation to summarize.";
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

        const prompt = `あなたは優秀な議事録作成アシスタントです。与えられた会議の文字起こしテキストを、5分間の簡潔な「要約」にまとめてください。重要な決定事項や議論のポイントを含めてください。日本語で出力してください。

テキスト:
${text}

要約:`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("AI Summarization Error:", error);
        return "AI summarization failed: " + error.message;
    }
}

module.exports = { summarizeText };
