const controls = document.querySelector<HTMLElement>('[data-portfolio-filters]');
if (controls) {
  const buttons = [...controls.querySelectorAll<HTMLButtonElement>('[data-work-filter]')];
  const cards = [...document.querySelectorAll<HTMLElement>('[data-work-category]')];
  const sections = [...document.querySelectorAll<HTMLElement>('[data-work-section]')];
  const count = document.querySelector<HTMLElement>('[data-work-filter-count]');

  function select(category: string): void {
    buttons.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.workFilter === category));
    });
    let visible = 0;
    cards.forEach((card) => {
      const matches = category === 'all' || card.dataset.workCategory === category;
      card.hidden = !matches;
      if (matches) visible += 1;
    });
    sections.forEach((section) => {
      section.hidden = !section.querySelector('[data-work-category]:not([hidden])');
    });
    if (count) count.textContent = `${visible}件を表示`;
  }

  buttons.forEach((button) => {
    button.addEventListener('click', () => select(button.dataset.workFilter ?? 'all'));
  });
  select('all');
}
