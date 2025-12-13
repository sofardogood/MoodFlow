const { createQuestion, voteQuestion, listQuestions } = require('../lib/db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const { sessionId } = req.query || {};
      if (!sessionId) return res.status(400).json({ success: false, error: 'Session ID is required' });
      const questions = await listQuestions(sessionId);
      return res.status(200).json({ success: true, questions });
    }

    if (req.method === 'POST') {
      const { action, sessionId, nickname, text, questionId } = req.body || {};
      if (!sessionId) return res.status(400).json({ success: false, error: 'Session ID is required' });

      if (action === 'vote') {
        if (!questionId) return res.status(400).json({ success: false, error: 'questionId is required' });
        const result = await voteQuestion({ questionId: Number(questionId), sessionId, nickname });
        return res.status(200).json({ success: true, skipped: result.skipped });
      }

      if (!text) return res.status(400).json({ success: false, error: 'text is required' });
      const q = await createQuestion({ sessionId, nickname, text });
      return res.status(200).json({ success: true, question: { id: q.id, text: q.text, status: q.status, createdAt: q.createdAt } });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('Questions API error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
};
