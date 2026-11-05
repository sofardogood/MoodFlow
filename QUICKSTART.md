# 補佐やねん (MoodFlow) クイックスタートガイド

ローカル環境または Render.com で **補佐やねん（MoodFlow）** を最短で動かす手順です。

---

## 🚀 ローカル環境で5分セットアップ

### 1. リポジトリのクローン & パッケージインストール

```bash
git clone https://github.com/sofardogood/MoodFlow.git
cd MoodFlow
npm install
```

### 2. 環境変数ファイル (`.env`) の作成

```bash
cp .env.example .env
```

`.env` を開き、以下の項目を設定します：

```env
# 1. PostgreSQL 接続文字列 (Supabase 等)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"

# 2. Google Gemini API キー (AI分析・要約・A2Aユーモア介入用)
GEMINI_API_KEY="AIzaSy..."

# 3. Google Cloud Speech-to-Text 認証情報 (リアルタイム文字起こし用・任意)
GOOGLE_CLIENT_EMAIL="your-service-account@your-project.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# 4. Google Custom Search API (お笑い芸人・プロ話術検索用・任意)
GOOGLE_SEARCH_ENGINE_ID="your-search-engine-id"
```

### 3. データベースのセットアップ (Prisma)

```bash
npx prisma generate
npx prisma db push
```

### 4. サーバー起動

```bash
npm run dev:local
```

ブラウザで `http://localhost:3000` を開くとすぐに利用できます。

---

## 🖥️ 各画面へのアクセスと動作確認

| 画面 | URL | 確認内容 |
|---|---|---|
| **管理画面** | `http://localhost:3000/admin.html` | セッションの作成・開始・終了、参加者用URL/QRコードの発行 |
| **参加者画面** | `http://localhost:3000/?session=<SessionID>` | 感情スコア（-5〜+5）・絵文字リアクション・コメント・匿名質問の送信 |
| **プレゼンター画面** | `http://localhost:3000/presenter.html?session=<SessionID>` | マイク音声のリアルタイム文字起こし、A2Aユーモア介入アラートの受信・評価 |
| **分析ダッシュボード** | `http://localhost:3000/dashboard.html?session=<SessionID>` | リアルタイム感情推移グラフ、5分自動要約、質問管理、AI時系列統合分析 |
| **アンケート画面** | `http://localhost:3000/survey.html?session=<SessionID>` | セッション終了後の満足度・フィードバック回答 |

---

## 🎯 おすすめの体験フロー

1. **セッション開始**: `/admin.html`（または `/dashboard.html`）でセッションを作成・開始します。
2. **リアクション＆質問送信**: `/` を別タブまたはスマホで開き、絵文字リアクションや質問を送信します。
3. **音声認識＆A2Aユーモア介入**: `/presenter.html` でマイク録音を開始するか、ユーモア介入テストを実行します。会議の発言が関西弁なら**関西エージェント**、標準語なら**関東エージェント**がアドバイスを生成し、短い警告メッセージが表示されます。
4. **介入評価（学習サイクル）**: 提示されたアドバイスを5段階評価すると DB（`InterventionLog`）に記録され、次回以降の介入プロンプト（RAG）に活かされます。
5. **セッション終了＆統合分析**: セッションを終了すると参加者画面にアンケートモーダルが表示されます。回答後、ダッシュボードで **AI統合分析** を実行すると、時間帯別のムードと発言内容の相関レポートが生成されます。

---

## 🌐 クラウドへのデプロイ

Socket.IO によるリアルタイム音声ストリーミングを使用するため、本番デプロイには **Render.com** を推奨します。

- 手順詳細: [docs/DEPLOYMENT_RENDER.md](docs/DEPLOYMENT_RENDER.md)
- アーキテクチャ・全体デプロイ解説: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
