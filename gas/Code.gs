/**
 * MoodFlow - Google Apps Script版
 * 会議中の感情をリアルタイムで記録・分析するシステム
 */

// Webアプリとして公開するためのエントリーポイント
function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('MoodFlow - 会議感情分析')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// スクリプトプロパティから設定を取得
function getProperties() {
  const props = PropertiesService.getScriptProperties();
  return {
    openaiApiKey: props.getProperty('OPENAI_API_KEY'),
    spreadsheetId: props.getProperty('SPREADSHEET_ID'),
    adminPassword: props.getProperty('ADMIN_PASSWORD'),
    slidesFolderId: props.getProperty('GOOGLE_SLIDES_FOLDER_ID') // オプション
  };
}

/**
 * 感情データを送信
 */
function submitMood(data) {
  try {
    const { sessionId, nickname, moodScore, comment, emoticon } = data;

    // バリデーション
    if (!sessionId || !nickname) {
      throw new Error('セッションIDとニックネームは必須です');
    }

    if (moodScore < -5 || moodScore > 5) {
      throw new Error('スコアは-5から5の範囲で指定してください');
    }

    const config = getProperties();
    const ss = SpreadsheetApp.openById(config.spreadsheetId);
    let sheet = ss.getSheetByName('MoodData');

    // シートが存在しない場合は作成
    if (!sheet) {
      sheet = ss.insertSheet('MoodData');
      sheet.appendRow(['Timestamp', 'SessionID', 'Nickname', 'MoodScore', 'Emoticon', 'Comment']);
    }

    const timestamp = new Date().toISOString();
    sheet.appendRow([
      timestamp,
      sessionId,
      nickname,
      moodScore,
      emoticon || '',
      comment || ''
    ]);

    return {
      success: true,
      timestamp: timestamp
    };
  } catch (error) {
    console.error('submitMood error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 管理者ログイン
 */
function adminLogin(password) {
  try {
    const config = getProperties();

    if (password === config.adminPassword) {
      // GASではセッション管理が難しいため、簡易的な認証トークンを生成
      const token = Utilities.getUuid();

      // トークンをキャッシュに保存（6時間有効）
      const cache = CacheService.getScriptCache();
      cache.put(token, 'authenticated', 21600);

      return {
        success: true,
        token: token
      };
    } else {
      return {
        success: false,
        error: 'パスワードが正しくありません'
      };
    }
  } catch (error) {
    console.error('adminLogin error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * トークンを検証
 */
function verifyToken(token) {
  if (!token) return false;

  const cache = CacheService.getScriptCache();
  const cached = cache.get(token);
  return cached === 'authenticated';
}

/**
 * セッションデータを取得
 */
function getSessionData(sessionId, token) {
  try {
    // 認証チェック
    if (!verifyToken(token)) {
      return {
        success: false,
        error: '認証が必要です'
      };
    }

    const config = getProperties();
    const ss = SpreadsheetApp.openById(config.spreadsheetId);
    const sheet = ss.getSheetByName('MoodData');

    if (!sheet) {
      console.log('MoodDataシートが見つかりません');
      return {
        success: false,
        error: 'MoodDataシートが見つかりません。データを送信してシートを作成してください。'
      };
    }

    const allData = sheet.getDataRange().getValues();
    console.log('総行数:', allData.length);

    if (allData.length <= 1) {
      console.log('データが空です（ヘッダーのみ）');
      return {
        success: false,
        error: 'データがまだ登録されていません。参加者に感情データを送信してもらってください。'
      };
    }

    // ヘッダー行をスキップして、セッションIDでフィルタ
    const sessionData = allData.slice(1)
      .filter(row => {
        // 空行をスキップ
        if (!row[1]) return false;

        // セッションIDを文字列として比較
        const rowSessionId = String(row[1]).trim();
        const targetSessionId = String(sessionId).trim();

        console.log(`比較: "${rowSessionId}" === "${targetSessionId}"`);
        return rowSessionId === targetSessionId;
      })
      .map(row => ({
        timestamp: row[0],
        sessionId: row[1],
        nickname: row[2],
        moodScore: Number(row[3]),
        emoticon: row[4] || '',
        comment: row[5] || ''
      }));

    console.log('フィルタ後のデータ件数:', sessionData.length);

    if (sessionData.length === 0) {
      return {
        success: false,
        error: `セッションID「${sessionId}」のデータが見つかりません。セッションIDを確認してください。`
      };
    }

    return {
      success: true,
      data: sessionData
    };
  } catch (error) {
    console.error('getSessionData error:', error);
    return {
      success: false,
      error: `エラーが発生しました: ${error.message}`
    };
  }
}

/**
 * 全セッションIDのリストを取得（デバッグ用）
 */
function getAllSessionIds(token) {
  try {
    // 認証チェック
    if (!verifyToken(token)) {
      return {
        success: false,
        error: '認証が必要です'
      };
    }

    const config = getProperties();
    const ss = SpreadsheetApp.openById(config.spreadsheetId);
    const sheet = ss.getSheetByName('MoodData');

    if (!sheet) {
      return {
        success: true,
        sessionIds: [],
        message: 'MoodDataシートが見つかりません'
      };
    }

    const allData = sheet.getDataRange().getValues();

    if (allData.length <= 1) {
      return {
        success: true,
        sessionIds: [],
        message: 'データがまだ登録されていません'
      };
    }

    // 重複を除いてセッションIDを取得
    const sessionIds = [...new Set(
      allData.slice(1)
        .filter(row => row[1])
        .map(row => String(row[1]).trim())
    )];

    return {
      success: true,
      sessionIds: sessionIds,
      totalRows: allData.length - 1
    };
  } catch (error) {
    console.error('getAllSessionIds error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * OpenAI API接続テスト
 */
function testOpenAIConnection(token) {
  try {
    // 認証チェック
    if (!verifyToken(token)) {
      return {
        success: false,
        error: '認証が必要です'
      };
    }

    const config = getProperties();

    if (!config.openaiApiKey) {
      return {
        success: false,
        error: 'OPENAI_API_KEYが設定されていません'
      };
    }

    // 簡単なテストリクエストを送信
    const response = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', {
      method: 'post',
      headers: {
        'Authorization': `Bearer ${config.openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: 'Hello! Just testing the connection.'
          }
        ],
        max_tokens: 10
      }),
      muteHttpExceptions: true
    });

    const result = JSON.parse(response.getContentText());
    const statusCode = response.getResponseCode();

    if (statusCode === 200) {
      return {
        success: true,
        message: 'OpenAI APIに正常に接続できました！',
        model: 'gpt-4o',
        response: result.choices[0].message.content
      };
    } else {
      return {
        success: false,
        error: `API接続エラー (${statusCode}): ${result.error?.message || '不明なエラー'}`
      };
    }
  } catch (error) {
    console.error('testOpenAIConnection error:', error);
    return {
      success: false,
      error: `接続テスト失敗: ${error.message}`
    };
  }
}

/**
 * セッションデータをAIで分析（リアルタイム分析）
 */
function analyzeSessionWithAI(sessionId, data, token) {
  try {
    // 認証チェック
    if (!verifyToken(token)) {
      return {
        success: false,
        error: '認証が必要です'
      };
    }

    if (!data || data.length === 0) {
      return {
        success: false,
        error: 'データがありません'
      };
    }

    // 統計情報を計算
    const stats = calculateStats(data);

    // AIで分析
    const analysis = analyzeMeetingData(data, stats);

    // 参加者別分析
    const participantAnalyses = analyzeByParticipant(data);

    // タイムライン分析
    const timeline = analyzeTimeline(data);

    return {
      success: true,
      stats: stats,
      analysis: analysis,
      participants: participantAnalyses,
      timeline: timeline
    };
  } catch (error) {
    console.error('analyzeSessionWithAI error:', error);
    return {
      success: false,
      error: `分析エラー: ${error.message}`
    };
  }
}

/**
 * Googleスライドを生成
 */
function generateSlides(sessionId, data, token) {
  try {
    // 認証チェック
    if (!verifyToken(token)) {
      return {
        success: false,
        error: '認証が必要です'
      };
    }

    if (!data || data.length === 0) {
      return {
        success: false,
        error: 'データがありません'
      };
    }

    // データを分析
    const stats = calculateStats(data);
    const analysis = analyzeMeetingData(data, stats);
    const participantAnalyses = analyzeByParticipant(data);
    const timeline = analyzeTimeline(data);

    // 新しいプレゼンテーションを作成
    const presentation = SlidesApp.create(`MoodFlow分析 - ${sessionId}`);
    const presentationId = presentation.getId();

    // デフォルトのスライドを削除
    const slides = presentation.getSlides();
    if (slides.length > 0) {
      slides.forEach(slide => slide.remove());
    }

    // タイトルスライド
    createTitleSlide(presentation, sessionId, stats);

    // サマリースライド
    createSummarySlide(presentation, analysis);

    // 統計スライド
    createStatsSlide(presentation, stats);

    // 参加者分析スライド
    createParticipantsSlide(presentation, participantAnalyses);

    // タイムラインスライド
    if (timeline.length > 0) {
      createTimelineSlide(presentation, timeline);
    }

    // 推奨アクションスライド
    createRecommendationsSlide(presentation, analysis);

    // フォルダに移動（オプション）
    const config = getProperties();
    if (config.slidesFolderId) {
      try {
        const file = DriveApp.getFileById(presentationId);
        const folder = DriveApp.getFolderById(config.slidesFolderId);
        file.moveTo(folder);
      } catch (error) {
        console.error('Folder move error:', error);
        // フォルダ移動失敗してもスライド生成は成功とする
      }
    }

    const slideUrl = `https://docs.google.com/presentation/d/${presentationId}`;

    return {
      success: true,
      presentationId: presentationId,
      slideUrl: slideUrl
    };
  } catch (error) {
    console.error('generateSlides error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
