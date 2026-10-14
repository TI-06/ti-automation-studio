const dashboardExport = document.querySelector<HTMLDetailsElement>('[data-dashboard-export-menu]');
if (dashboardExport) {
  const narrow = window.matchMedia('(max-width: 820px)');
  const sync = (): void => { dashboardExport.open = !narrow.matches; };
  sync();
  narrow.addEventListener('change', sync);
}
