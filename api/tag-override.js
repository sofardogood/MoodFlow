const { upsertTagOverride } = require('../lib/db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const { sessionId, sourceType, sourceId, tag } = req.body || {};
    if (!sessionId || !sourceType || !sourceId || !tag) {
      return res.status(400).json({ success: false, error: 'sessionId, sourceType, sourceId, tag are required' });
    }
    await upsertTagOverride({ sessionId, sourceType, sourceId: Number(sourceId), tag });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Tag override API error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
};
