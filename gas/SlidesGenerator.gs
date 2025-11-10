/**
 * Googleスライド生成
 */

// スライドの文字数制限（1スライドあたりの最大文字数）
const MAX_CHARS_PER_SLIDE = 800;

// 配列を指定された数ごとに分割
function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * タイトルスライドを作成
 */
function createTitleSlide(presentation, sessionId, stats) {
  const slide = presentation.appendSlide(SlidesApp.PredefinedLayout.TITLE);

  const shapes = slide.getShapes();

  // タイトル
  shapes[0].getText().setText('MoodFlow 会議分析レポート');

  // サブタイトル
  const subtitle = `Session: ${sessionId}\n総発言数: ${stats.total} | 参加者: ${stats.participants}人\n平均スコア: ${stats.average.toFixed(2)}`;
  shapes[1].getText().setText(subtitle);
}

/**
 * サマリースライドを作成
 */
function createSummarySlide(presentation, analysis) {
  // スライド1: 全体の雰囲気と時間経過
  const slide1 = presentation.appendSlide(SlidesApp.PredefinedLayout.TITLE_AND_BODY);
  const shapes1 = slide1.getShapes();
  shapes1[0].getText().setText('📊 会議サマリー');

  let content1 = '全体の雰囲気\n';
  content1 += analysis.overallMood + '\n\n';

  if (analysis.timeProgression) {
    content1 += '⏰ 時間経過に伴う変化\n';
    content1 += analysis.timeProgression;
  }

  shapes1[1].getText().setText(content1);

  // スライド2: 主なインサイト（文字数制限を考慮）
  if (analysis.keyInsights && analysis.keyInsights.length > 0) {
    // インサイトを4つずつのグループに分割
    const insightChunks = chunkArray(analysis.keyInsights, 4);

    insightChunks.forEach((chunk, index) => {
      const slide = presentation.appendSlide(SlidesApp.PredefinedLayout.TITLE_AND_BODY);
      const shapes = slide.getShapes();

      const title = insightChunks.length > 1
        ? `💡 主なインサイト (${index + 1}/${insightChunks.length})`
        : '💡 主なインサイト';

      shapes[0].getText().setText(title);

      const content = chunk.map((insight, i) => {
        const num = index * 4 + i + 1;
        return `${num}. ${insight}`;
      }).join('\n\n');

      shapes[1].getText().setText(content);
    });
  }
}

/**
 * 統計スライドを作成
 */
function createStatsSlide(presentation, stats) {
  const slide = presentation.appendSlide(SlidesApp.PredefinedLayout.TITLE_AND_BODY);

  const shapes = slide.getShapes();

  // タイトル
  shapes[0].getText().setText('📊 統計情報');

  // 本文
  let content = '';
  content += `📈 総発言数: ${stats.total}\n\n`;
  content += `👥 参加者数: ${stats.participants}人\n\n`;
  content += `💬 平均スコア: ${stats.average.toFixed(2)}\n\n`;
  content += `😊 ポジティブ: ${stats.positive}件 (${stats.positiveRate.toFixed(1)}%)\n\n`;
  content += `😢 ネガティブ: ${stats.negative}件 (${stats.negativeRate.toFixed(1)}%)\n\n`;
  content += `😐 ニュートラル: ${stats.neutral}件`;

  shapes[1].getText().setText(content);
}

/**
 * 参加者分析スライドを作成
 */
function createParticipantsSlide(presentation, participantAnalyses) {
  // 参加者を8名ずつのグループに分割
  const participantChunks = chunkArray(participantAnalyses, 8);

  participantChunks.forEach((chunk, index) => {
    const slide = presentation.appendSlide(SlidesApp.PredefinedLayout.TITLE_AND_BODY);
    const shapes = slide.getShapes();

    const title = participantChunks.length > 1
      ? `👥 参加者別分析 (${index + 1}/${participantChunks.length})`
      : '👥 参加者別分析';

    shapes[0].getText().setText(title);

    const content = chunk.map(p => {
      const trendEmoji = p.trend === 'rising' ? '📈' : p.trend === 'falling' ? '📉' : '➡️';
      return `${p.nickname}: ${p.count}件 (平均${p.averageScore.toFixed(1)}) ${trendEmoji}`;
    }).join('\n');

    shapes[1].getText().setText(content);
  });
}

/**
 * タイムラインスライドを作成
 */
function createTimelineSlide(presentation, timeline) {
  // タイムラインを15項目ずつのグループに分割
  const timelineChunks = chunkArray(timeline, 15);

  timelineChunks.forEach((chunk, index) => {
    const slide = presentation.appendSlide(SlidesApp.PredefinedLayout.TITLE_AND_BODY);
    const shapes = slide.getShapes();

    const title = timelineChunks.length > 1
      ? `⏱️ 時系列分析 (${index + 1}/${timelineChunks.length})`
      : '⏱️ 時系列分析';

    shapes[0].getText().setText(title);

    const content = chunk.map(interval => {
      const time = Utilities.formatDate(
        new Date(interval.startTime),
        Session.getScriptTimeZone(),
        'HH:mm'
      );
      return `${time}: ${interval.avgScore.toFixed(2)} (${interval.count}件)`;
    }).join('\n');

    shapes[1].getText().setText(content);
  });
}

/**
 * 推奨アクションスライドを作成
 */
function createRecommendationsSlide(presentation, analysis) {
  // スライド1: ポジティブな点と懸念事項
  const slide1 = presentation.appendSlide(SlidesApp.PredefinedLayout.TITLE_AND_BODY);
  const shapes1 = slide1.getShapes();
  shapes1[0].getText().setText('💡 分析結果 (1/2)');

  let content1 = '✅ ポジティブな点\n';
  const positiveItems = analysis.positiveHighlights.slice(0, 3);
  content1 += positiveItems.map(h => `• ${h}`).join('\n');

  if (analysis.concerns && analysis.concerns.length > 0) {
    content1 += '\n\n⚠️ 懸念事項\n';
    const concernItems = analysis.concerns.slice(0, 3);
    content1 += concernItems.map(c => `• ${c}`).join('\n');
  }

  shapes1[1].getText().setText(content1);

  // スライド2: 登壇者へのアドバイスと推奨アクション
  const slide2 = presentation.appendSlide(SlidesApp.PredefinedLayout.TITLE_AND_BODY);
  const shapes2 = slide2.getShapes();
  shapes2[0].getText().setText('💡 推奨アクション (2/2)');

  let content2 = '';

  if (analysis.speakerAdvice && analysis.speakerAdvice.length > 0) {
    content2 += '🎤 登壇者への具体的アドバイス\n';
    const adviceItems = analysis.speakerAdvice.slice(0, 3);
    content2 += adviceItems.map(a => `• ${a}`).join('\n');
    content2 += '\n\n';
  }

  content2 += '🎯 次回に向けた推奨アクション\n';
  const recommendationItems = analysis.recommendations.slice(0, 4);
  content2 += recommendationItems.map(r => `• ${r}`).join('\n');

  shapes2[1].getText().setText(content2);
}
