import { initAutomationDiagnosis } from './automation-diagnosis/controller';

const root = document.querySelector<HTMLElement>('[data-diagnosis-app]');
if (root) initAutomationDiagnosis(root);
