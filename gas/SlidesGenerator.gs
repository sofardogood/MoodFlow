/**
 * Googleスライド生成
 */

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
  const slide = presentation.appendSlide(SlidesApp.PredefinedLayout.TITLE_AND_BODY);

  const shapes = slide.getShapes();

  // タイトル
  shapes[0].getText().setText('📊 会議サマリー');

  // 本文
  let content = '全体の雰囲気\n';
  content += analysis.overallMood + '\n\n';

  if (analysis.timeProgression) {
    content += '⏰ 時間経過に伴う変化\n';
    content += analysis.timeProgression + '\n\n';
  }

  content += '主なインサイト\n';
  content += analysis.keyInsights.map((insight, i) => `${i + 1}. ${insight}`).join('\n');

  shapes[1].getText().setText(content);
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
  const slide = presentation.appendSlide(SlidesApp.PredefinedLayout.TITLE_AND_BODY);

  const shapes = slide.getShapes();

  // タイトル
  shapes[0].getText().setText('👥 参加者別分析');

  // 本文（上位8名）
  const content = participantAnalyses
    .slice(0, 8)
    .map(p => {
      const trendEmoji = p.trend === 'rising' ? '📈' : p.trend === 'falling' ? '📉' : '➡️';
      return `${p.nickname}: ${p.count}件 (平均${p.averageScore.toFixed(1)}) ${trendEmoji}`;
    })
    .join('\n');

  shapes[1].getText().setText(content);
}

/**
 * タイムラインスライドを作成
 */
function createTimelineSlide(presentation, timeline) {
  const slide = presentation.appendSlide(SlidesApp.PredefinedLayout.TITLE_AND_BODY);

  const shapes = slide.getShapes();

  // タイトル
  shapes[0].getText().setText('⏱️ 時系列分析');

  // 本文
  const content = timeline
    .map(interval => {
      const time = Utilities.formatDate(
        new Date(interval.startTime),
        Session.getScriptTimeZone(),
        'HH:mm'
      );
      return `${time}: ${interval.avgScore.toFixed(2)} (${interval.count}件)`;
    })
    .join('\n');

  shapes[1].getText().setText(content);
}

/**
 * 推奨アクションスライドを作成
 */
function createRecommendationsSlide(presentation, analysis) {
  const slide = presentation.appendSlide(SlidesApp.PredefinedLayout.TITLE_AND_BODY);

  const shapes = slide.getShapes();

  // タイトル
  shapes[0].getText().setText('💡 分析結果と推奨アクション');

  // 本文
  let content = '✅ ポジティブな点\n';
  content += analysis.positiveHighlights.map(h => `• ${h}`).join('\n');
  content += '\n\n';

  if (analysis.concerns && analysis.concerns.length > 0) {
    content += '⚠️ 懸念事項\n';
    content += analysis.concerns.map(c => `• ${c}`).join('\n');
    content += '\n\n';
  }

  if (analysis.speakerAdvice && analysis.speakerAdvice.length > 0) {
    content += '🎤 登壇者への具体的アドバイス\n';
    content += analysis.speakerAdvice.map(a => `• ${a}`).join('\n');
    content += '\n\n';
  }

  content += '🎯 次回に向けた推奨アクション\n';
  content += analysis.recommendations.map(r => `• ${r}`).join('\n');

  shapes[1].getText().setText(content);
}
