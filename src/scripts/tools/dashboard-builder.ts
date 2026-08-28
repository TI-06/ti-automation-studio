import { initDashboardBuilder } from './dashboard-builder/controller';

const root = document.querySelector<HTMLElement>('[data-dashboard-app]');
if (root) initDashboardBuilder(root);
