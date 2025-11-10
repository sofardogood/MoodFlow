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
 * セッションデータをAIで分析（バックグラウンド実行）
 */
function startAnalysis(sessionId, token) {
  try {
    // 認証チェック
    if (!verifyToken(token)) {
      return {
        success: false,
        error: '認証が必要です'
      };
    }

    // データを取得
    const dataResult = getSessionData(sessionId, token);
    if (!dataResult.success) {
      return dataResult;
    }

    const data = dataResult.data;

    // 分析ステータスを「処理中」に設定
    saveAnalysisStatus(sessionId, 'processing', null);

    // バックグラウンドで分析を実行（トリガーを使用）
    const scriptProperties = PropertiesService.getScriptProperties();
    scriptProperties.setProperty('PENDING_ANALYSIS_SESSION', sessionId);

    // 即座に分析を開始（タイムアウトを避けるため非同期的に実行）
    ScriptApp.newTrigger('executeBackgroundAnalysis')
      .timeBased()
      .after(1000) // 1秒後に実行
      .create();

    return {
      success: true,
      status: 'processing',
      message: 'AI分析を開始しました。結果を取得するまで数秒お待ちください。'
    };
  } catch (error) {
    console.error('startAnalysis error:', error);
    return {
      success: false,
      error: `分析開始エラー: ${error.message}`
    };
  }
}

/**
 * バックグラウンドで分析を実行
 */
function executeBackgroundAnalysis() {
  try {
    const scriptProperties = PropertiesService.getScriptProperties();
    const sessionId = scriptProperties.getProperty('PENDING_ANALYSIS_SESSION');

    if (!sessionId) {
      console.log('No pending analysis');
      return;
    }

    // 保留中のセッションIDをクリア
    scriptProperties.deleteProperty('PENDING_ANALYSIS_SESSION');

    // データを取得（認証チェックをスキップ - バックグラウンド実行のため）
    const config = getProperties();
    const ss = SpreadsheetApp.openById(config.spreadsheetId);
    const sheet = ss.getSheetByName('MoodData');

    if (!sheet) {
      saveAnalysisStatus(sessionId, 'error', { error: 'MoodDataシートが見つかりません' });
      return;
    }

    const allData = sheet.getDataRange().getValues();
    const sessionData = allData.slice(1)
      .filter(row => row[1] && String(row[1]).trim() === String(sessionId).trim())
      .map(row => ({
        timestamp: row[0],
        sessionId: row[1],
        nickname: row[2],
        moodScore: Number(row[3]),
        emoticon: row[4] || '',
        comment: row[5] || ''
      }));

    if (sessionData.length === 0) {
      saveAnalysisStatus(sessionId, 'error', { error: 'データが見つかりません' });
      return;
    }

    // 統計情報を計算
    const stats = calculateStats(sessionData);

    // AIで分析
    const analysis = analyzeMeetingData(sessionData, stats);

    // 参加者別分析
    const participantAnalyses = analyzeByParticipant(sessionData);

    // タイムライン分析
    const timeline = analyzeTimeline(sessionData);

    // 結果をスプレッドシートに保存
    const result = {
      success: true,
      stats: stats,
      analysis: analysis,
      participants: participantAnalyses,
      timeline: timeline
    };

    saveAnalysisStatus(sessionId, 'completed', result);

    // トリガーを削除
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(trigger => {
      if (trigger.getHandlerFunction() === 'executeBackgroundAnalysis') {
        ScriptApp.deleteTrigger(trigger);
      }
    });

  } catch (error) {
    console.error('executeBackgroundAnalysis error:', error);
    const sessionId = PropertiesService.getScriptProperties().getProperty('PENDING_ANALYSIS_SESSION');
    if (sessionId) {
      saveAnalysisStatus(sessionId, 'error', { error: error.message });
    }
  }
}

/**
 * 分析ステータスを保存
 */
function saveAnalysisStatus(sessionId, status, result) {
  const config = getProperties();
  const ss = SpreadsheetApp.openById(config.spreadsheetId);
  let statusSheet = ss.getSheetByName('AnalysisStatus');

  // シートが存在しない場合は作成
  if (!statusSheet) {
    statusSheet = ss.insertSheet('AnalysisStatus');
    statusSheet.appendRow(['SessionID', 'Status', 'Timestamp', 'Result']);
  }

  // 既存の行を探す
  const allData = statusSheet.getDataRange().getValues();
  let rowIndex = -1;
  for (let i = 1; i < allData.length; i++) {
    if (String(allData[i][0]).trim() === String(sessionId).trim()) {
      rowIndex = i + 1;
      break;
    }
  }

  const timestamp = new Date().toISOString();
  const resultJson = result ? JSON.stringify(result) : '';

  if (rowIndex > 0) {
    // 既存の行を更新
    statusSheet.getRange(rowIndex, 2, 1, 3).setValues([[status, timestamp, resultJson]]);
  } else {
    // 新しい行を追加
    statusSheet.appendRow([sessionId, status, timestamp, resultJson]);
  }
}

/**
 * 分析結果を取得
 */
function getAnalysisResult(sessionId, token) {
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
    const statusSheet = ss.getSheetByName('AnalysisStatus');

    if (!statusSheet) {
      return {
        success: false,
        status: 'not_started',
        message: '分析が開始されていません'
      };
    }

    // セッションIDで検索
    const allData = statusSheet.getDataRange().getValues();
    for (let i = 1; i < allData.length; i++) {
      if (String(allData[i][0]).trim() === String(sessionId).trim()) {
        const status = allData[i][1];
        const resultJson = allData[i][3];

        if (status === 'processing') {
          return {
            success: true,
            status: 'processing',
            message: 'AI分析中...'
          };
        } else if (status === 'completed') {
          const result = JSON.parse(resultJson);
          return {
            success: true,
            status: 'completed',
            ...result
          };
        } else if (status === 'error') {
          const errorData = JSON.parse(resultJson);
          return {
            success: false,
            status: 'error',
            error: errorData.error
          };
        }
      }
    }

    return {
      success: false,
      status: 'not_started',
      message: '分析が開始されていません'
    };
  } catch (error) {
    console.error('getAnalysisResult error:', error);
    return {
      success: false,
      error: `結果取得エラー: ${error.message}`
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
