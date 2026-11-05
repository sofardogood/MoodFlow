# 補佐やねん (MoodFlow) 環境変数設定ガイド

このドキュメントでは、**補佐やねん（MoodFlow）** で使用する環境変数について説明します。

---

## 1. 必須の環境変数

### `DATABASE_URL`
- **説明**: Prisma ORM が接続する PostgreSQL（Supabase 等）の接続文字列
- **例**:
  ```env
  DATABASE_URL="postgresql://postgres:password@db.xxxx.supabase.co:5432/postgres"
  ```

### `GEMINI_API_KEY`
- **説明**: Google Gemini API キー。会議統合分析（`lib/openai-service.js`）、5分自動要約（`lib/ai-service.js`）、A2Aユーモア介入エージェント（`lib/humor-agents.js`）で使用します。
- **取得方法**: [Google AI Studio](https://aistudio.google.com/) で API キーを発行
- **例**:
  ```env
  GEMINI_API_KEY="AIzaSy..."
  ```

---

## 2. 音声認識・外部検索・認証の環境変数（推奨）

### `GOOGLE_CLIENT_EMAIL` / `GOOGLE_PRIVATE_KEY`
- **説明**: Google Cloud Speech-to-Text API によるリアルタイム音声認識（`local-server.js`）で使用する GCP サービスアカウントのメールアドレスと秘密鍵
- **注意**: `GOOGLE_PRIVATE_KEY` の改行は `\n` を含めた文字列として設定します。
- **例**:
  ```env
  GOOGLE_CLIENT_EMAIL="moodflow-service@your-project.iam.gserviceaccount.com"
  GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----\n"
  ```

### `GOOGLE_SEARCH_ENGINE_ID` / `GOOGLE_SEARCH_API_KEY`
- **説明**: A2Aユーモア介入時にお笑い芸人やファシリテーターの話術を検索する Google Custom Search API 設定（`lib/search-service.js`）
- **備考**: `GOOGLE_SEARCH_API_KEY` を省略した場合は `GEMINI_API_KEY` が自動的に使用されます。

### `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **説明**: 管理者画面（`login.html` / `admin.html` / `dashboard.html`）での Supabase Auth ログイン認証に使用します。

### `GEMINI_MODEL`
- **説明**: 使用する Gemini モデル名の上書き設定（任意）
- **デフォルト**: 分析エンジンは `gemini-2.5-pro`、A2Aエージェントは `gemini-2.0-flash`

---

## 3. Google Slides / Sheets 連携（オプション）

| 変数名 | 説明 |
|---|---|
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Google Slides / Sheets 操作用サービスアカウントの JSON キー全体 |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | 個別指定時のサービスアカウントメールアドレス |
| `SPREADSHEET_ID` | Google スプレッドシート連携を使用する場合のシート ID |
| `GOOGLE_SLIDES_FOLDER_ID` | 自動生成した Google スライドを保存する Google Drive フォルダ ID |
| `ADMIN_PASSWORD` | 簡易管理者認証用のパスワード |

---

## 4. アラート通知・翻訳・スケジューラ設定（オプション）

| 変数名 | デフォルト値 | 説明 |
|---|---|---|
| `SLACK_WEBHOOK_URL` | なし | ネガティブ急増時の Slack Incoming Webhook URL |
| `TEAMS_WEBHOOK_URL` | なし | Microsoft Teams 用 Webhook URL |
| `ALERT_WEBHOOK_URL` | なし | 汎用 Webhook URL |
| `ALERT_WINDOW_MINUTES` | `10` | アラート判定に使う直近データの時間幅（分） |
| `ALERT_MIN_RECENT` | `5` | トレンドアラート判定に必要な最低リアクション件数 |
| `ALERT_NEG_AVG` | `-1.5` | トレンドアラートを発火する平均スコア閾値 |
| `ALERT_COOLDOWN_SECONDS` | `300` (パニック時 `180`) | 同一セッションでの連続アラート抑止クールダウン（秒） |
| `DEFAULT_TRANSLATION_LANG` | `en` | コメント自動翻訳時のターゲット言語 |
| `SSE_POLL_INTERVAL_MS` | `1000` | `/api/stream-visual-data` の配信更新間隔（ミリ秒） |
| `CRON_SECRET` | なし | `/api/cron-generate-reports` 実行時の認証シークレット |
| `REPORT_LANG` | `ja` | 定期レポート生成時の出力言語 |
| `ENABLE_SLIDE_AUTOMATION` | `false` | `true` の場合、定期レポート時に Google スライド自動生成を実行 |
| `PORT` | `3000` | `local-server.js` の待ち受けポート番号 |
