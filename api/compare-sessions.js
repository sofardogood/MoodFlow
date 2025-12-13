const { compareSessions } = require('../lib/db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const { ids } = req.query || {};
    const sessionIds = ids ? ids.split(',').map(s => s.trim()).filter(Boolean) : [];
    const stats = await compareSessions(sessionIds);
    return res.status(200).json({ success: true, stats });
  } catch (error) {
    console.error('Compare sessions API error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
};
