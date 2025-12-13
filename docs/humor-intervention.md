# Humor Intervention API ドキュメント

## 概要

会議のムードが低下した際に、AIエージェント間の対話を通じて適切な介入提案を生成するシステムです。

## アーキテクチャ

```
┌─────────────────────────────────────────────────────────────────┐
│                    HumorOrchestrator                            │
├─────────────────────────────────────────────────────────────────┤
│  HostAgent (MC)                                                 │
│    └─ 状況を分析し、どのエージェントが先に話すか決定           │
│                                                                 │
│  KansaiAgent (ボケ役)                                           │
│    └─ 関西弁でユーモアを交えた発言                             │
│                                                                 │
│  KantoAgent (ツッコミ役)                                        │
│    └─ 標準語で冷静なフォロー                                   │
└─────────────────────────────────────────────────────────────────┘
```

## API エンドポイント

### 1. 介入提案を取得

```
POST /api/humor-intervention
Content-Type: application/json

{
  "context": "会議で参加者のムードが下がっている",
  "sessionId": "session-123"  // オプション
}
```

**レスポンス:**
```json
{
  "success": true,
  "interventionId": 4,
  "data": {
    "dialogue": [
      { "agent": "KansaiAgent", "content": "なんやなんや..." },
      { "agent": "KantoAgent", "content": "確かに..." }
    ],
    "suggestion": {
      "text": "アクション: ...\nセリフ: 「...」"
    }
  }
}
```

### 2. 介入を評価（学習用）

```
POST /api/rate-intervention
Content-Type: application/json

{
  "interventionId": 4,
  "rating": 5  // 1-5 (5が最高)
}
```

## 学習メカニズム

現在の実装は **RAG（Retrieval-Augmented Generation）** 方式です：

1. 介入実行時に `InterventionLog` テーブルにログを保存
2. 次回の介入時、`successRating >= 4` の過去事例を3件取得
3. 過去の成功事例をプロンプトに含めてAIに参照させる

### データベーススキーマ

```sql
CREATE TABLE "InterventionLog" (
    id SERIAL PRIMARY KEY,
    "sessionId" VARCHAR(255),
    context TEXT NOT NULL,
    dialogue TEXT NOT NULL,
    suggestion TEXT NOT NULL,
    "successRating" INTEGER,  -- 1-5, null=未評価
    "createdAt" TIMESTAMP DEFAULT NOW()
);
```

## ファイル構成

```
api/
├── humor-intervention.js   # 介入API
├── rate-intervention.js    # 評価API
lib/
├── humor-agents.js         # エージェント定義
├── search-service.js       # ウェブ検索連携
```

## 環境変数

| 変数名 | 必須 | 説明 |
|--------|------|------|
| `GEMINI_API_KEY` | ✅ | Gemini API キー |
| `GOOGLE_SEARCH_ENGINE_ID` | ❌ | 検索連携用（設定すると最新ニュースを参照） |

## 将来の拡張（未実装）

### 本格的なファインチューニング

現在のRAG方式から、OpenAI Fine-tuning APIを使用した本格的なファインチューニングへの移行が可能です：

1. 成功事例データをJSONL形式でエクスポート
2. OpenAI Fine-tuning APIでカスタムモデルを作成
3. カスタムモデルを使用して提案を生成

**必要なもの:**
- OpenAI APIキー（課金必要）
- 最低10件以上の高評価事例データ

## 使用例

### PowerShell
```powershell
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/humor-intervention" `
  -Method POST -ContentType "application/json" `
  -Body '{"context": "参加者が眠そうにしている"}'
$response | ConvertTo-Json -Depth 10
```

### cURL
```bash
curl -X POST http://localhost:3000/api/humor-intervention \
  -H "Content-Type: application/json" \
  -d '{"context": "参加者が眠そうにしている"}'
```
