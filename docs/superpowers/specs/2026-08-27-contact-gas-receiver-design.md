# 問い合わせGAS受信・通知 設計

## 目的
TI AUTOMATION STUDIO の問い合わせフォームを本番運用できる状態にする。フォーム送信後、Cloudflare Turnstile でBot判定し、Cloudflare WorkerからGoogle Apps Script Web Appへ転送して、Googleスプレッドシートへ保存し、指定メールアドレスへ通知する。

## 全体構成
1. ブラウザの問い合わせフォームで入力・同意・Turnstileトークンを取得する。
2. `/api/contact` が入力値を検証する。
3. WorkerがCloudflare Turnstile Siteverify APIでトークンを検証する。
4. 検証成功後、WorkerがGAS Web AppへJSONをPOSTする。
5. GASはPOST本文の `_secret` をScript Propertiesの `CONTACT_SHARED_SECRET` と比較する。
6. 一致した場合のみ、問い合わせ内容をスプレッドシートへ追記する。
7. 保存成功後、GASのMailAppで `CONTACT_NOTIFY_EMAIL` へ通知メールを送信する。
8. GASはJSONで成功/失敗を返し、Workerはその結果をブラウザへ返す。

## セキュリティ
- TurnstileのSecret Key、GAS Web App URL、共有シークレットはCloudflare WorkerのVariables / Secretsへ保存し、GitHubへコミットしない。
- GAS側の共有シークレット、スプレッドシートID、通知先メールアドレスはScript Propertiesへ保存し、ソースへハードコードしない。
- Apps Script Web Appの `doPost(e)` では `e.postData.contents` からJSON本文を読み取る。公式イベントオブジェクトに任意リクエストヘッダーは定義されていないため、共有シークレットはHTTPヘッダーではなくPOST本文の `_secret` で渡す。
- 顧客入力値は文字列として扱い、スプレッドシートへ書き込む際に先頭が `=`, `+`, `-`, `@` の値は先頭へ `'` を付与して数式実行を防ぐ。
- GASは共有シークレット不一致時に保存もメール送信も行わない。

## GAS Script Properties
- `CONTACT_SHARED_SECRET`: WorkerとGASで共有するランダムな秘密値
- `CONTACT_SPREADSHEET_ID`: 問い合わせ保存先GoogleスプレッドシートID
- `CONTACT_NOTIFY_EMAIL`: 新規問い合わせ通知を受け取るメールアドレス

## 保存先
シート名は `お問い合わせ`。存在しなければ自動作成し、初回のみヘッダーを追加する。

列:
1. 受信日時
2. お名前・会社名
3. メールアドレス
4. 相談カテゴリ
5. 現在困っていること
6. 希望していること
7. 予算感
8. 希望時期
9. 送信元

## メール通知
件名: `[TI AUTOMATION STUDIO] 新しいお問い合わせ`

本文には、受信日時・名前/会社名・メールアドレス・カテゴリ・困りごと・希望内容・予算・希望時期を含める。`replyTo` に問い合わせ者のメールアドレスを設定し、通知メールからそのまま返信できるようにする。

## エラー処理
- JSON解析失敗: 400相当のJSONを返す
- Script Properties不足: GAS側でエラーJSONを返す
- 共有シークレット不一致: エラーJSONを返す
- スプレッドシート保存失敗: エラーJSONを返し、メールは送らない
- メール通知失敗: 保存済みであることを保持したままエラーJSONを返す。Worker側では利用者へ再送を促すため送信失敗として扱う
- WorkerはGASのHTTPステータスだけでなくJSON `{ ok: boolean }` も確認する

## ユーザーが行う設定
1. Googleスプレッドシートを1つ作成する。
2. Apps Scriptプロジェクトを作成し、リポジトリ内 `gas/contact-receiver/Code.gs` を貼り付ける。
3. Script Propertiesに3値を設定する。
4. Webアプリとして「実行するユーザー: 自分」「アクセスできるユーザー: 全員」でデプロイし、`/exec` URLを取得する。
5. Cloudflareに `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `CONTACT_GAS_URL`, `CONTACT_SHARED_SECRET` を設定する。
6. Turnstile WidgetのHostnameへ本番Workersドメインを登録する。

## 完了条件
- 正常な問い合わせがスプレッドシートへ1行保存される。
- 保存時に通知メールが届く。
- 通知メールの返信先が問い合わせ者になる。
- Turnstile失敗、共有シークレット不一致、GAS設定不足では保存されない。
- 既存の問い合わせフォームUIの送信中・成功・失敗表示を維持する。
