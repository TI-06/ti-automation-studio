# 問い合わせメール通知のみ運用

## Goal
問い合わせフォームの受信後処理を、現時点ではメール通知のみとする。Googleスプレッドシートへの保存処理はソースとして残し、設定で将来有効化できるようにする。

## Behavior
- `CONTACT_NOTIFY_EMAIL` と `CONTACT_SHARED_SECRET` は必須。
- `CONTACT_SAVE_TO_SHEET` が明示的に `true` の場合のみスプレッドシート保存を実行する。
- `CONTACT_SAVE_TO_SHEET` が未設定または `false` の場合は、`CONTACT_SPREADSHEET_ID` がなくても受信できる。
- メール通知は常に実行する。
- メール送信失敗時は `{ ok: false }` を返す。
- スプレッドシート保存処理・数式インジェクション対策はコードから削除しない。

## Current production setup
当面は `CONTACT_SAVE_TO_SHEET` を設定しない（または `false`）。そのためユーザー側でスプレッドシート作成・ID設定は不要。
