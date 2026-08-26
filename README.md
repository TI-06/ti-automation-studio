# TI AUTOMATION STUDIO

業務改善・自動化開発の実績、対応領域、公開ツール、問い合わせ窓口をまとめる営業用Webサイトです。

## コンセプト

**面倒な業務を、使える仕組みに変える。**

Excel・Google Apps Script・Python・Web・API・AIを組み合わせ、手作業で続いている業務を、現場で使える小さなシステムへ変えていきます。

## 方針

- サイト本文・見出し・実績説明は原則日本語
- 本名、顔写真、住所、勤務先などの個人情報は公開しない
- 顧客名や顧客固有データは掲載しない
- 実績は「課題 → 開発内容 → 改善」の形で匿名化して紹介する
- 営業上の品質を満たしたツールだけを公開する
- 問い合わせフォームから相談できる導線を設ける

## 技術構成

- Astro / TypeScript
- 独自CSS
- Cloudflare Workers
- Cloudflare Turnstile
- Google Apps Script（問い合わせ通知先）
- GitHub Actions

## ローカル起動

```bash
npm install
cp .dev.vars.example .dev.vars
npm run dev
```

`.dev.vars.example` のTurnstile値はCloudflare公式のテストキーです。問い合わせ転送まで確認する場合は、ローカルの `.dev.vars` に `CONTACT_GAS_URL` と `CONTACT_SHARED_SECRET` を設定してください。`.dev.vars` はGit管理対象外です。

## テスト / ビルド

```bash
npm test
npm run build
```

## Cloudflare Workersへの公開

### 1. GitHub連携

Cloudflare Workers & Pagesの管理画面からGitHubリポジトリ `TI-06/ti-automation-studio` を接続します。

- Production branch: `main`
- Build command: `npm run build`
- Deploy commandを手動実行する場合: `npm run deploy`

### 2. 環境変数

Cloudflare側に以下を登録します。

| 名前 | 種別 | 用途 |
| --- | --- | --- |
| `TURNSTILE_SITE_KEY` | Variable | 問い合わせ画面に表示するTurnstile site key |
| `TURNSTILE_SECRET_KEY` | Secret | Turnstileのサーバー検証 |
| `CONTACT_GAS_URL` | Secret | 問い合わせ転送先GAS Web App URL |
| `CONTACT_SHARED_SECRET` | Secret | WorkerとGAS間の共有シークレット |

秘密値は `wrangler.jsonc` やソースコードへ直接書き込みません。

### 3. Turnstile

Cloudflare Turnstileで本番ドメイン用Widgetを作成し、Site Key / Secret Keyを上記環境変数へ設定します。サーバー側では `/api/contact` がSiteverify APIを実行し、検証成功後のみGASへ転送します。

### 4. 独自ドメイン

独自ドメインを設定したら、以下も本番URLへ変更します。

- `astro.config.mjs` の `site`
- `public/robots.txt` の Sitemap URL

## 問い合わせ受信側GAS

GAS側ではPOSTされたJSONを受け取り、`X-Portfolio-Secret` がCloudflare側の `CONTACT_SHARED_SECRET` と一致することを確認してから保存・メール通知します。

受信データ:

- `source`
- `receivedAt`
- `name`
- `email`
- `category`
- `problem`
- `request`
- `budget`
- `timing`

## 公開ツールについて

既存GitHubリポジトリは無条件では掲載しません。以下を確認したものだけ `src/data/tools.ts` で `published: true` にします。

- APIキー・トークン・秘密情報が含まれていない
- 顧客・個人情報が含まれていない
- ライセンス上問題がない
- UI・README・動作が営業サイトに掲載できる品質になっている

## ドキュメント

- `docs/superpowers/specs/2026-08-26-ti-automation-studio-design.md`
- `docs/superpowers/plans/2026-08-26-ti-automation-studio-implementation.md`
