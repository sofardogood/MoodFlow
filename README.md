# MoodFlow 🌊

**会議中の心の変化をリアルタイムで分析し、Googleスライドで可視化するシステム**

## 概要

MoodFlowは、会議参加者がスマートフォンから自分の感情や意見をリアルタイムで入力し、OpenAI APIが会議全体の心理的な流れを分析・可視化するシステムです。Vercelでデプロイ可能で、Googleスプレッドシートにデータを保存し、Googleスライドで分析レポートを自動生成します。

## 主な機能

### 参加者向け
- **スマホで簡単入力**: ニックネーム（キリンさん、ゾウさんなど）で匿名参加
- **感情スコア記録**: -5（ネガティブ）〜 +5（ポジティブ）のスライダー
- **発言内容記録**: テキストで意見や感想を入力
- **リアルタイム反映**: 入力した瞬間にGoogleスプレッドシートに保存

### 管理者向け
- **パスワード保護**: 管理者ダッシュボードはパスワード認証
- **データ閲覧**: セッションごとにデータを表示
- **AI分析**: OpenAI GPT-4で会議を自動分析
- **スライド自動生成**: ワンクリックでGoogleスライドレポート作成

### AI分析機能（OpenAI GPT-4）
- 会議全体の雰囲気分析
- 重要なインサイト抽出
- ポジティブ・ネガティブポイントの識別
- 参加者エンゲージメント評価
- 推奨アクションの提案

## 技術スタック

- **フロントエンド**: HTML, CSS, JavaScript (Vanilla)
- **バックエンド**: Vercel Serverless Functions (Node.js)
- **AI**: OpenAI API (GPT-4o-mini)
- **データベース**: Google Spreadsheet
- **レポート**: Google Slides API
- **ホスティング**: Vercel

## プロジェクト構造

```
MoodFlow/
├── public/
│   ├── index.html          # 参加者用入力ページ
│   └── admin.html          # 管理者ダッシュボード
├── api/
│   ├── submit-mood.js      # ムードデータ送信API
│   ├── admin-login.js      # 管理者ログインAPI
│   ├── get-session-data.js # セッションデータ取得API
│   └── generate-slides.js  # スライド生成API
├── lib/
│   ├── sheets.js           # スプレッドシート操作
│   ├── openai-service.js   # OpenAI API連携
│   └── slides-generator.js # Googleスライド生成
├── package.json
├── vercel.json
└── README.md
```

## セットアップ

詳細な手順は [SETUP_VERCEL.md](SETUP_VERCEL.md) を参照してください。

### クイックスタート

1. Google Spreadsheetを作成
2. Google Cloud Projectとサービスアカウントを設定
3. OpenAI APIキーを取得
4. Vercelにデプロイ
5. 環境変数を設定

## 使い方

### 会議主催者（管理者）

1. 管理者ダッシュボード(`/admin.html`)にアクセス
2. 設定したパスワードでログイン
3. セッションID（例: `meeting-001`）を参加者に共有
4. 会議終了後、セッションIDを入力して「データ読み込み」
5. 「スライド生成」をクリックしてレポート作成

### 参加者

1. 参加者用URL(`/`)にアクセス
2. セッションIDとニックネームを入力
3. 会議中、感情スコアとコメントを自由に送信
4. 何度でも送信可能

## データ構造

### Googleスプレッドシート（MoodData シート）

| 列 | 内容 | 例 |
|----|------|-----|
| Timestamp | 送信時刻 | 2024-01-15T10:30:00.000Z |
| SessionID | セッションID | meeting-001 |
| Nickname | ニックネーム | キリンさん |
| MoodScore | 感情スコア (-5〜+5) | 3 |
| Emoticon | 絵文字 | 😊 |
| Comment | コメント | いいアイデアですね！ |

## セキュリティ

- 管理者ダッシュボードはパスワード保護
- APIキーは環境変数で管理
- サービスアカウントの秘密鍵は安全に保管
- ニックネームベースで個人情報を保護

## コスト

- **Vercel**: 無料プランで十分
- **OpenAI API**: 会議1回あたり約$0.01〜$0.05
- **Google API**: 無料枠内で利用可能
- **スプレッドシート・スライド**: 無料

## ライセンス

MIT License

## 開発ロードマップ

- [x] 基本機能実装
- [x] OpenAI API連携
- [x] Googleスライド生成
- [ ] リアルタイムグラフ表示
- [ ] Slack/Teams連携
- [ ] モバイルアプリ

## サポート

問題が発生した場合は、GitHubのIssueで報告してください。

---

**MoodFlow v2.0 - Powered by OpenAI & Vercel**
