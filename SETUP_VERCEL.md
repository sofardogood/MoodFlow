# MoodFlow セットアップガイド（Vercel版）

このガイドでは、MoodFlowをVercelにデプロイして動作させる手順を詳しく説明します。

## 前提条件

- Googleアカウント
- GitHubアカウント
- Vercelアカウント（無料、GitHubでサインアップ可能）
- Node.js 18以上（ローカルでテストする場合）

## ステップ 1: Google Spreadsheet の作成

### 1.1 新しいスプレッドシートを作成

1. [Google Spreadsheet](https://sheets.google.com) にアクセス
2. **空白** をクリックして新規作成
3. 名前を「MoodFlow Data」などに変更

### 1.2 シートを設定

1. シート名を「MoodData」に変更（下部のタブをダブルクリック）
2. A1セルから以下のヘッダーを入力：

| A | B | C | D | E | F |
|---|---|---|---|---|---|
| Timestamp | SessionID | Nickname | MoodScore | Emoticon | Comment |

### 1.3 スプレッドシートIDを取得

URLから以下の部分をコピー：

```
https://docs.google.com/spreadsheets/d/【ここがスプレッドシートID】/edit
```

例: `1ABC...XYZ`

**このIDを後で使うのでメモしておきます**

## ステップ 2: Google Cloud Project の設定

### 2.1 プロジェクトの作成

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 上部の **プロジェクトを選択** → **新しいプロジェクト**
3. プロジェクト名: 「MoodFlow」
4. **作成** をクリック

### 2.2 APIの有効化

1. **APIとサービス** → **ライブラリ** を開く
2. 以下のAPIを検索して有効化：
   - **Google Sheets API**
   - **Google Slides API**
   - **Google Drive API**

### 2.3 サービスアカウントの作成

1. **IAMと管理** → **サービスアカウント** を開く
2. **サービスアカウントを作成** をクリック
3. 名前: 「moodflow-service」
4. **作成して続行** をクリック
5. ロールは **選択不要**
6. **完了** をクリック

### 2.4 サービスアカウントキーの作成

1. 作成したサービスアカウントをクリック
2. **キー** タブを開く
3. **鍵を追加** → **新しい鍵を作成**
4. キーのタイプ: **JSON**
5. **作成** をクリック
6. JSONファイルがダウンロードされます

**このJSONファイルを安全な場所に保存してください**

### 2.5 スプレッドシートに権限を付与

1. ダウンロードしたJSONファイルを開く
2. `client_email` の値をコピー（例: `xxx@xxx.iam.gserviceaccount.com`）
3. Google Spreadsheetに戻り、**共有** をクリック
4. コピーしたメールアドレスを貼り付け
5. 権限: **編集者**
6. **送信** をクリック

## ステップ 3: OpenAI API キーの取得

### 3.1 OpenAI アカウント作成

1. [OpenAI Platform](https://platform.openai.com/) にアクセス
2. アカウントを作成（ない場合）

### 3.2 APIキーの作成

1. [API Keys](https://platform.openai.com/api-keys) ページを開く
2. **Create new secret key** をクリック
3. 名前: 「MoodFlow」
4. **Create secret key** をクリック
5. 表示されたキーをコピー（`sk-proj-...`で始まる文字列）

**このキーは一度しか表示されないので必ずコピーしてください**

## ステップ 4: GitHubリポジトリの作成

### 4.1 リポジトリをFork/Clone

このリポジトリを自分のGitHubアカウントにForkするか、新しいリポジトリを作成してコードをプッシュします。

```bash
# 新しいリポジトリの場合
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/your-username/moodflow.git
git push -u origin main
```

## ステップ 5: Vercel へのデプロイ

### 5.1 Vercelアカウント作成

1. [Vercel](https://vercel.com) にアクセス
2. **Sign Up** をクリック
3. **Continue with GitHub** を選択

### 5.2 プロジェクトのインポート

1. ダッシュボードで **Add New...** → **Project** をクリック
2. GitHubリポジトリを選択
3. **Import** をクリック

### 5.3 環境変数の設定

**重要**: デプロイ前に環境変数を設定します。

**Environment Variables** セクションで以下を追加：

#### OPENAI_API_KEY
```
sk-proj-...
```
（ステップ3で取得したOpenAI APIキー）

#### SPREADSHEET_ID
```
1ABC...XYZ
```
（ステップ1で取得したスプレッドシートID）

#### ADMIN_PASSWORD
```
your-secure-password
```
（管理者ダッシュボードのパスワード、自由に設定）

#### GOOGLE_SERVICE_ACCOUNT_EMAIL
```
xxx@xxx.iam.gserviceaccount.com
```
（サービスアカウントのJSONファイルの`client_email`の値）

#### GOOGLE_PRIVATE_KEY

JSONファイルの`private_key`の値をコピーします。

**重要**: 改行を`\n`に置き換える必要があります。

元の値（例）:
```
-----BEGIN PRIVATE KEY-----
MIIEvQ...
...複数行...
...
-----END PRIVATE KEY-----
```

設定する値:
```
-----BEGIN PRIVATE KEY-----\nMIIEvQ...\n...\n-----END PRIVATE KEY-----\n
```

**便利な方法**: オンラインツールを使用して改行を`\n`に置換するか、以下のコマンドを使用：

```bash
# macOS/Linux
cat key.json | jq -r '.private_key' | awk '{printf "%s\\n", $0}' | pbcopy
```

### 5.4 デプロイ

環境変数を設定したら、**Deploy** をクリックします。

数分後、デプロイが完了します。

## ステップ 6: 動作確認

### 6.1 URLの確認

デプロイ完了後、Vercelが提供するURLが表示されます：

```
https://your-project.vercel.app
```

### 6.2 参加者ページのテスト

1. `https://your-project.vercel.app/` にアクセス
2. セッションID: `test-001`
3. ニックネーム: `テストさん`
4. **参加する** をクリック
5. 感情スコアとコメントを入力して **送信**

### 6.3 データがスプレッドシートに保存されているか確認

Google Spreadsheetを開いて、データが追加されていることを確認します。

### 6.4 管理者ダッシュボードのテスト

1. `https://your-project.vercel.app/admin.html` にアクセス
2. 設定したパスワードでログイン
3. セッションID: `test-001` を入力
4. **データ読み込み** をクリック
5. データが表示されることを確認

### 6.5 スライド生成のテスト

1. 管理者ダッシュボードで **スライド生成** をクリック
2. 数秒〜数十秒待つ
3. Googleスライドへのリンクが表示されます
4. リンクをクリックしてスライドを確認

## トラブルシューティング

### データが保存されない

**原因**: サービスアカウントの権限不足

**解決法**:
1. スプレッドシートの共有設定を確認
2. サービスアカウントのメールが編集者として追加されているか確認

### スライドが生成されない

**原因**: Google Slides APIが有効化されていない

**解決法**:
1. Google Cloud Consoleで Google Slides API が有効化されているか確認
2. サービスアカウントに適切な権限があるか確認

### GOOGLE_PRIVATE_KEY エラー

**原因**: 秘密鍵の改行が正しく設定されていない

**解決法**:
1. 環境変数の値を確認
2. 改行が`\n`に正しく置換されているか確認
3. 先頭と末尾に余分な空白がないか確認

### 管理者ダッシュボードにログインできない

**原因**: パスワードが一致しない

**解決法**:
1. Vercelの環境変数 `ADMIN_PASSWORD` を確認
2. デプロイ後に環境変数を変更した場合は再デプロイが必要

### OpenAI APIエラー

**原因**: APIキーが無効または残高不足

**解決法**:
1. OpenAI Platformでアカウントの状態を確認
2. Usage ページで使用量を確認
3. 必要に応じて課金設定

## カスタムドメインの設定（オプション）

### カスタムドメインを使用する場合

1. Vercelダッシュボードでプロジェクトを開く
2. **Settings** → **Domains** を開く
3. カスタムドメインを追加
4. DNSレコードを設定
5. SSL証明書が自動的に設定されます

## 本番運用のチェックリスト

- [ ] すべての環境変数が正しく設定されている
- [ ] スプレッドシートにサービスアカウントが共有されている
- [ ] 参加者ページでデータが送信できる
- [ ] 管理者ダッシュボードでログインできる
- [ ] データが正しく表示される
- [ ] スライドが生成できる
- [ ] 強力な管理者パスワードを設定している
- [ ] OpenAI APIの使用量を監視している

## セキュリティのベストプラクティス

1. **パスワード**: 強力な管理者パスワードを設定
2. **APIキー**: 環境変数を定期的に更新
3. **権限**: サービスアカウントに最小限の権限のみ付与
4. **監視**: OpenAI APIの使用量を定期的に確認
5. **バックアップ**: スプレッドシートを定期的にバックアップ

## 次のステップ

- 参加者用URLを会議参加者に共有
- QRコードを生成してアクセスを簡単に
- 会議後のレポートをチームで共有
- フィードバックを集めて改善

## サポート

問題が発生した場合：
1. エラーメッセージを確認
2. Vercelのログを確認（ダッシュボード → Deployments → ログ）
3. GitHubのIssueで質問

---

セットアップが完了したら、MoodFlowをお楽しみください！
