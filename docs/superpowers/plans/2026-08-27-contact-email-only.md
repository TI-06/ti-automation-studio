# Contact Email-Only Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 問い合わせ受信をメール通知のみで運用し、スプレッドシート保存は将来再有効化できるようコードを残す。

**Architecture:** GASの設定取得で `CONTACT_SAVE_TO_SHEET` を読む。未設定/falseではシート関連設定を要求せずメールだけ送信し、trueの時だけ既存の保存処理を実行する。

**Tech Stack:** Google Apps Script, Vitest, Astro repository CI

**Spec:** `docs/superpowers/specs/2026-08-27-contact-email-only.md`

## Global Constraints

- `CONTACT_NOTIFY_EMAIL` と `CONTACT_SHARED_SECRET` は必須。
- `CONTACT_SAVE_TO_SHEET=true` の時だけ `CONTACT_SPREADSHEET_ID` を必須にする。
- スプレッドシート保存用ソースは削除しない。
- 当面の手順書ではスプレッドシート作成を不要とする。

---

### Task 1: Email-only contract

**Files:**
- Modify: `tests/content.test.ts`
- Modify: `gas/contact-receiver/Code.gs`

**Interfaces:**
- Consumes: Script Properties
- Produces: `getRequiredConfig_()` returning `saveToSheet`, conditional sheet save, unconditional MailApp notification

- [ ] **Step 1: Write the failing test**

メールのみモードで `CONTACT_SPREADSHEET_ID` が必須でなく、`CONTACT_SAVE_TO_SHEET` により保存処理が分岐することをソース契約テストへ追加する。

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL because `CONTACT_SAVE_TO_SHEET` contract is not implemented.

- [ ] **Step 3: Write minimal implementation**

`CONTACT_SAVE_TO_SHEET` をboolean化し、trueの時だけSpreadsheetApp / appendRowを実行する。falseではMailAppへ直接進む。

- [ ] **Step 4: Run tests and build**

Run: `npm test && npm run build`
Expected: PASS.

### Task 2: Setup guide

**Files:**
- Modify: `gas/contact-receiver/README.md`
- Modify: `README.md`

**Interfaces:**
- Produces: 現行運用ではスプレッドシート不要、将来ONにする場合のみ追加設定する手順

- [ ] **Step 1: Update documentation**

必須設定を `CONTACT_SHARED_SECRET` / `CONTACT_NOTIFY_EMAIL` に絞り、`CONTACT_SAVE_TO_SHEET` と `CONTACT_SPREADSHEET_ID` を任意設定として説明する。

- [ ] **Step 2: Run full verification**

Run: `npm test && npm run build`
Expected: PASS.
