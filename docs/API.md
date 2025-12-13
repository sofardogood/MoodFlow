# 補佐やねん API 仕様書

補佐やねんのバックエンドAPIの詳細仕様です。

## 概要

補佐やねんは、Google Apps Script（GAS）で実装されたRESTful風APIを提供します。すべてのリクエストは `doPost()` 関数を通じて処理されます。

## エンドポイント

ベースURL: デプロイ時に生成されるWebアプリのURL

## 認証

現在のバージョンでは、セッションIDベースの簡易認証を使用しています。

## リクエスト形式

すべてのリクエストはJSON形式で送信されます。

```javascript
{
  "action": "アクション名",
  "param1": "値1",
  "param2": "値2"
}
```

## レスポンス形式

すべてのレスポンスはJSON形式で返されます。

### 成功時
```javascript
{
  "success": true,
  "data": { ... }
}
```

### エラー時
```javascript
{
  "success": false,
  "error": "エラーメッセージ"
}
```

## API一覧

### セッション管理

#### セッション作成
新しい会議セッションを作成します。

**リクエスト**
```javascript
{
  "action": "createSession",
  "meetingTitle": "会議タイトル"
}
```

**レスポンス**
```javascript
{
  "success": true,
  "sessionId": "uuid-xxxx-xxxx",
  "meetingTitle": "会議タイトル",
  "startTime": "2024-01-01T10:00:00.000Z",
  "url": "https://script.google.com/..."
}
```

#### セッション参加
参加者がセッションに参加します。

**リクエスト**
```javascript
{
  "action": "joinSession",
  "sessionId": "uuid-xxxx-xxxx",
  "nickname": "キリンさん",
  "deviceInfo": "Mozilla/5.0..."
}
```

**レスポンス**
```javascript
{
  "success": true,
  "participantId": "uuid-yyyy-yyyy",
  "sessionId": "uuid-xxxx-xxxx",
  "nickname": "キリンさん",
  "joinTime": "2024-01-01T10:05:00.000Z"
}
```

#### セッション終了
会議セッションを終了します。

**リクエスト**
```javascript
{
  "action": "endSession",
  "sessionId": "uuid-xxxx-xxxx"
}
```

**レスポンス**
```javascript
{
  "success": true,
  "sessionId": "uuid-xxxx-xxxx",
  "endTime": "2024-01-01T11:00:00.000Z"
}
```

#### セッション状態取得
セッションの現在の状態を取得します。

**リクエスト**
```javascript
{
  "action": "getSessionStatus",
  "sessionId": "uuid-xxxx-xxxx"
}
```

**レスポンス**
```javascript
{
  "success": true,
  "sessionId": "uuid-xxxx-xxxx",
  "meetingTitle": "会議タイトル",
  "startTime": "2024-01-01T10:00:00.000Z",
  "endTime": null,
  "status": "active",
  "createdBy": "user@example.com"
}
```

### データ送信

#### ムードデータ送信
参加者が感情スコアとコメントを送信します。

**リクエスト**
```javascript
{
  "action": "submitMood",
  "sessionId": "uuid-xxxx-xxxx",
  "participantId": "uuid-yyyy-yyyy",
  "moodScore": 3,
  "comment": "いいアイデアだと思います！",
  "emoticon": "😊"
}
```

**パラメータ**
- `moodScore`: -5〜+5の整数
- `comment`: 文字列（オプション）
- `emoticon`: 絵文字（オプション）

**レスポンス**
```javascript
{
  "success": true,
  "recordId": "uuid-zzzz-zzzz",
  "timestamp": "2024-01-01T10:10:00.000Z"
}
```

### 分析取得

#### リアルタイム分析取得
セッションのリアルタイム分析データを取得します。

**リクエスト**
```javascript
{
  "action": "getRealTimeAnalysis",
  "sessionId": "uuid-xxxx-xxxx"
}
```

**レスポンス**
```javascript
{
  "success": true,
  "timestamp": "2024-01-01T10:30:00.000Z",
  "statistics": {
    "count": 25,
    "average": 2.4,
    "max": 5,
    "min": -2,
    "positive": 18,
    "negative": 5,
    "neutral": 2,
    "positiveRate": 72.0,
    "negativeRate": 20.0
  },
  "timeIntervals": [
    {
      "startTime": "2024-01-01T10:00:00.000Z",
      "endTime": "2024-01-01T10:05:00.000Z",
      "avgMoodScore": 2.5,
      "count": 5,
      "comments": [...]
    }
  ],
  "participantStats": [
    {
      "participantId": "uuid-yyyy-yyyy",
      "nickname": "キリンさん",
      "count": 5,
      "average": 3.2,
      "max": 5,
      "min": 1,
      "stdDev": 1.5,
      "commentCount": 3,
      "trend": "rising"
    }
  ],
  "recentMoods": [...]
}
```

#### 参加者個別分析取得
特定参加者の分析データを取得します。

**リクエスト**
```javascript
{
  "action": "getParticipantAnalysis",
  "sessionId": "uuid-xxxx-xxxx",
  "participantId": "uuid-yyyy-yyyy"
}
```

**レスポンス**
```javascript
{
  "success": true,
  "participantId": "uuid-yyyy-yyyy",
  "statistics": {
    "count": 5,
    "average": 3.2,
    "max": 5,
    "min": 1,
    "positive": 4,
    "negative": 0,
    "neutral": 1
  },
  "chartData": [
    {
      "time": "10:05",
      "score": 3,
      "comment": "いいですね"
    }
  ],
  "moodData": [...],
  "trend": "rising"
}
```

### レポート生成

#### 最終レポート生成
会議終了時の総合レポートを生成します。

**リクエスト**
```javascript
{
  "action": "generateReport",
  "sessionId": "uuid-xxxx-xxxx"
}
```

**レスポンス**
```javascript
{
  "success": true,
  "report": {
    "sessionInfo": {
      "sessionId": "uuid-xxxx-xxxx",
      "meetingTitle": "会議タイトル",
      "startTime": "2024-01-01T10:00:00.000Z",
      "endTime": "2024-01-01T11:00:00.000Z",
      "duration": {
        "totalMinutes": 60,
        "hours": 1,
        "minutes": 0,
        "formatted": "1時間0分"
      },
      "participantCount": 10
    },
    "overallStatistics": {...},
    "timelineData": [...],
    "participantStats": [...],
    "aiSummary": {
      "overallMood": "全体的にポジティブで建設的な雰囲気",
      "keyTopics": ["予算", "スケジュール", "リソース"],
      "positivePoints": [...],
      "concerns": [...],
      "turningPoints": [...],
      "recommendations": [...]
    },
    "turningPoints": [...],
    "participantAnalyses": [...]
  }
}
```

## データモデル

### Session（セッション）
```typescript
{
  sessionId: string;        // UUID
  meetingTitle: string;     // 会議タイトル
  startTime: Date;          // 開始時刻
  endTime: Date | null;     // 終了時刻
  status: 'active' | 'completed';
  createdBy: string;        // 作成者のメールアドレス
}
```

### Participant（参加者）
```typescript
{
  participantId: string;    // UUID
  sessionId: string;        // セッションID
  nickname: string;         // ニックネーム
  joinTime: Date;           // 参加時刻
  deviceInfo: string;       // デバイス情報
}
```

### MoodData（ムードデータ）
```typescript
{
  recordId: string;         // UUID
  sessionId: string;        // セッションID
  participantId: string;    // 参加者ID
  nickname: string;         // ニックネーム
  timestamp: Date;          // タイムスタンプ
  moodScore: number;        // -5〜+5
  comment: string;          // コメント
  emoticon: string;         // 絵文字
}
```

## エラーコード

| エラーメッセージ | 説明 | 対処法 |
|----------------|------|--------|
| Session not found or not active | セッションが見つからないか、終了済み | 正しいセッションIDを使用 |
| Participant not found | 参加者が見つからない | 先にjoinSessionを実行 |
| GEMINI_API_KEY not set | Gemini APIキーが未設定 | スクリプトプロパティで設定 |
| Gemini API error | Gemini API呼び出しエラー | APIキーの確認、クォータ確認 |

## レート制限

- GAS実行時間制限: 6分/実行
- Gemini API: 無料枠の制限に準拠
- スプレッドシート書き込み: バッチ処理で最適化済み

## キャッシュ戦略

- セッション情報: 5分間キャッシュ
- 参加者情報: 5分間キャッシュ
- CacheService を使用

## ベストプラクティス

1. **エラーハンドリング**
   - すべてのレスポンスで `success` フィールドを確認
   - エラー時は `error` フィールドのメッセージを表示

2. **パフォーマンス**
   - 頻繁なポーリングを避ける
   - リアルタイム分析は30秒〜1分間隔で取得推奨

3. **データ量**
   - 長時間の会議では定期的にデータをエクスポート
   - スプレッドシートの行数制限に注意（最大1000万セル）

## サンプルコード

### クライアント側（参加者アプリ）

```javascript
// セッション参加
function joinSession(sessionId, nickname) {
  google.script.run
    .withSuccessHandler(function(result) {
      if (result.success) {
        localStorage.setItem('participantId', result.participantId);
        showInputScreen();
      }
    })
    .doPost({
      action: 'joinSession',
      sessionId: sessionId,
      nickname: nickname,
      deviceInfo: navigator.userAgent
    });
}

// ムード送信
function submitMood(sessionId, participantId, score, comment) {
  google.script.run
    .withSuccessHandler(function(result) {
      if (result.success) {
        showSuccess('送信しました！');
      }
    })
    .doPost({
      action: 'submitMood',
      sessionId: sessionId,
      participantId: participantId,
      moodScore: score,
      comment: comment,
      emoticon: getEmoticon(score)
    });
}
```

## 変更履歴

- v1.0.0 (2024-01-01): 初版リリース
