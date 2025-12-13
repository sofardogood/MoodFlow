const { getRecentMoods } = require('../lib/db');
const { buildSuggestions } = require('../lib/alerts');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const { sessionId } = req.query || {};
    if (!sessionId) return res.status(400).json({ success: false, error: 'Session ID is required' });
    const recent = await getRecentMoods(sessionId, 15);
    if (!recent || recent.length === 0) return res.status(200).json({ success: true, suggestions: [] });
    const scores = recent.map(r => r.score);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const negativeRate = scores.filter(s => s < 0).length / scores.length;
    const tips = buildSuggestions({ moodScore: scores[scores.length - 1], avg, negativeRate });
    return res.status(200).json({ success: true, suggestions: tips, avg, negativeRate });
  } catch (error) {
    console.error('Interventions API error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
};
