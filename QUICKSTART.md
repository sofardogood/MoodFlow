# MoodFlow クイックスタートガイド

5分でMoodFlowをセットアップして動かす最短手順です。

## 🚀 5分でセットアップ

### 1. Google Spreadsheet を作成（30秒）

1. [Google Spreadsheet](https://sheets.google.com) を開く
2. **空白** をクリックして新規作成
3. 名前を「MoodFlow Database」に変更

### 2. Apps Script を開く（15秒）

1. スプレッドシートで **拡張機能** → **Apps Script** をクリック
2. 新しいタブでApps Scriptエディタが開きます

### 3. コードをコピー（2分）

#### メインファイル
1. `Code.gs` を開く
2. このリポジトリの [gas/Code.gs](gas/Code.gs) の内容をコピー＆ペースト

#### 追加ファイル（6個）
**スクリプトファイル**（`+` → **スクリプト**）
- `SessionManager.gs` ← [gas/SessionManager.gs](gas/SessionManager.gs)
- `DataService.gs` ← [gas/DataService.gs](gas/DataService.gs)
- `GeminiAPI.gs` ← [gas/GeminiAPI.gs](gas/GeminiAPI.gs)
- `AnalysisService.gs` ← [gas/AnalysisService.gs](gas/AnalysisService.gs)
- `ReportGenerator.gs` ← [gas/ReportGenerator.gs](gas/ReportGenerator.gs)

**HTMLファイル**（`+` → **HTML**）
- `ParticipantApp.html` ← [ui/ParticipantApp.html](ui/ParticipantApp.html)
- `AdminDashboard.html` ← [ui/AdminDashboard.html](ui/AdminDashboard.html)

### 4. Gemini API キーを取得（1分）

1. [Google AI Studio](https://makersuite.google.com/app/apikey) を開く
2. **Get API Key** → **Create API key** をクリック
3. APIキーをコピー

### 5. API キーを設定（30秒）

1. Apps Scriptエディタで以下のコードを `GeminiAPI.gs` の最後に一時的に追加：

```javascript
function setupApiKey() {
  setGeminiApiKey('YOUR_API_KEY_HERE');  // ← ここにAPIキーを貼り付け
}
```

2. 関数選択で `setupApiKey` を選択して **実行**
3. 承認を求められたら **承認**
4. 完了したら上記コードを削除

### 6. スプレッドシート初期化（30秒）

1. 関数選択で `initializeSpreadsheet` を選択
2. **実行** をクリック
3. スプレッドシートに4つのシートが作成されます

### 7. デプロイ（30秒）

1. **デプロイ** → **新しいデプロイ** をクリック
2. 種類で **ウェブアプリ** を選択
3. 以下を設定：
   - **説明**: MoodFlow v1.0
   - **次のユーザーとして実行**: 自分
   - **アクセスできるユーザー**: 全員
4. **デプロイ** をクリック
5. URLをコピー

## ✅ 動作確認

### 管理者ダッシュボード

1. デプロイURLに `?page=admin` を付けてアクセス
   ```
   例: https://script.google.com/macros/s/XXX/exec?page=admin
   ```

2. 会議タイトルを入力（例: テスト会議）

3. **新しいセッションを作成** をクリック

4. 参加者用URLが表示される

### 参加者アプリでテスト

1. 参加者用URLを別のタブで開く

2. ニックネームを入力（例: テストさん）

3. **参加する** をクリック

4. スライダーを動かして感情スコアを入力

5. コメントを入力（任意）

6. **送信** をクリック

7. 管理者ダッシュボードで **データ更新** をクリック

8. グラフとデータが表示されれば成功！

## 🎉 完了！

これでMoodFlowが使えるようになりました。

## 📱 スマホでテスト

1. 参加者用URLをスマホに送る（QRコード推奨）
2. スマホでアクセスしてテスト
3. スマホUIが最適化されています

## 🔧 トラブルシューティング

### エラー: "GEMINI_API_KEY not set"
→ ステップ5のAPIキー設定を確認

### シートが作成されない
→ ステップ6の `initializeSpreadsheet` を再実行

### URLにアクセスできない
→ デプロイ設定で「全員」が選択されているか確認

### データが表示されない
→ 管理者ダッシュボードで「データ更新」ボタンをクリック

## 📖 次のステップ

詳細は以下のドキュメントを参照：

- [完全セットアップガイド](docs/SETUP.md)
- [API仕様書](docs/API.md)
- [デプロイメントガイド](docs/DEPLOYMENT.md)

## 💡 使い方のコツ

### 会議での使用

1. **会議前**（5分）
   - 管理者ダッシュボードでセッション作成
   - 参加者用URLをQRコードで共有

2. **会議中**
   - 参加者は好きなタイミングで感情・意見を入力
   - 管理者は1分ごとにデータ更新で状況確認

3. **会議後**
   - セッション終了
   - レポート生成で自動分析

### 複数人でテスト

1. 参加者用URLを友人・同僚に共有
2. 各自がニックネームで参加
3. 同時に感情入力してリアルタイム性を確認
4. 10人同時でもスムーズに動作します

## 🎯 実際のユースケース

### チームミーティング
- プロジェクトの方向性議論
- ブレインストーミング
- 振り返り会

### ワークショップ
- 参加者の理解度確認
- エンゲージメント測定
- リアルタイムフィードバック

### オンライン授業
- 学生の理解度チェック
- 授業の雰囲気把握
- 質問しやすい環境作り

## 🌟 機能ハイライト

✅ **匿名性** - ニックネームで気軽に参加
✅ **リアルタイム** - 即座にデータが反映
✅ **AI分析** - Geminiが自動で感情・意見を分析
✅ **可視化** - グラフで心の変化を一目で理解
✅ **レポート** - 会議終了時に総合分析レポート
✅ **無料** - Google Apps Scriptで完全無料運用

## 📞 サポート

問題が解決しない場合：
- GitHubのIssueで質問
- ドキュメントを再確認
- サンプルセッションで動作テスト

---

**すぐに始めよう！5分でMoodFlowを体験できます。**
