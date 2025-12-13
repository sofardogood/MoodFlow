# Humor Intervention API ドキュメント

## 概要

会議のムードが低下した際に、ホストエージェントが会議の言語スタイル（関西弁 or 標準語）を検出し、適切なエージェントにアドバイスを求め、短い警告メッセージとして発表者に提示するシステムです。

## アーキテクチャ

```
┌─────────────────────────────────────────────────────────────────┐
│                    HumorOrchestrator                            │
├─────────────────────────────────────────────────────────────────┤
│  HostAgent (分析・ルーティング)                                  │
│    1. 会議の言語スタイル（方言）を検出                          │
│    2. 適切なエージェントを選択                                  │
│    3. エージェントのアドバイスを短い警告に要約                  │
│                                                                 │
│  関西エージェント (Kansai)                                       │
│    └─ 関西弁での親しみやすいアドバイス                         │
│                                                                 │
│  関東エージェント (Kanto)                                        │
│    └─ 標準語での丁寧なアドバイス                               │
└─────────────────────────────────────────────────────────────────┘
```

## フロー

1. **方言検出**: HostAgentが会議の発言内容から言語スタイルを判定
2. **エージェント選択**: 関西弁 → 関西エージェント、標準語 → 関東エージェント
3. **アドバイス生成**: 選択されたエージェントが改善提案を生成
4. **警告作成**: HostAgentがアドバイスを1〜2文の短い警告メッセージに要約

## API エンドポイント

### 1. 介入提案を取得

```
POST /api/humor-intervention
Content-Type: application/json

{
  "context": "会議の文字起こしや状況説明",
  "sessionId": "session-123"  // オプション
}
```

**レスポンス:**
```json
{
  "success": true,
  "interventionId": 4,
  "data": {
    "dialect": "kansai",
    "agentUsed": "関西エージェント",
    "advice": "ちょっと空気重いなぁ。ここで一回...",
    "warning": "⚠️ 参加者の反応が薄いです。『質問ある人〜？』と明るく聞いてみましょう！"
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

## 環境変数

| 変数名 | 必須 | 説明 |
|--------|------|------|
| `GEMINI_API_KEY` | ✅ | Gemini API キー |

## 使用例

### PowerShell
```powershell
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/humor-intervention" `
  -Method POST -ContentType "application/json" `
  -Body '{"context": "えー、ほな次のスライドいきますわ。みなさん眠そうやなぁ..."}'
$response | ConvertTo-Json -Depth 10
```
