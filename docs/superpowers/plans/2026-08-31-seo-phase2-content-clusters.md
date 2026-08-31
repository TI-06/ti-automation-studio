# SEO Phase 2 Content Clusters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the site from five SEO guides to a 20-guide topic-cluster structure connected bidirectionally with services and case studies.

**Architecture:** Keep `src/data/solutions.ts` as the source of truth for solution content and add cluster/search-intent/internal-link metadata there. Reuse the existing dynamic `/solutions/[slug]` renderer, extend service/work detail pages to discover related guides from the same data, and add SEO metadata fields to `works.ts` without changing visible case-study titles.

**Tech Stack:** Astro, TypeScript, Vitest, Cloudflare adapter

**Spec:** `docs/superpowers/specs/2026-08-31-seo-phase2-content-clusters.md`

## Global Constraints
- No new runtime dependency.
- Do not expose confidential client details or fabricate numeric outcomes.
- Keep existing canonical, OGP, structured data, design language, and responsive behavior.
- All existing tests plus Phase 2 tests must pass.

---

### Task 1: Phase 2 acceptance tests

**Files:**
- Create: `tests/seo-phase2.test.ts`

**Interfaces:**
- Consumes: existing `solutions`, service detail source, work detail source.
- Produces: executable requirements for 20 solutions, clusters, related-guide links, and work SEO metadata.

- [ ] **Step 1: Write failing tests**
  - Assert `solutions.length === 20`.
  - Assert all 15 Phase 2 slugs exist.
  - Assert every solution has `cluster`, `searchIntent`, and at least two `relatedSolutionSlugs`.
  - Assert solutions index groups by cluster.
  - Assert solution detail renders related guides.
  - Assert service detail discovers and renders related solutions.
  - Assert work detail discovers and renders related solutions.
  - Assert every work has `seoTitle` and `seoDescription`, and work detail passes those to `BaseLayout`.

- [ ] **Step 2: Run `npm test -- tests/seo-phase2.test.ts` and confirm RED**
Expected: failure because Phase 2 fields/pages/content do not exist yet.

- [ ] **Step 3: Commit test-only RED state**
Commit message: `test: define SEO phase 2 content cluster requirements`

### Task 2: Expand solution data to 20 guides

**Files:**
- Modify: `src/data/solutions.ts`

**Interfaces:**
- Adds `cluster`, `searchIntent`, `relatedSolutionSlugs` to `SolutionDefinition`.
- Adds 15 Phase 2 `SolutionDefinition` entries.

- [ ] **Step 1: Extend the interface**
Use exact fields:
```ts
cluster: 'excel' | 'gas' | 'python' | 'api' | 'automation';
searchIntent: 'informational' | 'commercial';
relatedSolutionSlugs: string[];
```

- [ ] **Step 2: Add metadata to the existing five solutions**
Assign each an appropriate cluster, intent, and at least two related solution slugs.

- [ ] **Step 3: Add the 15 spec slugs**
Each entry includes unique SEO copy, decision criteria, approaches, steps, cost guidance, pitfalls, at least three FAQs, and all related-link fields.

- [ ] **Step 4: Run the Phase 2 test and confirm data assertions turn GREEN**
Run: `npm test -- tests/seo-phase2.test.ts`

- [ ] **Step 5: Commit**
Commit message: `feat: expand SEO guides to twenty search intents`

### Task 3: Build solution clusters and article-to-article linking

**Files:**
- Modify: `src/pages/solutions/index.astro`
- Modify: `src/pages/solutions/[slug].astro`

**Interfaces:**
- Consumes `solution.cluster` and `solution.relatedSolutionSlugs`.
- Produces cluster sections on index and related-guide cards on detail.

- [ ] **Step 1: Group index entries by the five cluster keys**
Render visible Japanese headings for each cluster and keep links crawlable as normal anchors.

- [ ] **Step 2: Resolve related guides on detail pages**
```ts
const relatedSolutions = solution.relatedSolutionSlugs
  .map((relatedSlug) => solutions.find((item) => item.slug === relatedSlug))
  .filter(Boolean);
```

- [ ] **Step 3: Render a `関連する業務自動化ガイド` section**
Use existing card classes; do not introduce a new styling system.

- [ ] **Step 4: Run Phase 2 and full tests**
Run: `npm test -- tests/seo-phase2.test.ts` then `npm test`.

- [ ] **Step 5: Commit**
Commit message: `feat: connect solution guides into topic clusters`

### Task 4: Connect services and works to the clusters

**Files:**
- Modify: `src/pages/services/[slug].astro`
- Modify: `src/data/works.ts`
- Modify: `src/pages/works/[slug].astro`

**Interfaces:**
- Service detail selects `solutions.filter((item) => item.relatedServiceSlug === service.slug)`.
- Work detail selects `solutions.filter((item) => item.relatedWorkSlugs.includes(work.slug))`.
- Work data adds `seoTitle` and `seoDescription`.

- [ ] **Step 1: Add `seoTitle` and `seoDescription` to `Work` and every work entry**
SEO titles should describe the actual automation outcome without altering visible case-study titles.

- [ ] **Step 2: Use SEO metadata in work `BaseLayout`**
```astro
<BaseLayout title={work.seoTitle} description={work.seoDescription} ...>
```
Keep `<h1>{work.title}</h1>` unchanged.

- [ ] **Step 3: Add related-guide sections to service and work detail pages**
Use plain internal anchors and cap service suggestions to a useful subset when needed.

- [ ] **Step 4: Run Phase 2 and full tests**
Run: `npm test -- tests/seo-phase2.test.ts` then `npm test`.

- [ ] **Step 5: Commit**
Commit message: `feat: link services and case studies to SEO guides`

### Task 5: Production verification

**Files:**
- No production changes expected.

**Interfaces:**
- Verifies final branch only.

- [ ] **Step 1: Run full test suite**
Run: `npm test`
Expected: all tests pass.

- [ ] **Step 2: Run Astro production build**
Run: `npm run build`
Expected: Cloudflare Workers build succeeds and all static solution routes generate.

- [ ] **Step 3: Compare branch against `main`**
Confirm only intended docs/tests/data/pages changed.

- [ ] **Step 4: Review for duplicated search intent and broken internal slugs**
Every `relatedSolutionSlugs`, `relatedWorkSlugs`, `relatedToolSlugs`, and `relatedServiceSlug` must resolve.

- [ ] **Step 5: Prepare integration**
Do not merge until the final verification is green.
