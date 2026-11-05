# 補佐やねん (MoodFlow) 🌊🎭

> **「会議を可視化し、分析し、その場で変える」**  
> リアルタイムの感情・質問収集から、音声文字起こし・自動要約、A2A（Agent-to-Agent）によるユーモア介入、事後アンケート連携の時系列AI統合分析までを一気通貫で提供するAI会議支援システム

---

## 📌 リポジトリ概要

**補佐やねん（MoodFlow）** は、オンライン会議・研修・講義・ワークショップにおいて「参加者の本音や空気感が見えない」「反応が薄く場が重くなってもその場で対処できない」という課題を解決する **リアルタイム会議可視化・AIファシリテーション支援プラットフォーム** です。

参加者はスマートフォンやPCから匿名で感情スコア（`-5` 〜 `+5`）・絵文字リアクション・コメント・質問をリアルタイムに送信でき、発表者の音声は **Socket.IO + Google Cloud Speech-to-Text** によってリアルタイムに文字起こしされます。さらに、会議のムードが低下した際には **A2A（Agent-to-Agent）マルチエージェント構成**（ホストエージェント・関西エージェント・関東エージェント）が会議の方言・言語スタイルを判定し、**Google Custom Search API** で取得したお笑い芸人やプロのファシリテーターの話術と、過去の成功事例（**RAG学習サイクル**）を掛け合わせて、発表者へ即座に空気改善のアドバイス・警告を提示します。

会議終了後には参加者を自動で事後アンケートへ誘導し、**「感情推移 × 発言文字起こし × 5分自動要約 × アンケート結果」** を **Google Gemini API** で時系列統合分析。どの話題でムードが上下したかの相関分析や改善アクションの抽出、さらには **Google Slides API** によるプレゼンレポート自動生成までをサポートします。

---

## ✨ 主な機能

| カテゴリ | 機能 | 概要 |
|---|---|---|
| **① リアルタイム感情・反応収集** | ムードスコア・絵文字・コメント送信 | `-5`（ネガティブ）〜 `+5`（ポジティブ）のスコア、絵文字、コメント、属性（役職・部署・テーマ）を匿名（ハッシュ化ID）で記録。コメントの自動多言語翻訳・インサイト自動タグ付け（`decision` / `concern` / `idea` / `other`）に対応。 |
| **② 匿名Q&A・投票** | 質問投稿・リアルタイム投票 | 発言しづらい参加者でも匿名で質問・要望を投稿可能。「いいね」投票による優先度ソートとステータス管理（`open` / `answered` / `archived`）を提供。 |
| **③ 音声認識・5分自動要約** | ストリーミング文字起こし＆要約 | ブラウザのマイク音声を **Socket.IO** でストリーミングし、**Google Cloud Speech-to-Text** でリアルタイム日本語文字起こし。バックグラウンドスケジューラが5分ごとに **Gemini API** で自動要約し、生データをクリーンアップしてDB肥大化を防止。 |
| **④ A2Aユーモア介入システム** | 方言ルーティング × Web検索 × RAG学習 | ムード低下時に **HostAgent** が会議の言語スタイル（関西弁 / 標準語）を検出し、**関西エージェント** または **関東エージェント** にルーティング。プロの盛り上げ術のWeb検索結果と過去の高評価介入ログ（`successRating >= 4`）を参照し、発表者へ1〜2文の具体的な声かけ・警告を提案。 |
| **⑤ 事後アンケート＆AI時系列統合分析** | 4種データの時系列相関分析 | セッション終了時に参加者画面へアンケートモーダルを自動表示。ムード・文字起こし・5分要約・アンケートを統合し、時間帯別アドバイス、話題と感情の相関（`moodCorrelations`）、経営層向けサマリーを生成。 |
| **⑥ ダッシュボード・アラート・連携** | SSE可視化・コホート分析・外部通知 | **Server-Sent Events (SSE)** によるリアルタイムグラフ更新、部署・役職別のコホート分析、複数セッション比較、ハイライト管理、CSV/JSONエクスポート、ネガティブ急増時の **Slack / Microsoft Teams / Webhook アラート通知**、**Googleスライド自動生成**、**MCPサーバー** を搭載。 |

---

## 📐 UML 図・システム設計

### 1. システムアーキテクチャ図（Component Diagram）

```mermaid
flowchart TB
    subgraph Clients["クライアント層 (Browser / AI Client)"]
        ParticipantUI["参加者画面<br/>(public/index.html, survey.html)"]
        PresenterUI["プレゼンター画面<br/>(public/presenter.html)"]
        DashboardUI["分析ダッシュボード / 管理画面<br/>(public/dashboard.html, admin.html)"]
        MCPClient["MCP クライアント<br/>(Claude Desktop 等)"]
    end

    subgraph Server["アプリケーションサーバー層 (Node.js / Express)"]
        ExpressApp["Express HTTP Server<br/>(local-server.js)"]
        RESTAPI["REST / SSE API ハンドラ群<br/>(api/*.js)"]
        SocketIO["Socket.IO サーバー<br/>(音声ストリーム中継)"]
        Scheduler["5分自動要約スケジューラ<br/>(lib/scheduler.js)"]
        MCPServer["MCP Server (stdio)<br/>(mcp-server.js)"]
    end

    subgraph Services["ドメインサービス層 (lib/)"]
        HumorOrchestrator["A2A HumorOrchestrator<br/>(lib/humor-agents.js)"]
        AnalysisService["AI統合分析・翻訳サービス<br/>(lib/openai-service.js, ai-service.js)"]
        AlertService["ネガティブ検知・Webhook通知<br/>(lib/alerts.js)"]
        SearchService["Web検索サービス<br/>(lib/search-service.js)"]
        SlidesService["Google Slides / Sheets 連携<br/>(lib/slides-generator.js, sheets.js)"]
        DBService["データアクセス層 / Prisma Client<br/>(lib/db.js, lib/prisma.js)"]
    end

    subgraph External["外部クラウド・AIサービス / データベース"]
        SupabaseDB[("PostgreSQL<br/>(Supabase / Prisma)")]
        SupabaseAuth["Supabase Auth<br/>(管理者認証)"]
        GeminiAPI["Google Gemini API<br/>(分析・要約・A2Aエージェント)"]
        SpeechAPI["Google Cloud<br/>Speech-to-Text API"]
        CustomSearch["Google Custom Search API<br/>(芸人・司会テクニック検索)"]
        GoogleWorkspace["Google Slides / Sheets API<br/>(レポート出力)"]
        Webhooks["Slack / Teams / 汎用 Webhook<br/>(リアルタイムアラート)"]
    end

    ParticipantUI -->|"REST (ムード/質問/アンケート)"| ExpressApp
    PresenterUI -->|"WebSocket (WebM/Opus音声)"| SocketIO
    PresenterUI -->|"REST (A2A介入要求・評価)"| ExpressApp
    DashboardUI -->|"SSE (/api/stream-visual-data) / REST"| ExpressApp
    DashboardUI -->|"JWT 認証"| SupabaseAuth
    MCPClient <-->|"stdio (JSON-RPC)"| MCPServer

    ExpressApp --> RESTAPI
    SocketIO -->|"gRPC ストリーム"| SpeechAPI
    RESTAPI --> HumorOrchestrator
    RESTAPI --> AnalysisService
    RESTAPI --> AlertService
    RESTAPI --> SlidesService
    RESTAPI --> DBService
    Scheduler --> AnalysisService
    Scheduler --> DBService
    MCPServer --> DBService

    HumorOrchestrator --> GeminiAPI
    HumorOrchestrator --> SearchService
    HumorOrchestrator --> DBService
    SearchService --> CustomSearch
    AnalysisService --> GeminiAPI
    AlertService --> Webhooks
    SlidesService --> GoogleWorkspace
    DBService --> SupabaseDB
```

---

### 2. A2A（Agent-to-Agent）ユーモア介入＆RAG学習シーケンス図（Sequence Diagram）

```mermaid
sequenceDiagram
    autonumber
    actor Presenter as 発表者 (presenter.html)
    participant API as /api/humor-intervention
    participant Orch as HumorOrchestrator
    participant Search as SearchService (Google検索)
    participant DB as Prisma / PostgreSQL
    participant Host as HostAgent (MC・分析)
    participant Kansai as 関西エージェント
    participant Kanto as 関東エージェント

    Presenter->>API: POST /api/humor-intervention { context, sessionId }
    API->>Orch: intervene(context)
    
    par プロの話術検索と過去の成功事例取得 (RAG)
        Orch->>Search: searchWeb("お笑い芸人 話の振り方 場の空気 盛り上げ方...")
        Search-->>Orch: searchResults (上位3件のテクニック)
    and
        Orch->>Host: learnFromHistory()
        Host->>DB: findMany(successRating >= 4, 最新3件)
        DB-->>Host: lessonsLearned (過去の成功介入ログ)
        Host-->>Orch: lessonsLearned
    end

    Orch->>Host: detectDialect(context)
    Note over Host: 発言の語尾・語彙から<br/>関西弁("kansai") / 標準語("standard")を判定
    Host-->>Orch: dialect ("kansai" | "standard")

    alt dialect === "kansai"
        Orch->>Kansai: generateAdvice(context, lessonsLearned, searchResults)
        Kansai-->>Orch: 関西弁でのユーモア改善アドバイス
    else dialect === "standard"
        Orch->>Kanto: generateAdvice(context, lessonsLearned, searchResults)
        Kanto-->>Orch: 標準語での建設的・丁寧な改善アドバイス
    end

    Orch->>Host: createWarning(context, agentName, advice)
    Note over Host: 発表者が即座に使える1〜2文の<br/>短い警告・声かけセリフに要約
    Host-->>Orch: warning ("⚠️ 参加者の反応が薄いです...")

    Orch-->>API: { dialect, agentUsed, advice, warning }
    API->>DB: InterventionLog.create({ sessionId, context, dialogue, suggestion })
    DB-->>API: log.id (interventionId)
    API-->>Presenter: 200 OK { interventionId, data }

    Note over Presenter,DB: 【学習サイクル】介入後、発表者が効果(1〜5)を評価すると次回以降のRAGに反映
    Presenter->>API: POST /api/rate-intervention { interventionId, rating: 5 }
    API->>DB: InterventionLog.update({ successRating: 5 })
```

---

### 3. 会議ライフサイクル全体のワークフロー図（Activity Diagram）

```mermaid
flowchart LR
    subgraph Phase1["1. 準備フェーズ"]
        A1["管理者ログイン<br/>(/login.html)"] --> A2["セッション作成・開始<br/>(/admin.html)"]
        A2 --> A3["参加URL / QRコード共有"]
    end

    subgraph Phase2["2. 会議実行・リアルタイム介入フェーズ"]
        B1["参加者: 感情スコア・絵文字・質問送信<br/>(/index.html)"]
        B2["発表者: マイク音声ストリーミング文字起こし<br/>(/presenter.html)"]
        B3["5分ごと自動AI要約 & 生文字起こし整理<br/>(lib/scheduler.js)"]
        B4{"ムード低下 /<br/>ネガティブ急増?"}
        B5["A2Aユーモア介入提案 &<br/>Slack/Teams Webhook通知"]

        B1 & B2 --> B4
        B2 --> B3
        B4 -->|"Yes"| B5
        B5 -->|"発表者が評価 (1〜5)"| B6[("知識DB蓄積<br/>InterventionLog")]
    end

    subgraph Phase3["3. 終了・統合分析フェーズ"]
        C1["管理者: セッション終了"] --> C2["参加者画面にアンケートモーダル自動表示<br/>(/survey.html)"]
        C2 --> C3["AI時系列統合分析<br/>(ムード × 文字起こし × 要約 × アンケート)"]
        C3 --> C4["ダッシュボード可視化 /<br/>Googleスライド自動生成 / CSV・JSON出力"]
    end

    Phase1 --> Phase2 --> Phase3
```

---

### 4. ドメインモデル・クラス／ER図（Class Diagram）

```mermaid
classDiagram
    class User {
        +Int id
        +String email
        +String password
        +String name
        +DateTime createdAt
    }

    class Session {
        +String id
        +String name
        +Boolean isActive
        +Int ownerId
        +DateTime createdAt
    }

    class Mood {
        +Int id
        +String sessionId
        +String nickname
        +String hashedNickname
        +Int score
        +String comment
        +String translatedComment
        +String language
        +String tag
        +String role
        +String department
        +String theme
        +String emoticon
        +DateTime createdAt
    }

    class Transcript {
        +Int id
        +String sessionId
        +String text
        +String speaker
        +String tag
        +String language
        +DateTime createdAt
    }

    class Summary {
        +Int id
        +String sessionId
        +String content
        +DateTime startTime
        +DateTime endTime
        +DateTime createdAt
    }

    class SurveyResponse {
        +Int id
        +String sessionId
        +String nickname
        +String hashedNickname
        +String role
        +String department
        +Int satisfaction
        +String positive
        +String improvement
        +DateTime createdAt
    }

    class Question {
        +Int id
        +String sessionId
        +String nickname
        +String hashedNickname
        +String text
        +String status
        +DateTime createdAt
    }

    class QuestionVote {
        +Int id
        +Int questionId
        +String hashedNickname
        +DateTime createdAt
    }

    class Highlight {
        +Int id
        +String sessionId
        +String text
        +String tag
        +String sourceType
        +Int sourceId
        +DateTime createdAt
    }

    class TagOverride {
        +Int id
        +String sessionId
        +String sourceType
        +Int sourceId
        +String tag
        +DateTime createdAt
    }

    class InterventionLog {
        +Int id
        +String sessionId
        +String context
        +String dialogue
        +String suggestion
        +Int successRating
        +DateTime createdAt
    }

    class HumorOrchestrator {
        -HostAgent host
        -KansaiAgent kansai
        -KantoAgent kanto
        +intervene(moodContext) Promise~Object~
    }

    class HostAgent {
        +learnFromHistory() Promise~InterventionLog[]~
        +detectDialect(context) Promise~String~
        +createWarning(context, agentName, advice) Promise~String~
    }

    class Agent {
        +String name
        +String persona
        +generateAdvice(context, lessonsLearned, searchResults) Promise~String~
    }

    class KansaiAgent
    class KantoAgent

    User "1" --> "*" Session : owns
    Session "1" --> "*" Mood : records
    Session "1" --> "*" Transcript : transcribes
    Session "1" --> "*" Summary : summarizes
    Session "1" --> "*" SurveyResponse : collects
    Session "1" --> "*" Question : receives
    Session "1" --> "*" Highlight : highlights
    Question "1" --> "*" QuestionVote : has votes
    HumorOrchestrator *-- HostAgent
    HumorOrchestrator *-- KansaiAgent
    HumorOrchestrator *-- KantoAgent
    Agent <|-- KansaiAgent
    Agent <|-- KantoAgent
    HostAgent ..> InterventionLog : reads high-rated logs (RAG)
```

---

## 🛠 技術スタック

| レイヤー | 使用技術 | 用途 |
|---|---|---|
| **フロントエンド** | HTML5, CSS3, Vanilla JavaScript, Chart.js, Socket.IO Client | 参加者UI、プレゼンターUI、リアルタイムダッシュボード、管理画面 |
| **バックエンド** | Node.js (`>=18`), Express.js (`v5`), Socket.IO (`v4`) | REST API、SSEストリーミング、WebSocket音声ストリーム処理 |
| **データベース / ORM** | PostgreSQL (Supabase), Prisma ORM (`v5.22`), Google Sheets (互換) | セッション、ムード、文字起こし、要約、質問、アンケート、介入ログの永続化 |
| **認証** | Supabase Auth (`@supabase/supabase-js`) / パスワード認証 | 管理者ログイン・マイセッション管理 |
| **AI / LLM** | Google Gemini API (`@google/generative-ai`: `gemini-2.5-pro` / `gemini-2.0-flash`) | 時系列統合分析、5分自動要約、翻訳、インサイト分類、A2Aユーモア介入 |
| **音声認識** | Google Cloud Speech-to-Text (`@google-cloud/speech`) | 発表者マイク音声（WebM/Opus 48kHz）のリアルタイム日本語文字起こし |
| **外部検索・連携** | Google Custom Search API, Google Slides / Drive API, Slack / Teams Webhook | 芸人・司会テクニック検索、スライド自動生成、ネガティブ急増アラート通知 |
| **AIエージェント連携** | Model Context Protocol SDK (`@modelcontextprotocol/sdk`) | MCP対応クライアント（Claude Desktop等）へのツール・リソース提供 |
| **ホスティング** | Render.com（推奨：WebSocket常時接続対応） / Vercel | 本番Webサービス稼働 |

---

## 📁 プロジェクト構造

```text
MoodFlow/
├── public/                        # フロントエンド静的ファイル
│   ├── index.html                 # 参加者用リアクション・質問入力画面
│   ├── presenter.html             # 発表者用リアルタイム音声認識・A2A介入表示画面
│   ├── dashboard.html             # リアルタイム分析・要約・コホート可視化ダッシュボード
│   ├── admin.html                 # セッション管理・QR発行・スライド生成画面
│   ├── survey.html                # セッション終了後アンケート画面
│   ├── login.html                 # 管理者ログイン画面 (Supabase Auth)
│   ├── checkAuth.js               # クライアント認証ガードスクリプト
│   └── logo.png                   # 「補佐やねん」ロゴ画像
├── api/                           # APIエンドポイントハンドラ (Express / Vercel 両対応)
│   ├── submit-mood.js             # ムード・コメント送信 (自動翻訳・タグ分類・アラート判定)
│   ├── submit-transcript.js       # 文字起こしテキスト保存
│   ├── get-visual-data.js         # 可視化用セッションデータ一括取得
│   ├── stream-visual-data.js      # SSE (Server-Sent Events) リアルタイムデータ配信
│   ├── humor-intervention.js      # A2Aユーモア介入実行・ログ保存
│   ├── rate-intervention.js       # 介入効果の評価登録 (1〜5段階、RAG学習用)
│   ├── analyze-session.js         # Geminiによる時系列統合AI分析
│   ├── get-summaries.js           # 5分ごとのAI要約一覧取得
│   ├── questions.js               # 匿名Q&A投稿・投票・ステータス更新
│   ├── highlights.js              # 重要ハイライトの登録・取得
│   ├── tag-override.js            # 自動分類タグの手動上書き
│   ├── submit-survey.js           # 事後アンケート回答送信
│   ├── get-survey.js              # 事後アンケート集計・一覧取得
│   ├── cohort-stats.js            # 部署・役職・テーマ別コホート統計取得
│   ├── compare-sessions.js        # 複数セッション間のスコア・指標比較
│   ├── interventions.js           # ルールベースのファシリテーション介入ヒント取得
│   ├── export.js                  # セッションデータの CSV / JSON エクスポート
│   ├── session.js                 # セッション状態取得・開始・終了制御
│   ├── my-sessions.js             # ログインユーザー所有セッションの作成・一覧取得
│   ├── generate-slides.js         # Googleスライドレポート自動生成
│   ├── cron-generate-reports.js   # 定期レポート自動生成バッチ用エンドポイント
│   ├── auth.js / auth-config.js   # Supabase Auth 連携エンドポイント
│   └── admin-login.js / get-session-data.js
├── lib/                           # ビジネスロジック・外部サービス連携モジュール
│   ├── humor-agents.js            # A2A マルチエージェント (Host / 関西 / 関東) & RAG学習
│   ├── openai-service.js          # Gemini 統合会議分析・時系列相関・翻訳・分類エンジン
│   ├── ai-service.js              # 5分文字起こし要約・質問抽出サービス
│   ├── scheduler.js               # 5分間隔の自動要約＆生文字起こし削除スケジューラ
│   ├── search-service.js          # Google Custom Search API 連携 (話術・テクニック検索)
│   ├── alerts.js                  # ネガティブ急増検知 & Slack / Teams / Webhook 通知
│   ├── db.js                      # Prisma / Google Sheets ハイブリッドデータアクセス層
│   ├── prisma.js                  # Prisma Client シングルトンインスタンス
│   ├── supabaseClient.js          # Supabase クライアント初期化
│   ├── slides-generator.js        # Google Slides API スライド構築ロジック
│   └── sheets.js                  # Google Sheets API 操作ロジック
├── prisma/
│   └── schema.prisma              # Prisma データベーススキーマ定義 (全11モデル)
├── docs/                          # 詳細ドキュメント
│   ├── features.md                # 全機能一覧とバックエンド仕様
│   ├── humor-intervention.md      # A2Aユーモア介入システム詳細仕様
│   ├── API.md                     # REST / SSE / Socket.IO API仕様書
│   ├── DEPLOYMENT.md              # デプロイ＆A2Aアーキテクチャガイド
│   ├── DEPLOYMENT_RENDER.md       # Render.com デプロイ手順書
│   ├── SETUP.md                   # 詳細セットアップ手順
│   └── presentation_plan.md       # ハッカソンプレゼンテーション構成案
├── gas/                           # Google Apps Script スタンドアロン版 (レガシー互換)
├── local-server.js                # Express + Socket.IO メインサーバーエントリーポイント
├── mcp-server.js                  # Model Context Protocol (MCP) サーバーエントリーポイント
├── package.json
└── README.md
```

---

## 🚀 セットアップ・起動手順

### 1. 依存パッケージのインストール

```bash
git clone https://github.com/sofardogood/MoodFlow.git
cd MoodFlow
npm install
```

### 2. 環境変数の設定

`.env.example` をコピーして `.env` を作成し、必要なキーを設定します（詳細は [ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md) を参照）。

```bash
cp .env.example .env
```

主な必須・推奨環境変数：

```env
# データベース (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"

# Google Gemini API (AI分析・要約・A2Aエージェント用)
GEMINI_API_KEY="AIzaSy..."
GEMINI_MODEL="gemini-2.5-pro"

# Google Cloud Speech-to-Text / Google API サービスアカウント
GOOGLE_CLIENT_EMAIL="your-service-account@your-project.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Google Custom Search API (A2A介入時のプロ話術検索・任意)
GOOGLE_SEARCH_ENGINE_ID="your-custom-search-engine-id"
GOOGLE_SEARCH_API_KEY="AIzaSy..."

# Supabase Auth (管理画面ログイン用・任意)
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT_REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGci..."

# アラート通知用 Webhook (任意)
SLACK_WEBHOOK_URL=""
TEAMS_WEBHOOK_URL=""
```

### 3. Prisma クライアント生成・DBマイグレーション

```bash
npx prisma generate
npx prisma db push
```

### 4. ローカルサーバーの起動

```bash
npm run dev:local
```

起動後、以下のURLにアクセスできます：

- **参加者画面**: `http://localhost:3000/`
- **プレゼンター画面（音声認識・介入表示）**: `http://localhost:3000/presenter.html`
- **リアルタイム分析ダッシュボード**: `http://localhost:3000/dashboard.html`
- **管理者画面（セッション管理）**: `http://localhost:3000/admin.html`
- **事後アンケート画面**: `http://localhost:3000/survey.html`

### 5. MCP サーバーとしての起動（オプション）

Claude Desktop 等の MCP クライアントから利用する場合は、`mcp-server.js` を stdio モードで起動します：

```bash
node mcp-server.js
```

提供ツール：`get_latest_moods`、`get_session_stats`、`submit_mood`  
提供リソース：`moodflow://sessions/{sessionId}/data`

---

## 🌐 本番デプロイ（Render.com 推奨）

リアルタイム音声ストリーミング（Socket.IO）および5分ごとの自動要約スケジューラを常時稼働させるため、本番環境には **Render.com** の Web Service を推奨します。詳細な手順は [docs/DEPLOYMENT_RENDER.md](docs/DEPLOYMENT_RENDER.md) を参照してください。

- **Build Command**: `npm install && npx prisma generate`
- **Start Command**: `node local-server.js`

---

## 📚 ドキュメント一覧

- [全機能ドキュメント (`docs/features.md`)](docs/features.md)
- [A2A ユーモア介入システム仕様 (`docs/humor-intervention.md`)](docs/humor-intervention.md)
- [API 仕様書 (`docs/API.md`)](docs/API.md)
- [デプロイ＆アーキテクチャガイド (`docs/DEPLOYMENT.md`)](docs/DEPLOYMENT.md)
- [Render.com デプロイ手順 (`docs/DEPLOYMENT_RENDER.md`)](docs/DEPLOYMENT_RENDER.md)
- [プロジェクト構造・DB設計 (`PROJECT_STRUCTURE.md`)](PROJECT_STRUCTURE.md)
- [クイックスタートガイド (`QUICKSTART.md`)](QUICKSTART.md)
- [環境変数設定ガイド (`ENVIRONMENT_VARIABLES.md`)](ENVIRONMENT_VARIABLES.md)

---

## 📄 ライセンス

[MIT License](LICENSE)
