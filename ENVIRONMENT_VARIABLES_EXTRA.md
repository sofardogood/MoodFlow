# 追加の環境変数（新機能向け）

- `SLACK_WEBHOOK_URL`: ネガティブ急増などのアラート送信先（Slack Incoming Webhook）
- `TEAMS_WEBHOOK_URL`: Microsoft Teams 用 Webhook（任意）
- `ALERT_WEBHOOK_URL`: 汎用 Webhook URL（任意）
- `ALERT_WINDOW_MINUTES`: アラート判定に使う直近データの分数（デフォルト 10）
- `ALERT_MIN_RECENT`: アラート判定に必要な最低件数（デフォルト 5）
- `ALERT_NEG_AVG`: 平均スコアがこの値以下でネガティブ増加とみなす（デフォルト -1.5）
- `ALERT_COOLDOWN_SECONDS`: 同じセッションでアラートを抑止するクールダウン（デフォルト 300 秒）
- `DEFAULT_TRANSLATION_LANG`: コメントを翻訳して保存する際のターゲット言語（デフォルト en）
- `SSE_POLL_INTERVAL_MS`: SSEフォールバック時のポーリング間隔（デフォルト 3000ms）
- `CRON_SECRET`: `/api/cron-generate-reports` を叩く際の保護用シークレット
- `REPORT_LANG`: 定期レポート出力時の言語
- `ENABLE_SLIDE_AUTOMATION`: `true` で定期レポート時に Slides 自動生成を有効化
