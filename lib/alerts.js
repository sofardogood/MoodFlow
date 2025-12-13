const { getRecentMoods } = require('./db');

const cooldowns = new Map(); // key: `${sessionId}:${type}` -> timestamp

function shouldThrottle(key, cooldownSeconds) {
    const now = Date.now();
    const last = cooldowns.get(key) || 0;
    if (now - last < cooldownSeconds * 1000) return true;
    cooldowns.set(key, now);
    return false;
}

async function postWebhook(url, payload) {
    if (!url) return;
    try {
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } catch (err) {
        console.error('Webhook error:', err);
    }
}

async function broadcast(text) {
    const slackUrl = process.env.SLACK_WEBHOOK_URL;
    const teamsUrl = process.env.TEAMS_WEBHOOK_URL;
    const genericUrl = process.env.ALERT_WEBHOOK_URL;

    if (!slackUrl && !teamsUrl && !genericUrl) {
        console.log('[ALERT]', text);
        return;
    }

    await Promise.all([
        postWebhook(slackUrl, { text }),
        postWebhook(teamsUrl, { text }),
        postWebhook(genericUrl, { text })
    ]);
}

function buildSuggestions({ moodScore, avg, negativeRate }) {
    const tips = [];
    if (moodScore <= -3 || avg <= -1) tips.push('5分休憩を提案し、論点を整理する');
    if (negativeRate >= 0.5) tips.push('決定事項を再確認し、懸念点を一度列挙する');
    if (avg <= -2) tips.push('司会者が一言で場をリセットし、ポジティブな問いを投げる');
    if (tips.length === 0) tips.push('進行速度や論点の優先度を確認してください');
    return tips;
}

async function checkAndSendAlerts(sessionId, moodScore, nickname) {
    try {
        const recent = await getRecentMoods(sessionId, parseInt(process.env.ALERT_WINDOW_MINUTES || '10', 10));
        if (!recent || recent.length === 0) return;

        const scores = recent.map(r => r.score);
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        const negatives = scores.filter(s => s <= -2).length;
        const negativeRate = negatives / scores.length;

        // Immediate critical alert
        if (moodScore <= -4 && !shouldThrottle(`${sessionId}:panic`, parseInt(process.env.ALERT_COOLDOWN_SECONDS || '180', 10))) {
            const tips = buildSuggestions({ moodScore, avg, negativeRate });
            await broadcast(`⚠️ MoodFlow: 強いネガティブ反応が検出されました (score=${moodScore}, from=${nickname || 'anonymous'}, session=${sessionId}).\n介入案: ${tips.join(' / ')}`);
            return;
        }

        // Trend-based alert
        if (scores.length >= (parseInt(process.env.ALERT_MIN_RECENT || '5', 10)) && avg <= (parseFloat(process.env.ALERT_NEG_AVG || '-1.5')) && negativeRate >= 0.5) {
            if (!shouldThrottle(`${sessionId}:trend`, parseInt(process.env.ALERT_COOLDOWN_SECONDS || '300', 10))) {
                const tips = buildSuggestions({ moodScore, avg, negativeRate });
                await broadcast(`📉 MoodFlow: ネガティブが増加中 (直近平均 ${avg.toFixed(2)}, ネガ率 ${(negativeRate * 100).toFixed(0)}%, session=${sessionId}).\n介入案: ${tips.join(' / ')}`);
            }
        }
    } catch (error) {
        console.error('Alert check error:', error);
    }
}

module.exports = { checkAndSendAlerts, buildSuggestions };
