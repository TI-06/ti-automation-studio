export {};

/**
 * Wrangler / cloudflare:workers exposes the HTMLRewriter `Element` type globally.
 * The browser UI is compiled in the same TypeScript program, so its `append()` and
 * HTMLSelectElement#remove() signatures can collide with the standard DOM types.
 *
 * Keep the compatibility surface limited to browser HTMLElements instead of
 * widening Cloudflare's Element API itself. This file changes types only; it does
 * not patch browser runtime behavior.
 */
declare global {
  interface HTMLElement {
    append(...nodes: (Node | string)[]): void;
  }

  interface HTMLSelectElement {
    remove(): any;
  }
}
