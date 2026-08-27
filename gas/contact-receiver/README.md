# 問い合わせ受信GAS セットアップ

TI AUTOMATION STUDIO の問い合わせフォームから、Cloudflare Worker経由で問い合わせを受信し、**現在はメール通知だけ**行うGASです。

Googleスプレッドシート保存用の処理は `Code.gs` に残してありますが、標準では無効です。必要になった時だけ設定で有効化できます。

## 1. Apps Scriptを作成

現行運用では**スプレッドシートは不要**です。

Google Apps Scriptの新しいプロジェクトを作成し、既存の `Code.gs` の内容を削除して、このフォルダの `Code.gs` をすべて貼り付けて保存してください。

## 2. Script Propertiesを設定

Apps Script画面左側の `プロジェクトの設定` を開き、`スクリプト プロパティ` に次の2つを追加します。

| プロパティ | 値 |
| --- | --- |
| `CONTACT_SHARED_SECRET` | WorkerとGASで共通に使う32文字以上のランダム文字列 |
| `CONTACT_NOTIFY_EMAIL` | 新規問い合わせ通知を受け取りたいメールアドレス |

`CONTACT_SHARED_SECRET` は32〜64文字程度のランダム値を作成してください。この値は後でCloudflareにも**同じ値**を設定します。

これらの値を `Code.gs` やGitHubへ直接書かないでください。

### スプレッドシート保存を後から有効にする場合

以下の2つを追加してください。

| プロパティ | 値 |
| --- | --- |
| `CONTACT_SAVE_TO_SHEET` | `true` |
| `CONTACT_SPREADSHEET_ID` | 保存先GoogleスプレッドシートID |

`CONTACT_SAVE_TO_SHEET` が未設定または `false` の場合、`CONTACT_SPREADSHEET_ID` は不要です。

保存を有効にすると、GASが保存先スプレッドシートへ `お問い合わせ` シートを自動作成し、問い合わせを追記します。

## 3. 初回権限を許可

現在はMailAppによるメール送信だけを利用します。最初の実行・デプロイ時にGoogleの権限確認が表示された場合は、内容を確認して許可してください。

MailAppは通知メールの送信だけに利用し、Gmailの受信トレイを読み取る処理はありません。

将来 `CONTACT_SAVE_TO_SHEET=true` にした場合は、Google Sheetsへの書き込み権限も利用します。

## 4. Webアプリとしてデプロイ

1. Apps Script右上の `デプロイ` → `新しいデプロイ`
2. `種類の選択` → `ウェブアプリ`
3. 説明: `TI AUTOMATION STUDIO Contact Receiver`
4. `次のユーザーとして実行`: **自分**
5. `アクセスできるユーザー`: **全員（Anyone）**
6. `デプロイ`
7. 表示されたWebアプリURLをコピー

本番で使うURLは末尾が `/exec` のものです。`/dev` はテスト用URLなのでCloudflareには設定しません。

Webアプリ自体は外部からアクセス可能ですが、GAS側で `CONTACT_SHARED_SECRET` を検証します。WebアプリURLや共有シークレットはフロントエンドへ直接埋め込みません。

## 5. Cloudflare Workerへ設定

Cloudflare Dashboardで `ti-automation-studio` Workerを開き、Variables and Secretsへ以下を設定します。

| 名前 | 種別 | 値 |
| --- | --- | --- |
| `CONTACT_GAS_URL` | Secret | 手順4の `/exec` URL |
| `CONTACT_SHARED_SECRET` | Secret | GASのScript Propertiesと同じランダム文字列 |

設定後はWorkerを再デプロイしてください。

問い合わせフォーム側では、通常の利用者には見えないhoneypot項目とサーバー側バリデーションを使って軽量なスパム対策を行います。

## 6. 動作確認

Cloudflareへの反映後、公開サイトの問い合わせページからテスト送信します。

確認する内容:

1. 送信ボタンが押せる
2. 送信中に `送信しています…` と表示される
3. 成功後に `お問い合わせを受け付けました` と表示される
4. `CONTACT_NOTIFY_EMAIL` に通知メールが届く
5. 通知メールの返信先が問い合わせフォームに入力したメールアドレスになっている

現在の標準設定ではGoogleスプレッドシートには何も保存されません。

## メールに含まれる内容

- 受信日時
- お名前・会社名
- メールアドレス
- 相談カテゴリ
- 現在困っていること
- 希望していること
- 予算感
- 希望時期

## GASコードを変更した場合

Apps Scriptでコードを変更しただけでは既存の本番Webアプリへ反映されない場合があります。`デプロイ` → `デプロイを管理` から既存デプロイを編集し、新しいバージョンとして更新してください。

## セキュリティ上の注意

- `CONTACT_SHARED_SECRET` を第三者へ共有しない
- Script Propertiesの値をGitHubへコミットしない
- CloudflareのSecret値をソースコードへ書かない
- WebアプリURLをフロントエンドへ直接埋め込まない
- 将来スプレッドシート保存を有効にする場合は、保存先の共有範囲を必要最小限にする
