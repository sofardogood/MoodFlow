# 補佐やねん (MoodFlow) API 仕様書

補佐やねん（MoodFlow）のバックエンド API（REST / Server-Sent Events / Socket.IO）の詳細仕様です。

---

## 1. セッション管理 API

### `GET /api/session?sessionId={id}`
セッションの現在の状態（アクティブ状態、タイトル、開始時刻など）を取得します。

### `POST /api/session`
セッションの作成・開始・終了を制御します。

```json
{
  "action": "start | end | create",
  "sessionId": "session-123",
  "name": "週次定例ミーティング"
}
```

### `GET / POST /api/my-sessions`
ログイン中の管理者ユーザーが所有するセッション一覧の取得および新規セッション作成を行います。

---

## 2. リアルタイム反応・文字起こし・Q&A API

### `POST /api/submit-mood`
参加者の感情スコア（`-5` 〜 `+5`）、絵文字、コメント、属性情報を送信します。
コメントがある場合は Gemini API による自動翻訳とインサイト分類（`decision` / `concern` / `idea` / `other`）が行われ、強いネガティブ反応時は Webhook アラート判定（`lib/alerts.js`）が実行されます。

**リクエスト**
```json
{
  "sessionId": "session-123",
  "nickname": "キリンさん",
  "moodScore": 3,
  "comment": "新しいUI案とても分かりやすいです！",
  "emoticon": "😊",
  "role": "engineer",
  "department": "product",
  "theme": "UI改善"
}
```

### `POST /api/submit-transcript`
文字起こしテキストをセッションに保存します。

```json
{
  "sessionId": "session-123",
  "text": "それでは次のアジェンダに移ります。",
  "speaker": "Presenter"
}
```

### `GET / POST / PUT /api/questions`
匿名質問・要望の取得、新規投稿、投票（「いいね」）、ステータス変更（`open` / `answered` / `archived`）を行います。

---

## 3. A2A（Agent-to-Agent）ユーモア介入 API

### `POST /api/humor-intervention`
会議の文脈・文字起こしを分析し、方言判定（関西弁 / 標準語）に応じたエージェント選択、Google Custom Search によるプロの話術検索、過去の成功事例（RAG）を組み合わせたアドバイスと短い警告メッセージを生成します。

**リクエスト**
```json
{
  "sessionId": "session-123",
  "context": "えー、ほな次のスライドいきますわ。みなさんちょっと眠そうやなぁ..."
}
```

**レスポンス**
```json
{
  "success": true,
  "interventionId": 12,
  "data": {
    "dialect": "kansai",
    "agentUsed": "関西エージェント",
    "advice": "ちょっと空気が重くなってるで！一回質問タイム挟んで場をほぐそか。",
    "warning": "⚠️ 参加者の反応が薄いです。『ここまででツッコミどころある人〜？』と明るく振ってみましょう！"
  }
}
```

### `POST /api/rate-intervention`
提示された介入提案の効果を発表者が `1` 〜 `5` で評価します。`rating >= 4` の高評価データは次回以降の介入プロンプト（RAG）で自動的に参照されます。

```json
{
  "interventionId": 12,
  "rating": 5
}
```

---

## 4. 可視化・アンケート・AI統合分析 API

### `GET /api/get-visual-data?sessionId={id}`
ダッシュボード描画用のムード履歴、文字起こし、質問一覧、ハイライト、統計データを一括取得します。

### `GET /api/stream-visual-data?sessionId={id}`
**Server-Sent Events (SSE)** により、セッションの最新データをリアルタイムストリーム配信します。

### `GET /api/get-summaries?sessionId={id}`
5分ごとのバックグラウンドスケジューラ（`lib/scheduler.js`）によって生成された AI 自動要約の一覧を取得します。

### `POST /api/submit-survey` & `GET /api/get-survey?sessionId={id}`
セッション終了後のアンケート回答（満足度 `1`〜`5`、良かった点、改善点）の送信および集計結果の取得を行います。

### `POST /api/analyze-session`
ムードデータ、5分要約、文字起こし、事後アンケートを統合し、Gemini API で時系列相関分析レポートを生成します。

**レスポンスに含まれる主な分析項目**
- `overallMood`: 会議全体の雰囲気要約
- `keyInsights`: 重要な気づきリスト
- `positiveHighlights` / `concerns`: ムードが上がった話題・下がった話題の具体分析
- `timelinedAdvice`: 時間帯別のムードトレンドと推奨アクション
- `moodCorrelations`: 特定のトピック・発言内容とムード変動の相関
- `executiveSummary`: 経営層向けサマリー
- `facilitatorCues`: ファシリテーター向け介入ヒント

---

## 5. コホート分析・比較・エクスポート・その他 API

| メソッド & パス | 説明 |
|---|---|
| `GET /api/cohort-stats?sessionId={id}` | 部署（`department`）・役職（`role`）・テーマ（`theme`）別の平均スコア・件数統計 |
| `GET /api/compare-sessions?sessions=id1,id2` | 複数セッション間の平均スコア・ポジティブ率・参加者数の比較 |
| `GET / POST /api/highlights` | 重要発言やムードのハイライト登録・一覧取得 |
| `POST /api/tag-override` | 自動分類されたタグ（`decision` / `concern` / `idea` / `other`）の手動変更 |
| `GET /api/interventions?sessionId={id}` | 直近のムード傾向に基づくルールベースのファシリテーション提案取得 |
| `GET /api/export?sessionId={id}&format=csv\|json` | セッションデータの CSV または JSON エクスポート |
| `POST /api/generate-slides` | 分析結果から Google スライドのプレゼンテーションを自動生成 |
| `GET /api/cron-generate-reports` | アクティブセッションの定期レポート生成バッチエンドポイント |

---

## 6. Socket.IO リアルタイム音声認識イベント (`local-server.js`)

| イベント名 | 方向 | ペイロード / 動作 |
|---|---|---|
| `start-stream` | Client → Server | Google Cloud Speech-to-Text ストリーミング認識（`WEBM_OPUS`, 48000Hz, `ja-JP`）を開始 |
| `audio-data` | Client → Server | ブラウザの `MediaRecorder` から取得した音声バイナリチャンクを送信 |
| `speech-result` | Server → Client | `{ transcript: string, isFinal: boolean }` 認識テキストをリアルタイム返却 |
| `speech-error` | Server → Client | 音声認識エラーメッセージを通知 |
| `end-stream` | Client → Server | 音声認識ストリームを終了 |
