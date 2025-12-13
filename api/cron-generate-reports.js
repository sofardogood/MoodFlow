const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { analyzeMeetingData } = require('../lib/openai-service');
const { generateSlides } = require('../lib/slides-generator');

module.exports = async (req, res) => {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers['x-cron-secret'] !== secret) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const frequency = (req.query && req.query.frequency) || 'daily';
  const days = frequency === 'weekly' ? 7 : 1;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  try {
    const sessions = await prisma.session.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' }
    });

    let processed = 0;
    let slidesCreated = 0;

    for (const session of sessions) {
      const moods = await prisma.mood.findMany({
        where: { sessionId: session.id },
        orderBy: { createdAt: 'asc' }
      });
      const summaries = await prisma.summary.findMany({
        where: { sessionId: session.id },
        orderBy: { startTime: 'asc' }
      });

      if (moods.length === 0 && summaries.length === 0) continue;

      const analysis = await analyzeMeetingData(
        moods.map(m => ({ ...m, moodScore: m.score, timestamp: m.createdAt })),
        summaries,
        { targetLanguage: process.env.REPORT_LANG || 'ja' }
      );

      await prisma.summary.create({
        data: {
          sessionId: session.id,
          content: analysis.analysis?.overallMood || 'Report generated',
          startTime: moods[0]?.createdAt || summaries[0]?.startTime || new Date(),
          endTime: moods[moods.length - 1]?.createdAt || summaries[summaries.length - 1]?.endTime || new Date()
        }
      });

      if (process.env.ENABLE_SLIDE_AUTOMATION === 'true') {
        try {
          const slideData = moods.map(m => ({ ...m, moodScore: m.score, timestamp: m.createdAt }));
          await generateSlides(session.id, slideData);
          slidesCreated += 1;
        } catch (err) {
          console.error('Slide generation failed for session', session.id, err.message);
        }
      }

      processed += 1;
    }

    res.status(200).json({ success: true, processed, slidesCreated });
  } catch (error) {
    console.error('Cron generate reports error:', error);
    res.status(500).json({ success: false, error: error.message || 'Cron failed' });
  }
};
