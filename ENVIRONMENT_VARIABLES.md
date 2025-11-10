# MoodFlow 環境変数設定ガイド

このドキュメントでは、MoodFlowで使用するすべての環境変数（スクリプトプロパティ）について説明します。

## 必須の環境変数

これらの環境変数は必ず設定する必要があります。

### 1. OPENAI_API_KEY

**説明**: OpenAI APIのAPIキー

**取得方法**:
1. [OpenAI Platform](https://platform.openai.com/) にアクセス
2. [API Keys](https://platform.openai.com/api-keys) ページを開く
3. **Create new secret key** をクリック
4. APIキーをコピー

**形式**: `sk-proj-...` で始まる文字列

**例**:
```
OPENAI_API_KEY=sk-proj-1234567890abcdefghijklmnopqrstuvwxyz
```

**Vercel設定**:
- Environment Variables に追加
- Production, Preview, Development すべてにチェック

---

### 2. SPREADSHEET_ID

**説明**: データを保存するGoogleスプレッドシートのID

**取得方法**:
1. Google Spreadsheetを開く
2. URLから以下の部分をコピー:
   ```
   https://docs.google.com/spreadsheets/d/{ここがSPREADSHEET_ID}/edit
   ```

**形式**: 英数字とハイフンの組み合わせ（約44文字）

**例**:
```
SPREADSHEET_ID=1ABCdefGHIjklMNOpqrSTUvwxYZ1234567890abcdefg
```

**注意**:
- スプレッドシートのシート名は「MoodData」にする
- サービスアカウントに編集者権限を付与する

---

### 3. ADMIN_PASSWORD

**説明**: 管理者ダッシュボードへのログインパスワード

**設定方法**:
自由に決定してください。強力なパスワードを推奨します。

**形式**: 任意の文字列（推奨: 12文字以上、英数字記号の組み合わせ）

**例**:
```
ADMIN_PASSWORD=MySecurePassword123!
```

**セキュリティ**:
- 定期的に変更する
- 他のサービスと同じパスワードを使わない
- パスワードマネージャーで管理する

---

### 4. GOOGLE_SERVICE_ACCOUNT_EMAIL

**説明**: Googleサービスアカウントのメールアドレス

**取得方法**:
1. Google Cloud Consoleでサービスアカウントを作成
2. 作成したサービスアカウントのJSONキーをダウンロード
3. JSONファイルの `client_email` の値をコピー

**形式**: `xxx@xxx.iam.gserviceaccount.com`

**例**:
```
GOOGLE_SERVICE_ACCOUNT_EMAIL=moodflow-service@your-project.iam.gserviceaccount.com
```

**注意**:
- このメールアドレスをスプレッドシートに共有（編集者権限）
- フォルダに共有する場合も同様

---

### 5. GOOGLE_PRIVATE_KEY

**説明**: Googleサービスアカウントの秘密鍵

**取得方法**:
1. サービスアカウントのJSONキーファイルを開く
2. `private_key` の値をコピー
3. **重要**: 改行を `\n` に置換する

**形式**: 改行が `\n` に置換されたRSA秘密鍵

**変換例**:

元の値:
```
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
...（複数行）...
-----END PRIVATE KEY-----
```

変換後:
```
-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n...\n-----END PRIVATE KEY-----\n
```

**変換方法**:

macOS/Linuxの場合:
```bash
# JSONファイルから自動抽出
cat service-account-key.json | jq -r '.private_key'
```

オンラインツールを使用:
- テキストエディタの置換機能で改行を `\n` に置換

**Vercel設定時の注意**:
- ダブルクォートで囲む必要はありません
- 先頭と末尾に余分な空白を入れない

---

## オプションの環境変数

これらは必須ではありませんが、設定すると便利です。

### 6. GOOGLE_SLIDES_FOLDER_ID

**説明**: 生成したGoogleスライドを保存するフォルダのID

**取得方法**:
1. Google Driveでフォルダを作成
2. フォルダのURLから以下の部分をコピー:
   ```
   https://drive.google.com/drive/folders/{ここがFOLDER_ID}
   ```

**形式**: 英数字とハイフンの組み合わせ

**例**:
```
GOOGLE_SLIDES_FOLDER_ID=1XYZabcDEFghiJKLmnoPQRstu
```

**設定しない場合**:
スライドはマイドライブのルートに作成されます。

**注意**:
- フォルダにサービスアカウントのメールアドレスを共有（編集者権限）
- 共有しないとフォルダに移動できません

---

## Vercelでの設定手順

### 1. Vercelダッシュボードにアクセス

1. [Vercel](https://vercel.com) にログイン
2. プロジェクトを選択
3. **Settings** → **Environment Variables** を開く

### 2. 環境変数を追加

各環境変数を以下の手順で追加:

1. **Key** に変数名を入力（例: `OPENAI_API_KEY`）
2. **Value** に値を入力
3. 環境を選択:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
4. **Save** をクリック

### 3. 再デプロイ

環境変数を追加・変更したら、再デプロイが必要です:

1. **Deployments** タブを開く
2. 最新のデプロイメントの右側 **...** をクリック
3. **Redeploy** を選択

---

## ローカル開発での設定

### .envファイルの作成

1. `.env.example` をコピーして `.env` を作成:
   ```bash
   cp .env.example .env
   ```

2. `.env` ファイルを編集して値を設定:
   ```env
   OPENAI_API_KEY=sk-proj-...
   SPREADSHEET_ID=1ABC...
   ADMIN_PASSWORD=your-password
   GOOGLE_SERVICE_ACCOUNT_EMAIL=xxx@xxx.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   GOOGLE_SLIDES_FOLDER_ID=1XYZ...
   ```

3. ローカルサーバーを起動:
   ```bash
   npm install
   vercel dev
   ```

---

## トラブルシューティング

### OPENAI_API_KEY エラー

**エラーメッセージ**: "Invalid API key" または "Unauthorized"

**解決方法**:
1. APIキーが正しくコピーされているか確認
2. OpenAI Platformで使用量を確認（無料枠を超過していないか）
3. APIキーが有効か確認（削除されていないか）

### GOOGLE_PRIVATE_KEY エラー

**エラーメッセージ**: "Error: error:0909006C:PEM routines"

**解決方法**:
1. 改行が正しく `\n` に置換されているか確認
2. 先頭の `-----BEGIN PRIVATE KEY-----` と末尾の `-----END PRIVATE KEY-----` が含まれているか確認
3. 余分な空白やクォートがないか確認

### Permission Denied エラー

**エラーメッセージ**: "The caller does not have permission"

**解決方法**:
1. スプレッドシートにサービスアカウントが共有されているか確認
2. 権限が「編集者」になっているか確認
3. フォルダを使用する場合、フォルダにも共有されているか確認

---

## セキュリティのベストプラクティス

1. **APIキーの管理**
   - 環境変数にのみ保存（コードに直接書かない）
   - 定期的にローテーション
   - 使用量を監視

2. **パスワードの管理**
   - 強力なパスワードを使用
   - パスワードマネージャーで管理
   - 定期的に変更

3. **秘密鍵の管理**
   - JSONファイルを安全な場所に保管
   - Gitにコミットしない（.gitignoreに含める）
   - 漏洩した場合はすぐに無効化

4. **アクセス制御**
   - サービスアカウントに最小限の権限のみ付与
   - 不要なAPIは有効化しない
   - 定期的に権限を見直す

---

## チェックリスト

デプロイ前に確認:

- [ ] OPENAI_API_KEY が設定されている
- [ ] SPREADSHEET_ID が設定されている
- [ ] ADMIN_PASSWORD が設定されている（強力なパスワード）
- [ ] GOOGLE_SERVICE_ACCOUNT_EMAIL が設定されている
- [ ] GOOGLE_PRIVATE_KEY が設定されている（改行が \n に置換済み）
- [ ] スプレッドシートにサービスアカウントが共有されている
- [ ] Google Sheets API が有効化されている
- [ ] Google Slides API が有効化されている
- [ ] Google Drive API が有効化されている
- [ ] （オプション）GOOGLE_SLIDES_FOLDER_ID が設定されている
- [ ] （オプション）フォルダにサービスアカウントが共有されている

---

このドキュメントに従って環境変数を正しく設定すれば、MoodFlowが正常に動作します。
