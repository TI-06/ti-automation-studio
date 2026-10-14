/**
 * Mobile-only workspace navigation for multi-pane spreadsheet tools.
 * Desktop keeps all panels visible. Without JavaScript, mobile also shows all panels.
 */
const tools = document.querySelectorAll<HTMLElement>('[data-excel-diff-app], [data-cleaner-app]');

tools.forEach((root) => {
  const nav = root.querySelector<HTMLElement>('[data-tool-mobile-nav]');
  if (!nav) return;
  const buttons = [...nav.querySelectorAll<HTMLButtonElement>('[data-mobile-view]')];
  const panelNames = new Set(['setup', 'result', 'detail']);
  let current = 'setup';

  function show(name: string, moveFocus = false): void {
    if (!panelNames.has(name)) return;
    current = name;
    root.dataset.mobileActive = name;
    buttons.forEach((button) => {
      const active = button.dataset.mobileView === name;
      button.setAttribute('aria-pressed', String(active));
    });
    if (moveFocus && window.matchMedia('(max-width: 960px)').matches) {
      const panel = root.querySelector<HTMLElement>(`[data-mobile-panel="${name}"]`);
      panel?.scrollIntoView({ block: 'start', behavior: 'instant' });
      panel?.querySelector<HTMLElement>('h2, h3')?.focus({ preventScroll: true });
    }
  }

  buttons.forEach((button) => button.addEventListener('click', () => {
    const target = button.dataset.mobileView;
    if (target) show(target, true);
  }));

  root.addEventListener('tool:show-results', () => show('result', true));
  root.addEventListener('tool:reset-view', () => show('setup'));
  root.addEventListener('click', (event) => {
    if (!window.matchMedia('(max-width: 960px)').matches || current !== 'result') return;
    if (!(event.target instanceof Element)) return;
    if (root.matches('[data-excel-diff-app]') && event.target.closest('[data-diff-body] tr')) {
      show('detail', true);
    }
    if (root.matches('[data-cleaner-app]') && event.target.closest('[data-data-head] button')) {
      show('detail', true);
    }
  });

  show('setup');
});
