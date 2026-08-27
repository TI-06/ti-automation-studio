# 問い合わせ受信GAS セットアップ

TI AUTOMATION STUDIO の問い合わせフォームから、Cloudflare Worker経由で問い合わせを受信し、Googleスプレッドシートへ保存してメール通知するGASです。

## 1. Googleスプレッドシートを作成

問い合わせ保存用のGoogleスプレッドシートを1つ新規作成してください。シート名は何でも構いません。GASが初回受信時に `お問い合わせ` シートを自動作成します。

スプレッドシートURLが次の場合:

```text
https://docs.google.com/spreadsheets/d/XXXXXXXXXXXXXXXXXXXXXXXXXXXX/edit
```

`/d/` と `/edit` の間にある `XXXXXXXXXXXXXXXXXXXXXXXXXXXX` が `CONTACT_SPREADSHEET_ID` です。

## 2. Apps Scriptを作成

1. 作成したスプレッドシートを開く
2. `拡張機能` → `Apps Script`
3. 既存の `Code.gs` の内容を削除
4. このフォルダの `Code.gs` をすべて貼り付けて保存

## 3. Script Propertiesを設定

Apps Script画面左側の `プロジェクトの設定` を開き、`スクリプト プロパティ` に次の3つを追加します。

| プロパティ | 値 |
| --- | --- |
| `CONTACT_SHARED_SECRET` | WorkerとGASで共通に使う32文字以上のランダム文字列 |
| `CONTACT_SPREADSHEET_ID` | 手順1で確認したスプレッドシートID |
| `CONTACT_NOTIFY_EMAIL` | 新規問い合わせ通知を受け取りたいメールアドレス |

`CONTACT_SHARED_SECRET` はパスワードマネージャー等で32〜64文字程度のランダム値を作成してください。この値は後でCloudflareにも**同じ値**を設定します。

これらの値を `Code.gs` やGitHubへ直接書かないでください。

## 4. 初回権限を許可

GASはGoogle Sheetsへの書き込みとMailAppによるメール送信を行います。最初の実行・デプロイ時にGoogleの権限確認が表示された場合は、内容を確認して許可してください。

MailAppは通知メールの送信だけに利用し、Gmailの受信トレイを読み取る処理はありません。

## 5. Webアプリとしてデプロイ

1. Apps Script右上の `デプロイ` → `新しいデプロイ`
2. `種類の選択` → `ウェブアプリ`
3. 説明: `TI AUTOMATION STUDIO Contact Receiver`
4. `次のユーザーとして実行`: **自分**
5. `アクセスできるユーザー`: **全員（Anyone）**
6. `デプロイ`
7. 表示されたWebアプリURLをコピー

本番で使うURLは末尾が `/exec` のものです。`/dev` はテスト用URLなのでCloudflareには設定しません。

Webアプリ自体は外部からアクセス可能ですが、GAS側で `CONTACT_SHARED_SECRET` を検証し、Cloudflare側ではその前段でTurnstile検証を行います。

## 6. Cloudflare Workerへ設定

Cloudflare Dashboardで `ti-automation-studio` Workerを開き、Variables and Secretsへ以下を設定します。

| 名前 | 種別 | 値 |
| --- | --- | --- |
| `TURNSTILE_SITE_KEY` | Variable / Text | Turnstileで発行されたSite Key |
| `TURNSTILE_SECRET_KEY` | Secret | Turnstileで発行されたSecret Key |
| `CONTACT_GAS_URL` | Secret | 手順5の `/exec` URL |
| `CONTACT_SHARED_SECRET` | Secret | GASのScript Propertiesと同じランダム文字列 |

設定後はWorkerを再デプロイしてください。

## 7. Turnstile Widgetを作成

Cloudflare DashboardのTurnstileからWidgetを作成します。

- Widget name: `TI AUTOMATION STUDIO Contact`
- Hostname: `ti-automation-studio.utiltoools.workers.dev`
- Widget mode: `Managed`

発行されたSite KeyとSecret Keyを手順6で設定します。

独自ドメインへ切り替えた場合は、そのドメインもTurnstile WidgetのHostnameへ追加してください。

## 8. 動作確認

Cloudflareへの反映後、公開サイトの問い合わせページからテスト送信します。

確認する内容:

1. 送信ボタンが押せる
2. 送信中に `送信しています…` と表示される
3. 成功後に `お問い合わせを受け付けました` と表示される
4. Googleスプレッドシートに `お問い合わせ` シートが作成され、1行追加される
5. `CONTACT_NOTIFY_EMAIL` に通知メールが届く
6. 通知メールの返信先が問い合わせフォームに入力したメールアドレスになっている

## 保存される列

1. 受信日時
2. お名前・会社名
3. メールアドレス
4. 相談カテゴリ
5. 現在困っていること
6. 希望していること
7. 予算感
8. 希望時期
9. 送信元

## GASコードを変更した場合

Apps Scriptでコードを変更しただけでは既存の本番Webアプリへ反映されない場合があります。`デプロイ` → `デプロイを管理` から既存デプロイを編集し、新しいバージョンとして更新してください。

## セキュリティ上の注意

- `CONTACT_SHARED_SECRET` を第三者へ共有しない
- Script Propertiesの値をGitHubへコミットしない
- CloudflareのSecret値をソースコードへ書かない
- WebアプリURLをフロントエンドへ直接埋め込まない
- 問い合わせ内容は個人情報を含む可能性があるため、保存先スプレッドシートの共有範囲を必要最小限にする
