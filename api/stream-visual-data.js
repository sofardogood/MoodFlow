const { getVisualData } = require('../lib/db');

module.exports = async (req, res) => {
  const { sessionId } = req.query || {};

  if (!sessionId) {
    return res.status(400).json({ success: false, error: 'Session ID is required' });
  }

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  let closed = false;
  const sendEvent = (event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  async function pushData() {
    if (closed) return;
    try {
      const data = await getVisualData(sessionId);
      sendEvent('update', data);
    } catch (error) {
      sendEvent('error', { message: error.message || 'failed to fetch data' });
    }
  }

  // Initial payload
  await pushData();

  const interval = setInterval(pushData, parseInt(process.env.SSE_POLL_INTERVAL_MS || '3000', 10));

  req.on('close', () => {
    closed = true;
    clearInterval(interval);
  });
};
