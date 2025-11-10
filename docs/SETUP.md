# MoodFlow セットアップガイド

このガイドでは、MoodFlowを最初から構築してデプロイする手順を説明します。

## 前提条件

- Googleアカウント
- Google Gemini API キー（無料で取得可能）

## ステップ 1: Google Spreadsheet の作成

1. [Google Spreadsheet](https://sheets.google.com) にアクセス
2. 新しいスプレッドシートを作成
3. 任意の名前を付けます（例: "MoodFlow Database"）

## ステップ 2: Apps Script エディタを開く

1. スプレッドシートで **拡張機能** → **Apps Script** をクリック
2. Apps Script エディタが新しいタブで開きます

## ステップ 3: コードをコピー

### 3.1 メインファイル（Code.gs）

1. デフォルトの `Code.gs` を開く
2. このリポジトリの `/gas/Code.gs` の内容をコピー＆ペースト

### 3.2 追加ファイルの作成

Apps Script エディタで以下のファイルを追加（`+` アイコン → **スクリプト** をクリック）:

- `SessionManager.gs` - `/gas/SessionManager.gs` の内容をコピー
- `DataService.gs` - `/gas/DataService.gs` の内容をコピー
- `GeminiAPI.gs` - `/gas/GeminiAPI.gs` の内容をコピー
- `AnalysisService.gs` - `/gas/AnalysisService.gs` の内容をコピー
- `ReportGenerator.gs` - `/gas/ReportGenerator.gs` の内容をコピー

### 3.3 HTMLファイルの追加

Apps Script エディタで以下のHTMLファイルを追加（`+` アイコン → **HTML** をクリック）:

- `ParticipantApp.html` - `/ui/ParticipantApp.html` の内容をコピー
- `AdminDashboard.html` - `/ui/AdminDashboard.html` の内容をコピー

## ステップ 4: Gemini API キーの取得

1. [Google AI Studio](https://makersuite.google.com/app/apikey) にアクセス
2. **Get API Key** をクリック
3. API キーをコピー

## ステップ 5: API キーの設定

1. Apps Script エディタで実行ボタンの横にある関数選択で `setGeminiApiKey` を選択
2. コードエディタで以下のように一時的に編集:

```javascript
function setGeminiApiKey() {
  const apiKey = 'YOUR_API_KEY_HERE'; // ここに取得したAPIキーを貼り付け
  const properties = PropertiesService.getScriptProperties();
  properties.setProperty('GEMINI_API_KEY', apiKey);
  Logger.log('Gemini API key has been set');
}
```

3. **実行** をクリック
4. 初回実行時、権限の承認を求められるので **承認**
5. 実行ログで "Gemini API key has been set" を確認
6. **重要**: APIキーをコードから削除（セキュリティのため）

## ステップ 6: スプレッドシートの初期化

1. 関数選択で `initializeSpreadsheet` を選択
2. **実行** をクリック
3. スプレッドシートに戻ると、以下のシートが作成されています:
   - Sessions
   - Participants
   - MoodData
   - Analysis

## ステップ 7: Webアプリとしてデプロイ

1. Apps Script エディタで **デプロイ** → **新しいデプロイ** をクリック
2. **種類の選択** で **ウェブアプリ** を選択
3. 以下の設定を行う:
   - **説明**: 任意（例: "MoodFlow v1.0"）
   - **次のユーザーとして実行**: 自分
   - **アクセスできるユーザー**: 全員
4. **デプロイ** をクリック
5. 承認を求められたら **アクセスを承認**
6. **ウェブアプリのURL** をコピーして保存

## ステップ 8: 動作確認

### 8.1 管理者ダッシュボード

1. デプロイしたWebアプリのURLに `?page=admin` を付けてアクセス
   - 例: `https://script.google.com/macros/s/XXX/exec?page=admin`
2. 会議タイトルを入力して **新しいセッションを作成** をクリック
3. 参加者用URLが表示されます

### 8.2 参加者アプリ

1. 生成された参加者用URLにアクセス
2. ニックネームを入力して参加
3. 感情スコアとコメントを入力して送信
4. 管理者ダッシュボードで **データ更新** をクリックしてリアルタイムデータを確認

## トラブルシューティング

### エラー: "GEMINI_API_KEY not set"

- ステップ5のAPI キー設定が正しく行われていません
- スクリプトプロパティを確認:
  1. プロジェクト設定（⚙️アイコン）→ **スクリプト プロパティ**
  2. `GEMINI_API_KEY` が設定されているか確認

### エラー: "Sessions sheet not found"

- ステップ6のスプレッドシート初期化が実行されていません
- `initializeSpreadsheet` 関数を再度実行してください

### Webアプリにアクセスできない

- デプロイ設定で **アクセスできるユーザー** が **全員** になっているか確認
- URLが正しいか確認（末尾に `/exec` が含まれているか）

### データが表示されない

- 管理者ダッシュボードで **データ更新** ボタンをクリック
- 参加者が実際にデータを送信しているか確認
- スプレッドシートの `MoodData` シートにデータがあるか確認

## セキュリティに関する注意

1. **APIキーの管理**
   - APIキーは必ずスクリプトプロパティに保存し、コードに直接書かない
   - APIキーを他人と共有しない

2. **データの取り扱い**
   - スプレッドシートの共有設定に注意
   - 会議終了後、不要なデータは削除を検討

3. **アクセス制御**
   - 管理者ダッシュボードURLは会議主催者のみに共有
   - 参加者用URLは参加者にのみ共有

## 次のステップ

- [API.md](API.md) - API仕様の詳細
- [DEPLOYMENT.md](DEPLOYMENT.md) - 本番環境へのデプロイ
- [PROJECT_STRUCTURE.md](../PROJECT_STRUCTURE.md) - プロジェクト構造の詳細

## サポート

問題が発生した場合は、GitHubのIssueで報告してください。
