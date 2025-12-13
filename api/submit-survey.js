const { createSurveyResponse } = require('../lib/db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { sessionId, nickname, role, department, satisfaction, positive, improvement } = req.body;

    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'Session ID is required' });
    }

    const result = await createSurveyResponse({
      sessionId,
      nickname,
      role,
      department,
      satisfaction: satisfaction !== undefined ? Number(satisfaction) : null,
      positive,
      improvement
    });

    res.status(200).json({ success: true, timestamp: result.timestamp });
  } catch (error) {
    console.error('Submit survey error:', error);
    res.status(500).json({ success: false, error: error.message || 'アンケート送信でエラーが発生しました' });
  }
};
