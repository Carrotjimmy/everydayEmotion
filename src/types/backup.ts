import type { StorageDataV1 } from './mood';

/** 导出 / 导入的备份文件信封 */
export interface BackupFileV1 {
  app: 'everydayEmotion';
  exportVersion: 1;
  exportedAt: string;
  data: StorageDataV1;
}

export type ImportMode = 'merge' | 'replace';

export interface BackupPreview {
  fileName: string;
  exportedAt: string;
  recordCount: number;
  customMoodCount: number;
  firstDate: string | null;
  lastDate: string | null;
}

export interface ImportStats {
  mode: ImportMode;
  recordCount: number;
  customMoodCount: number;
  addedRecords: number;
  updatedRecords: number;
  addedCustomMoods: number;
  updatedCustomMoods: number;
}
