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

### 4. Google認証情報（以下のいずれか一つを設定）

Google APIを使用するには、サービスアカウントの認証情報が必要です。**2つの方法**があります：

#### 方法1: GOOGLE_SERVICE_ACCOUNT_JSON（推奨・簡単）

**説明**: サービスアカウントのJSONキーファイル全体

**取得方法**:
1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクトを選択または作成
3. **IAMと管理** → **サービスアカウント** を開く
4. **サービスアカウントを作成** をクリック
5. 名前（例: moodflow-service）を入力して **作成して続行**
6. ロールは不要（スキップ）して **完了**
7. 作成したサービスアカウントをクリック
8. **キー** タブを開く
9. **鍵を追加** → **新しい鍵を作成**
10. **JSON** を選択して **作成**
11. ダウンロードされたJSONファイルを開く
12. **ファイル全体の内容をコピー**

**形式**: JSON形式のテキスト

**例**:
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----\n",
  "client_email": "moodflow-service@your-project.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

**Vercel設定**:
1. JSONファイルの内容全体をコピー
2. Vercel Environment Variables の Value にペースト
3. そのまま保存（改行などの変換は不要）

**メリット**:
- ✅ 設定が簡単（コピー&ペーストだけ）
- ✅ 改行の置換が不要
- ✅ エラーが発生しにくい

**注意**:
- このメールアドレス（`client_email` の値）をスプレッドシートに共有（編集者権限）
- フォルダに共有する場合も同様

---

#### 方法2: 個別設定（上級者向け）

GOOGLE_SERVICE_ACCOUNT_JSON の設定が難しい場合や、個別に管理したい場合はこちらを使用します。

##### 4-A. GOOGLE_SERVICE_ACCOUNT_EMAIL

**説明**: Googleサービスアカウントのメールアドレス

**取得方法**:
1. サービスアカウントのJSONキーファイルを開く
2. `client_email` の値をコピー

**形式**: `xxx@xxx.iam.gserviceaccount.com`

**例**:
```
GOOGLE_SERVICE_ACCOUNT_EMAIL=moodflow-service@your-project.iam.gserviceaccount.com
```

---

##### 4-B. GOOGLE_PRIVATE_KEY

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

---

## オプションの環境変数

これらは必須ではありませんが、設定すると便利です。

### 5. GOOGLE_SLIDES_FOLDER_ID

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

   # 推奨: JSONファイル全体を設定
   GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}

   # または個別設定
   # GOOGLE_SERVICE_ACCOUNT_EMAIL=xxx@xxx.iam.gserviceaccount.com
   # GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

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

### Google認証エラー

**エラーメッセージ**: "Error: error:0909006C:PEM routines" または "サービスアカウントJSONの解析に失敗しました"

**解決方法**:

**GOOGLE_SERVICE_ACCOUNT_JSON を使用している場合**:
1. JSONファイルの内容が完全にコピーされているか確認
2. JSONの形式が正しいか確認（開始 `{` と終了 `}` が含まれているか）
3. Vercelの場合、値を再度ペーストしてみる

**GOOGLE_PRIVATE_KEY を使用している場合**:
1. 改行が正しく `\n` に置換されているか確認
2. 先頭の `-----BEGIN PRIVATE KEY-----` と末尾の `-----END PRIVATE KEY-----` が含まれているか確認
3. 余分な空白やクォートがないか確認
4. 問題が解決しない場合は、代わりに `GOOGLE_SERVICE_ACCOUNT_JSON` の使用を検討

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

**必須の環境変数**:
- [ ] OPENAI_API_KEY が設定されている
- [ ] SPREADSHEET_ID が設定されている
- [ ] ADMIN_PASSWORD が設定されている（強力なパスワード）
- [ ] Google認証情報（以下のいずれか）
  - [ ] GOOGLE_SERVICE_ACCOUNT_JSON が設定されている（推奨）
  - [ ] または GOOGLE_SERVICE_ACCOUNT_EMAIL と GOOGLE_PRIVATE_KEY が設定されている

**Google Cloud設定**:
- [ ] Google Cloud Projectが作成されている
- [ ] サービスアカウントが作成されている
- [ ] Google Sheets API が有効化されている
- [ ] Google Slides API が有効化されている
- [ ] Google Drive API が有効化されている

**権限設定**:
- [ ] スプレッドシートにサービスアカウントのメールアドレスが共有されている（編集者権限）
- [ ] （オプション）GOOGLE_SLIDES_FOLDER_ID が設定されている
- [ ] （オプション）フォルダにサービスアカウントが共有されている（編集者権限）

---

このドキュメントに従って環境変数を正しく設定すれば、MoodFlowが正常に動作します。
