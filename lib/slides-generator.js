const { google } = require('googleapis');
const { analyzeMeetingData, analyzeByParticipant, analyzeTimeline } = require('./openai-service');

// Google Slides API クライアントを初期化
function getSlidesClient() {
  // 環境変数からサービスアカウントの認証情報を取得
  let credentials;

  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    // JSONファイル全体が設定されている場合
    try {
      credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    } catch (error) {
      console.error('Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON:', error);
      throw new Error('サービスアカウントJSONの解析に失敗しました');
    }
  } else if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    // 個別に設定されている場合（後方互換性のため残す）
    credentials = {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
  } else {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON または GOOGLE_SERVICE_ACCOUNT_EMAIL と GOOGLE_PRIVATE_KEY を設定してください');
  }

  const auth = new google.auth.GoogleAuth({
    credentials: credentials,
    scopes: [
      'https://www.googleapis.com/auth/presentations',
      'https://www.googleapis.com/auth/drive'
    ],
  });

  return {
    slides: google.slides({ version: 'v1', auth }),
    drive: google.drive({ version: 'v3', auth })
  };
}

/**
 * スライドを生成
 */
async function generateSlides(sessionId, data) {
  if (!data || data.length === 0) {
    throw new Error('データがありません');
  }

  // データを分析
  const { stats, analysis } = await analyzeMeetingData(data);
  const participantAnalyses = await analyzeByParticipant(data);
  const timeline = analyzeTimeline(data);

  // スライドを作成
  const { slides, drive } = getSlidesClient();

  // 新しいプレゼンテーションを作成
  const presentation = await slides.presentations.create({
    requestBody: {
      title: `MoodFlow分析 - ${sessionId}`
    }
  });

  const presentationId = presentation.data.presentationId;

  // スライドのリクエストを構築
  const requests = [];

  // 既存のスライドを削除
  const slideIds = presentation.data.slides.map(s => s.objectId);
  slideIds.forEach(id => {
    requests.push({
      deleteObject: { objectId: id }
    });
  });

  // タイトルスライド
  requests.push(
    ...createTitleSlide(sessionId, stats)
  );

  // サマリースライド
  requests.push(
    ...createSummarySlide(analysis)
  );

  // 統計スライド
  requests.push(
    ...createStatsSlide(stats)
  );

  // 参加者分析スライド
  requests.push(
    ...createParticipantsSlide(participantAnalyses)
  );

  // タイムラインスライド
  if (timeline.length > 0) {
    requests.push(
      ...createTimelineSlide(timeline)
    );
  }

  // 推奨アクションスライド
  requests.push(
    ...createRecommendationsSlide(analysis)
  );

  // スライドを一括更新
  await slides.presentations.batchUpdate({
    presentationId,
    requestBody: { requests }
  });

  // スライドを指定フォルダに移動（オプション）
  const folderId = process.env.GOOGLE_SLIDES_FOLDER_ID;
  if (folderId) {
    try {
      await drive.files.update({
        fileId: presentationId,
        addParents: folderId,
        removeParents: 'root',
        fields: 'id, parents'
      });
      console.log(`Slide moved to folder: ${folderId}`);
    } catch (error) {
      console.error('Folder move error:', error);
      // フォルダ移動失敗してもスライド生成は成功とする
    }
  }

  // スライドを一般公開または共有可能にする
  try {
    await drive.permissions.create({
      fileId: presentationId,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    });
  } catch (error) {
    console.error('Permission setting error:', error);
  }

  const slideUrl = `https://docs.google.com/presentation/d/${presentationId}`;

  return {
    presentationId,
    slideUrl
  };
}

/**
 * タイトルスライドを作成
 */
function createTitleSlide(sessionId, stats) {
  const slideId = 'title_slide';

  return [
    {
      createSlide: {
        objectId: slideId,
        slideLayoutReference: { predefinedLayout: 'TITLE' }
      }
    },
    {
      insertText: {
        objectId: `${slideId}_title`,
        text: `🌊 MoodFlow 会議分析レポート`
      }
    },
    {
      insertText: {
        objectId: `${slideId}_subtitle`,
        text: `Session: ${sessionId}\n総発言数: ${stats.total} | 参加者: ${stats.participants}人\n平均スコア: ${stats.average.toFixed(2)}`
      }
    }
  ];
}

/**
 * サマリースライドを作成
 */
function createSummarySlide(analysis) {
  const slideId = 'summary_slide';

  const content = `
全体の雰囲気
${analysis.overallMood}

主なインサイト
${analysis.keyInsights.map((insight, i) => `${i + 1}. ${insight}`).join('\n')}
`;

  return [
    {
      createSlide: {
        objectId: slideId,
        slideLayoutReference: { predefinedLayout: 'TITLE_AND_BODY' }
      }
    },
    {
      insertText: {
        objectId: `${slideId}_title`,
        text: '📊 会議サマリー'
      }
    },
    {
      insertText: {
        objectId: `${slideId}_body`,
        text: content.trim()
      }
    }
  ];
}

/**
 * 統計スライドを作成
 */
function createStatsSlide(stats) {
  const slideId = 'stats_slide';

  const content = `
📈 総発言数: ${stats.total}

👥 参加者数: ${stats.participants}人

💬 平均スコア: ${stats.average.toFixed(2)}

😊 ポジティブ: ${stats.positive}件 (${stats.positiveRate.toFixed(1)}%)

😢 ネガティブ: ${stats.negative}件 (${stats.negativeRate.toFixed(1)}%)

😐 ニュートラル: ${stats.neutral}件
`;

  return [
    {
      createSlide: {
        objectId: slideId,
        slideLayoutReference: { predefinedLayout: 'TITLE_AND_BODY' }
      }
    },
    {
      insertText: {
        objectId: `${slideId}_title`,
        text: '📊 統計情報'
      }
    },
    {
      insertText: {
        objectId: `${slideId}_body`,
        text: content.trim()
      }
    }
  ];
}

/**
 * 参加者分析スライドを作成
 */
function createParticipantsSlide(participantAnalyses) {
  const slideId = 'participants_slide';

  const content = participantAnalyses
    .slice(0, 8) // 上位8名
    .map(p => {
      const trendEmoji = p.trend === 'rising' ? '📈' : p.trend === 'falling' ? '📉' : '➡️';
      return `${p.nickname}: ${p.count}件 (平均${p.averageScore.toFixed(1)}) ${trendEmoji}`;
    })
    .join('\n');

  return [
    {
      createSlide: {
        objectId: slideId,
        slideLayoutReference: { predefinedLayout: 'TITLE_AND_BODY' }
      }
    },
    {
      insertText: {
        objectId: `${slideId}_title`,
        text: '👥 参加者別分析'
      }
    },
    {
      insertText: {
        objectId: `${slideId}_body`,
        text: content
      }
    }
  ];
}

/**
 * タイムラインスライドを作成
 */
function createTimelineSlide(timeline) {
  const slideId = 'timeline_slide';

  const content = timeline
    .map(interval => {
      const time = new Date(interval.startTime).toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit'
      });
      return `${time}: ${interval.avgScore.toFixed(2)} (${interval.count}件)`;
    })
    .join('\n');

  return [
    {
      createSlide: {
        objectId: slideId,
        slideLayoutReference: { predefinedLayout: 'TITLE_AND_BODY' }
      }
    },
    {
      insertText: {
        objectId: `${slideId}_title`,
        text: '⏱️ 時系列分析'
      }
    },
    {
      insertText: {
        objectId: `${slideId}_body`,
        text: content
      }
    }
  ];
}

/**
 * 推奨アクションスライドを作成
 */
function createRecommendationsSlide(analysis) {
  const slideId = 'recommendations_slide';

  let content = '✅ ポジティブな点\n';
  content += analysis.positiveHighlights.map(h => `• ${h}`).join('\n');
  content += '\n\n';

  if (analysis.concerns && analysis.concerns.length > 0) {
    content += '⚠️ 懸念事項\n';
    content += analysis.concerns.map(c => `• ${c}`).join('\n');
    content += '\n\n';
  }

  content += '🎯 推奨アクション\n';
  content += analysis.recommendations.map(r => `• ${r}`).join('\n');

  return [
    {
      createSlide: {
        objectId: slideId,
        slideLayoutReference: { predefinedLayout: 'TITLE_AND_BODY' }
      }
    },
    {
      insertText: {
        objectId: `${slideId}_title`,
        text: '💡 分析結果と推奨アクション'
      }
    },
    {
      insertText: {
        objectId: `${slideId}_body`,
        text: content.trim()
      }
    }
  ];
}

module.exports = {
  generateSlides
};
