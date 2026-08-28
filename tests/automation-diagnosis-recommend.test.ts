import { describe, expect, it } from 'vitest';
import { buildAutomationRecommendations } from '../src/lib/tools/automation-diagnosis/recommend';
import type { AutomationDiagnosisInput } from '../src/lib/tools/automation-diagnosis/types';

const input = (patch: Partial<AutomationDiagnosisInput> = {}): AutomationDiagnosisInput => ({
  minutesPerRun: 30,
  frequency: 'weekly',
  people: 2,
  tasks: ['file-transfer', 'aggregation'],
  routineLevel: 'same',
  judgmentLevel: 'low',
  dataConsistency: 'same',
  exceptionLevel: 'low',
  environments: ['excel'],
  ...patch,
});

describe('自動化候補のルール', () => {
  it('Excel転記・集計から実務候補と技術例を返す', () => {
    const result = buildAutomationRecommendations(input());
    expect(result.automatable).toEqual(expect.arrayContaining(['ファイル間転記', '定型集計', '一括処理']));
    expect(result.technologies).toEqual(expect.arrayContaining(['Excel / VBA', 'Python']));
  });

  it('Google Workspace環境ではGAS系候補を返す', () => {
    const result = buildAutomationRecommendations(input({ environments: ['google-sheets', 'google-workspace'], tasks: ['email'] }));
    expect(result.automatable).toEqual(expect.arrayContaining(['スプレッドシート連携', 'Gmail定型通知', 'Drive保存', '定期処理']));
    expect(result.technologies).toContain('Google Apps Script');
  });

  it('複数人・社内Web環境では共有Webツール候補を返す', () => {
    const result = buildAutomationRecommendations(input({ people: 4, environments: ['internal-web'] }));
    expect(result.automatable).toEqual(expect.arrayContaining(['入力画面', '一覧・検索', '状態管理']));
    expect(result.technologies).toContain('Webツール');
  });

  it('外部登録ではAPI連携候補を返す', () => {
    const result = buildAutomationRecommendations(input({ tasks: ['external-registration'], environments: ['external-web'] }));
    expect(result.automatable).toEqual(expect.arrayContaining(['データ変換', 'API連携', '登録結果管理']));
    expect(result.technologies).toContain('API連携');
  });

  it('判断・例外・承認は人が残す部分として明示する', () => {
    const result = buildAutomationRecommendations(input({
      tasks: ['approval', 'verification'],
      judgmentLevel: 'high',
      exceptionLevel: 'high',
    }));
    expect(result.humanLed).toEqual(expect.arrayContaining(['内容の最終判断', '例外時の判断', '承認そのもの']));
  });

  it('候補の重複を除去する', () => {
    const result = buildAutomationRecommendations(input({ tasks: ['file-transfer', 'aggregation', 'excel-input'], environments: ['excel'] }));
    expect(new Set(result.automatable).size).toBe(result.automatable.length);
    expect(new Set(result.technologies).size).toBe(result.technologies.length);
  });
});
