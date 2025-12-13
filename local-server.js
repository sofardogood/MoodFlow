const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes - Manual mapping to mimic Vercel file-system routing
const submitMood = require('./api/submit-mood');
const submitTranscript = require('./api/submit-transcript');
const getVisualData = require('./api/get-visual-data');
const streamVisualData = require('./api/stream-visual-data');
const submitSurvey = require('./api/submit-survey');
const getSurvey = require('./api/get-survey');
const questions = require('./api/questions');
const tagOverride = require('./api/tag-override');
const highlights = require('./api/highlights');
const exportData = require('./api/export');
const cohortStats = require('./api/cohort-stats');
const compareSessions = require('./api/compare-sessions');
const interventions = require('./api/interventions');
const auth = require('./api/auth');

// Wrapper to handle Vercel-style async handlers in Express
const handle = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res)).catch(next);
};

// Scheduler
const { startScheduler } = require('./lib/scheduler');
startScheduler();

app.post('/api/submit-mood', handle(submitMood));
app.post('/api/submit-transcript', handle(submitTranscript));
app.get('/api/get-visual-data', handle(getVisualData));
app.get('/api/stream-visual-data', handle(streamVisualData));
app.post('/api/submit-survey', handle(submitSurvey));
app.get('/api/get-survey', handle(getSurvey));
app.all('/api/questions', handle(questions));
app.post('/api/tag-override', handle(tagOverride));
app.all('/api/highlights', handle(highlights));
app.get('/api/export', handle(exportData));
app.get('/api/cohort-stats', handle(cohortStats));
app.get('/api/compare-sessions', handle(compareSessions));
app.get('/api/interventions', handle(interventions));
app.post('/api/auth', handle(auth));
app.all('/api/my-sessions', handle(require('./api/my-sessions')));
app.get('/api/get-summaries', handle(require('./api/get-summaries')));
app.post('/api/analyze-session', handle(require('./api/analyze-session')));
app.get('/api/cron-generate-reports', handle(require('./api/cron-generate-reports')));

// Start server
app.listen(PORT, () => {
    console.log(`
    🚀 Server is running locally!
    
    > Open http://localhost:${PORT} to view the app.
    > Presenter Mode: http://localhost:${PORT}/presenter.html
    > Dashboard: http://localhost:${PORT}/dashboard.html
    `);
});
