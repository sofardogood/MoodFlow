const { getCohortStats } = require('../lib/db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const { sessionId } = req.query || {};
    if (!sessionId) return res.status(400).json({ success: false, error: 'Session ID is required' });
    const stats = await getCohortStats(sessionId);
    return res.status(200).json({ success: true, stats });
  } catch (error) {
    console.error('Cohort stats API error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
};
