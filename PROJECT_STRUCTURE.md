# MoodFlow - 会議中の心の変化分析システム

## プロジェクト概要
リアルタイムで参加者の心の変化を数値化・可視化する会議分析システム

## 技術スタック
- **フロントエンド**: HTML5, CSS3, JavaScript (Vanilla)
- **バックエンド**: Google Apps Script (GAS)
- **データベース**: Google Spreadsheet
- **AI分析**: Google Gemini API
- **グラフ生成**: Google Charts API

## システム構成

```
MoodFlow/
├── gas/                          # Google Apps Scriptファイル
│   ├── Code.gs                   # メインエントリーポイント
│   ├── SessionManager.gs         # セッション管理
│   ├── DataService.gs            # データ操作サービス
│   ├── AnalysisService.gs        # 分析エンジン
│   ├── GeminiAPI.gs              # Gemini AI連携
│   ├── ChartGenerator.gs         # グラフ生成
│   └── ReportGenerator.gs        # レポート生成
│
├── ui/                           # UIファイル
│   ├── ParticipantApp.html       # 参加者用アプリ
│   ├── AdminDashboard.html       # 管理者ダッシュボード
│   ├── styles.css                # 共通スタイル
│   └── app.js                    # クライアントサイドJS
│
├── config/                       # 設定ファイル
│   └── appsscript.json          # GAS設定
│
└── docs/                         # ドキュメント
    ├── SETUP.md                  # セットアップガイド
    ├── API.md                    # API仕様
    └── DEPLOYMENT.md             # デプロイ手順
```

## データ構造

### 1. Sessions シート
| 列名 | 型 | 説明 |
|-----|-----|------|
| sessionId | String | 会議セッションID (UUID) |
| meetingTitle | String | 会議タイトル |
| startTime | DateTime | 開始時刻 |
| endTime | DateTime | 終了時刻 |
| status | String | active/completed |
| createdBy | String | 作成者 |

### 2. Participants シート
| 列名 | 型 | 説明 |
|-----|-----|------|
| participantId | String | 参加者ID (UUID) |
| sessionId | String | セッションID |
| nickname | String | ニックネーム |
| joinTime | DateTime | 参加時刻 |
| deviceInfo | String | デバイス情報 |

### 3. MoodData シート
| 列名 | 型 | 説明 |
|-----|-----|------|
| recordId | String | レコードID (UUID) |
| sessionId | String | セッションID |
| participantId | String | 参加者ID |
| nickname | String | ニックネーム |
| timestamp | DateTime | タイムスタンプ |
| moodScore | Number | 感情スコア (-5〜+5) |
| comment | String | 発言内容 |
| emoticon | String | 絵文字 |

### 4. Analysis シート
| 列名 | 型 | 説明 |
|-----|-----|------|
| analysisId | String | 分析ID |
| sessionId | String | セッションID |
| timestamp | DateTime | 分析時刻 |
| analysisType | String | individual/group/timeline |
| targetId | String | 対象ID（参加者IDなど） |
| resultData | JSON | 分析結果 |

## 主要機能

### 1. セッション管理
- 会議セッションの作成・開始・終了
- 参加者の登録とセッション紐付け
- 同時10人以上の接続管理

### 2. リアルタイムデータ収集
- スマホから感情スコア入力
- タイムスタンプ自動付与
- 非同期バッチ処理で高速保存

### 3. AI分析機能
- Gemini APIによる発言内容の感情分析
- 意見のカテゴリ自動分類
- ポジティブ/ネガティブ判定

### 4. 可視化機能
- 個別参加者の心の変化グラフ
- 全体の感情推移グラフ
- 時間帯別の意見分布
- 発言量と感情の相関

### 5. レポート生成
- 会議終了時の総合分析
- 参加者ごとのインサイト
- 重要な転換点の検出

## パフォーマンス設計

### 同時実行対応
- **想定**: 10〜30人の同時アクセス
- **書き込み**: バッチ処理で負荷分散
- **読み込み**: キャッシュサービス活用
- **タイムアウト**: 6分以内の処理完了保証

### 最適化戦略
1. **データベース**: スプレッドシートの行数制限対策
2. **API制限**: Gemini API呼び出し回数の最適化
3. **UI**: 軽量レスポンシブデザイン
4. **キャッシュ**: CacheServiceでセッション情報管理

## セキュリティ
- セッションIDベースの認証
- ニックネームの匿名性保持
- データの会議終了後の保持期間設定
- 管理者権限の分離

## API エンドポイント

### 参加者用
- `POST /api/session/join` - セッション参加
- `POST /api/mood/submit` - 感情データ送信
- `GET /api/session/status` - セッション状態取得

### 管理者用
- `POST /api/session/create` - セッション作成
- `POST /api/session/end` - セッション終了
- `GET /api/analysis/realtime` - リアルタイム分析
- `GET /api/report/generate` - 最終レポート生成

## 今後の拡張可能性
- Slack/Teams連携
- 音声入力対応
- ビデオ会議ツール統合
- 機械学習による予測機能
- 多言語対応
