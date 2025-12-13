# 補佐やねん デプロイメントガイド

「補佐やねん」をRender.comにデプロイする手順です。

## 前提条件

- GitHubに最新コードがプッシュ済み
- 以下の環境変数が用意されていること:
    - `DATABASE_URL` (Supabase PostgreSQL)
    - `GEMINI_API_KEY`
    - `GOOGLE_CLIENT_EMAIL` / `GOOGLE_PRIVATE_KEY` (音声認識用)

## Render.com へのデプロイ

詳細な手順は [DEPLOYMENT_RENDER.md](./DEPLOYMENT_RENDER.md) を参照してください。

### 簡易手順

1. [Render.com](https://render.com/) にログイン
2. **New +** → **Web Service** を選択
3. GitHubリポジトリを連携・選択
4. 以下の設定:
   - **Build Command**: `npm install && npx prisma generate`
   - **Start Command**: `node local-server.js`
   - **Instance Type**: Free（デモ用）または Starter（本番用）
5. 環境変数を追加
6. **Create Web Service** をクリック

## アーキテクチャ

```
┌─────────────────────────────────────────────────────────────────┐
│                     補佐やねん システム構成                      │
├─────────────────────────────────────────────────────────────────┤
│  フロントエンド (public/*.html)                                  │
│    - 管理画面 (admin.html)                                      │
│    - ダッシュボード (dashboard.html)                            │
│    - 参加者画面 (index.html)                                    │
│    - プレゼンター (presenter.html)                              │
│    - アンケート (survey.html)                                   │
├─────────────────────────────────────────────────────────────────┤
│  バックエンド (local-server.js + api/*.js)                      │
│    - Express.js サーバー                                        │
│    - Socket.IO (リアルタイム音声ストリーミング)                 │
│    - Prisma ORM (PostgreSQL)                                    │
├─────────────────────────────────────────────────────────────────┤
│  外部サービス                                                    │
│    - Supabase (PostgreSQL データベース)                         │
│    - Google Gemini API (AI分析・介入)                           │
│    - Google Cloud Speech-to-Text (音声認識)                     │
└─────────────────────────────────────────────────────────────────┘
```

## 環境変数一覧

| 変数名 | 必須 | 説明 |
|--------|------|------|
| `DATABASE_URL` | ✅ | Supabase PostgreSQL 接続文字列 |
| `GEMINI_API_KEY` | ✅ | Google Gemini API キー |
| `GOOGLE_CLIENT_EMAIL` | ✅ | GCP サービスアカウントメール |
| `GOOGLE_PRIVATE_KEY` | ✅ | GCP サービスアカウント秘密鍵 |
| `GOOGLE_SEARCH_ENGINE_ID` | ✅ | カスタム検索用（オプション） |

## 本番環境チェックリスト

### デプロイ前

- [ ] 環境変数がすべて設定されている
- [ ] `npx prisma migrate deploy` でDBマイグレーション済み
- [ ] ローカルで `npm run dev:local` が動作する

### デプロイ後

- [ ] トップページ (/) にアクセスできる
- [ ] 管理画面でセッションが作成できる
- [ ] 参加者がムードを送信できる
- [ ] ダッシュボードでリアルタイム更新される
- [ ] 録音・文字起こしが動作する

## トラブルシューティング

### Build Failed

**原因**: Prisma クライアント生成エラー
**解決法**: Build Command に `npx prisma generate` を追加

### Health Check Failed

**原因**: サーバー起動失敗
**解決法**: ログで `PORT` 環境変数の読み取りを確認

### Database Connection Error

**原因**: `DATABASE_URL` が正しくない
**解決法**: Supabase の接続文字列を確認（`?pgbouncer=true` が必要な場合あり）

## A2A (Agent-to-Agent) アーキテクチャ

補佐やねんはA2Aアーキテクチャを採用しています。

```
┌────────────────────────────────────────────────────────┐
│                 HumorOrchestrator                      │
├────────────────────────────────────────────────────────┤
│   ⓪ ウェブ検索: お笑い芸人のテクニックを取得           │
│        ↓                                               │
│   ① HostAgent: 会議の方言を検出                        │
│        ↓                                               │
│   ② 適切なエージェントを選択                           │
│        ├─ 関西弁 → 関西エージェント                    │
│        └─ 標準語 → 関東エージェント                    │
│        ↓                                               │
│   ③ 選択されたエージェントがアドバイスを生成           │
│      （検索結果 + 過去の成功事例を参照）               │
│        ↓                                               │
│   ④ HostAgent: アドバイスを短い警告に要約              │
│        ↓                                               │
│   ⚠️ 警告メッセージを発表者に表示                      │
└────────────────────────────────────────────────────────┘
```

### ウェブ検索連携

`GOOGLE_SEARCH_ENGINE_ID` を設定すると、介入時に以下のクエリでウェブ検索を実行します:

```
お笑い芸人 話の振り方 場の空気 盛り上げ方 ファシリテーション テクニック
```

検索結果はエージェントのプロンプトに含まれ、プロの話術を参考にしたアドバイスを生成します。

## AI学習メカニズム

### 現在の実装: RAG (Retrieval-Augmented Generation)

| 項目 | 内容 |
|------|------|
| **方式** | RAG (Retrieval-Augmented Generation) |
| **仕組み** | 過去の成功した介入（rating >= 4）をDBから取得し、プロンプトに含める |
| **学習** | モデル自体は学習しない。コンテキストとして過去の成功例を参照する |
| **検索連携** | Google Custom Searchでお笑い芸人のテクニックを取得 |

**メリット**:
- 追加コスト不要（Gemini APIのみ）
- 即座に反映される
- データが増えれば精度が向上
- プロのテクニックを参考にしたアドバイス

### 将来の拡張: ファインチューニング

本格的なファインチューニングを行う場合:
- OpenAI Fine-tuning API を使用
- 10件以上の高評価データが必要
- 月額課金が発生

## 参照

- [Render.com ドキュメント](https://render.com/docs)
- [Prisma デプロイガイド](https://www.prisma.io/docs/guides/deployment)
- [Supabase 接続設定](https://supabase.com/docs/guides/database/connecting-to-postgres)

