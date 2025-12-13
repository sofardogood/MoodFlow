const { google } = require('googleapis');

const customsearch = google.customsearch('v1');

/**
 * Google Custom Search APIを使用して検索を行う
 * @param {string} query 検索クエリ
 * @returns {Promise<Array<{title: string, snippet: string}>>} 検索結果のリスト
 */
async function searchWeb(query) {
    // ユーザー指示により、GOOGLE_SEARCH_API_KEY が未設定の場合は GEMINI_API_KEY を使用する
    const apiKey = process.env.GOOGLE_SEARCH_API_KEY || process.env.GEMINI_API_KEY;
    const cx = process.env.GOOGLE_SEARCH_ENGINE_ID;

    if (!apiKey || !cx) {
        console.warn("Google Search API Key or Engine ID is missing. Skipping search.");
        return [];
    }

    try {
        const res = await customsearch.cse.list({
            cx: cx,
            q: query,
            auth: apiKey,
            num: 3, // ネタ元として3件ほど取得
            lr: 'lang_ja', // 日本語ページに限定
        });

        if (!res.data.items) {
            return [];
        }

        return res.data.items.map(item => ({
            title: item.title,
            snippet: item.snippet
        }));
    } catch (error) {
        console.error("Google Search Error:", error.message);
        return [];
    }
}

module.exports = { searchWeb };
