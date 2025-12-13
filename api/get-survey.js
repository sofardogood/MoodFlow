const { getSurveyResponses } = require('../lib/db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { sessionId } = req.query || {};
    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'Session ID is required' });
    }

    const responses = await getSurveyResponses(sessionId);
    const satisfactionValues = responses
      .map(r => r.satisfaction)
      .filter(v => v !== null && v !== undefined);
    const avgSatisfaction = satisfactionValues.length
      ? satisfactionValues.reduce((a, b) => a + b, 0) / satisfactionValues.length
      : null;

    res.status(200).json({
      success: true,
      responses,
      stats: {
        count: responses.length,
        avgSatisfaction
      }
    });
  } catch (error) {
    console.error('Get survey error:', error);
    res.status(500).json({ success: false, error: error.message || 'アンケート取得でエラーが発生しました' });
  }
};
