# 問い合わせGAS受信・通知 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 問い合わせフォームから送信された内容をTurnstile検証後にGASへ安全に転送し、スプレッドシート保存とメール通知を行う。

**Architecture:** 既存のAstro/Cloudflare Workerの `/api/contact` を維持し、Turnstile検証成功後のGAS転送部分だけを本文シークレット方式へ変更する。GASはScript Propertiesから秘密値・保存先・通知先を読み、保存成功後にMailAppで通知する。

**Tech Stack:** Astro, TypeScript, Cloudflare Workers, Cloudflare Turnstile, Google Apps Script, Google Sheets, MailApp, Vitest

**Spec:** `docs/superpowers/specs/2026-08-27-contact-gas-receiver-design.md`

## Global Constraints
- 秘密値・通知先メール・スプレッドシートIDをGitHubへハードコードしない。
- WorkerからGASへの共有シークレットはPOST本文 `_secret` で渡す。
- GASはScript Propertiesの `CONTACT_SHARED_SECRET`, `CONTACT_SPREADSHEET_ID`, `CONTACT_NOTIFY_EMAIL` を利用する。
- 保存シート名は `お問い合わせ`。
- スプレッドシート数式インジェクションを防止する。
- 正常保存後にMailAppで通知し、`replyTo` は問い合わせ者メールアドレスにする。
- 既存のフォームUIとTurnstile検証は維持する。

---

### Task 1: Worker → GAS転送契約を変更

**Files:**
- Modify: `tests/contact.test.ts`
- Modify: `src/pages/api/contact.ts`

**Interfaces:**
- Consumes: `CONTACT_SHARED_SECRET` Worker secret
- Produces: GAS POST JSON with `_secret`, `source`, `receivedAt`, `name`, `email`, `category`, `problem`, `request`, `budget`, `timing`

- [ ] **Step 1: Write the failing test**

`tests/contact.test.ts` で `src/pages/api/contact.ts` を文字列として読み、以下を検証する。

```ts
const contactApiSource = readFileSync(new URL('../src/pages/api/contact.ts', import.meta.url), 'utf-8');

it('GAS共有シークレットをHTTPヘッダーではなくJSON本文に含める', () => {
  expect(contactApiSource).toContain('_secret: sharedSecret');
  expect(contactApiSource).not.toContain("'x-portfolio-secret'");
});

it('GASのJSON結果が失敗なら送信成功にしない', () => {
  expect(contactApiSource).toContain('gasResult.ok');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: new two assertions fail against the current header-based implementation.

- [ ] **Step 3: Implement minimal Worker change**

`payload` に `_secret: sharedSecret` を追加し、GAS POSTから `x-portfolio-secret` を削除する。GASレスポンスをJSON解析し、`gasResult.ok !== true` の場合は502を返す。JSON解析不能も502とする。

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/contact.test.ts src/pages/api/contact.ts
git commit -m "fix: secure contact forwarding to GAS"
```

### Task 2: GAS受信・スプレッドシート保存・メール通知を追加

**Files:**
- Create: `gas/contact-receiver/Code.gs`
- Create: `gas/contact-receiver/README.md`
- Modify: `tests/content.test.ts`

**Interfaces:**
- Consumes: Worker POST JSON from Task 1
- Produces: JSON TextOutput `{ ok: true }` or `{ ok: false, message: string }`

- [ ] **Step 1: Write failing static contract tests**

`tests/content.test.ts` でGASファイルとREADMEを読み、以下を検証する。

```ts
const gasReceiverSource = readFileSync(new URL('../gas/contact-receiver/Code.gs', import.meta.url), 'utf-8');
const gasReceiverReadme = readFileSync(new URL('../gas/contact-receiver/README.md', import.meta.url), 'utf-8');

it('GAS受信側が本文シークレットをScript Propertiesと照合する', () => {
  expect(gasReceiverSource).toContain("getProperty('CONTACT_SHARED_SECRET')");
  expect(gasReceiverSource).toContain('payload._secret');
});

it('問い合わせを保存してメール通知する', () => {
  expect(gasReceiverSource).toContain("getProperty('CONTACT_SPREADSHEET_ID')");
  expect(gasReceiverSource).toContain("getProperty('CONTACT_NOTIFY_EMAIL')");
  expect(gasReceiverSource).toContain('appendRow');
  expect(gasReceiverSource).toContain('MailApp.sendEmail');
  expect(gasReceiverSource).toContain('replyTo');
});

it('GASセットアップ手順を公開ドキュメントに含める', () => {
  expect(gasReceiverReadme).toContain('CONTACT_SHARED_SECRET');
  expect(gasReceiverReadme).toContain('CONTACT_SPREADSHEET_ID');
  expect(gasReceiverReadme).toContain('CONTACT_NOTIFY_EMAIL');
  expect(gasReceiverReadme).toContain('Webアプリ');
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test`
Expected: missing GAS files cause failure until implementation exists.

- [ ] **Step 3: Implement `Code.gs`**

Functions:

```js
function doPost(e) {}
function getRequiredConfig_() {}
function getOrCreateSheet_(spreadsheet) {}
function sanitizeCell_(value) {}
function buildNotificationBody_(payload) {}
function jsonResponse_(body) {}
```

`doPost(e)` responsibilities:
1. `JSON.parse(e.postData.contents)`
2. required Script Properties validation
3. `_secret` constant string equality check
4. required `email`, `problem`, `source` validation
5. open spreadsheet by ID
6. get/create `お問い合わせ` sheet and header
7. append sanitized values
8. `MailApp.sendEmail({ to, subject, body, replyTo, name })`
9. return `{ ok: true }`
10. catch and return `{ ok: false, message: '...' }`

- [ ] **Step 4: Write setup README**

Document exact user steps:
- create Google Sheet
- open Extensions > Apps Script
- paste `Code.gs`
- Project Settings > Script Properties and add three properties
- Deploy > New deployment > Web app
- Execute as: Me
- Who has access: Anyone
- copy `/exec` URL
- set Cloudflare Worker vars/secrets
- create Turnstile widget for `ti-automation-studio.utiltoools.workers.dev`
- test one real submission

- [ ] **Step 5: Run tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add gas/contact-receiver tests/content.test.ts
git commit -m "feat: add GAS contact receiver and email notification"
```

### Task 3: Root documentation and final verification

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: deployed GAS receiver from Task 2
- Produces: complete setup documentation for production

- [ ] **Step 1: Update root README**

Replace the obsolete claim that GAS reads `X-Portfolio-Secret` with the body `_secret` contract. Link `gas/contact-receiver/README.md` and list the exact Script Properties.

- [ ] **Step 2: Run full verification**

Run:
```bash
npm test
npm run build
```
Expected: all Vitest tests pass; Astro check and Cloudflare Workers production build complete successfully.

- [ ] **Step 3: Review for secrets**

Search changed files for literal production email addresses, spreadsheet IDs, Turnstile secrets, and shared secrets. Expected: none present.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: document production contact setup"
```

- [ ] **Step 5: Open PR and merge after CI passes**

Create PR to `main`, verify GitHub Actions `test-and-build` succeeds, squash merge, then verify the post-merge `main` workflow succeeds.
