# Render.com へのデプロイ手順

「補佐やねん」は常時接続のWebSocketサーバー（Socket.IO）を使用するため、Vercelなどのサーバーレス環境ではなく、**Render** のようなWebサービス型ホスティングが最適です。

以下に無料プランでも動作するデプロイ手順をまとめます。

## 1. 準備

1.  GitHubに最新のコードがプッシュされていることを確認してください。
2.  [Render.com](https://render.com/) のアカウントを作成・ログインします。

## 2. Web Service の作成

1.  ダッシュボードの「New +」ボタンから **"Web Service"** を選択します。
2.  "Build and deploy from a Git repository" を選択し、このリポジトリを連携・選択します。

## 3. 設定項目

以下の通りに入力してください。

| 項目 | 設定値 |
|------|--------|
| **Name** | `hosa-yanen` (など任意の名前) |
| **Region** | `Singapore` (日本に近いので推奨) |
| **Branch** | `feature/rename-to-hosa-yanen` (または `main`) |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npx prisma generate` |
| **Start Command** | `node local-server.js` |
| **Instance Type** | `Free` (デモ用) |

> **注意**: `Start Command` は `npm start` ではなく `node local-server.js` を指定してください（`local-server.js` がこのアプリの本体です）。また、Prismaクライアントを生成するためにBuild Commandに `npx prisma generate` を追加することが重要です。

## 4. 環境変数 (Environment Variables)

"Advanced" セクションを展開し、"Environment Variables" に以下の変数を追加します。`.env` ファイルの内容をコピーしてください。

| Key | Value (例) |
|-----|------------|
| `DATABASE_URL` | `postgres://...` (Supabase等の接続文字列) |
| `GEMINI_API_KEY` | `AIzaSy...` |
| `GOOGLE_SEARCH_ENGINE_ID` | `012345...` |
| `GOOGLE_SEARCH_API_KEY` | (任意: なければGEMINI_KEYが使われます) |
| `GOOGLE_CLIENT_EMAIL` | `service-account@...` |
| `GOOGLE_PRIVATE_KEY` | `-----BEGIN PRIVATE KEY-----\n...` |

> **重要**: `GOOGLE_PRIVATE_KEY` は改行を含むため、Renderの入力欄に入力する際は、改行コード `\n` をそのまま文字列として入力するか、Renderのシークレットファイル機能を使う必要がある場合がありますが、通常はそのままペーストで認識されます。エラーが出る場合はダブルクォーテーションで囲んでみてください。

## 5. デプロイ

「Create Web Service」をクリックするとデプロイが始まります。
ログに `Server running on port 10000` のように表示されれば成功です。

## 6. 動作確認

発行されたURL（例: `https://hosa-yanen.onrender.com`）にアクセスし、トップページが表示されるか確認してください。

### トラブルシューティング

*   **Build Failed**: `package.json` の依存関係エラーが大半です。ログを確認してください。Prismaのエラーが出る場合は Build Command に `npx prisma generate` が入っているか確認してください。
*   **Health Check Failed**: サーバーが起動に時間がかかっているか、ポートのリッスンに失敗しています。`local-server.js` は環境変数 `PORT` をリッスンするように作られているか確認してください（現在のコードは対応済みです）。
*   **Google Auth Error**: `GOOGLE_PRIVATE_KEY` のフォーマットが崩れている可能性があります。
