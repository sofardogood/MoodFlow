const { createHighlight, getHighlights } = require('../lib/db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const { sessionId } = req.query || {};
      if (!sessionId) return res.status(400).json({ success: false, error: 'Session ID is required' });
      const highlights = await getHighlights(sessionId);
      return res.status(200).json({ success: true, highlights });
    }

    if (req.method === 'POST') {
      const { sessionId, text, tag, sourceType, sourceId } = req.body || {};
      if (!sessionId || !text) return res.status(400).json({ success: false, error: 'sessionId and text are required' });
      const h = await createHighlight({ sessionId, text, tag, sourceType, sourceId: sourceId ? Number(sourceId) : null });
      return res.status(200).json({ success: true, highlight: h });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('Highlights API error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
};
