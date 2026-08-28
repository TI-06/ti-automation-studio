import type { DashboardDataset } from './types';

export function createDashboardSample(): DashboardDataset {
  const columns = [
    { id: 'sample-date', name: '日付', index: 0 },
    { id: 'sample-store', name: '店舗', index: 1 },
    { id: 'sample-staff', name: '担当者', index: 2 },
    { id: 'sample-category', name: 'カテゴリ', index: 3 },
    { id: 'sample-code', name: '商品コード', index: 4 },
    { id: 'sample-quantity', name: '数量', index: 5 },
    { id: 'sample-sales', name: '売上額', index: 6 },
  ];

  const stores = ['東京店', '大阪店', '名古屋店'];
  const staff = ['佐藤', '鈴木', '田中', '高橋'];
  const categories = ['食品', '雑貨', '衣料', '家電'];
  const months = ['2026-06', '2026-07', '2026-08'];
  const rows = Array.from({ length: 36 }, (_, index) => {
    const month = months[Math.floor(index / 12)];
    const day = String((index % 12) + 1).padStart(2, '0');
    const quantity = 1 + (index % 6);
    const unit = 2400 + ((index * 370) % 4100);
    return [
      `${month}-${day}`,
      stores[index % stores.length],
      staff[index % staff.length],
      categories[index % categories.length],
      `P-${String(index + 1).padStart(4, '0')}`,
      quantity,
      quantity * unit,
    ];
  });

  return { sheetName: 'サンプル売上', columns, rows };
}
