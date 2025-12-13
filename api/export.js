const { getExportData } = require('../lib/db');

function toCsv(items, fields) {
  const header = fields.join(',');
  const rows = items.map(item => fields.map(f => {
    const v = item[f];
    if (v === null || v === undefined) return '';
    const s = String(v).replace(/"/g, '""');
    return `"${s}"`;
  }).join(','));
  return [header, ...rows].join('\n');
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const { sessionId, format } = req.query || {};
    if (!sessionId) return res.status(400).json({ success: false, error: 'Session ID is required' });

    const data = await getExportData(sessionId);
    if (format === 'csv') {
      const csv = toCsv(data.moods, ['id', 'sessionId', 'nickname', 'hashedNickname', 'score', 'comment', 'tag', 'role', 'department', 'createdAt']);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="moodflow-${sessionId}.csv"`);
      return res.status(200).send(csv);
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Export API error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
};
