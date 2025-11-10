const { google } = require('googleapis');

// Google Sheets API クライアントを初期化
function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
}

// データを追加
async function appendToSheet(data) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;

  const { sessionId, nickname, moodScore, comment, emoticon } = data;

  const timestamp = new Date().toISOString();

  const values = [[
    timestamp,
    sessionId,
    nickname,
    moodScore,
    emoticon,
    comment || ''
  ]];

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'MoodData!A:F', // シート名とカラム範囲
      valueInputOption: 'RAW',
      resource: { values },
    });

    return { success: true, timestamp };
  } catch (error) {
    console.error('Sheets append error:', error);
    throw new Error('スプレッドシートへの書き込みに失敗しました');
  }
}

// セッションのデータを取得
async function getSessionData(sessionId) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'MoodData!A:F',
    });

    const rows = response.data.values || [];

    if (rows.length === 0) {
      return [];
    }

    // ヘッダー行をスキップして、セッションIDでフィルタ
    const data = rows.slice(1)
      .filter(row => row[1] === sessionId)
      .map(row => ({
        timestamp: row[0],
        sessionId: row[1],
        nickname: row[2],
        moodScore: parseInt(row[3] || 0),
        emoticon: row[4],
        comment: row[5] || ''
      }));

    return data;
  } catch (error) {
    console.error('Sheets read error:', error);
    throw new Error('スプレッドシートからの読み込みに失敗しました');
  }
}

// すべてのデータを取得（管理者用）
async function getAllData() {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'MoodData!A:F',
    });

    const rows = response.data.values || [];

    if (rows.length === 0) {
      return [];
    }

    const data = rows.slice(1).map(row => ({
      timestamp: row[0],
      sessionId: row[1],
      nickname: row[2],
      moodScore: parseInt(row[3] || 0),
      emoticon: row[4],
      comment: row[5] || ''
    }));

    return data;
  } catch (error) {
    console.error('Sheets read error:', error);
    throw new Error('スプレッドシートからの読み込みに失敗しました');
  }
}

// スプレッドシートを初期化（初回のみ）
async function initializeSheet() {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;

  try {
    // ヘッダー行を追加
    const values = [[
      'Timestamp',
      'SessionID',
      'Nickname',
      'MoodScore',
      'Emoticon',
      'Comment'
    ]];

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'MoodData!A1:F1',
      valueInputOption: 'RAW',
      resource: { values },
    });

    return { success: true };
  } catch (error) {
    console.error('Sheet initialization error:', error);
    throw new Error('スプレッドシートの初期化に失敗しました');
  }
}

module.exports = {
  appendToSheet,
  getSessionData,
  getAllData,
  initializeSheet
};
