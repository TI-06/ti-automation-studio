import type { ToolSource } from '../../data/tool-conversion';

export interface ToolResultCtaBinding {
  show(): void;
  hide(): void;
}

export function bindToolResultCta(source: ToolSource): ToolResultCtaBinding {
  const element = document.querySelector<HTMLElement>(`[data-tool-result-cta="${source}"]`);
  if (!element) throw new Error(`結果CTAが見つかりません: ${source}`);

  return {
    show() {
      element.hidden = false;
    },
    hide() {
      element.hidden = true;
    },
  };
}
